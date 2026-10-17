import { http } from '@/utils/request'
import type {
  SentimentReportResponse,
  SentimentReportStatusPayload,
  SentimentReportHistoryItem
} from '@/types/sentimentReport'

/**
 * 舆情数据报告接口（后端预留）。
 *
 * 路径统一挂在 `/api/sentiment` 下，与声量报告 `/api/analysis` 区分开，
 * 避免两类报告混用同一套接口。后端就绪后按其真实路径在此处对齐即可。
 */

/** 获取/生成舆情报告（同步 200 或异步 202） */
export function getSentimentReport(taskNo: string, asyncFlag?: boolean) {
  return http<SentimentReportResponse | SentimentReportStatusPayload>({
    url: `/api/sentiment/${taskNo}/report`,
    method: 'get',
    params: asyncFlag ? { async: true } : undefined
  })
}

/** 强制重新生成舆情报告 */
export function regenerateSentimentReport(taskNo: string, options?: Record<string, unknown>) {
  return http<SentimentReportResponse | SentimentReportStatusPayload>({
    url: `/api/sentiment/${taskNo}/regenerate`,
    method: 'post',
    data: options || {}
  })
}

/** 舆情报告生成状态（异步轮询） */
export function getSentimentReportStatus(taskNo: string) {
  return http<SentimentReportStatusPayload>({
    url: `/api/sentiment/${taskNo}/report/status`,
    method: 'get'
  })
}

/** 舆情历史报告列表 */
export function getSentimentReportHistory(taskNo: string) {
  return http<SentimentReportHistoryItem[]>({
    url: `/api/sentiment/${taskNo}/reports/history`,
    method: 'get'
  })
}

/** 按 ID 获取历史舆情报告 */
export function getSentimentReportById(reportId: number) {
  return http<SentimentReportResponse>({
    url: `/api/sentiment/reports/${reportId}`,
    method: 'get'
  })
}
