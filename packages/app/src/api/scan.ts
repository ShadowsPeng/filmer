import { request } from './client'
import type { ScanShop } from '../types/order'

export async function listShops() {
  return request<ScanShop[]>({ method: 'GET', url: '/api/scan/shops' })
}

export async function getShop(id: string) {
  return request<ScanShop>({ method: 'GET', url: `/api/scan/shops/${id}` })
}
