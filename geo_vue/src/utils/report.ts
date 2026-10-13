import { getReport, getReportStatus, regenerateReport } from '@/api/analysis'
import type { AnalysisReportResponse, ReportStatusPayload } from '@/types/analysis'

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/** 判断响应是否是「异步状态」payload（而非直接报告数据） */
export function isStatusPayload(d: unknown): d is ReportStatusPayload {
  return (
    !!d &&
    typeof d === 'object' &&
    'status' in d &&
    ['IDLE', 'RUNNING', 'COMPLETED', 'FAILED'].includes((d as ReportStatusPayload).status as string)
  )
}

/**
 * 判断响应是否携带真实报告数据（区别于异步状态 payload）。
 *
 * 注意：报告本身也带 `status` 字段（后端 AnalysisReportResponse.status =
 * 任务状态，如 COMPLETED），所以不能靠「有没有 status」来区分两类结构，
 * 只能靠报告专属的数据字段是否存在来判断。
 */
export function hasReportData(d: unknown): d is AnalysisReportResponse {
  if (!d || typeof d !== 'object') return false
  const r = d as AnalysisReportResponse
  return (
    r.overallScore !== undefined ||
    r.topMetrics !== undefined ||
    r.exposureMetrics !== undefined ||
    r.brandComparison !== undefined ||
    r.rankings !== undefined ||
    r.aiSummary !== undefined ||
    r.keywordCloud !== undefined ||
    r.brandName !== undefined ||
    r.title !== undefined
  )
}

/** 报告字段归一化：为可空字段补安全默认值，避免图表渲染报错 */
export function normalizeReport(raw?: AnalysisReportResponse | null): AnalysisReportResponse {
  const r = (raw ?? {}) as AnalysisReportResponse
  const em = (r.exposureMetrics = (r.exposureMetrics ?? {}) as NonNullable<
    AnalysisReportResponse['exposureMetrics']
  >)
  em.coverageRate = em.coverageRate ?? 0
  em.firstRate = em.firstRate ?? 0
  em.top3Rate = em.top3Rate ?? 0
  em.top5Rate = em.top5Rate ?? 0
  em.mentionRate = em.mentionRate ?? 0
  em.positiveSentimentRate = em.positiveSentimentRate ?? 0

  if (typeof r.overallScore !== 'number') r.overallScore = 0
  if (typeof r.scoreChange !== 'number') r.scoreChange = 0
  if (!r.scoreLevel) {
    const s = r.overallScore
    r.scoreLevel = s >= 90 ? '优秀' : s >= 80 ? '良好' : s >= 70 ? '中等' : s >= 60 ? '及格' : '待提升'
  }

  const ai = (r.aiSummary = (r.aiSummary ?? {}) as NonNullable<AnalysisReportResponse['aiSummary']>)
  ai.highlights = ai.highlights ?? []
  ai.suggestions = ai.suggestions ?? []
  ai.riskAlerts = ai.riskAlerts ?? []
  ai.trendObservations = ai.trendObservations ?? []

  r.keywordCloud = r.keywordCloud ?? {}
  r.keywordCloud.positive = r.keywordCloud.positive ?? []
  r.keywordCloud.negative = r.keywordCloud.negative ?? []

  r.competitionRanking = r.competitionRanking ?? []
  r.citationPlatformRanking = r.citationPlatformRanking ?? []
  r.citationSourceDistribution = r.citationSourceDistribution ?? []

  r.globalTrends = r.globalTrends ?? {}
  const gt = r.globalTrends
  gt.dates = gt.dates ?? []
  ;(['brandVoice', 'citationHeat', 'positiveSentiment', 'positioningFit'] as const).forEach(k => {
    const series = gt[k] ?? { unit: '', series: [] }
    series.series = series.series ?? []
    gt[k] = series
  })

  if (typeof r.historyReportCount !== 'number') r.historyReportCount = 0
  return r
}

/** 轮询报告生成状态，直到完成/失败 */
async function pollUntilReady(taskNo: string): Promise<AnalysisReportResponse> {
  for (let i = 0; i < 600; i++) {
    let s: ReportStatusPayload
    try {
      s = await getReportStatus(taskNo)
    } catch {
      await sleep(2000)
      continue
    }
    if (s.status === 'COMPLETED') {
      if (s.report && hasReportData(s.report)) return normalizeReport(s.report)
      const again = await getReport(taskNo, false)
      if (hasReportData(again)) return normalizeReport(again)
      throw new Error('报告已生成但数据缺失')
    }
    if (s.status === 'FAILED') {
      throw new Error(s.errorMsg || '报告生成失败')
    }
    await sleep(2000)
  }
  throw new Error('报告生成超时，请稍后重试')
}

/**
 * 获取报告的统一入口：同步返回报告、异步(202)则自动轮询。
 * regenerate=true 时强制重新生成。
 */
export async function fetchReport(taskNo: string, regenerate = false): Promise<AnalysisReportResponse> {
  const res = regenerate ? await regenerateReport(taskNo) : await getReport(taskNo)
  if (hasReportData(res)) return normalizeReport(res)
  return pollUntilReady(taskNo)
}
