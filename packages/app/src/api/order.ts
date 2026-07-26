import { request } from './client'
import type {
  CreateOrderInput,
  CreateOrderOutput,
  PaymentSignOutput,
} from '../types/order'

export async function createOrder(input: CreateOrderInput) {
  return request<CreateOrderOutput>({
    method: 'POST',
    url: '/api/orders',
    data: input,
    header: { 'Idempotency-Key': `oid-${Date.now()}-${Math.random().toString(36).slice(2,8)}` },
  })
}

export async function getOrder(orderId: string) {
  return request<any>({ method: 'GET', url: `/api/orders/${orderId}` })
}

export async function listOrders() {
  return request<any[]>({ method: 'GET', url: '/api/orders' })
}

export async function payOrder(orderId: string) {
  return request<PaymentSignOutput>({
    method: 'POST',
    url: '/api/payment/jsapi',
    data: { orderId },
  })
}

export async function mockDeliverNotify(outTradeNo: string) {
  // 仅开发期可用,管理员 token 调用
  return request<any>({
    method: 'POST',
    url: '/api/payment/mock-notify',
    data: { outTradeNo, status: 'SUCCESS' },
  })
}

export async function queryPayment(outTradeNo: string) {
  return request<any>({
    method: 'POST',
    url: '/api/payment/query',
    data: { outTradeNo },
  })
}
