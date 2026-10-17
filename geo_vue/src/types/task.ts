/** 监测目标类型：声量 / 舆情 */
export type MonitorTarget = 'volume' | 'sentiment'

/** 任务实体（与后端 Task + enrichTaskFields 回填字段一致） */
export interface Task {
  id: number
  taskNo: string
  userId?: string
  title: string
  status: string
  totalCount: number
  completedCount: number
  failedCount: number
  totalAiCount: number
  totalQuestionCount: number
  brandName?: string
  productName?: string
  /** 后端 TEXT 字段，可能是逗号分隔字符串或 JSON；前端做归一化 */
  competitors?: string | string[] | null
  reportJson?: string | null
  executionFrequency?: string
  nextRunTime?: string | null
  errorMsg?: string | null
  whitelistUrls?: string | string[] | null
  createdAt?: string
  updatedAt?: string
  completedAt?: string | null
  /** enrich 回填字段 */
  scope?: string
  projectId?: string
  questionCount?: number
  intentCount?: number
  /**
   * 监测目标：声量 / 舆情。
   * 后端暂未持久化该字段（舆情任务功能尚在开发），前端以 utils/taskType.ts 的
   * 本地记录兜底；后端就绪后返回该字段即自动以它为准。
   */
  monitorTarget?: MonitorTarget
}

/** 创建任务入参（手动 JSON） */
export interface TaskSubmitRequest {
  aiPlatforms: string[]
  questions: string[]
  wordIds?: (number | null)[]
  title: string
  brandName: string
  productName?: string
  competitors?: string[]
  executionFrequency?: string
  retryOnFailure?: boolean
  scope?: string
  projectId?: string
  whitelistUrls?: string[] | null
  /** 监测目标：声量 / 舆情（后端就绪前为前向兼容字段） */
  monitorTarget?: MonitorTarget
}

/** 任务进度 */
export interface TaskProgressVO {
  taskNo?: string
  status?: string
  totalCount: number
  completedCount: number
  failedCount: number
  totalAiCount?: number
  totalQuestionCount?: number
  currentAi?: string
  currentQuestion?: string
  percentage: number
  errorMsg?: string
  createdAt?: string
  completedAt?: string
}

/** 任务结果单元（问题 × 平台） */
export interface TaskResultVO {
  id: number
  aiPlatform?: string
  aiDisplayName?: string
  questionText?: string
  answerText?: string
  thinkingContent?: string
  /** 后端为 JSON 字符串，前端需 parse */
  sourceInfo?: string
  screenshotUrls?: string[]
  status?: string
  errorMsg?: string
  durationMs?: number
  rpaRetryCount?: number
  createdAt?: string
  completedAt?: string
  /** 展现状态 */
  showStatus?: string
  brand?: string
  queryTime?: string
  brandRanking?: string[] | null
  sentiment?: string
  sentimentSource?: string
  level?: string
  tag?: string
  keyword?: string
}

/** 品牌排名条目 */
export interface BrandRankingItem {
  brandName?: string
  isSelfBrand?: boolean
  rank?: number | null
  firstIndex?: number
  matchedText?: string
}

/** 问题排名 */
export interface QuestionRanking {
  resultId?: number
  questionText?: string
  aiPlatform?: string
  brandRankings?: BrandRankingItem[]
  answerText?: string
}

/** 品牌排名统计 */
export interface TaskRankingVO {
  taskNo?: string
  title?: string
  brandName?: string
  competitorBrands?: string[]
  questionRankings?: QuestionRanking[]
  aggregatedRankings?: BrandRankingItem[]
  totalAnswers?: number
  validAnswers?: number
}

/** 任务池看板 */
export interface TaskPoolOverview {
  statusCount: Array<{ name: string; value: number }>
  platformCount: Array<{ name: string; value: number }>
  workerCount: Array<{ name: string; value: number }>
  runningUnits: Array<{
    id: number
    taskNo: string
    aiPlatform: string
    assignee: string
    startedAt: string
    questionText: string
  }>
}

