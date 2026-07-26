/**
 * 路由:scan (冲扫店)
 */
import Router from '@koa/router'
import { listShops, getShop } from '../service/scan'

export const scanRouter = new Router({ prefix: '/api/scan' })

scanRouter.get('/shops', async (ctx) => {
  ctx.body = { ok: true, data: await listShops() }
})

scanRouter.get('/shops/:id', async (ctx) => {
  const shop = await getShop(ctx.params.id)
  if (!shop) {
    ctx.status = 404
    ctx.body = { ok: false, code: 'NOT_FOUND', message: 'shop not found' }
    return
  }
  ctx.body = { ok: true, data: shop }
})
