/**
 * 退款 service(MVP:单笔全额)。
 * 流程:校验订单 paid、未退满 → 调 WxPayClient.refund → 写 Refund 行 pending → 等通知/主动查 → 推进
 */
import { Prisma } from '@prisma/client'
import { prisma } from '../lib/prisma'
import { BizError } from '../middleware/error'
import { getWxPayClient } from '../lib/wxpay'
import { transitionOrder } from './order'
import { settlement } from '../lib/settlement'

export interface CreateRefundInput {
  orderId: string
  amount: number                // MVP 必须等于已 paid
  reason: string
  requestedBy: string           // 管理员 userId
}

export interface CreateRefundOutput {
  refundId: string              // Refund 表 id
  outRefundNo: string
  status: 'pending' | 'success' | 'failed' | 'rejected'
}

export async function createRefund(input: CreateRefundInput): Promise<CreateRefundOutput> {
  // 1) 校验订单
  const order = await prisma.order.findUnique({
    where: { id: input.orderId },
    include: { attempts: true, refunds: true },
  })
  if (!order) throw new BizError('NOT_FOUND', '订单不存在', 404)
  if (order.userId === input.requestedBy) {
    throw new BizError('FORBIDDEN', '不能退自己的订单(请用客服入口)', 403)
  }
  if (order.status !== 'paid' && order.status !== 'refunding') {
    throw new BizError('INVALID_STATE', `订单状态 ${order.status} 不可退款`, 409)
  }
  if (input.amount > order.paid) {
    throw new BizError('INVALID_AMOUNT', '退款金额超过实付金额', 400)
  }
  if (input.amount !== order.amount) {
    throw new BizError('INVALID_AMOUNT', `MVP 仅支持单笔全额退款,期望 ${order.amount}`, 400)
  }

  // 2) 已累计退款金额校验
  const alreadyRefunded = order.refunds
    .filter((r: any) => r.status === 'success')
    .reduce((sum: number, r: any) => sum + r.successAmount, 0)
  if (alreadyRefunded + input.amount > order.amount) {
    throw new BizError('INVALID_AMOUNT', `退款金额超过实付金额`, 400)
  }

  const successAttempt = order.attempts.find((a: any) => a.status === 'success')
  if (!successAttempt || !successAttempt.transactionId) {
    throw new BizError('INVALID_STATE', '订单尚未支付成功,无法退款', 409)
  }

  // 3) 商户退款单号
  const ts = new Date()
  const stamp = ts.getFullYear().toString() +
    String(ts.getMonth() + 1).padStart(2, '0') +
    String(ts.getDate()).padStart(2, '0') +
    String(ts.getHours()).padStart(2, '0') +
    String(ts.getMinutes()).padStart(2, '0') +
    String(ts.getSeconds()).padStart(2, '0')
  const rnd = Math.random().toString(16).slice(2, 8).toUpperCase()
  const outRefundNo = `RF${stamp}${rnd}`

  // 4) 写 refund 行
  const refund = await prisma.refund.create({
    data: {
      orderId: order.id,
      outRefundNo,
      transactionId: successAttempt.transactionId,
      outTradeNo: successAttempt.outTradeNo,
      requestedAmount: input.amount,
      status: 'pending',
      reason: input.reason,
      requestedBy: input.requestedBy,
      approvedBy: input.requestedBy,         // MVP 单步审批
    },
  })

  // 5) 推进订单到 refunding
  if (order.status === 'paid') {
    await transitionOrder(order.id, 'refunding', prisma, 'refund requested', {
      refundId: refund.id,
    })
  }

  // 6) 调微信退款 API
  const client = getWxPayClient()
  try {
    await client.refund({
      outRefundNo,
      transactionId: successAttempt.transactionId,
      outTradeNo: successAttempt.outTradeNo,
      amountTotal: order.amount,
      amountRefund: input.amount,
      reason: input.reason,
    })

    // mock 模式下,接口直接 success;真实模式异步等通知
    // 这里简化:查退款状态,如 success 则推进
    const status = await client.queryRefund(outRefundNo)
    if (status.status === 'SUCCESS') {
      // mock 模式的 queryRefund 不回传 successAmount;查 Refund 表回填
      let successAmount = status.successAmount
      if (!successAmount) {
        const r = await prisma.refund.findUnique({ where: { outRefundNo } })
        successAmount = r?.requestedAmount ?? input.amount
      }
      await applyRefundSuccess(refund.id, status.refundId ?? `mock_refund_${outRefundNo}`, successAmount)
    }
  } catch (e: any) {
    await prisma.refund.update({
      where: { id: refund.id },
      data: { status: 'failed', failureReason: String(e?.message ?? e) },
    })
    // 订单回退
    await transitionOrder(order.id, 'paid', prisma, 'refund failed', { refundId: refund.id })
    throw new BizError('WX_PAY_ERROR', `退款失败: ${e?.message ?? e}`, 502)
  }

  return {
    refundId: refund.id,
    outRefundNo,
    status: 'pending',
  }
}

export async function applyRefundSuccess(
  refundId: string,
  wxRefundId: string,
  successAmount: number,
) {
  const current = await prisma.refund.findUnique({ where: { id: refundId } })
  if (!current) throw new BizError('NOT_FOUND', '退款记录不存在', 404)
  if (current.status === 'success') return

  await prisma.$transaction(async (tx: any) => {
    const refund = await tx.refund.update({
      where: { id: refundId },
      data: {
        status: 'success',
        refundId: wxRefundId,
        successAmount,
        successTime: new Date(),
      },
    })

    // 累计实付撤销
    await tx.order.update({
      where: { id: refund.orderId },
      data: {
        paid: { decrement: successAmount },
        refundedAt: new Date(),
      },
    })

    // 推进订单到 refunded
    await transitionOrder(refund.orderId, 'refunded', tx, 'refund success', {
      refundId,
      successAmount,
    })
  })

  const final = await prisma.refund.findUnique({ where: { id: refundId } })
  if (final) {
    await settlement.onRefundSuccess(
      {
        orderId: final.orderId,
        refundId: final.refundId ?? '',
        amountRefund: final.successAmount,
      },
      prisma,
    )
  }
}
