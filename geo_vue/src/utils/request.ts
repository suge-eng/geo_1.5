import axios, { type AxiosRequestConfig, type AxiosResponse } from 'axios'
import { ElMessage } from 'element-plus'
import type { Result } from '@/types/common'

/**
 * axios 实例：
 * - baseURL 为空，开发走 Vite 代理（/api → 8080），生产与后端网关同域
 * - 后端统一响应 { code, message, data }，业务错误返回 HTTP 200 + code != 200
 * - 查询接口统一加 no-cache 头 + _t 时间戳
 */
const service = axios.create({
  baseURL: '',
  timeout: 600000 // 报告/长任务 10 分钟
})

service.interceptors.request.use(config => {
  if (config.method === 'get') {
    config.headers.set('Cache-Control', 'no-cache')
    config.headers.set('Pragma', 'no-cache')
    config.params = { ...(config.params || {}), _t: Date.now() }
  }
  // 后端对空 body 的 POST 较宽容，但为稳妥兜底
  if (config.method === 'post' && config.data === undefined) {
    config.data = {}
  }
  return config
})

service.interceptors.response.use(
  (response: AxiosResponse): any => {
    // 文件下载（blob）直接返回原始数据
    if (response.config.responseType === 'blob' || response.config.responseType === 'arraybuffer') {
      return response.data
    }
    const res = response.data as Result<unknown>
    if (res && typeof res === 'object' && 'code' in res) {
      if (res.code === 200) {
        return res.data
      }
      ElMessage.error(res.message || '请求失败')
      return Promise.reject(new Error(res.message || '请求失败'))
    }
    return response.data
  },
  (error): any => {
    const status = error?.response?.status
    const message = error?.response?.data?.message || error?.message || '网络错误'
    if (status === 404) {
      ElMessage.error(message || '资源不存在')
    } else if (status === 400) {
      ElMessage.error(message || '请求参数错误')
    } else {
      ElMessage.error(message || '请求失败')
    }
    return Promise.reject(error)
  }
)

/** 泛型请求封装：直接返回后端 data 字段 */
export function http<T = unknown>(config: AxiosRequestConfig): Promise<T> {
  return service(config) as unknown as Promise<T>
}

export default service
