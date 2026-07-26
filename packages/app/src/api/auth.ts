/** 微信登录 API；local-mock 时由调用层走受控 demo 登录。 */
import Taro from '@tarojs/taro'
import { request } from './client'
import { ENV } from '../utils/env'

export interface LoginResponse {
  token: string
  user: { uid: string; role: 'user' | 'admin'; nickname: string | null }
}

export async function login(): Promise<LoginResponse> {
  if (ENV.IS_LOCAL_MOCK) {
    return request<LoginResponse>({
      method: 'POST',
      url: '/api/auth/mock-login',
      data: { userId: 'user_demo' },
    })
  }
  const result = await Taro.login()
  if (!result.code) throw new Error('微信未返回登录凭证')
  return request<LoginResponse>({
    method: 'POST',
    url: '/api/auth/wx-login',
    data: { code: result.code },
  })
}
