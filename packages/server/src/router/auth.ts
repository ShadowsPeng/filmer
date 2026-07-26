/**
 * 路由:auth
 */
import Router from '@koa/router'
import { z } from 'zod'
import { mockLogin, wxLogin } from '../service/auth'

export const authRouter = new Router({ prefix: '/api/auth' })

const MockBodySchema = z.object({
  userId: z.string().min(1),
})
const WxBodySchema = z.object({
  code: z.string().min(1).max(128),
})

authRouter.post('/wx-login', async (ctx) => {
  const body = WxBodySchema.parse(ctx.request.body)
  const result = await wxLogin(body.code)
  ctx.body = { ok: true, data: result }
})

authRouter.post('/mock-login', async (ctx) => {
  const body = MockBodySchema.parse(ctx.request.body)
  const result = await mockLogin(body.userId)
  ctx.body = { ok: true, data: result }
})
