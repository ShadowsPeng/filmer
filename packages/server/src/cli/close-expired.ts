import { prisma } from '../lib/prisma'
import { closeExpiredOrders } from '../service/close-expired'

closeExpiredOrders()
  .then((result) => {
    console.log('[close-expired]', result)
    if (result.failed > 0) process.exitCode = 1
  })
  .catch((error) => {
    console.error('[close-expired] fatal', error)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
