/**
 * 前后端共用的订单/支付类型(简化版)。
 */

export type OrderStatus =
  | 'pending_pay'
  | 'paid'
  | 'refunding'
  | 'refunded'
  | 'closed'
  | 'finished'

export interface ScanShop {
  id: string
  name: string
  city: string
  address: string
  phone: string
  rating: number
  basePriceC41: number         // 分
  basePriceE6: number
  basePriceBW: number
  hiResFee: number
  rushFee: number
}

export interface ScanShopSummary extends ScanShop {
  serviceCoverage: string       // '胶卷冲洗 + 高质量扫描'
}

export interface CreateOrderInput {
  shopId: string
  filmFormat: '135' | '120'
  rolls: number
  process: 'C41' | 'E6' | 'BW'
  package: 'standard' | 'fine'
  hiRes: boolean
  rush: boolean
  receiver: { name: string; phone: string; address: string }
  remark?: string
}

export interface CreateOrderOutput {
  orderId: string
  outTradeNo: string
  amount: number
  expireAt: string
}

export interface PaymentSignOutput {
  outTradeNo: string
  amount: number
  paySign: {
    appId: string
    timeStamp: string
    nonceStr: string
    package: string
    signType: 'RSA'
    paySign: string
  }
  mode: 'local-mock' | 'staging-live' | 'production-live'
}
