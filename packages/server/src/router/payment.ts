/**
 * 路由:payment
 *  - POST /api/payment/jsapi       (auth)  客户端发起统一下单
 *  - POST /api/payment/notify      (no auth) 微信回调
 *  - POST /api/payment/mock-notify (auth admin) local-mock 测试用
 *  - POST /api/payment/query       (auth) 主动查单
 */
import { readFileSync } from 'node:fs'
import Router from '@koa/router'
import { authMiddleware } from '../middleware/auth'
import { prisma } from '../lib/prisma'
import { createPayment, handleNotify, mockDeliverNotify, queryOrderByOutTradeNo } from '../service/payment'
import { config } from '../config'
import { isTimestampFresh, verifyWxResponse } from '../lib/wxpay/signature'
import { NotifyPayload } from '../lib/wxpay/types'
import { BizError } from '../middleware/error'

export const paymentRouter = new Router({ prefix: '/api/payment' })
let wxPublicKey: Buffer | undefined

function verifyLiveNotify(ctx: any): void {
  const timestamp = ctx.get('Wechatpay-Timestamp')
  const nonce = ctx.get('Wechatpay-Nonce')
  const signature = ctx.get('Wechatpay-Signature')
  const serial = ctx.get('Wechatpay-Serial')
  const rawBody = ctx.state.rawBody

  if (!timestamp || !nonce || !signature || !serial || typeof rawBody !== 'string') {
    throw new BizError('UNAUTHORIZED', '微信支付回调缺少验签信息', 401)
  }
  if (!isTimestampFresh(timestamp)) {
    throw new BizError('UNAUTHORIZED', '微信支付回调已过期', 401)
  }
  if (serial !== config.WECHAT_PUBLIC_KEY_ID) {
    throw new BizError('UNAUTHORIZED', '微信支付公钥 ID 不匹配', 401)
  }
  wxPublicKey ??= readFileSync(config.WECHAT_PUBLIC_KEY_PATH!)
  if (!verifyWxResponse({ timestamp, nonce, signature, body: rawBody, publicKeyPem: wxPublicKey })) {
    throw new BizError('UNAUTHORIZED', '微信支付回调签名无效', 401)
  }
}

// ===== 1. 客户端统一下单 =====
paymentRouter.post('/jsapi', authMiddleware(), async (ctx) => {
  const { orderId } = ctx.request.body as { orderId: string }
  if (!orderId) throw new BizError('BAD_REQUEST', 'orderId 必填', 400)
  const userId = ctx.state.auth.uid
  const u = await prisma.user.findUnique({ where: { id: userId } })
  const result = await createPayment({
    userId,
    orderId,
    userOpenid: u?.openid ?? `mock_openid_${userId}`,
  })
  ctx.body = { ok: true, data: result }
})

// ===== 2. 微信回调(无 auth,从微信 IP + 签名校验) =====
paymentRouter.post('/notify', async (ctx) => {
  // 真实环境:
  //   1) 校验 Wechatpay-Timestamp (5 分钟内) + 回调签名(平台证书/公钥)
  //   2) AES 解密 resource
  //   3) 校验 appid/mchid/amount
  //   4) 推进 attempt + order
  //
  // 本 MVP 简化为:直接信任 body 里的 resource (本地 mock 投递);staging/production 必须把上面 3 步补齐

  const body = ctx.request.body as NotifyPayload
  if (!body?.resource?.ciphertext) {
    ctx.status = 400
    ctx.body = 'FAIL: missing resource'
    return
  }

  if (config.WX_PAY_MODE !== 'local-mock') {
    verifyLiveNotify(ctx)
  }

  try {
    const result = await handleNotify(body)
    if (!result.ok) {
      ctx.status = 400
      ctx.body = `FAIL: ${result.reason ?? 'invalid notification'}`
      return
    }
  } catch (e: any) {
    console.error('[notify] failed:', e)
    ctx.status = 500
    ctx.body = 'FAIL'
    return
  }
  // 微信回调必须返回纯文本 SUCCESS(不是 JSON,不是 200 + JSON)
  ctx.type = 'text/plain'
  ctx.body = 'SUCCESS'
})

// ===== 3. local-mock 投递(管理员权限) =====
paymentRouter.post('/mock-notify', authMiddleware(), async (ctx) => {
  if (config.WX_PAY_MODE !== 'local-mock' || config.NODE_ENV === 'production') {
    throw new BizError('NOT_FOUND', '接口不存在', 404)
  }
  const { outTradeNo, status, transactionId, amount } = ctx.request.body as {
    outTradeNo: string
    status: 'SUCCESS' | 'NOTPAY' | 'CLOSED' | 'PAYERROR'
    transactionId?: string
    amount?: number
  }
  const attempt = await prisma.paymentAttempt.findUnique({
    where: { outTradeNo },
    include: { order: true },
  })
  if (!attempt || attempt.order.userId !== ctx.state.auth.uid) {
    throw new BizError('NOT_FOUND', '支付单不存在', 404)
  }
  const result = await mockDeliverNotify({ outTradeNo, status, transactionId, amount })
  ctx.body = { ok: true, data: result }
})

// ===== 4. 主动查单 =====
paymentRouter.post('/query', authMiddleware(), async (ctx) => {
  const { outTradeNo } = ctx.request.body as { outTradeNo: string }
  const result = await queryOrderByOutTradeNo(outTradeNo, ctx.state.auth.uid)
  ctx.body = { ok: true, data: result }
})
