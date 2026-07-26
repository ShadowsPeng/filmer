import { prisma } from '../lib/prisma'
import { getWxPayClient } from '../lib/wxpay'
import { transitionOrder } from './order'

/** 关闭已过支付期限的订单；可由 cron 重复调用。 */
export async function closeExpiredOrders(now = new Date()): Promise<{ scanned: number; closed: number; failed: number }> {
  const orders = await prisma.order.findMany({
    where: { status: 'pending_pay', expireAt: { lt: now } },
    include: { attempts: true },
    take: 100,
  })
  let closed = 0
  let failed = 0

  for (const order of orders) {
    try {
      const pendingAttempts = order.attempts.filter((attempt) => attempt.status === 'pending')
      for (const attempt of pendingAttempts) {
        await getWxPayClient().closeOrder(attempt.outTradeNo)
      }
      await prisma.$transaction(async (tx) => {
        const current = await tx.order.findUnique({ where: { id: order.id } })
        if (!current || current.status !== 'pending_pay' || current.expireAt >= now) return
        await tx.paymentAttempt.updateMany({
          where: { orderId: order.id, status: 'pending' },
          data: { status: 'closed' },
        })
        await transitionOrder(order.id, 'closed', tx, 'payment expired')
      })
      closed += 1
    } catch (error) {
      failed += 1
      console.error(`[close-expired] ${order.id} failed`, error)
    }
  }
  return { scanned: orders.length, closed, failed }
}
