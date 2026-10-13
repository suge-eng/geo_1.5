/** AI 平台枚举（与后端 AiPlatform 一致） */
export enum AiPlatform {
  DOUBAO = 'doubao',
  DOUBAO_APP = 'doubao_app',
  DEEPSEEK = 'deepseek',
  DEEPSEEK_APP = 'deepseek_app',
  QIANWEN = 'qianwen',
  QIANWEN_APP = 'qianwen_app',
  TENCENT = 'tencent',
  TENCENT_APP = 'tencent_app',
  KIMI = 'kimi',
  KIMI_APP = 'kimi_app',
  WENXIN = 'wenxin',
  WENXIN_APP = 'wenxin_app'
}

export interface PlatformOption {
  value: string
  label: string
}

/** AI 平台列表（展示顺序与旧前端一致） */
export const AI_PLATFORMS: PlatformOption[] = [
  { value: 'doubao', label: '豆包' },
  { value: 'doubao_app', label: '豆包' },
  { value: 'deepseek', label: 'DeepSeek' },
  { value: 'deepseek_app', label: 'DeepSeek' },
  { value: 'qianwen', label: '通义千问' },
  { value: 'qianwen_app', label: '通义千问' },
  { value: 'tencent', label: '腾讯元宝' },
  { value: 'tencent_app', label: '腾讯元宝' },
  { value: 'kimi', label: 'Kimi' },
  { value: 'kimi_app', label: 'Kimi' },
  { value: 'wenxin', label: '文心一言' },
  { value: 'wenxin_app', label: '文心一言' }
]

/** 任务状态 */
export enum TaskStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  PARTIAL_FAILED = 'PARTIAL_FAILED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED'
}

export const TASK_STATUS_MAP: Record<string, { label: string; type: 'info' | 'primary' | 'warning' | 'success' | 'danger' }> = {
  PENDING: { label: '待处理', type: 'info' },
  PROCESSING: { label: '处理中', type: 'primary' },
  PAUSED: { label: '已暂停', type: 'warning' },
  COMPLETED: { label: '已完成', type: 'success' },
  PARTIAL_FAILED: { label: '部分失败', type: 'warning' },
  FAILED: { label: '失败', type: 'danger' },
  CANCELLED: { label: '已取消', type: 'info' }
}

/** 结果单元状态 */
export enum ResultStatus {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  TIMEOUT = 'TIMEOUT'
}

export const RESULT_STATUS_MAP: Record<string, { label: string; type: 'info' | 'primary' | 'success' | 'danger' }> = {
  PENDING: { label: '待开始', type: 'info' },
  RUNNING: { label: '执行中', type: 'primary' },
  SUCCESS: { label: '已完成', type: 'success' },
  FAILED: { label: '失败', type: 'danger' },
  TIMEOUT: { label: '超时', type: 'danger' }
}

/** 舆情（情感） */
export const SENTIMENT_MAP: Record<string, { label: string; color: string }> = {
  positive: { label: '正面', color: '#28a745' },
  negative: { label: '负面', color: '#dc3545' },
  neutral: { label: '中性', color: '#fd7e14' },
  none: { label: '未提及', color: '#adb5bd' }
}

/** 执行频次 */
export const FREQUENCY_MAP: Record<string, string> = {
  single: '单次',
  daily: '每天',
  weekly: '每周',
  monthly: '每月'
}

/** 账号状态（预留，无对外接口） */
export enum AccountStatus {
  ACTIVE = 'ACTIVE',
  BANNED = 'BANNED',
  MAINTENANCE = 'MAINTENANCE',
  EXHAUSTED = 'EXHAUSTED'
}

export function platformLabel(code?: string): string {
  if (!code) return '-'
  return AI_PLATFORMS.find(p => p.value === code)?.label ?? code
}
