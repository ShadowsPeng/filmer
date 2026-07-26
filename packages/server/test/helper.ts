/**
 * 测试 helper:vi.mock 替身 prisma + 简单 sqlite 接入(可选,用于集成测试)。
 * 单元测试 (signature / pricing / order-state) 不需要 DB。
 */
import { vi } from 'vitest'

export function mockPrisma(overrides: Partial<any> = {}) {
  return {
    scanShop: { findUnique: vi.fn() },
    order: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      findMany: vi.fn(),
    },
    paymentAttempt: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    refund: {
      create: vi.fn(),
      update: vi.fn(),
      findUnique: vi.fn(),
    },
    orderEvent: { create: vi.fn() },
    idempotencyKey: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    user: { findUnique: vi.fn() },
    $transaction: vi.fn(),
    $disconnect: vi.fn(),
    ...overrides,
  }
}
