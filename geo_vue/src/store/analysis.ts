import { defineStore } from 'pinia'
import type { AnalysisReportResponse, ReportHistoryItem } from '@/types/analysis'
import { getReportHistory } from '@/api/analysis'

/** 分析报告状态 */
export const useAnalysisStore = defineStore('analysis', {
  state: () => ({
    report: null as AnalysisReportResponse | null,
    reportLoading: false,
    history: [] as ReportHistoryItem[],
    historyLoading: false
  }),
  actions: {
    setReport(report: AnalysisReportResponse | null) {
      this.report = report
    },
    async fetchHistory(taskNo: string) {
      this.historyLoading = true
      try {
        this.history = await getReportHistory(taskNo)
      } finally {
        this.historyLoading = false
      }
    }
  }
})
