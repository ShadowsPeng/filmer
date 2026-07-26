import Router from '@koa/router'
import { prisma } from '../lib/prisma'

export const healthRouter = new Router()

healthRouter.get('/health', async (ctx) => {
  await prisma.$queryRaw`SELECT 1`
  ctx.body = { ok: true, service: 'filmer-server' }
})
