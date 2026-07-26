/**
 * 状态机测试:合法/非法迁移。
 */
import { describe, it, expect } from 'vitest'
import { canTransition, assertTransition, TERMINAL_STATUSES } from '../src/service/order-state'

describe('order status machine', () => {
  it('pending_pay → paid 是合法的', () => {
    expect(canTransition('pending_pay', 'paid')).toBe(true)
  })

  it('pending_pay → closed 是合法的', () => {
    expect(canTransition('pending_pay', 'closed')).toBe(true)
  })

  it('pending_pay → finished 非法(必须先 paid)', () => {
    expect(canTransition('pending_pay', 'finished')).toBe(false)
  })

  it('paid → finished / refunding 都合法', () => {
    expect(canTransition('paid', 'finished')).toBe(true)
    expect(canTransition('paid', 'refunding')).toBe(true)
  })

  it('paid → closed 非法(不能从 paid 直接关闭)', () => {
    expect(canTransition('paid', 'closed')).toBe(false)
  })

  it('refunding → paid 合法(退款失败回退)', () => {
    expect(canTransition('refunding', 'paid')).toBe(true)
  })

  it('refunding → refunded 合法', () => {
    expect(canTransition('refunding', 'refunded')).toBe(true)
  })

  it('终态 closed / finished / refunded 不能继续转', () => {
    expect(canTransition('closed', 'paid')).toBe(false)
    expect(canTransition('finished', 'refunding')).toBe(false)
    expect(canTransition('refunded', 'pending_pay')).toBe(false)
  })

  it('assertTransition 在非法时抛错', () => {
    expect(() => assertTransition('pending_pay', 'finished')).toThrow(/非法状态迁移/)
  })

  it('assertTransition 在合法时不抛错', () => {
    expect(() => assertTransition('pending_pay', 'paid')).not.toThrow()
  })

  it('TERMINAL_STATUSES 包含 3 个终态', () => {
    expect(TERMINAL_STATUSES).toEqual(expect.arrayContaining(['closed', 'finished', 'refunded']))
    expect(TERMINAL_STATUSES).toHaveLength(3)
  })
})
