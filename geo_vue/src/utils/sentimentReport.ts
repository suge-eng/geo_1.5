import {
  getSentimentReport,
  getSentimentReportStatus,
  regenerateSentimentReport
} from '@/api/sentimentReport'
import type { SentimentReportResponse, SentimentReportStatusPayload } from '@/types/sentimentReport'

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/** 判断响应是否是「异步状态」payload（而非直接报告数据） */
export function isSentimentStatusPayload(d: unknown): d is SentimentReportStatusPayload {
  return (
    !!d &&
    typeof d === 'object' &&
    'status' in d &&
    ['IDLE', 'RUNNING', 'COMPLETED', 'FAILED'].includes((d as SentimentReportStatusPayload).status as string)
  )
}

/** 判断响应是否携带真实舆情报告数据（区别于异步状态 payload） */
export function hasSentimentReportData(d: unknown): d is SentimentReportResponse {
  if (!d || typeof d !== 'object') return false
  const r = d as SentimentReportResponse
  return r.overview !== undefined || r.mediaSource !== undefined || r.brandName !== undefined || r.title !== undefined
}

/** 轮询舆情报告生成状态，直到完成/失败 */
async function pollUntilReady(taskNo: string): Promise<SentimentReportResponse> {
  for (let i = 0; i < 600; i++) {
    let s: SentimentReportStatusPayload
    try {
      s = await getSentimentReportStatus(taskNo)
    } catch {
      await sleep(2000)
      continue
    }
    if (s.status === 'COMPLETED') {
      if (s.report && hasSentimentReportData(s.report)) return s.report
      const again = await getSentimentReport(taskNo, false)
      if (hasSentimentReportData(again)) return again
      throw new Error('舆情报告已生成但数据缺失')
    }
    if (s.status === 'FAILED') {
      throw new Error(s.errorMsg || '舆情报告生成失败')
    }
    await sleep(2000)
  }
  throw new Error('舆情报告生成超时，请稍后重试')
}

/**
 * 获取舆情报告的统一入口：同步返回报告、异步(202)则自动轮询。
 * regenerate=true 时强制重新生成。
 */
export async function fetchSentimentReport(
  taskNo: string,
  regenerate = false
): Promise<SentimentReportResponse> {
  const res = regenerate ? await regenerateSentimentReport(taskNo) : await getSentimentReport(taskNo)
  if (hasSentimentReportData(res)) return res
  return pollUntilReady(taskNo)
}
