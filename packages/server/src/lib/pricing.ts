/**
 * 服务端计价 (绝不信前端传入的金额)。
 * 价格按 ScanShop 表读;订单字段只接收:filmFormat / rolls / process / package / hiRes / rush。
 */
import { prisma } from './prisma'

export type FilmFormat = '135' | '120'
export type Process = 'C41' | 'E6' | 'BW'
export type Package = 'standard' | 'fine'

export interface PriceInput {
  shopId: string
  filmFormat: FilmFormat
  rolls: number                 // 1-10
  process: Process
  package: Package
  hiRes: boolean
  rush: boolean
}

export interface PriceBreakdown {
  basePrice: number             // 单价 * 卷数
  hiResFee: number
  rushFee: number
  total: number                 // 分
  unit: 'fen'
}

const ROLLS_MIN = 1
const ROLLS_MAX = 10

export async function calculatePrice(input: PriceInput): Promise<PriceBreakdown> {
  if (input.rolls < ROLLS_MIN || input.rolls > ROLLS_MAX) {
    throw new Error(`rolls 必须在 ${ROLLS_MIN}-${ROLLS_MAX} 之间`)
  }
  const shop = await prisma.scanShop.findUnique({ where: { id: input.shopId } })
  if (!shop || !shop.isActive) throw new Error('shop 不存在或已下架')

  let unit = 0
  switch (input.process) {
    case 'C41': unit = shop.basePriceC41; break
    case 'E6':  unit = shop.basePriceE6; break
    case 'BW':  unit = shop.basePriceBW; break
  }

  const basePrice = unit * input.rolls
  const hiResFee = input.hiRes ? shop.hiResFee : 0
  const rushFee = input.rush ? shop.rushFee : 0
  const total = basePrice + hiResFee + rushFee

  // package 字段在 MVP 标价不区分(预留精细套餐)
  return { basePrice, hiResFee, rushFee, total, unit: 'fen' }
}
