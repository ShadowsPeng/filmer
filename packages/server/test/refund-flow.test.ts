/**
 * 退款链路集成测试。
 * 条件:与 payment-flow.test.ts 同,需要 sqlite。
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { execSync } from 'node:child_process'
import { randomUUID } from 'node:crypto'

let HAS_DB = false
const TEST_DB = path.join(__dirname, '..', 'test_refund.db')
const dbUrl = `file:${TEST_DB}`

beforeAll(async () => {
  if (fs.existsSync(TEST_DB)) fs.unlinkSync(TEST_DB)
  process.env.DATABASE_URL = dbUrl
  process.env.WX_PAY_MODE = 'local-mock'
  process.env.WECHAT_API_V3_KEY = 'mock-32-byte-key-mock-32-byte-key'
  process.env.WECHAT_APPID = 'mock_appid'
  process.env.WECHAT_MCHID = 'mock_mchid'
  process.env.JWT_SECRET = 'test-secret-12345'

  execSync('npx prisma db push --skip-generate --accept-data-loss', {
    cwd: path.join(__dirname, '..'),
    env: { ...process.env, DATABASE_URL: dbUrl },
    stdio: 'pipe',
  })
})

afterAll(async () => {
  await import('../src/lib/prisma').then((m) => m.prisma.$disconnect())
  if (fs.existsSync(TEST_DB)) fs.unlinkSync(TEST_DB)
})

describe('refund flow (mock mode)', () => {
  it('单笔全额退款:paid → refunding → refunded,paid 归零', async () => {
    const { PrismaClient } = await import('@prisma/client')
    const prisma = new PrismaClient()
    const { createRefund, applyRefundSuccess } = await import('../src/service/refund')

    // setup:已支付订单
    const admin = await prisma.user.create({
      data: { id: `a_${randomUUID().slice(0,6)}`, role: 'admin' },
    })
    const user = await prisma.user.create({
      data: { id: `u_${randomUUID().slice(0,6)}`, role: 'user' },
    })
    const shop = await prisma.scanShop.create({
      data: {
        id: `s_${randomUUID().slice(0,6)}`,
        name: 'Shop', city: 'sh', address: 'x', phone: '1',
        rating: 5,
        basePriceC41: 2500, basePriceE6: 3500, basePriceBW: 2000,
      },
    })
    const order = await prisma.order.create({
      data: {
        outTradeNo: `ft_${randomUUID().slice(0,6)}`,
        userId: user.id, shopId: shop.id,
        filmFormat: '135', rolls: 1, process: 'C41', package: 'standard',
        amount: 2500, paid: 2500, status: 'paid', paidAt: new Date(), expireAt: new Date(Date.now() + 60_000),
      },
    })
    await prisma.paymentAttempt.create({
      data: {
        orderId: order.id, outTradeNo: order.outTradeNo,
        amount: 2500, status: 'success', userOpenid: 'x', appid: 'a', mchid: 'm',
        transactionId: `tx_${randomUUID().slice(0,6)}`,
      },
    })

    // 申请退款
    const result = await createRefund({
      orderId: order.id,
      amount: 2500,
      reason: '测试退款',
      requestedBy: admin.id,
    })
    expect(result.status).toBe('pending')

    // 推进退款成功
    await applyRefundSuccess(result.refundId, `rfd_${randomUUID().slice(0,6)}`, 2500)

    const finalOrder = await prisma.order.findUnique({ where: { id: order.id } })
    expect(finalOrder?.status).toBe('refunded')
    expect(finalOrder?.paid).toBe(0)

    await prisma.$disconnect()
  }, 30000)

  it('退款金额超过实付抛错', async () => {
    const { PrismaClient } = await import('@prisma/client')
    const prisma = new PrismaClient()
    const { createRefund } = await import('../src/service/refund')

    const admin = await prisma.user.create({ data: { id: `a_${randomUUID().slice(0,6)}`, role: 'admin' } })
    const user = await prisma.user.create({ data: { id: `u_${randomUUID().slice(0,6)}`, role: 'user' } })
    const shop = await prisma.scanShop.create({
      data: { id: `s_${randomUUID().slice(0,6)}`, name: 's', city: 'a', address: 'a', phone: 'a', rating: 5, basePriceC41: 1000, basePriceE6: 1000, basePriceBW: 1000 },
    })
    const order = await prisma.order.create({
      data: {
        outTradeNo: `x_${randomUUID().slice(0,6)}`,
        userId: user.id, shopId: shop.id,
        filmFormat: '135', rolls: 1, process: 'C41', package: 'standard',
        amount: 1000, paid: 1000, status: 'paid', paidAt: new Date(), expireAt: new Date(Date.now() + 60_000),
      },
    })

    await expect(createRefund({
      orderId: order.id,
      amount: 9999,
      reason: '超退',
      requestedBy: admin.id,
    })).rejects.toThrow(/退款金额超过/)

    await prisma.$disconnect()
  }, 30000)
})
