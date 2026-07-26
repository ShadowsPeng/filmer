import { useEffect, useState } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { getShop } from '../../api/scan'
import type { ScanShop } from '../../types/order'
import './detail.scss'

function priceYuan(fen: number) { return `¥${(fen / 100).toFixed(0)}` }

export default function ScanDetail() {
  const [shop, setShop] = useState<ScanShop | null>(null)
  const [process, setProcess] = useState<'C41' | 'E6' | 'BW'>('C41')
  const [rolls, setRolls] = useState(1)
  const [hiRes, setHiRes] = useState(false)
  const [rush, setRush] = useState(false)

  useEffect(() => {
    // Taro.getCurrentInstance 在 Taro 4.x 推荐使用,这里简化为 router.params
    const router = Taro.getCurrentInstance()?.router
    const id = router?.params?.id
    if (!id) {
      Taro.showToast({ title: '缺参数 id', icon: 'none' })
      return
    }
    getShop(id).then(setShop).catch((e) => Taro.showToast({ title: e.message, icon: 'none' }))
  }, [])

  if (!shop) {
    return <View className="loading"><Text>加载中…</Text></View>
  }

  function unitPrice(): number {
    if (process === 'C41') return shop!.basePriceC41
    if (process === 'E6') return shop!.basePriceE6
    return shop!.basePriceBW
  }

  const total = unitPrice() * rolls + (hiRes ? shop.hiResFee : 0) + (rush ? shop.rushFee : 0)

  function goConfirm() {
    Taro.navigateTo({
      url: '/pages/order/confirm',
    })
    // 透传选项:用 navigateTo 的 success 回调或本地存储;这里用 navigateTo 传 query 不便,用本页缓存:
    Taro.setStorageSync('draft', {
      shopId: shop!.id,
      filmFormat: '135' as const,
      rolls, process,
      package: 'standard' as const,
      hiRes, rush,
    })
  }

  return (
    <View className="page">
      <View className="hero">
        <Text className="shop-name">{shop.name}</Text>
        <Text className="shop-meta">★ {shop.rating.toFixed(1)} · {shop.city}</Text>
      </View>

      <View className="section">
        <Text className="section-title">选择工艺</Text>
        <View className="chips">
          {(['C41','E6','BW'] as const).map((p) => (
            <View key={p} className={`chip ${process === p ? 'active' : ''}`} onClick={() => setProcess(p)}>
              <Text>{p}{p !== 'BW' ? ` · ${priceYuan(shop[`basePrice${p}` as 'basePriceC41'])}` : ` · ${priceYuan(shop.basePriceBW)}`}</Text>
            </View>
          ))}
        </View>
      </View>

      <View className="section">
        <Text className="section-title">卷数</Text>
        <View className="counter">
          <View className="counter-btn" onClick={() => setRolls(Math.max(1, rolls - 1))}>−</View>
          <Text className="counter-val">{rolls}</Text>
          <View className="counter-btn" onClick={() => setRolls(Math.min(10, rolls + 1))}>+</View>
        </View>
      </View>

      <View className="section">
        <Text className="section-title">附加选项</Text>
        <View className="toggle-row" onClick={() => setHiRes(!hiRes)}>
          <Text>高分辨率扫描</Text>
          <Text className={`toggle ${hiRes ? 'on' : ''}`}>{hiRes ? 'ON' : 'OFF'}</Text>
          <Text className="fee">+{priceYuan(shop.hiResFee)}</Text>
        </View>
        <View className="toggle-row" onClick={() => setRush(!rush)}>
          <Text>加急(1 天完成)</Text>
          <Text className={`toggle ${rush ? 'on' : ''}`}>{rush ? 'ON' : 'OFF'}</Text>
          <Text className="fee">+{priceYuan(shop.rushFee)}</Text>
        </View>
      </View>

      <View className="footer">
        <View>
          <Text className="total-label">合计</Text>
          <Text className="total">{priceYuan(total)}</Text>
        </View>
        <View className="primary" onClick={goConfirm}>
          <Text>去下单</Text>
        </View>
      </View>
    </View>
  )
}
