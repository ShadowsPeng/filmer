/**
 * 微信支付 V3 签名 / 验签 / 回调解密。
 *
 * - 商户请求签名: SHA256withRSA(merchant private key)
 *   签名串 = method + '\n' + url + '\n' + timestamp + '\n' + nonce_str + '\n' + body + '\n'
 *   Authorization 头 = WECHATPAY2-SHA256-RSA2048 mchid="..",nonce_str="..",signature="..",timestamp="..",serial_no=".."
 *
 * - 应答验签: 微信返回的 Wechatpay-Signature 头用平台证书/微信支付公钥验签。
 * - 回调验签: 同上,验签字符串与请求签名格式一致。
 * - 回调解密: resource.ciphertext base64 解码 → AES-256-GCM 解密
 *   key = 32 字节 APIv3 key, nonce = resource.nonce, aad = resource.associated_data
 *
 * 文档:
 *   https://pay.weixin.qq.com/wiki/doc/apiv3/wechatpay/wechatpay-4_3.shtml
 */
import * as crypto from 'node:crypto'

function randomNonce(len = 32): string {
  return crypto.randomBytes(len).toString('hex').slice(0, len)
}

// ===== 商户请求签名 =====

export interface SignInput {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  url: string                 // 不含域名;例如 /v3/pay/transactions/jsapi
  body: string                // JSON 字符串,GET 时为 ''
  merchantPrivateKeyPem: Buffer | string
}

export interface SignOutput {
  timestamp: string           // 秒
  nonce: string
  signature: string           // base64
}

export function signRequest(input: SignInput): SignOutput {
  const timestamp = Math.floor(Date.now() / 1000).toString()
  const nonce = randomNonce(32)
  const message = `${input.method}\n${input.url}\n${timestamp}\n${nonce}\n${input.body}\n`
  const sign = crypto.createSign('RSA-SHA256')
  sign.update(message, 'utf8')
  sign.end()
  const signature = sign.sign(input.merchantPrivateKeyPem).toString('base64')
  return { timestamp, nonce, signature }
}

export function buildAuthHeader(
  mchid: string,
  serialNo: string,
  sign: SignOutput,
): string {
  return (
    `WECHATPAY2-SHA256-RSA2048 ` +
    `mchid="${mchid}",` +
    `nonce_str="${sign.nonce}",` +
    `signature="${sign.signature}",` +
    `timestamp="${sign.timestamp}",` +
    `serial_no="${serialNo}"`
  )
}

// ===== 应答验签 =====

export interface VerifyInput {
  timestamp: string           // 微信 Wechatpay-Timestamp 头
  nonce: string               // 微信 Wechatpay-Nonce 头
  body: string                // 微信返回的原始 response body
  signature: string           // 微信 Wechatpay-Signature 头
  publicKeyPem: Buffer | string
}

export function verifyWxResponse(input: VerifyInput): boolean {
  const message = `${input.timestamp}\n${input.nonce}\n${input.body}\n`
  const verify = crypto.createVerify('RSA-SHA256')
  verify.update(message, 'utf8')
  verify.end()
  return verify.verify(input.publicKeyPem, input.signature, 'base64')
}

// ===== 回调解密 =====

export function decryptNotify(
  ciphertextB64: string,
  nonce: string,
  associatedData: string,
  apiV3Key: string,
): string {
  if (Buffer.byteLength(apiV3Key, 'utf8') !== 32) {
    throw new Error('apiV3Key 必须是 32 字节')
  }
  const key = Buffer.from(apiV3Key, 'utf8')
  // 微信把 16 字节 auth tag 拼在密文二进制末尾,而不是 base64 字符串末尾
  const full = Buffer.from(ciphertextB64, 'base64')
  const TAG_LEN = 16
  if (full.length < TAG_LEN) throw new Error('ciphertext 太短')
  const tag = full.subarray(full.length - TAG_LEN)
  const ciphertext = full.subarray(0, full.length - TAG_LEN)
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, nonce)
  decipher.setAuthTag(tag)
  decipher.setAAD(Buffer.from(associatedData, 'utf8'))
  return Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]).toString('utf8')
}

// ===== 工具:计算 timestamp diff 用于回调时间戳校验 =====

export function isTimestampFresh(ts: string, toleranceSec = 300): boolean {
  const diff = Math.abs(Math.floor(Date.now() / 1000) - Number(ts))
  return diff <= toleranceSec
}
