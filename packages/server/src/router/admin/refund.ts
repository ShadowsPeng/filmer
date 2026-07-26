/**
 * 路由:admin/refund (管理员退款)
 */
import Router from '@koa/router'
import { z } from 'zod'
import { authMiddleware, requireRole } from '../../middleware/auth'
import { createRefund } from '../../service/refund'

export const adminRefundRouter = new Router({ prefix: '/api/admin/refunds' })

const BodySchema = z.object({
  orderId: z.string().min(1),
  amount: z.number().int().positive(),
  reason: z.string().min(1).max(200),
})

adminRefundRouter.use(authMiddleware())
adminRefundRouter.use(requireRole('admin'))

adminRefundRouter.post('/', async (ctx) => {
  const body = BodySchema.parse(ctx.request.body)
  const requestedBy = ctx.state.auth.uid
  const result = await createRefund({ ...body, requestedBy })
  ctx.body = { ok: true, data: result }
})
