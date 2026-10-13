import dayjs from 'dayjs'

/** 格式化日期时间，空值返回 '-' */
export function formatDateTime(value?: string | null): string {
  if (!value) return '-'
  const d = dayjs(value)
  return d.isValid() ? d.format('YYYY-MM-DD HH:mm:ss') : value
}

/** 格式化日期时间（点分格式，如 2026.09.09 12:00），空值返回 '-' */
export function formatDateTimeDot(value?: string | null): string {
  if (!value) return '-'
  const d = dayjs(value)
  return d.isValid() ? d.format('YYYY.MM.DD HH:mm') : String(value)
}

/** 格式化日期，空值返回 '-' */
export function formatDate(value?: string | null): string {
  if (!value) return '-'
  const d = dayjs(value)
  return d.isValid() ? d.format('YYYY-MM-DD') : value
}

/** 解析后端 TEXT 字段为数组（competitors / whitelistUrls 可能是字符串或数组） */
export function toArray(value?: string | string[] | null): string[] {
  if (Array.isArray(value)) return value
  if (!value) return []
  const str = String(value).trim()
  if (!str) return []
  // 尝试 JSON 数组
  try {
    const parsed = JSON.parse(str)
    if (Array.isArray(parsed)) return parsed.map(String)
  } catch {
    /* ignore */
  }
  // 逗号分隔
  return str
    .split(/[,，]/)
    .map(s => s.trim())
    .filter(Boolean)
}

/** 解析 sourceInfo（后端 JSON 字符串）为联网记录列表 */
export interface NetworkSource {
  index: number
  title: string
  url: string
  siteName: string
}

export function parseSourceInfo(sourceInfo?: string): NetworkSource[] {
  if (!sourceInfo) return []
  try {
    const data = JSON.parse(sourceInfo)
    if (!Array.isArray(data)) return []
    return data
      .map((item, i) => {
        if (Array.isArray(item)) {
          const title = String(item[0] ?? '-')
          const url = String(item[1] ?? '-')
          return { index: i + 1, title, url, siteName: extractSiteName(url) }
        }
        const obj = item && typeof item === 'object' ? item : {}
        const url = String(obj.url ?? obj.address ?? obj.link ?? '-')
        const title = String(obj.title ?? obj.name ?? '-')
        return { index: i + 1, title, url, siteName: extractSiteName(url) }
      })
      .filter(s => s.url !== '-')
  } catch {
    return []
  }
}

export function extractSiteName(url?: string): string {
  if (!url) return '-'
  try {
    const host = new URL(url).hostname
    return host.startsWith('www.') ? host.slice(4) : host
  } catch {
    return url
  }
}

/** 百分比解析：容忍 '12.3%' / 数字 */
export function parseRate(value?: unknown): number {
  if (value === null || value === undefined) return 0
  const num = parseFloat(String(value).replace('%', ''))
  return Number.isFinite(num) ? Math.min(100, Math.max(0, num)) : 0
}
