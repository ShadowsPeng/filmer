/**
 * 支付 service:统一下单(写 PaymentAttempt) + 处理微信回调(推进订单) + 主动查单。
 */
import { Prisma } from '@prisma/client'
import { prisma } from '../lib/prisma'
import { config } from '../config'
import { BizError } from '../middleware/error'
import {
  getWxPayClient,
  signJsapiPay,
  JsapiPaySign,
  buildWxPayConfig,
} from '../lib/wxpay'
import {
  JsapiOrderInput,
  DecryptedNotify,
  NotifyPayload,
} from '../lib/wxpay/types'
import { decryptNotify } from '../lib/wxpay/signature'
import { transitionOrder } from './order'
import { settlement } from '../lib/settlement'

// ===== 1) 统一下单(写 PaymentAttempt) =====

export interface CreatePaymentInput {
  userId: string
  orderId: string
  userOpenid: string
}

export interface CreatePaymentOutput {
  outTradeNo: string
  amount: number
  paySign: JsapiPaySign
  mode: 'local-mock' | 'staging-live' | 'production-live'
}

export async function createPayment(input: CreatePaymentInput): Promise<CreatePaymentOutput> {
  const order = await prisma.order.findUnique({
    where: { id: input.orderId },
    include: { attempts: true },
  })
  if (!order || order.userId !== input.userId) {
    throw new BizError('NOT_FOUND', '订单不存在', 404)
  }
  if (order.status !== 'pending_pay') {
    throw new BizError('INVALID_STATE', `订单状态 ${order.status} 不能发起支付`, 409)
  }

  // 检查是否已有 pending 尝试(可复用,避免重复下单)
  const existingPending = order.attempts.find((a: any) => a.status === 'pending')
  let outTradeNo: string
  let amount: number = order.amount

  if (existingPending) {
    // 复用现有 prepay_id
    if (existingPending.prepayId) {
      const cfg = buildWxPayConfig()
      return {
        outTradeNo: existingPending.outTradeNo,
        amount: existingPending.amount,
        paySign: signJsapiPay(existingPending.prepayId, cfg),
        mode: cfg.mode,
      }
    }
    outTradeNo = existingPending.outTradeNo
  } else {
    outTradeNo = order.outTradeNo
    // 新建 attempt
    await prisma.paymentAttempt.create({
      data: {
        orderId: order.id,
        outTradeNo,
        amount: order.amount,
        status: 'pending',
        userOpenid: input.userOpenid,
        appid: config.WECHAT_APPID ?? 'mock_appid',
        mchid: config.WECHAT_MCHID ?? 'mock_mchid',
      },
    })
  }

  // 调用微信(本地 mock 直接返 prepayId)
  const client = getWxPayClient()
  const jsapiInput: JsapiOrderInput = {
    outTradeNo,
    description: `Filmer 冲扫服务 #${order.id.slice(-6)}`,
    amountTotal: amount,
    openid: input.userOpenid,
    attach: JSON.stringify({ orderId: order.id }),
  }
  const { prepayId } = await client.createJsapiOrder(jsapiInput)

  // 写回 prepayId
  await prisma.paymentAttempt.update({
    where: { outTradeNo },
    data: { prepayId },
  })

  // 前端签名
  const cfg = buildWxPayConfig()
  const paySign = signJsapiPay(prepayId, cfg)

  return { outTradeNo, amount, paySign, mode: cfg.mode }
}

// ===== 2) 处理微信回调 =====

export interface HandleNotifyResult {
  ok: boolean
  alreadyProcessed?: boolean
  reason?: string
}

export async function handleNotify(payload: NotifyPayload): Promise<HandleNotifyResult> {
  // 1) 解密 resource — 本地 mock 用固定 key(MOCK_KEY)解;线上用 config.WECHAT_API_V3_KEY
  const localKey = (config.WX_PAY_MODE === 'local-mock') ? MOCK_KEY : (config.WECHAT_API_V3_KEY ?? '')
  const plain = decryptNotify(
    payload.resource.ciphertext,
    payload.resource.nonce,
    payload.resource.associated_data,
    localKey,
  )
  const raw = JSON.parse(plain) as any
  const decrypted = {
    appid: raw.appid,
    mchid: raw.mchid,
    outTradeNo: raw.out_trade_no ?? raw.outTradeNo,
    transactionId: raw.transaction_id ?? raw.transactionId,
    tradeState: raw.trade_state ?? raw.tradeState,
    successTime: raw.success_time ?? raw.successTime,
    amount: raw.amount,
    raw,
  }

  // 2) 幂等:用 notifyId 查重
  if (decrypted.transactionId && payload.id) {
    const dupe = await prisma.paymentAttempt.findFirst({
      where: {
        OR: [
          { notifyId: payload.id },
          { transactionId: decrypted.transactionId },
        ],
      },
    })
    if (dupe && (dupe.notifyId === payload.id || dupe.status === 'success')) {
      return { ok: true, alreadyProcessed: true }
    }
  }

  // 3) 校验 appid / mchid / amount
  const attempt = await prisma.paymentAttempt.findFirst({
    where: { outTradeNo: decrypted.outTradeNo },
    include: { order: true },
  })
  if (!attempt) {
    return { ok: false, reason: 'outTradeNo not found' }
  }
  if (decrypted.amount.total !== attempt.amount) {
    return { ok: false, reason: `amount mismatch: notify=${decrypted.amount.total} vs attempt=${attempt.amount}` }
  }
  if (decrypted.appid !== attempt.appid || decrypted.mchid !== attempt.mchid) {
    return { ok: false, reason: 'appid/mchid mismatch' }
  }
  if (decrypted.tradeState !== 'SUCCESS') {
    return { ok: false, reason: `tradeState=${decrypted.tradeState}` }
  }

  // 4) 事务:条件更新 attempt + 推进 order
  await prisma.$transaction(async (tx: any) => {
    const txId = (decrypted as any).transaction_id ?? decrypted.transactionId
    const updated = await tx.paymentAttempt.updateMany({
      where: { outTradeNo: decrypted.outTradeNo, status: 'pending' },
      data: {
        status: 'success',
        transactionId: txId,
        notifyId: payload.id,
        successTime: new Date(decrypted.successTime ?? Date.now()),
        rawNotify: JSON.stringify(decrypted),
      },
    })
    if (updated.count !== 1) {
      throw new BizError('CONFLICT', 'attempt already processed', 409)
    }

    // 推进 order
    await transitionOrder(attempt.orderId, 'paid', tx, 'wxpay notify', {
      notifyId: payload.id,
      transactionId: txId,
      amount: decrypted.amount.total,
    })

    // 累加 paid
    await tx.order.update({
      where: { id: attempt.orderId },
      data: {
        paid: { increment: decrypted.amount.total },
        paidAt: new Date(),
      },
    })
  })

  // 5) outbox:通知冲扫店 + 发短信(暂用 console.log)
  await settlement.onPaymentSuccess(
    {
      orderId: attempt.orderId,
      transactionId: decrypted.transactionId ?? '',
      amountTotal: decrypted.amount.total,
      shopId: attempt.order.shopId,
      expectedPayToShop: 0,        // MVP 不分账
      expectedCommission: decrypted.amount.total,
    },
    prisma,
  )

  return { ok: true }
}

// ===== 3) 主动查单(回调丢失兜底) =====

export async function queryOrderByOutTradeNo(outTradeNo: string, userId: string) {
  const attempt = await prisma.paymentAttempt.findUnique({
    where: { outTradeNo },
    include: { order: true },
  })
  if (!attempt || attempt.order.userId !== userId) throw new BizError('NOT_FOUND', '支付单不存在', 404)

  const client = getWxPayClient()
  const res = await client.queryOrderByOutTradeNo(outTradeNo)

  // 如果查单显示 SUCCESS 但本地未推进 → 对账修复
  if (res.status === 'SUCCESS' && attempt.status === 'pending') {
    await prisma.$transaction(async (tx: any) => {
      await tx.paymentAttempt.update({
        where: { outTradeNo },
        data: {
          status: 'success',
          transactionId: res.transactionId,
          successTime: res.paidAt ?? new Date(),
        },
      })
      await transitionOrder(attempt.orderId, 'paid', tx, 'wxpay query reconciled', {
        fromQuery: true,
        status: res.status,
      })
      await tx.order.update({
        where: { id: attempt.orderId },
        data: {
          paid: { increment: res.amountTotal },
          paidAt: res.paidAt ?? new Date(),
        },
      })
    })
  }

  return res
}

// ===== 4) mock 模式下的手动通知投递 =====

export async function mockDeliverNotify(opts: {
  outTradeNo: string
  transactionId?: string
  status: 'SUCCESS' | 'NOTPAY' | 'CLOSED' | 'PAYERROR'
  amount?: number
}) {
  const attempt = await prisma.paymentAttempt.findUnique({
    where: { outTradeNo: opts.outTradeNo },
    include: { order: true },
  })
  if (!attempt) throw new BizError('NOT_FOUND', '支付单不存在', 404)
  if (attempt.status !== 'pending') {
    return { ok: true, alreadyProcessed: true }
  }

  const fakePayload: NotifyPayload = {
    id: `mock_notify_${Date.now()}`,
    create_time: new Date().toISOString().replace(/\.\d+Z$/, '+08:00'),
    resource_type: 'encrypt-resource',
    event_type: 'TRANSACTION.SUCCESS',
    summary: 'mock 通知',
    resource: {
      algorithm: 'AEAD_AES_256_GCM',
      ciphertext: encryptMockPlain(JSON.stringify({
        appid: attempt.appid,
        mchid: attempt.mchid,
        out_trade_no: attempt.outTradeNo,
        transaction_id: opts.transactionId ?? `mock_tx_${Date.now()}`,
        trade_state: opts.status,
        amount: { total: opts.amount ?? attempt.amount, payer_total: opts.amount ?? attempt.amount, currency: 'CNY' },
        payer: { openid: attempt.userOpenid },
        success_time: new Date().toISOString().replace(/\.\d+Z$/, '+08:00'),
      })),
      nonce: 'mocknonce',
      associated_data: 'transaction',
    },
  }
  return handleNotify(fakePayload)
}

// mock 模式专用:用一个固定 32 字节 key 做对称加密,只是为了走通解密路径
// 实际线上不会调用,只是为了本地测试 deserializer 一致
const MOCK_KEY = '1234567890abcdef1234567890abcdef'           // 32 字节
function encryptMockPlain(plain: string): string {
  const key = Buffer.from(MOCK_KEY, 'utf8')
  const nonce = 'mocknonce'
  const cipher = require('crypto').createCipheriv('aes-256-gcm', key, nonce)
  cipher.setAAD(Buffer.from('transaction'))
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return Buffer.concat([enc, tag]).toString('base64')
}
