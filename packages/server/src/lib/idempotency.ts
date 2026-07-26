/**
 * 业务幂等键:依赖客户端传入 Idempotency-Key header。
 * - 同一 key + 同一 scope + 同一 user,只处理一次。
 * - 重放时返回首次的响应 body。
 */
import { Context } from 'koa'
import { prisma } from './prisma'
import { BizError } from '../middleware/error'

export async function withIdempotency<T>(
  ctx: Context,
  scope: string,
  fn: () => Promise<T>,
): Promise<T> {
  const userId = ctx.state.auth?.uid
  if (!userId) throw new BizError('UNAUTHORIZED', '未登录', 401)

  const key = ctx.headers['idempotency-key']
  if (!key || typeof key !== 'string' || key.length < 8) {
    // 没有幂等键也允许,但**只**保证非幂等场景
    return fn()
  }

  const existing = await prisma.idempotencyKey.findUnique({ where: { key } })
  if (existing) {
    if (existing.userId !== userId || existing.scope !== scope) {
      throw new BizError('CONFLICT', 'Idempotency-Key 已被他处使用', 409)
    }
    // 重放:返回首次响应
    return JSON.parse(existing.responseBody) as T
  }

  const result = await fn()
  await prisma.idempotencyKey.create({
    data: {
      key,
      scope,
      userId,
      responseBody: JSON.stringify(result),
    },
  })
  return result
}
