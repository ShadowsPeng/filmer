/**
 * 路由:order
 */
import Router from '@koa/router'
import { z } from 'zod'
import { authMiddleware } from '../middleware/auth'
import { withIdempotency } from '../lib/idempotency'
import { createOrder, getOrder, listOrders } from '../service/order'

export const orderRouter = new Router({ prefix: '/api/orders' })

const CreateSchema = z.object({
  shopId: z.string().min(1),
  filmFormat: z.enum(['135', '120']),
  rolls: z.number().int().min(1).max(10),
  process: z.enum(['C41', 'E6', 'BW']),
  package: z.enum(['standard', 'fine']),
  hiRes: z.boolean().default(false),
  rush: z.boolean().default(false),
  receiver: z.object({
    name: z.string().min(1),
    phone: z.string().regex(/^1[3-9]\d{9}$/, '手机号格式不对'),
    address: z.string().min(4),
  }),
  remark: z.string().max(200).optional(),
})

orderRouter.use(authMiddleware())

orderRouter.post('/', async (ctx) => {
  const input = CreateSchema.parse(ctx.request.body)
  const userId = ctx.state.auth.uid

  // 拉 openid(本地 mock:用 user 的 openid,真实模式:从 wx.login 注入)
  const { prisma } = await import('../lib/prisma')
  const u = await prisma.user.findUnique({ where: { id: userId } })

  const result = await withIdempotency(ctx, 'order.create', () =>
    createOrder({ ...input, userId, userOpenid: u?.openid ?? null, receiver: input.receiver, remark: input.remark }),
  )
  ctx.body = { ok: true, data: result }
})

orderRouter.get('/:id', async (ctx) => {
  const userId = ctx.state.auth.uid
  const order = await getOrder(ctx.params.id, userId)
  if (!order) {
    ctx.status = 404
    ctx.body = { ok: false, code: 'NOT_FOUND', message: 'order not found' }
    return
  }
  ctx.body = { ok: true, data: order }
})

orderRouter.get('/', async (ctx) => {
  const userId = ctx.state.auth.uid
  const orders = await listOrders(userId)
  ctx.body = { ok: true, data: orders }
})
