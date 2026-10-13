import { defineStore } from 'pinia'

/**
 * 登录态：token + 当前用户（昵称/头像）。
 *
 * 后端暂无鉴权，token 在 USE_MOCK 下由前端本地生成；持久化到 localStorage，
 * 供路由守卫与顶部导航栏判断登录状态。后端补齐 JWT 后，把 login() 里的
 * 本地 token 生成替换为接口返回的 token 即可。
 */

const TOKEN_KEY = 'geo_token'
const USER_KEY = 'geo_user'

export interface AuthUser {
  nickname: string
  avatar?: string
}

function loadUser(): AuthUser | null {
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as AuthUser
  } catch {
    return null
  }
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem(TOKEN_KEY) || '',
    user: loadUser() as AuthUser | null
  }),
  getters: {
    isLoggedIn: state => !!state.token,
    /** 头像圆内展示：昵称首字符（无昵称时兜底「G」） */
    avatarText: state => (state.user?.nickname ? state.user.nickname.charAt(0) : 'G')
  },
  actions: {
    login(token: string, user: AuthUser) {
      this.token = token
      this.user = user
      localStorage.setItem(TOKEN_KEY, token)
      localStorage.setItem(USER_KEY, JSON.stringify(user))
    },
    /** 更新昵称（顶部头像「编辑」入口，本地落库，接口就绪后替换为 PUT /api/user） */
    updateUser(user: AuthUser) {
      this.user = user
      localStorage.setItem(USER_KEY, JSON.stringify(user))
    },
    logout() {
      this.token = ''
      this.user = null
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
    }
  }
})
