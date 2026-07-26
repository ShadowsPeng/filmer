/**
 * 路由总装
 */
import Koa from 'koa'
import { authRouter } from './auth'
import { scanRouter } from './scan'
import { orderRouter } from './order'
import { paymentRouter } from './payment'
import { adminRefundRouter } from './admin/refund'
import { healthRouter } from './health'

export function registerRouters(app: Koa) {
  app.use(healthRouter.routes()).use(healthRouter.allowedMethods())
  app.use(authRouter.routes()).use(authRouter.allowedMethods())
  app.use(scanRouter.routes()).use(scanRouter.allowedMethods())
  app.use(orderRouter.routes()).use(orderRouter.allowedMethods())
  app.use(paymentRouter.routes()).use(paymentRouter.allowedMethods())
  app.use(adminRefundRouter.routes()).use(adminRefundRouter.allowedMethods())
}
