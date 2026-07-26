/**
 * 签名 + 解密 round-trip 测试。
 * 不依赖 DB。
 */
import { describe, it, expect } from 'vitest'
import * as crypto from 'node:crypto'
import { signRequest, buildAuthHeader, decryptNotify, verifyWxResponse, isTimestampFresh } from '../src/lib/wxpay/signature'

// 生成一对临时 RSA 用于测试
function genKeyPair() {
  return crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  })
}

describe('signature.ts', () => {
  it('signRequest 生成的签名可被对应公钥验证', () => {
    const { publicKey, privateKey } = genKeyPair()
    const body = JSON.stringify({ foo: 'bar' })
    const { timestamp, nonce, signature } = signRequest({
      method: 'POST',
      url: '/v3/pay/transactions/jsapi',
      body,
      merchantPrivateKeyPem: privateKey,
    })
    expect(timestamp).toMatch(/^\d+$/)
    expect(nonce).toHaveLength(32)
    expect(signature).toMatch(/^[A-Za-z0-9+/=]+$/)

    // 用公钥重算并比对(模拟微信内部校验)
    const message = `POST\n/v3/pay/transactions/jsapi\n${timestamp}\n${nonce}\n${body}\n`
    const verify = crypto.createVerify('RSA-SHA256')
    verify.update(message, 'utf8')
    verify.end()
    expect(verify.verify(publicKey, signature, 'base64')).toBe(true)
  })

  it('buildAuthHeader 格式正确', () => {
    const { privateKey } = genKeyPair()
    const sign = signRequest({
      method: 'GET', url: '/v3/test', body: '',
      merchantPrivateKeyPem: privateKey,
    })
    const header = buildAuthHeader('mchid_123', 'serial_abc', sign)
    expect(header.startsWith('WECHATPAY2-SHA256-RSA2048 ')).toBe(true)
    expect(header).toContain('mchid="mchid_123"')
    expect(header).toContain(`nonce_str="${sign.nonce}"`)
    expect(header).toContain(`signature="${sign.signature}"`)
    expect(header).toContain(`timestamp="${sign.timestamp}"`)
    expect(header).toContain('serial_no="serial_abc"')
  })

  it('decryptNotify 解密:与 AES-256-GCM 加密 round-trip 一致', () => {
    const apiV3Key = '0123456789abcdef0123456789abcdef'  // 32 bytes
    const key = Buffer.from(apiV3Key, 'utf8')
    const nonce = 'abcedfg'
    const aad = 'transaction'
    const plain = JSON.stringify({ out_trade_no: 'FT123', trade_state: 'SUCCESS' })

    // 加密
    const cipher = crypto.createCipheriv('aes-256-gcm', key, nonce)
    cipher.setAAD(Buffer.from(aad))
    const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()])
    const tag = cipher.getAuthTag()
    const cipherB64 = Buffer.concat([enc, tag]).toString('base64')

    // 用 decryptNotify 解密
    const decrypted = decryptNotify(cipherB64, nonce, aad, apiV3Key)
    expect(JSON.parse(decrypted).out_trade_no).toBe('FT123')
    expect(JSON.parse(decrypted).trade_state).toBe('SUCCESS')
  })

  it('decryptNotify:密钥长度非法抛错', () => {
    expect(() => decryptNotify('xx', 'n', 'a', 'short')).toThrow(/32 字节/)
  })

  it('verifyWxResponse 能验签自己签出来的内容', () => {
    const { publicKey, privateKey } = genKeyPair()
    const ts = '1700000000'
    const nonce = 'random_nonce_abc'
    const body = '{"foo":"bar"}'
    const message = `${ts}\n${nonce}\n${body}\n`
    const sign = crypto.createSign('RSA-SHA256')
    sign.update(message, 'utf8')
    sign.end()
    const sig = sign.sign(privateKey).toString('base64')

    expect(verifyWxResponse({
      timestamp: ts,
      nonce,
      body,
      signature: sig,
      publicKeyPem: publicKey,
    })).toBe(true)

    // 改一处 -> 验签失败
    expect(verifyWxResponse({
      timestamp: ts,
      nonce,
      body: '{"foo":"baz"}',         // 改 body
      signature: sig,
      publicKeyPem: publicKey,
    })).toBe(false)
  })

  it('isTimestampFresh:5 分钟内新鲜', () => {
    expect(isTimestampFresh(Math.floor(Date.now() / 1000).toString())).toBe(true)
    expect(isTimestampFresh((Math.floor(Date.now() / 1000) - 1000).toString())).toBe(false)
  })
})
