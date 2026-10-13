import { http } from '@/utils/request'
import type {
  AnalysisReportResponse,
  ReportStatusPayload,
  ReportHistoryItem
} from '@/types/analysis'

/** 获取/生成报告（同步 200 或异步 202） */
export function getReport(taskNo: string, asyncFlag?: boolean) {
  return http<AnalysisReportResponse | ReportStatusPayload>({
    url: `/api/analysis/${taskNo}/report`,
    method: 'get',
    params: asyncFlag ? { async: true } : undefined
  })
}

/** 强制重新生成报告 */
export function regenerateReport(taskNo: string, options?: Record<string, unknown>) {
  return http<AnalysisReportResponse | ReportStatusPayload>({
    url: `/api/analysis/${taskNo}/regenerate`,
    method: 'post',
    data: options || {}
  })
}

/** 报告生成状态（异步轮询） */
export function getReportStatus(taskNo: string) {
  return http<ReportStatusPayload>({
    url: `/api/analysis/${taskNo}/report/status`,
    method: 'get'
  })
}

/** 历史报告列表 */
export function getReportHistory(taskNo: string) {
  return http<ReportHistoryItem[]>({
    url: `/api/analysis/${taskNo}/reports/history`,
    method: 'get'
  })
}

/** 按 ID 获取历史报告 */
export function getReportById(reportId: number) {
  return http<AnalysisReportResponse>({
    url: `/api/analysis/reports/${reportId}`,
    method: 'get'
  })
}

/** 生成全局数据报告 */
export function generateGlobalReport(taskNo: string) {
  return http<AnalysisReportResponse>({
    url: `/api/analysis/${taskNo}/reports/global/generate`,
    method: 'post',
    data: {}
  })
}
