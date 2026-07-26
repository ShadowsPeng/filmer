/**
 * 计价公式测试。
 * 这里用 vi.mock 替身 prisma,不需要真实 DB。
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { calculatePrice } from '../src/lib/pricing'

// vi.mock 需要在 import 之前,所以放文件顶部
vi.mock('../src/lib/prisma', () => ({
  prisma: {
    scanShop: {
      findUnique: vi.fn(),
    },
  },
}))

import { prisma } from '../src/lib/prisma'

const SHOP = {
  id: 'shop1',
  name: '光合影像',
  city: '上海',
  address: 'x',
  phone: 'x',
  rating: 4.8,
  basePriceC41: 2500,
  basePriceE6: 3500,
  basePriceBW: 2000,
  hiResFee: 1500,
  rushFee: 1000,
  isActive: true,
}

describe('calculatePrice', () => {
  beforeEach(() => {
    vi.mocked(prisma.scanShop.findUnique).mockReset().mockResolvedValue(SHOP as any)
  })

  it('C-41 标准套餐 1 卷不加价', async () => {
    const r = await calculatePrice({
      shopId: 'shop1',
      filmFormat: '135',
      rolls: 1,
      process: 'C41',
      package: 'standard',
      hiRes: false,
      rush: false,
    })
    expect(r.basePrice).toBe(2500)
    expect(r.hiResFee).toBe(0)
    expect(r.rushFee).toBe(0)
    expect(r.total).toBe(2500)
  })

  it('黑白 5 卷加 ¥10 加急 = 5×20 + 10 = ¥110', async () => {
    const r = await calculatePrice({
      shopId: 'shop1', filmFormat: '120', rolls: 5,
      process: 'BW', package: 'standard',
      hiRes: false, rush: true,
    })
    expect(r.basePrice).toBe(2000 * 5)        // 10000
    expect(r.rushFee).toBe(1000)
    expect(r.total).toBe(11000)
  })

  it('E-6 + 高分辨率扫描 + 加急,2 卷', async () => {
    const r = await calculatePrice({
      shopId: 'shop1', filmFormat: '135', rolls: 2,
      process: 'E6', package: 'fine',
      hiRes: true, rush: true,
    })
    expect(r.basePrice).toBe(3500 * 2)
    expect(r.hiResFee).toBe(1500)
    expect(r.rushFee).toBe(1000)
    expect(r.total).toBe(7000 + 1500 + 1000)
  })

  it('rolls 越界抛错', async () => {
    await expect(calculatePrice({
      shopId: 'shop1', filmFormat: '135', rolls: 11,
      process: 'C41', package: 'standard',
      hiRes: false, rush: false,
    })).rejects.toThrow(/1-10 之间/)
  })

  it('shop 不存在抛错', async () => {
    vi.mocked(prisma.scanShop.findUnique).mockReset().mockResolvedValue(null)
    await expect(calculatePrice({
      shopId: 'nope', filmFormat: '135', rolls: 1,
      process: 'C41', package: 'standard',
      hiRes: false, rush: false,
    })).rejects.toThrow(/shop 不存在/)
  })
})
