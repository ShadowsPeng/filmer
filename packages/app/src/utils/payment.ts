/**
 * 微信支付调用层。
 *
 * local-mock 分支:**不**调 wx.requestPayment,直接 resolve success,
 *   业务上依赖轮询订单状态推进(由后端 mock-notify 手动投递)。
 * staging/production 分支:调 wx.requestPayment,真机拉起微信收银台。
 */
import Taro from '@tarojs/taro'
import { ENV } from './env'
import type { PaymentSignOutput } from '../types/order'

export interface PaymentRequestArgs {
  prepay: PaymentSignOutput
}

export interface PaymentResult {
  errMsg: string
  mode: 'local-mock' | 'live'
}

export async function requestWechatPay(prepay: PaymentSignOutput): Promise<PaymentResult> {
  if (ENV.WX_PAY_MODE === 'local-mock') {
    console.log('[payment] local-mock:skipping wx.requestPayment, resolve success')
    // 模拟 200ms 延迟,让 UI 不要瞬间跳转
    await new Promise((r) => setTimeout(r, 200))
    return { errMsg: 'requestPayment:ok mock', mode: 'local-mock' }
  }

  const { timeStamp, nonceStr, package: pkg, signType, paySign } = prepay.paySign
  // 调起微信支付
  // 文档:https://pay.weixin.qq.com/wiki/doc/apiv3/apis/chapter3_1_4.shtml
  const res = await Taro.requestPayment({
    timeStamp, nonceStr, package: pkg, signType, paySign,
  })
  return { errMsg: res.errMsg, mode: 'live' }
}
