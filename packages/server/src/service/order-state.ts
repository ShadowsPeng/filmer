/**
 * 订单状态机:定义合法迁移 + 守卫函数。
 * MVP 状态:
 *   pending_pay → paid | closed
 *   paid        → finished | refunding
 *   refunding   → refunded
 * 终态: closed / finished / refunded
 */

export type OrderStatus =
  | 'pending_pay'
  | 'paid'
  | 'refunding'
  | 'refunded'
  | 'closed'
  | 'finished'

const transitions: Record<OrderStatus, OrderStatus[]> = {
  pending_pay: ['paid', 'closed'],
  paid: ['finished', 'refunding'],
  refunding: ['refunded', 'paid'],  // 退款失败可回到 paid
  refunded: [],
  closed: [],
  finished: [],
}

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return transitions[from]?.includes(to) ?? false
}

export function assertTransition(from: OrderStatus, to: OrderStatus): void {
  if (!canTransition(from, to)) {
    throw new Error(`非法状态迁移: ${from} → ${to}`)
  }
}

export const TERMINAL_STATUSES: OrderStatus[] = ['closed', 'finished', 'refunded']
