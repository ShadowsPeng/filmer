import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useAuth } from '../../store/useAuth'
import './index.scss'

export default function Profile() {
  const auth = useAuth()

  async function login() {
    try {
      await auth.login()
      Taro.showToast({ title: '登录成功' })
    } catch (e: any) {
      Taro.showToast({ title: e?.message ?? '登录失败', icon: 'none' })
    }
  }

  async function logout() {
    auth.logout()
    Taro.showToast({ title: '已退出' })
  }

  return (
    <View className="page">
      <View className="hero">
        <Text className="nickname">{auth.nickname ?? '未登录'}</Text>
        <Text className="uid">{auth.uid ?? ''}</Text>
        <Text className="role">{auth.role ?? ''}</Text>
      </View>

      <View className="actions">
        {!auth.token && (
          <View className="btn primary" onClick={login}>
            <Text>微信登录</Text>
          </View>
        )}
        {auth.token && (
          <View className="btn ghost" onClick={logout}>
            <Text>退出登录</Text>
          </View>
        )}
      </View>
    </View>
  )
}
