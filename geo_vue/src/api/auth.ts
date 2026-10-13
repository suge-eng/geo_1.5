import { http } from '@/utils/request'

/** 登录请求参数 */
export interface LoginParams {
  username: string
  password: string
}

/** 登录成功返回（后端鉴权就绪后按此结构约定） */
export interface LoginResult {
  token: string
  nickname: string
  avatar?: string
}

/**
 * 登录接口。
 *
 * 注：后端当前无鉴权（见 docs/后端API分析报告.md「无登录/JWT」）。
 * 此方法为待对接桩：USE_MOCK = true 时前端走 mock/index.ts 的虚拟账号，
 * false 时调用本接口 `/api/auth/login`，后端补齐鉴权后即可直连。
 */
export function login(data: LoginParams) {
  return http<LoginResult>({ url: '/api/auth/login', method: 'post', data })
}
