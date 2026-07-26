/**
 * 启动配置 + 环境变量校验。
 * 启动时若生产/staging 配置缺失会报错;mock 模式跳过商业字段。
 *
 * 单一 schema 涵盖所有字段;mock 模式放宽前 6 个微信字段为可选。
 */
import 'dotenv/config'
import { existsSync } from 'node:fs'
import { z } from 'zod'

const Mode = z.enum(['local-mock', 'staging-live', 'production-live'])

const fullSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  SERVER_PORT: z.coerce.number().default(3000),

  DATABASE_URL: z.string().min(1),

  JWT_SECRET: z.string().min(8).default('dev-secret-change-me'),
  JWT_EXPIRES_IN: z.string().default('7d'),

  WX_PAY_MODE: Mode.default('local-mock'),

  // mock 模式可空; staging/production 必须有
  WECHAT_APPID: z.string().optional(),
  WECHAT_APPSECRET: z.string().optional(),
  WECHAT_MCHID: z.string().optional(),
  WECHAT_API_V3_KEY: z.string().optional(),
  WECHAT_MERCHANT_CERT_SERIAL_NO: z.string().optional(),
  WECHAT_MERCHANT_CERT_PATH: z.string().optional(),
  WECHAT_MERCHANT_KEY_PATH: z.string().optional(),
  WECHAT_PUBLIC_KEY_PATH: z.string().optional(),
  WECHAT_PUBLIC_KEY_ID: z.string().optional(),
  WECHAT_API_BASE: z.string().default('https://api.mch.weixin.qq.com'),
  WX_PAY_NOTIFY_URL: z.string().optional(),

  ORDER_PAY_EXPIRE_MINUTES: z.coerce.number().default(30),
})

export interface AppConfig extends z.infer<typeof fullSchema> {}

function loadConfig(): AppConfig {
  const parsed = fullSchema.safeParse(process.env)
  if (!parsed.success) {
    console.error('❌ 环境变量校验失败:')
    console.error(parsed.error.format())
    process.exit(1)
  }
  const cfg = parsed.data

  if (cfg.WX_PAY_MODE !== 'local-mock') {
    const required = ['WECHAT_APPID','WECHAT_APPSECRET','WECHAT_MCHID','WECHAT_API_V3_KEY','WECHAT_MERCHANT_CERT_SERIAL_NO','WECHAT_MERCHANT_CERT_PATH','WECHAT_MERCHANT_KEY_PATH','WECHAT_PUBLIC_KEY_PATH','WECHAT_PUBLIC_KEY_ID','WX_PAY_NOTIFY_URL'] as const
    const missing = required.filter((k) => !cfg[k])
    if (missing.length) {
      console.error(`❌ 支付模式 = ${cfg.WX_PAY_MODE},缺失字段: ${missing.join(', ')}`)
      process.exit(1)
    }
    if (cfg.WECHAT_API_V3_KEY && Buffer.byteLength(cfg.WECHAT_API_V3_KEY, 'utf8') !== 32) {
      console.error('❌ WECHAT_API_V3_KEY 必须是 32 字节')
      process.exit(1)
    }
    for (const pathKey of ['WECHAT_MERCHANT_CERT_PATH','WECHAT_MERCHANT_KEY_PATH','WECHAT_PUBLIC_KEY_PATH'] as const) {
      const file = cfg[pathKey]
      if (file && !existsSync(file)) {
        console.error(`❌ ${pathKey} 文件不存在: ${file}`)
        process.exit(1)
      }
    }
    if (!cfg.WX_PAY_NOTIFY_URL?.startsWith('https://')) {
      console.error('❌ WX_PAY_NOTIFY_URL 必须使用 HTTPS')
      process.exit(1)
    }
  }

  if (cfg.NODE_ENV === 'production') {
    if (cfg.WX_PAY_MODE !== 'production-live') {
      console.error('❌ production 环境必须使用 production-live 支付模式')
      process.exit(1)
    }
    if (cfg.JWT_SECRET.startsWith('dev-secret') || cfg.JWT_SECRET.length < 32) {
      console.error('❌ production 环境 JWT_SECRET 必须是至少 32 位的随机值')
      process.exit(1)
    }
    if (cfg.DATABASE_URL.startsWith('file:')) {
      console.error('❌ production 环境禁止使用 SQLite')
      process.exit(1)
    }
  }
  return cfg
}

export const config: AppConfig = loadConfig()
