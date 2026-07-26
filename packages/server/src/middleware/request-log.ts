/**
 * 简单请求日志,只记录 method + path + status + latency。
 * 永远不打印 request body(可能含手机号 / 金额等敏感字段)。
 */
import { Context, Next } from 'koa'

export function requestLogMiddleware() {
  return async (ctx: Context, next: Next) => {
    const start = Date.now()
    await next()
    const ms = Date.now() - start
    console.log(
      `${ctx.method} ${ctx.path} → ${ctx.status} (${ms}ms)`,
    )
  }
}
