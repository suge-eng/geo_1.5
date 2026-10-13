/** 曝光指标 */
export interface ExposureMetrics {
  coverageRate?: number
  firstRate?: number
  top3Rate?: number
  top5Rate?: number
  mentionRate?: number
  positiveSentimentRate?: number
  /** 场景覆盖率：统一回答级口径（后端计算） */
  sceneCoverageRate?: number
  mentionCount?: number | string
  platformStats?: unknown[]
  [key: string]: unknown
}

/** AI 总结 */
export interface AiSummary {
  content?: string
  highlights?: string[]
  suggestions?: string[]
  riskAlerts?: string[]
  trendObservations?: string[]
}

/** 品牌对比表格（列 + 行） */
export interface BrandComparisonTable {
  columns?: string[]
  rows?: Array<{ metric?: string; label?: string; values?: unknown[] }>
  [key: string]: unknown
}

/** 引用源排名条目 */
export interface CitationRankingItem {
  rank?: number
  name?: string
  address?: string
  citationCount?: number
  trend?: string
  [key: string]: unknown
}

/** 全局趋势 */
export interface GlobalTrends {
  dates?: string[]
  brandVoice?: TrendSeries
  citationHeat?: TrendSeries
  positiveSentiment?: TrendSeries
  positioningFit?: TrendSeries
}

export interface TrendSeries {
  unit?: string
  series?: Array<{ name?: string; data?: number[]; color?: string }>
}

/**
 * 分析报告（后端 AnalysisReportResponse）
 * 字段多且大量可空，采用宽松类型 + 索引签名，配合 report-normalize 归一化
 */
export interface AnalysisReportResponse {
  taskNo?: string
  title?: string
  brandName?: string
  totalQuestions?: number
  totalPlatforms?: number
  totalResults?: number
  completedResults?: number
  historyReportCount?: number
  rangeStart?: string
  rangeEnd?: string
  overallScore?: number
  scoreLevel?: string
  scoreChange?: number
  topMetrics?: Record<string, unknown>
  productMetrics?: Record<string, unknown>
  sideMetrics?: Record<string, unknown>
  charts?: unknown[]
  rankings?: RankingWidget[]
  aiSummary?: AiSummary
  brandComparison?: BrandComparisonTable | null
  exposureMetrics?: ExposureMetrics
  resultBrandRankings?: Record<string, string[]>
  aiSentimentMap?: Record<string, string>
  keywordCloud?: { positive?: unknown[]; negative?: unknown[] }
  perPlatformBrandComparison?: Record<string, BrandComparisonTable>
  competition?: Record<string, unknown>
  competitionRanking?: unknown[]
  competitionTop10?: unknown[]
  citationPlatformRanking?: CitationRankingItem[]
  citationPlatformTop10?: CitationRankingItem[]
  citationSourceDistribution?: unknown[]
  platformScoreCards?: unknown[]
  platformScores?: unknown[]
  globalTrends?: GlobalTrends
  kpiThreshold?: number
  platformSelfExposureCount?: Record<string, number>
  intentHeatmap?: IntentHeatmap
  gapTagList?: GapTagItem[]
  platformCoreMetrics?: PlatformCoreMetric[]
  topPlatformCards?: TopPlatformCard[]
  [key: string]: unknown
}

export interface IntentHeatmap {
  levels?: string[]
  brands?: Array<{
    name?: string
    selfBrand?: boolean
    values?: Array<number | null>
  }>
  selfLevelMetrics?: Array<{
    level?: string
    total?: number
    mentionCount?: number
    coverage?: number
    firstRate?: number
    top3Rate?: number
  }>
}

export interface RankingWidget {
  id?: string
  title?: string
  items?: Array<{ name?: string; value?: number; rank?: number; trend?: string }>
  [key: string]: unknown
}

export interface GapTagItem {
  tagName?: string
  level?: string
  selfCoverage?: number
  competitorCoverage?: number
  priority?: string
  questionCount?: number
  brandCoverages?: Record<string, number>
  /** 场景覆盖达标：回答级 selfCoverage ≥ KPI 阈值 */
  scenePassed?: boolean
}

export interface PlatformCoreMetric {
  platformCode?: string
  platformName?: string
  totalAnswers?: number
  coverRate?: number
  firstRate?: number
  top3Rate?: number
  avgRank?: number
  stabilityRate?: number
  positiveRate?: number
}

export interface TopPlatformCard {
  title?: string
  platformName?: string
  value?: number
  unit?: string
  desc?: string
}

/** 报告生成状态 */export interface ReportStatusPayload {
  taskNo?: string
  status?: 'IDLE' | 'RUNNING' | 'COMPLETED' | 'FAILED'
  progressPercent?: number
  stage?: string
  errorMsg?: string
  startedAt?: string
  finishedAt?: string
  report?: AnalysisReportResponse | null
}

/** 历史报告列表项 */
export interface ReportHistoryItem {
  id?: number
  taskNo?: string
  title?: string
  reportDate?: string
  brandName?: string
  totalQuestions?: number
  totalPlatforms?: number
  completedResults?: number
  totalResults?: number
  coverageRate?: number
  firstRate?: number
  top3Rate?: number
  top5Rate?: number
  [key: string]: unknown
}
