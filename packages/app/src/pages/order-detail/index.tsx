import { useEffect, useState } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { getOrder } from '../../api/order'
import './index.scss'

function priceYuan(fen: number) { return `¥${(fen / 100).toFixed(2)}` }

const STATUS_LABEL: Record<string, string> = {
  pending_pay: '待支付',
  paid: '已支付',
  refunding: '退款中',
  refunded: '已退款',
  closed: '已关闭',
  finished: '已完成',
}

export default function OrderDetail() {
  const [order, setOrder] = useState<any>(null)

  useEffect(() => {
    const router = Taro.getCurrentInstance()?.router
    const id = router?.params?.id
    if (!id) return
    getOrder(id).then(setOrder).catch(() => Taro.showToast({ title: '加载失败', icon: 'none' }))
  }, [])

  if (!order) {
    return <View className="page"><Text className="placeholder">加载中…</Text></View>
  }

  return (
    <View className="page">
      <View className="hero">
        <Text className="status">{STATUS_LABEL[order.status] ?? order.status}</Text>
        <Text className="amount">{priceYuan(order.amount)}</Text>
        <Text className="no">订单号:{order.outTradeNo}</Text>
      </View>

      <View className="section">
        <Text className="section-title">商品</Text>
        <Text className="row">{order.filmFormat} · {order.process} · {order.rolls} 卷</Text>
        {order.hiRes && <Text className="row sub">高分辨率扫描</Text>}
        {order.rush && <Text className="row sub">加急</Text>}
      </View>

      <View className="section">
        <Text className="section-title">收件</Text>
        <Text className="row">{order.receiverName}  {order.receiverPhone}</Text>
        <Text className="row sub">{order.receiverAddr}</Text>
        {order.remark && <Text className="row sub">备注:{order.remark}</Text>}
      </View>

      <View className="section">
        <Text className="section-title">时间线</Text>
        {order.events?.map((e: any) => (
          <View key={e.id} className="event">
            <Text className="dot">●</Text>
            <View>
              <Text className="event-line">{STATUS_LABEL[e.toStatus] ?? e.toStatus}</Text>
              <Text className="event-meta">{new Date(e.createdAt).toLocaleString()} {e.reason ? `· ${e.reason}` : ''}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  )
}
