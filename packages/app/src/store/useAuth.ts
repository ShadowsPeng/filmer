/** Auth Zustand store + Taro Storage 持久化。 */
import Taro from '@tarojs/taro'
import { create } from 'zustand'
import { login as loginApi } from '../api/auth'
import { configureClient } from '../api/client'

interface AuthState {
  token: string | null
  uid: string | null
  role: 'user' | 'admin' | null
  nickname: string | null
  login: () => Promise<void>
  logout: () => void
}

const STORAGE_KEY = 'filmer.auth'
type PersistedAuth = Pick<AuthState, 'token' | 'uid' | 'role' | 'nickname'>

function load(): PersistedAuth {
  try {
    const value = Taro.getStorageSync<PersistedAuth>(STORAGE_KEY)
    if (value?.token) return value
  } catch {}
  return { token: null, uid: null, role: null, nickname: null }
}

function save(state: PersistedAuth) {
  try { Taro.setStorageSync(STORAGE_KEY, state) } catch {}
}

export const useAuth = create<AuthState>((set, get) => {
  const init = load()
  configureClient({
    tokenGetter: () => get().token,
    onUnauthorized: () => get().logout(),
  })

  return {
    ...init,
    async login() {
      const res = await loginApi()
      const next = {
        token: res.token,
        uid: res.user.uid,
        role: res.user.role,
        nickname: res.user.nickname,
      }
      set(next)
      save(next)
    },
    logout() {
      set({ token: null, uid: null, role: null, nickname: null })
      try { Taro.removeStorageSync(STORAGE_KEY) } catch {}
    },
  }
})
