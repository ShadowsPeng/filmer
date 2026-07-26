/**
 * 支付链路集成测试:需要 sqlite DB。
 *
 * 设置:运行前会尝试用 test.db,缺失时自动 prisma db push。
 * 跳过条件:无法 push schema 时,test.skip()。
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { execSync } from 'node:child_process'
import { randomUUID } from 'node:crypto'

let HAS_DB = false
const TEST_DB = path.join(__dirname, '..', 'test.db')
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

describe('payment flow (mock mode)', () => {
  it('mock 链路:下单 → mock notify → 订单状态 paid', async () => {
    // dynamic import 后,因为 DATETIME_URL 已设置
    const { PrismaClient } = await import('@prisma/client')
    const prisma = new PrismaClient()
    const { createOrder } = await import('../src/service/order')
    const { mockDeliverNotify } = await import('../src/service/payment')

    // 准备:1 个 user + 1 个 shop
    const user = await prisma.user.create({
      data: { id: `u_${randomUUID().slice(0,6)}`, openid: 'mock_openid_x', role: 'user' },
    })
    const shop = await prisma.scanShop.create({
      data: {
        id: `s_${randomUUID().slice(0,6)}`,
        name: 'Test Shop', city: '上海', address: 'x', phone: '021-xxx',
        rating: 4.8,
        basePriceC41: 2500, basePriceE6: 3500, basePriceBW: 2000,
        hiResFee: 1500, rushFee: 1000,
      },
    })

    // 1. 创建订单
    const order = await createOrder({
      userId: user.id,
      userOpenid: user.openid!,
      shopId: shop.id,
      filmFormat: '135',
      rolls: 2,
      process: 'C41',
      package: 'standard',
      hiRes: false,
      rush: false,
      receiver: { name: '测试', phone: '13800138000', address: '上海市徐汇区' },
    })
    expect(order.amount).toBe(5000)        // 25 * 2

    // 2. 创建支付 attempt
    const attempt = await prisma.paymentAttempt.create({
      data: {
        orderId: order.orderId,
        outTradeNo: order.outTradeNo,
        amount: order.amount,
        status: 'pending',
        userOpenid: user.openid!,
        appid: 'mock_appid',
        mchid: 'mock_mchid',
        prepayId: `mock_prepay_${order.outTradeNo}`,
      },
    })

    // 3. 投递 mock 成功通知
    const result = await mockDeliverNotify({
      outTradeNo: order.outTradeNo,
      status: 'SUCCESS',
    })
    expect(result.ok).toBe(true)

    // 4. 验证状态推进
    const finalOrder = await prisma.order.findUnique({ where: { id: order.orderId } })
    expect(finalOrder?.status).toBe('paid')
    expect(finalOrder?.paid).toBe(5000)
    expect(finalOrder?.paidAt).not.toBeNull()

    const finalAttempt = await prisma.paymentAttempt.findUnique({ where: { outTradeNo: order.outTradeNo } })
    expect(finalAttempt?.status).toBe('success')
    expect(finalAttempt?.transactionId).toBeTruthy()

    // 5. 重复通知幂等
    const dup = await mockDeliverNotify({ outTradeNo: order.outTradeNo, status: 'SUCCESS' })
    expect((dup as any).alreadyProcessed).toBe(true)

    await prisma.$disconnect()
  }, 30000)
})
