import { useState, useEffect } from 'react'
import { View, Text, Input, Textarea } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useAuth } from '../../store/useAuth'
import { createOrder, payOrder } from '../../api/order'
import { requestWechatPay } from '../../utils/payment'
import { ENV } from '../../utils/env'
import './confirm.scss'

interface Draft {
  shopId: string
  filmFormat: '135' | '120'
  rolls: number
  process: 'C41' | 'E6' | 'BW'
  package: 'standard' | 'fine'
  hiRes: boolean
  rush: boolean
}

function priceYuan(fen: number) { return `¥${(fen / 100).toFixed(2)}` }

export default function OrderConfirm() {
  const auth = useAuth()
  const [draft, setDraft] = useState<Draft | null>(null)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [remark, setRemark] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const d = Taro.getStorageSync<Draft>('draft')
    if (!d) {
      Taro.showToast({ title: '已无草稿', icon: 'none' })
      return
    }
    setDraft(d)
  }, [])

  if (!draft) return null

  const totalPreview = computePrice(draft)

  async function submit() {
    if (!name || !phone || !address) {
      Taro.showToast({ title: '请填收货信息', icon: 'none' })
      return
    }
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      Taro.showToast({ title: '手机号格式不对', icon: 'none' })
      return
    }
    if (!auth.token) {
      try { await auth.login() } catch (e: any) {
        Taro.showToast({ title: '请先登录', icon: 'none' })
        return
      }
    }
    setSubmitting(true)
    try {
      const order = await createOrder({
        ...draft!,
        receiver: { name, phone, address },
        remark,
      })
      // 1) 调起支付
      const prepay = await payOrder(order.orderId)
      const result = await requestWechatPay(prepay)
      if (!result.errMsg.includes('ok')) {
        Taro.showToast({ title: '支付失败:' + result.errMsg, icon: 'none' })
        return
      }

      // 2) local-mock 模式下手动投递通知
      if (ENV.IS_LOCAL_MOCK) {
        await import('../../api/order').then(m => m.mockDeliverNotify(order.outTradeNo))
      }

      Taro.navigateTo({ url: `/pages/order/result?orderId=${order.orderId}` })
    } catch (e: any) {
      Taro.showToast({ title: e?.message ?? '提交失败', icon: 'none' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <View className="page">
      <View className="section">
        <Text className="section-title">工艺</Text>
        <Text className="row">135 · {draft.process} · {draft.rolls} 卷</Text>
        {(draft.hiRes || draft.rush) && (
          <Text className="row sub">
            {draft.hiRes ? '高分辨率扫描 ' : ''}{draft.rush ? '加急' : ''}
          </Text>
        )}
      </View>

      <View className="section">
        <Text className="section-title">收件信息</Text>
        <Input className="input" placeholder="姓名" value={name} onInput={(e) => setName(e.detail.value)} />
        <Input className="input" type="number" placeholder="手机号" value={phone} onInput={(e) => setPhone(e.detail.value)} />
        <Input className="input" placeholder="寄件地址(顺丰上门收)" value={address} onInput={(e) => setAddress(e.detail.value)} />
        <Textarea className="textarea" placeholder="备注(选填)" value={remark} onInput={(e) => setRemark(e.detail.value)} />
      </View>

      <View className="footer">
        <View>
          <Text className="total-label">合计</Text>
          <Text className="total">{priceYuan(totalPreview)}</Text>
        </View>
        <View className={`primary ${submitting ? 'disabled' : ''}`} onClick={submit}>
          <Text>{submitting ? '提交中…' : '提交订单并支付'}</Text>
        </View>
      </View>
    </View>
  )
}

// 服务端等价公式的客户端预览(仅供参考;真实价格以服务端返回为准)
function computePrice(d: Draft): number {
  const unit = d.process === 'C41' ? 2500 : d.process === 'E6' ? 3500 : 2000
  const hi = d.hiRes ? 1500 : 0
  const r = d.rush ? 1000 : 0
  return unit * d.rolls + hi + r
}
