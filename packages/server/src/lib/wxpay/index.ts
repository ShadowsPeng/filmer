/**
 * 工厂 + 客户端签名(payload 用于前端 wx.requestPayment)。
 */
import * as crypto from 'node:crypto'
import * as fs from 'node:fs'
import { config as appConfig } from '../../config'
import {
  WxPayClient,
  WxPayConfig,
  WxPayMode,
} from './types'
import { createMockClient } from './mock'
import { createLiveClient } from './live'

export function buildWxPayConfig(): WxPayConfig {
  const mode = appConfig.WX_PAY_MODE as WxPayMode

  if (mode === 'local-mock') {
    return {
      mode,
      appid: appConfig.WECHAT_APPID ?? 'mock_appid',
      mchid: appConfig.WECHAT_MCHID ?? 'mock_mchid',
      apiV3Key: '',
      merchantCertSerialNo: '',
      merchantCert: Buffer.alloc(0),
      merchantKey: Buffer.alloc(0),
      notifyUrl: '',
      apiBase: 'https://api.mch.weixin.qq.com',
    }
  }

  // staging-live / production-live,从环境变量读
  const certPath = appConfig.WECHAT_MERCHANT_CERT_PATH
  const keyPath = appConfig.WECHAT_MERCHANT_KEY_PATH
  if (!certPath || !keyPath) {
    throw new Error('WECHAT_MERCHANT_CERT_PATH / WECHAT_MERCHANT_KEY_PATH 未配置')
  }
  // config.ts 启动校验已保证 staging/production 必填;此处用非空断言
  return {
    mode,
    appid: appConfig.WECHAT_APPID!,
    mchid: appConfig.WECHAT_MCHID!,
    apiV3Key: appConfig.WECHAT_API_V3_KEY!,
    merchantCertSerialNo: appConfig.WECHAT_MERCHANT_CERT_SERIAL_NO!,
    merchantCert: fs.readFileSync(certPath),
    merchantKey: fs.readFileSync(keyPath),
    notifyUrl: appConfig.WX_PAY_NOTIFY_URL!,
    apiBase: appConfig.WECHAT_API_BASE,
  }
}

export function createWxPayClient(): WxPayClient {
  const config = buildWxPayConfig()
  if (config.mode === 'local-mock') return createMockClient()
  // staging/production 阶段,微信支付公钥 / 平台证书通过 /v3/certificates 下载并缓存(本 MVP 简化:要求 WECHAT_PUBLIC_KEY_PATH 环境变量)
  let publicKeyPem: Buffer | null = null
  if (process.env.WECHAT_PUBLIC_KEY_PATH) {
    publicKeyPem = fs.readFileSync(process.env.WECHAT_PUBLIC_KEY_PATH)
  }
  return createLiveClient(config, publicKeyPem)
}

// 单例
let _client: WxPayClient | null = null
export function getWxPayClient(): WxPayClient {
  if (!_client) _client = createWxPayClient()
  return _client
}

// 测试用:重置单例
export function _resetWxPayClientForTest() {
  _client = null
}

// ===== 给前端 wx.requestPayment 用的签名 =====
// 前端需要 nonceStr / timeStamp / paySign,paySign 是前端对 prepay_id 再签一次。
// 文档:https://pay.weixin.qq.com/wiki/doc/apiv3/apis/chapter3_1_4.shtml

export interface JsapiPaySign {
  appId: string
  timeStamp: string
  nonceStr: string
  package: string              // 'prepay_id=' + prepayId
  signType: 'RSA'
  paySign: string              // base64
}

export function signJsapiPay(prepayId: string, cfg: WxPayConfig): JsapiPaySign {
  if (cfg.mode === 'local-mock') {
    // mock 模式:paySign 不需要真实签名,前端 mockWxPay() 直接 resolve
    return {
      appId: cfg.appid,
      timeStamp: Math.floor(Date.now() / 1000).toString(),
      nonceStr: 'mocknonce',
      package: `prepay_id=${prepayId}`,
      signType: 'RSA',
      paySign: 'mockpaysign',
    }
  }
  const nonceStr = crypto.randomBytes(16).toString('hex')
  const timeStamp = Math.floor(Date.now() / 1000).toString()
  const message = `${cfg.appid}\n${timeStamp}\n${nonceStr}\nprepay_id=${prepayId}\n`
  const sign = crypto.createSign('RSA-SHA256')
  sign.update(message, 'utf8')
  sign.end()
  const paySign = sign.sign(cfg.merchantKey).toString('base64')
  return {
    appId: cfg.appid,
    timeStamp,
    nonceStr,
    package: `prepay_id=${prepayId}`,
    signType: 'RSA',
    paySign,
  }
}
