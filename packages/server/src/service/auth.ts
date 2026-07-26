/**
 * 登录服务：本地 mock 与微信 code2Session 最终都签发自有 JWT。
 */
import { config } from '../config'
import { prisma } from '../lib/prisma'
import { signToken, AuthPayload } from '../middleware/auth'
import { BizError } from '../middleware/error'

interface LoginResult {
  token: string
  user: AuthPayload & { nickname: string | null }
}

interface Code2SessionResult {
  openid?: string
  unionid?: string
  session_key?: string
  errcode?: number
  errmsg?: string
}

function issueToken(user: { id: string; role: string; nickname: string | null }): LoginResult {
  const payload: AuthPayload = { uid: user.id, role: user.role as 'user' | 'admin' }
  return { token: signToken(payload), user: { ...payload, nickname: user.nickname } }
}

export async function mockLogin(userId: string): Promise<LoginResult> {
  if (config.WX_PAY_MODE !== 'local-mock' || config.NODE_ENV === 'production') {
    throw new BizError('NOT_FOUND', '接口不存在', 404)
  }
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw new BizError('NOT_FOUND', `用户 ${userId} 不存在`, 404)
  return issueToken(user)
}

export async function wxLogin(code: string): Promise<LoginResult> {
  if (!config.WECHAT_APPID || !config.WECHAT_APPSECRET) {
    throw new BizError('SERVICE_UNAVAILABLE', '微信登录尚未配置', 503)
  }
  const url = new URL('https://api.weixin.qq.com/sns/jscode2session')
  url.searchParams.set('appid', config.WECHAT_APPID)
  url.searchParams.set('secret', config.WECHAT_APPSECRET)
  url.searchParams.set('js_code', code)
  url.searchParams.set('grant_type', 'authorization_code')

  let data: Code2SessionResult
  try {
    const response = await fetch(url)
    data = await response.json() as Code2SessionResult
  } catch {
    throw new BizError('WECHAT_UNAVAILABLE', '微信登录服务暂不可用', 502)
  }
  if (!data.openid || data.errcode) {
    throw new BizError('WECHAT_LOGIN_FAILED', data.errmsg ?? '微信登录失败', 401)
  }

  const user = await prisma.user.upsert({
    where: { openid: data.openid },
    update: { unionid: data.unionid },
    create: { openid: data.openid, unionid: data.unionid, role: 'user' },
  })
  return issueToken(user)
}
