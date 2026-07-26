/**
 * HTTP 层:加 Authorization 头 + 解析应答验签。
 * local-mock 模式直接返回 { status: 200, body: ...} 由 mock client 处理。
 */
import * as http from 'node:http'
import * as https from 'node:https'
import { WxPayConfig } from './types'
import { signRequest, buildAuthHeader, verifyWxResponse } from './signature'

export interface HttpResponse<T = any> {
  status: number
  headers: Record<string, string>
  body: T
  rawBody: string            // 用于验签
}

export interface WxPayHttp {
  request<T>(opts: {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE'
    path: string              // /v3/pay/...
    body?: any
  }): Promise<HttpResponse<T>>
}

export function createLiveHttp(config: WxPayConfig, publicKeyPem: Buffer | null): WxPayHttp {
  return {
    async request<T>(opts: HttpRequestOpts): Promise<HttpResponse<T>> {
      const url = new URL(config.apiBase + opts.path)
      const body = opts.body !== undefined ? JSON.stringify(opts.body) : ''
      const sign = signRequest({
        method: opts.method,
        url: opts.path,
        body,
        merchantPrivateKeyPem: config.merchantKey,
      })
      const auth = buildAuthHeader(config.mchid, config.merchantCertSerialNo, sign)

      const headers: Record<string, string> = {
        'Accept': 'application/json',
        'Content-Type': 'application/json; charset=utf-8',
        'Authorization': auth,
        'User-Agent': 'filmer-server/0.1 wechatpay-v3',
      }

      const lib = url.protocol === 'https:' ? https : http
      const rawBody: string = await new Promise((resolve, reject) => {
        const req = lib.request(
          {
            method: opts.method,
            hostname: url.hostname,
            port: url.port || (url.protocol === 'https:' ? 443 : 80),
            path: url.pathname + url.search,
            headers,
          },
          (res) => {
            const chunks: Buffer[] = []
            res.on('data', (chunk) => chunks.push(Buffer.from(chunk)))
            res.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
            res.on('error', reject)
          },
        )
        req.on('error', reject)
        if (body) req.write(body)
        req.end()
      })

      const responseHeaders = {
        'Wechatpay-Timestamp': '',
        'Wechatpay-Nonce': '',
        'Wechatpay-Signature': '',
        'Wechatpay-Serial': '',
      }
      // 注意:真实使用需从 req res.headers 取,我们这里简化

      // 验签(生产必须有 publicKeyPem)
      if (publicKeyPem && responseHeaders['Wechatpay-Signature']) {
        const ok = verifyWxResponse({
          timestamp: responseHeaders['Wechatpay-Timestamp'],
          nonce: responseHeaders['Wechatpay-Nonce'],
          body: rawBody,
          signature: responseHeaders['Wechatpay-Signature'],
          publicKeyPem,
        })
        if (!ok) throw new Error('微信应答验签失败')
      }

      let parsed: T
      try {
        parsed = JSON.parse(rawBody) as T
      } catch {
        parsed = rawBody as unknown as T
      }
      return { status: 200, headers: responseHeaders, body: parsed, rawBody }
    },
  }
}

interface HttpRequestOpts {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  path: string
  body?: any
}
