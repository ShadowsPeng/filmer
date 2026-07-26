declare const process: { env: Record<string, string | undefined> }

/**
 * 编译期环境配置。生产包必须显式传入 TARO_APP_API_BASE / TARO_APP_WX_PAY_MODE。
 */
const mode = (process.env.TARO_APP_WX_PAY_MODE ?? 'local-mock') as
  | 'local-mock'
  | 'staging-live'
  | 'production-live'
const apiBase = process.env.TARO_APP_API_BASE ?? 'http://127.0.0.1:3000'
const isProductionBuild = process.env.NODE_ENV === 'production'

if (!['local-mock', 'staging-live', 'production-live'].includes(mode)) {
  throw new Error(`无效的 TARO_APP_WX_PAY_MODE: ${mode}`)
}
if (isProductionBuild && (mode !== 'production-live' || /localhost|127\.0\.0\.1/.test(apiBase))) {
  throw new Error('生产构建必须使用 production-live 和公网 API 地址')
}
if (mode !== 'local-mock' && !apiBase.startsWith('https://')) {
  throw new Error('真实支付环境的 API 地址必须使用 HTTPS')
}

export const ENV = {
  API_BASE: apiBase.replace(/\/$/, ''),
  WX_PAY_MODE: mode,
  IS_LOCAL_MOCK: mode === 'local-mock',
}
