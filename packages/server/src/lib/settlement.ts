/**
 * 平台自营模式 (Settlement = Noop)。
 * 平台统一收款,线下对公结算给冲扫店。
 *
 * Phase 2 切服务商+子商户模式时,实现 SettlementWithProfitSharing 接口:
 *   - createSubMerchant
 *   - profitShare (调 /v3/profitsharing/orders)
 *   - profitShareReturn (退款时冲正)
 */
import { PrismaClient } from '@prisma/client'

export interface Settlement {
  /**
   * 支付成功后调用:记录平台收款 + 待对账的供应商结算额。
   * MVP 不做实际分账,只落日志(供线下对账脚本读)。
   */
  onPaymentSuccess(input: {
    orderId: string
    transactionId: string
    amountTotal: number
    shopId: string
    expectedPayToShop: number       // 应付给冲扫店(分)
    expectedCommission: number     // 平台抽佣(分)
  }, prisma: PrismaClient): Promise<void>

  /**
   * 退款成功后调用:回滚对账记录。
   */
  onRefundSuccess(input: {
    orderId: string
    refundId: string
    amountRefund: number
  }, prisma: PrismaClient): Promise<void>
}

export const NoopSettlement: Settlement = {
  async onPaymentSuccess(input, _prisma) {
    // MVP 阶段什么都不做,后续接入脚本读 PaymentAttempt 自己做对账
    console.log('[settlement:noop] payment success', input)
  },

  async onRefundSuccess(input, _prisma) {
    console.log('[settlement:noop] refund success', input)
  },
}

export const settlement: Settlement = NoopSettlement
