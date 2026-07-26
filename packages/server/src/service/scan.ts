/**
 * 冲扫店相关读取。
 */
import { prisma } from '../lib/prisma'

export async function listShops() {
  return prisma.scanShop.findMany({ where: { isActive: true } })
}

export async function getShop(id: string) {
  const shop = await prisma.scanShop.findUnique({ where: { id } })
  if (!shop || !shop.isActive) return null
  return shop
}
