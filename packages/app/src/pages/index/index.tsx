import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import './index.scss'

export default function Index() {
  return (
    <View className="page">
      <View className="hero">
        <Text className="hero-title">Filmer · 胶片影像</Text>
        <Text className="hero-sub">Phase 1 MVP · 冲扫服务下单</Text>
      </View>
      <View className="card" onClick={() => Taro.switchTab({ url: '/pages/scan/list' })}>
        <Text className="card-title">去冲扫</Text>
        <Text className="card-desc">下单 → 寄件 → 出片</Text>
      </View>
      <View className="placeholder">
        <Text>Feed / 笔记发布占位 · Phase 1 上线</Text>
      </View>
    </View>
  )
}
