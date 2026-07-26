/**
 * 订单 service:创建 + 查询 + 状态迁移 + 超时关闭。
 */
import { Prisma } from '@prisma/client'
import { prisma } from '../lib/prisma'
import { calculatePrice, PriceInput } from '../lib/pricing'
import { config } from '../config'
import { BizError } from '../middleware/error'
import {
  OrderStatus,
  assertTransition,
} from './order-state'

// ===== 创建订单 =====

export interface CreateOrderInput extends PriceInput {
  userId: string
  userOpenid: string | null
  receiver: { name: string; phone: string; address: string }
  remark?: string
}

export interface CreateOrderOutput {
  orderId: string
  outTradeNo: string
  amount: number
  expireAt: string
}

function newOutTradeNo(): string {
  // FT + yyyyMMddHHmmss + 6 hex random
  const ts = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  const stamp =
    ts.getFullYear().toString() +
    pad(ts.getMonth() + 1) +
    pad(ts.getDate()) +
    pad(ts.getHours()) +
    pad(ts.getMinutes()) +
    pad(ts.getSeconds())
  const rnd = Math.random().toString(16).slice(2, 8).toUpperCase()
  return `FT${stamp}${rnd}`
}

export async function createOrder(input: CreateOrderInput): Promise<CreateOrderOutput> {
  const price = await calculatePrice(input)

  const outTradeNo = newOutTradeNo()
  const expireAt = new Date(Date.now() + config.ORDER_PAY_EXPIRE_MINUTES * 60 * 1000)

  const order = await prisma.order.create({
    data: {
      outTradeNo,
      userId: input.userId,
      shopId: input.shopId,
      filmFormat: input.filmFormat,
      rolls: input.rolls,
      process: input.process,
      package: input.package,
      hiRes: input.hiRes,
      rush: input.rush,
      amount: price.total,
      expireAt,
      receiverName: input.receiver.name,
      receiverPhone: input.receiver.phone,
      receiverAddr: input.receiver.address,
      remark: input.remark ?? null,
      status: 'pending_pay',
      events: {
        create: {
          toStatus: 'pending_pay',
          reason: 'order created',
        },
      },
    },
  })

  return {
    orderId: order.id,
    outTradeNo: order.outTradeNo,
    amount: order.amount,
    expireAt: order.expireAt.toISOString(),
  }
}

// ===== 推进订单状态(在事务里:状态机校验 + 写事件) =====

export async function transitionOrder(
  orderId: string,
  to: OrderStatus,
  tx: Prisma.TransactionClient | typeof prisma = prisma,
  reason?: string,
  payload?: any,
): Promise<void> {
  const order = await tx.order.findUnique({ where: { id: orderId } })
  if (!order) throw new BizError('NOT_FOUND', 'order not found', 404)

  assertTransition(order.status as OrderStatus, to)

  await tx.order.update({
    where: { id: orderId },
    data: { status: to },
  })
  await tx.orderEvent.create({
    data: {
      orderId,
      fromStatus: order.status,
      toStatus: to,
      reason: reason ?? null,
      payload: payload ? JSON.stringify(payload) : null,
    },
  })
}

// ===== 查询 =====

export async function getOrder(orderId: string, userId?: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      attempts: { orderBy: { createdAt: 'desc' } },
      refunds: true,
      events: { orderBy: { createdAt: 'asc' } },
    },
  })
  if (!order) return null
  if (userId && order.userId !== userId) return null
  return order
}

export async function listOrders(userId: string) {
  return prisma.order.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })
}

// ===== 超时关闭(定时任务入口) =====

export async function closeExpiredOrders() {
  const now = new Date()
  const expired = await prisma.order.findMany({
    where: { status: 'pending_pay', expireAt: { lt: now } },
    take: 100,
  })
  for (const o of expired) {
    try {
      await transitionOrder(o.id, 'closed', prisma, 'expired')
    } catch (e) {
      console.error(`[close-expired] ${o.id} failed:`, e)
    }
  }
  return expired.length
}
