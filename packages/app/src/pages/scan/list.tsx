import { useState, useEffect } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { listShops } from '../../api/scan'
import type { ScanShop } from '../../types/order'
import './list.scss'

function priceYuan(fen: number) {
  return `¥${(fen / 100).toFixed(0)}`
}

export default function ScanList() {
  const [shops, setShops] = useState<ScanShop[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    listShops()
      .then(setShops)
      .catch((e) => {
        Taro.showToast({ title: e.message ?? '加载失败', icon: 'none' })
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <View className="loading"><Text>加载中…</Text></View>
  }

  return (
    <View className="page">
      <Text className="page-title">冲扫服务</Text>
      {shops.map((shop) => (
        <View
          key={shop.id}
          className="shop-card"
          onClick={() => Taro.navigateTo({ url: `/pages/scan/detail?id=${shop.id}` })}
        >
          <View className="shop-header">
            <Text className="shop-name">{shop.name}</Text>
            <Text className="shop-rating">★ {shop.rating.toFixed(1)}</Text>
          </View>
          <Text className="shop-addr">{shop.city} · {shop.address}</Text>
          <View className="shop-prices">
            <Text className="price-item">C-41 {priceYuan(shop.basePriceC41)}/卷</Text>
            <Text className="price-item">E-6 {priceYuan(shop.basePriceE6)}/卷</Text>
            <Text className="price-item">黑白 {priceYuan(shop.basePriceBW)}/卷</Text>
          </View>
        </View>
      ))}
      {shops.length === 0 && (
        <View className="empty"><Text>暂无冲扫店</Text></View>
      )}
    </View>
  )
}
