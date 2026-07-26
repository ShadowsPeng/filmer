/**
 * local-mock 模式实现。
 *
 * 不访问微信网络。所有方法都基于当前进程的内存状态返回。
 * 注意:这里**不**读真实 PaymentAttempt (那是 service 层的事);
 *       mock 的"查询订单 / 退款状态"交由 service 层通过 callback 解耦注入,
 *       client 层只暴露接口。
 *
 * 业务上,local-mock 模式下:
 *   createJsapiOrder → 返回固定 prepayId = 'mock_prepay_' + outTradeNo
 *   后端 service 在 attempt.status === 'pending' 时立即返回前端 wx.requestPayment 的 mock 参数
 *   notify 由管理员手动调 /api/payment/mock-notify 测试接口投递,client 不参与
 */
import {
  WxPayClient,
  JsapiOrderInput,
  JsapiOrderOutput,
  WxOrder,
  CloseOrderResult,
  RefundInput,
  RefundOutput,
  RefundStatus,
  WxTradeState,
} from './types'

export function createMockClient(): WxPayClient {
  return {
    async createJsapiOrder(input: JsapiOrderInput): Promise<JsapiOrderOutput> {
      // 服务端 mock:truePrep
      return { prepayId: `mock_prepay_${input.outTradeNo}` }
    },

    async closeOrder(_outTradeNo: string): Promise<CloseOrderResult> {
      return { ok: true }
    },

    async queryOrderByOutTradeNo(_outTradeNo: string): Promise<WxOrder> {
      // 在 mock 模式下,真实订单状态由 service 查 PaymentAttempt 表;
      // 此方法**不会被 service 调用**(由 service 短路),保留返回兜底 default。
      return {
        transactionId: null,
        outTradeNo: _outTradeNo,
        status: 'NOTPAY',
        amountTotal: 0,
        paidAt: null,
      }
    },

    async refund(_input: RefundInput): Promise<RefundOutput> {
      return { refundId: `mock_refund_${_input.outRefundNo}` }
    },

    async queryRefund(_outRefundNo: string): Promise<RefundStatus> {
      return { refundId: null, status: 'SUCCESS', successAmount: 0 }
    },
  }
}
