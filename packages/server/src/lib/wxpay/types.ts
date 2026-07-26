/**
 * 微信支付 V3 API 类型与客户端接口。
 */

export type WxPayMode = 'local-mock' | 'staging-live' | 'production-live'

export interface WxPayConfig {
  mode: WxPayMode
  appid: string
  mchid: string
  apiV3Key: string              // 32 字节(mock 模式可空)
  merchantCertSerialNo: string  // (mock 可空)
  merchantCert: Buffer          // apiclient_cert.pem 内容 (mock 可空)
  merchantKey: Buffer           // apiclient_key.pem 内容 (mock 可空)
  notifyUrl: string             // (mock 模式可空,但长度校验要过)
  apiBase: string               // 默认 https://api.mch.weixin.qq.com
}

// ===== 统一下单(JSAPI) =====

export interface JsapiOrderInput {
  outTradeNo: string
  description: string
  amountTotal: number           // 分
  amountCurrency?: 'CNY'
  openid: string
  attach?: string
}

export interface JsapiOrderOutput {
  prepayId: string
}

// ===== 主动查单 =====

export type WxTradeState =
  | 'SUCCESS'
  | 'REFUND'
  | 'NOTPAY'
  | 'CLOSED'
  | 'REVOKED'
  | 'USERPAYING'
  | 'PAYERROR'

export interface WxOrder {
  transactionId: string | null   // 微信支付订单号,NOTPAY 时可能为 null
  outTradeNo: string
  status: WxTradeState
  amountTotal: number
  paidAt: Date | null
}

// ===== 关单 =====

export interface CloseOrderResult {
  ok: boolean
}

// ===== 退款 =====

export interface RefundInput {
  outRefundNo: string
  transactionId: string
  outTradeNo: string
  amountTotal: number
  amountRefund: number
  reason: string
}

export interface RefundOutput {
  refundId: string | null       // 受理后异步,可能为 null
}

// ===== 主动查退款 =====

export type WxRefundState = 'SUCCESS' | 'PROCESSING' | 'CLOSED' | 'ABNORMAL'

export interface RefundStatus {
  refundId: string | null
  status: WxRefundState
  successAmount: number
}

// ===== 客户端接口 =====

export interface WxPayClient {
  createJsapiOrder(input: JsapiOrderInput): Promise<JsapiOrderOutput>
  closeOrder(outTradeNo: string): Promise<CloseOrderResult>
  queryOrderByOutTradeNo(outTradeNo: string): Promise<WxOrder>
  refund(input: RefundInput): Promise<RefundOutput>
  queryRefund(outRefundNo: string): Promise<RefundStatus>
}

// ===== 回调解密相关 =====

export interface NotifyPayload {
  id: string                     // 通知 ID
  create_time: string
  resource_type: string
  event_type: string
  summary: string
  resource: {
    algorithm: string             // 'AEAD_AES_256_GCM'
    ciphertext: string            // base64
    nonce: string
    associated_data: string
  }
}

export interface DecryptedNotify {
  appid: string
  mchid: string
  outTradeNo: string
  transactionId: string | null
  tradeState: WxTradeState
  amount: { total: number; payer_total: number; currency: string }
  payer: { openid: string }
  successTime: string             // 'yyyy-MM-DDTHH:mm:ss+08:00'
}
