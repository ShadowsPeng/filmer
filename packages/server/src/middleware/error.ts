/**
 * 统一错误码 + 异常处理中间件。
 * 业务层 throw new BizError(code, message, status?),中间件捕获返回结构化响应。
 */
import { Context, Next } from 'koa'

export type BizCode =
  | 'BAD_REQUEST'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'INVALID_AMOUNT'
  | 'INVALID_STATE'
  | 'WX_PAY_ERROR'
  | 'SERVICE_UNAVAILABLE'
  | 'WECHAT_UNAVAILABLE'
  | 'WECHAT_LOGIN_FAILED'
  | 'INTERNAL'

export class BizError extends Error {
  constructor(
    public code: BizCode,
    message: string,
    public status: number = 400,
    public detail?: unknown,
  ) {
    super(message)
  }
}

export function errorMiddleware() {
  return async (ctx: Context, next: Next) => {
    try {
      await next()
    } catch (err: any) {
      if (err instanceof BizError) {
        ctx.status = err.status
        ctx.body = {
          ok: false,
          code: err.code,
          message: err.message,
          detail: err.detail,
        }
        return
      }
      // 未知错误:不泄露 stack 给客户端
      console.error('[unhandled]', err)
      ctx.status = 500
      ctx.body = {
        ok: false,
        code: 'INTERNAL',
        message: 'Internal Server Error',
      }
    }
  }
}
