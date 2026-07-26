/**
 * 统一请求封装 + 拦截器。
 * - 注入 Authorization: Bearer <token>
 * - 401 自动清理 token
 * - 错误响应统一 throw
 */
import Taro from '@tarojs/taro'
import { ENV } from '../utils/env'

let tokenGetter: () => string | null = () => null
let onUnauthorized: () => void = () => {}

export function configureClient(opts: { tokenGetter: () => string | null; onUnauthorized: () => void }) {
  tokenGetter = opts.tokenGetter
  onUnauthorized = opts.onUnauthorized
}

interface ApiResponse<T> {
  ok: boolean
  code?: string
  message?: string
  data?: T
}

export async function request<T = any>(opts: {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  url: string                  // 包含 query 部分或不包含
  data?: any
  header?: Record<string, string>
}): Promise<T> {
  const url = opts.url.startsWith('http')
    ? opts.url
    : `${ENV.API_BASE}${opts.url}`

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(opts.header ?? {}),
  }
  const t = tokenGetter()
  if (t) headers['Authorization'] = `Bearer ${t}`

  const res = await Taro.request<ApiResponse<T>>({
    url,
    method: opts.method,
    data: opts.data,
    header: headers,
    timeout: 30000,
  })

  // 微信小程序 HTTP 网络层异常
  if (res.statusCode < 200 || res.statusCode >= 300) {
    throw new Error(`HTTP ${res.statusCode}: ${res.errMsg ?? ''}`)
  }

  const body = res.data as ApiResponse<T>
  if (!body?.ok) {
    if (body?.code === 'UNAUTHORIZED') {
      onUnauthorized()
    }
    throw new Error(body?.message ?? `${opts.method} ${opts.url} failed`)
  }
  return body.data as T
}
