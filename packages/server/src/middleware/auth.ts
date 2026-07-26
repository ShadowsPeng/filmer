/**
 * JWT 认证中间件。
 * 解码失败 → 401,带 role 校验的需求用 requireRole('admin')。
 */
import { Context, Next } from 'koa'
import jwt from 'jsonwebtoken'
import { config } from '../config'
import { BizError } from './error'

export interface AuthPayload {
  uid: string
  role: 'user' | 'admin'
}

export function signToken(payload: AuthPayload): string {
  // jwt 库在 .sign(payload, secret) 第二个参数严格类型要求;宽松写
  return (jwt.sign as any)(payload, config.JWT_SECRET, { expiresIn: config.JWT_EXPIRES_IN as any })
}

export function verifyToken(token: string): AuthPayload {
  return jwt.verify(token, config.JWT_SECRET) as AuthPayload
}

export function authMiddleware() {
  return async (ctx: Context, next: Next) => {
    const header = ctx.headers.authorization
    if (!header || !header.startsWith('Bearer ')) {
      throw new BizError('UNAUTHORIZED', '缺少 Bearer Token', 401)
    }
    try {
      ctx.state.auth = verifyToken(header.slice(7))
    } catch {
      throw new BizError('UNAUTHORIZED', 'Token 无效或过期', 401)
    }
    await next()
  }
}

export function requireRole(role: 'admin' | 'user') {
  return async (ctx: Context, next: Next) => {
    const auth = ctx.state.auth as AuthPayload | undefined
    if (!auth) throw new BizError('UNAUTHORIZED', '未登录', 401)
    if (auth.role !== role) throw new BizError('FORBIDDEN', `需要 ${role} 权限`, 403)
    await next()
  }
}
