/**
 * Koa 入口:挂中间件 + 路由 + 启动监听。
 */
import getRawBody from 'raw-body'
import Koa from 'koa'
import bodyParser from 'koa-bodyparser'
import { config } from './config'
import { errorMiddleware } from './middleware/error'
import { requestLogMiddleware } from './middleware/request-log'
import { logger } from './lib/logger'
import { registerRouters } from './router'

const app = new Koa()

app.use(errorMiddleware())
app.use(requestLogMiddleware())
app.use(async (ctx, next) => {
  if (ctx.method === 'POST' && ctx.path === '/api/payment/notify') {
    const rawBody = await getRawBody(ctx.req, { limit: '1mb', encoding: 'utf8' })
    ctx.state.rawBody = rawBody
    try {
      ctx.request.body = JSON.parse(rawBody)
    } catch {
      ctx.throw(400, 'Invalid JSON')
    }
  }
  await next()
})
app.use(bodyParser({
  enableTypes: ['json'],
  jsonLimit: '1mb',
  detectJSON: (ctx) => ctx.path !== '/api/payment/notify',
}))

registerRouters(app)

const port = config.SERVER_PORT
app.listen(port, () => {
  logger.info(`Filmer server listening on http://127.0.0.1:${port}`)
  logger.info(`支付模式 = ${config.WX_PAY_MODE}`)
  logger.info(`环境 = ${process.env.NODE_ENV ?? 'development'}`)
})

export { app }
