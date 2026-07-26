import { useEffect, useState } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { getOrder } from '../../api/order'
import './result.scss'

export default function OrderResult() {
  const [order, setOrder] = useState<any>(null)
  const [tries, setTries] = useState(0)

  useEffect(() => {
    const router = Taro.getCurrentInstance()?.router
    const orderId = router?.params?.orderId
    if (!orderId) return

    let timer: any
    const poll = async () => {
      try {
        const o = await getOrder(orderId)
        setOrder(o)
        if (o.status === 'paid') {
          // 成功,跳转详情
          Taro.redirectTo({ url: `/pages/order-detail/index?id=${orderId}` })
        }
      } catch {}
      if (tries < 6) {
        timer = setTimeout(() => {
          setTries((n) => n + 1)
          poll()
        }, 1500)
      }
    }
    poll()
    return () => timer && clearTimeout(timer)
  }, [tries])

  return (
    <View className="page">
      <View className="status">
        <Text className="icon">⏳</Text>
        <Text className="title">支付处理中…</Text>
        <Text className="desc">等待后台确认(本地 mock 模式自动通过)</Text>
      </View>
      {order && (
        <View className="meta">
          <Text className="row">订单号:{order.outTradeNo}</Text>
          <Text className="row">金额:¥{(order.amount / 100).toFixed(2)}</Text>
          <Text className="row">状态:{order.status}</Text>
        </View>
      )}
    </View>
  )
}
