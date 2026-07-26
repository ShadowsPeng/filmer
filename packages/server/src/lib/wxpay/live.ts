/**
 * staging-live / production-live 共用实现。
 * 通过 http 层调微信支付 V3 真实端点。
 */
import { WxPayClient } from './types'
import {
  JsapiOrderInput,
  JsapiOrderOutput,
  WxOrder,
  CloseOrderResult,
  RefundInput,
  RefundOutput,
  RefundStatus,
  WxPayConfig,
} from './types'
import { createLiveHttp, WxPayHttp } from './http'

export function createLiveClient(config: WxPayConfig, publicKeyPem: Buffer | null): WxPayClient {
  const http: WxPayHttp = createLiveHttp(config, publicKeyPem)

  return {
    async createJsapiOrder(input: JsapiOrderInput): Promise<JsapiOrderOutput> {
      const body = {
        appid: config.appid,
        mchid: config.mchid,
        description: input.description,
        out_trade_no: input.outTradeNo,
        notify_url: config.notifyUrl,
        amount: { total: input.amountTotal, currency: input.amountCurrency ?? 'CNY' },
        payer: { openid: input.openid },
        attach: input.attach ?? '',
      }
      const res = await http.request<{ prepay_id: string }>({
        method: 'POST',
        path: '/v3/pay/transactions/jsapi',
        body,
      })
      return { prepayId: res.body.prepay_id }
    },

    async closeOrder(outTradeNo: string): Promise<CloseOrderResult> {
      await http.request({
        method: 'POST',
        path: `/v3/pay/transactions/out-trade-no/${outTradeNo}/close`,
        body: { mchid: config.mchid },
      })
      return { ok: true }
    },

    async queryOrderByOutTradeNo(outTradeNo: string): Promise<WxOrder> {
      const res = await http.request<{
        transaction_id?: string
        out_trade_no: string
        trade_state: string
        amount: { total: number; payer_total: number; currency: string }
        success_time?: string
      }>({
        method: 'GET',
        path: `/v3/pay/transactions/out-trade-no/${outTradeNo}`,
      })
      return {
        transactionId: res.body.transaction_id ?? null,
        outTradeNo: res.body.out_trade_no,
        status: res.body.trade_state as WxOrder['status'],
        amountTotal: res.body.amount?.total ?? 0,
        paidAt: res.body.success_time ? new Date(res.body.success_time) : null,
      }
    },

    async refund(input: RefundInput): Promise<RefundOutput> {
      const res = await http.request<{ refund_id?: string }>({
        method: 'POST',
        path: '/v3/refund/domestic/refunds',
        body: {
          out_trade_no: input.outTradeNo,
          transaction_id: input.transactionId,
          out_refund_no: input.outRefundNo,
          reason: input.reason,
          amount: {
            refund: input.amountRefund,
            total: input.amountTotal,
            currency: 'CNY',
          },
        },
      })
      return { refundId: res.body.refund_id ?? null }
    },

    async queryRefund(outRefundNo: string): Promise<RefundStatus> {
      const res = await http.request<{
        refund_id?: string
        status: 'SUCCESS' | 'PROCESSING' | 'CLOSED' | 'ABNORMAL'
        amount: { refund: number }
      }>({
        method: 'GET',
        path: `/v3/refund/domestic/refunds/${outRefundNo}`,
      })
      return {
        refundId: res.body.refund_id ?? null,
        status: res.body.status,
        successAmount: res.body.amount?.refund ?? 0,
      }
    },
  }
}
