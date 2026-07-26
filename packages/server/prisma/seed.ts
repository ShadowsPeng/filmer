/**
 * Seed: 创建 demo 用户 + 单家冲扫店。
 * 运行: npm run prisma:seed
 */
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('生产环境禁止运行 demo seed')
  }
  // demo 用户:1 个普通用户 + 1 个管理员(mock-login 时按角色分)
  await prisma.user.upsert({
    where: { id: 'user_demo' },
    update: {},
    create: {
      id: 'user_demo',
      openid: 'mock_openid_user',
      nickname: '小胶',
      role: 'user',
    },
  })

  await prisma.user.upsert({
    where: { id: 'admin_demo' },
    update: {},
    create: {
      id: 'admin_demo',
      openid: 'mock_openid_admin',
      nickname: 'Admin',
      role: 'admin',
    },
  })

  // demo 冲扫店
  await prisma.scanShop.upsert({
    where: { id: 'shop_demo' },
    update: {},
    create: {
      id: 'shop_demo',
      name: '光合影像工作室',
      city: '上海',
      address: '徐汇区天平路 320 号',
      phone: '021-12345678',
      rating: 4.8,
      basePriceC41: 2500,        // ¥25/卷
      basePriceE6: 3500,         // ¥35/卷
      basePriceBW: 2000,         // ¥20/卷
      hiResFee: 1500,            // ¥15
      rushFee: 1000,             // ¥10
      isActive: true,
    },
  })

  console.log('✅ Seed 完成:')
  console.log('  - 用户 user_demo / admin_demo (mock-login 用)')
  console.log('  - 冲扫店 shop_demo (光合影像工作室)')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
