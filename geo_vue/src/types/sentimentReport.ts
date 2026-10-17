/**
 * 舆情类型任务的数据报告类型定义。
 *
 * 背景：声量类型任务的数据报告（见 AnalysisReport.vue）包含
 * 「数据总览 / 模型对比 / 场景覆盖 / 竞品分析」四个模块；
 * 舆情类型任务的数据报告只包含「数据总览 / 媒体来源」两个模块。
 *
 * 本文件的类型同时服务于：
 *  - src/mock/sentimentReport.ts（开关开启时的虚拟数据）
 *  - src/api/sentimentReport.ts（后端接口预留）
 *  - src/views/monitor/analysis/SentimentReport.vue（页面展示 + 后端映射）
 */

/** 舆情报告子模块 key */
export type SentimentModuleKey = 'overview' | 'media'

/** 顶部指标卡（含左侧彩条） */
export interface SentimentKpi {
  label: string
  value: string
  /** 副文案；与 trend 二选一 */
  sub?: string
  /** 环比趋势文案 */
  trend?: { text: string; dir: 'up' | 'down' }
  /** 左侧彩条配色 */
  accent?: 'blue' | 'green' | 'gray' | 'red'
}

/** 整体舆情结构的单个分段 */
export interface SentimentStructureSegment {
  name: string
  value: number
  color: string
  /** 条内展示文案，缺省用 `${name} ${value}%` */
  label?: string
}

/** 整体舆情结构（堆叠条 + 图例） */
export interface SentimentStructure {
  title: string
  /** 右上角样本量文案，如 “958 条” */
  total: string
  tip: string
  segments: SentimentStructureSegment[]
  legend: Array<{ text: string; color: string }>
}

/** 各 AI 平台倾向差异行 */
export interface SentimentPlatformRow {
  name: string
  sample: number
  pos: string
  neu: string
  neg: string
  mix: string
  /** 是否高亮正向值 */
  highlight?: boolean
}

/** 品牌核心议题项 */
export interface SentimentTopic {
  name: string
  value: number
  color: string
}

/** 风险信号卡 */
export interface SentimentRiskSignal {
  title: string
  value: string
  sub: string
  /** 数值配色，缺省为主文字色 */
  accent?: 'danger' | 'normal'
}

/** 观点卡（正向 / 负向 / 争议共用） */
export interface SentimentOpinion {
  title: string
  tag: string
  tagType: 'success' | 'danger' | 'gray'
  /** 涉及答案数等说明文案 */
  desc: string
  /** 补充说明 */
  sub: string
}

/** 议题 × 舆情倾向矩阵行 */
export interface SentimentMatrixRow {
  topic: string
  cover: string
  pos: string
  neu: string
  neg: string
  negText: string
}

/** 「数据总览」模块的全部数据 */
export interface SentimentOverviewData {
  kpis: SentimentKpi[]
  structure: SentimentStructure
  platformTendency: { title: string; rows: SentimentPlatformRow[] }
  topics: { title: string; tip: string; items: SentimentTopic[] }
  riskSignals: { title: string; items: SentimentRiskSignal[] }
  positiveOpinions: { title: string; tip: string; items: SentimentOpinion[] }
  negativeOpinions: { title: string; tip: string; items: SentimentOpinion[] }
  matrix: { title: string; tip: string; rows: SentimentMatrixRow[] }
}

/** 媒体类型全景卡 */
export interface MediaPanoramaItem {
  title: string
  desc: string
}

/** 权威媒体候选行 */
export interface MediaAuthorityRow {
  source: string
  sub: string
  type: string
  /** 权威分（用于动态色阶） */
  score: number
  rel: string
  cite: string
  fact: string
}

/** 来源类型引用占比项 */
export interface MediaSourceRatioItem {
  name: string
  value: number
  color: string
}

/** 风险事件等级 / 状态档位 */
export type MediaBadgeType = 'danger' | 'warning' | 'success' | 'gray'

/** 风险事件监测台行 */
export interface MediaRiskEventRow {
  event: string
  level: string
  levelType: MediaBadgeType
  platform: string
  source: string
  mainSource: string
  status: string
  statusType: MediaBadgeType
  suggestion: string
}

/** 「媒体来源」模块的全部数据 */
export interface MediaSourceData {
  panorama: { title: string; count: string; tip: string; items: MediaPanoramaItem[] }
  authority: { title: string; tip: string; rows: MediaAuthorityRow[] }
  rules: { title: string; tip: string; formulas: string[]; note: string }
  sourceRatio: { title: string; items: MediaSourceRatioItem[] }
  riskEvents: { title: string; tip: string; rows: MediaRiskEventRow[] }
}

/**
 * 舆情数据报告响应（后端接口预留）。
 *
 * 后端就绪后按此结构返回：overview / mediaSource 两个分组
 * 分别对应「数据总览」「媒体来源」两个模块；缺失时页面向下兜底为空态。
 */
export interface SentimentReportResponse {
  taskNo?: string
  title?: string
  brandName?: string
  reportDate?: string
  totalQuestions?: number
  totalPlatforms?: number
  totalResults?: number
  /** 数据总览模块 */
  overview?: SentimentOverviewData
  /** 媒体来源模块 */
  mediaSource?: MediaSourceData
  [key: string]: unknown
}

/** 舆情报告生成状态（异步轮询用） */
export interface SentimentReportStatusPayload {
  taskNo?: string
  status?: 'IDLE' | 'RUNNING' | 'COMPLETED' | 'FAILED'
  progressPercent?: number
  stage?: string
  errorMsg?: string
  report?: SentimentReportResponse | null
}

/** 舆情历史报告列表项 */
export interface SentimentReportHistoryItem {
  id?: number
  taskNo?: string
  title?: string
  reportDate?: string
  brandName?: string
  totalQuestions?: number
  totalPlatforms?: number
  [key: string]: unknown
}
