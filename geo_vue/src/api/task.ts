import { http } from '@/utils/request'
import type {
  Task,
  TaskSubmitRequest,
  TaskProgressVO,
  TaskResultVO,
  TaskRankingVO
} from '@/types/task'

/** 任务列表（按项目隔离） */
export function listTasks(projectId?: string) {
  return http<Task[]>({
    url: '/api/task/list',
    method: 'get',
    params: projectId ? { projectId } : {}
  })
}

/** 任务详情 */
export function getTask(taskNo: string) {
  return http<Task>({ url: `/api/task/${taskNo}`, method: 'get' })
}

/** 创建任务（手动 JSON） */
export function createTask(data: TaskSubmitRequest) {
  return http<Task>({ url: '/api/task/create', method: 'post', data })
}

/** Excel 批量创建任务 */
export function createTaskFromExcel(formData: FormData) {
  return http<Task>({
    url: '/api/task/create/excel',
    method: 'post',
    data: formData,
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

/** 解析白名单 Excel → 域名列表 */
export function parseWhitelist(file: File) {
  const fd = new FormData()
  fd.append('file', file)
  return http<string[]>({
    url: '/api/task/parse-whitelist',
    method: 'post',
    data: fd,
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

/** 提交任务（派发执行） */
export function submitTask(taskNo: string, body?: { executionFrequency?: string; retryOnFailure?: boolean }) {
  return http<Task>({ url: `/api/task/${taskNo}/submit`, method: 'post', data: body || {} })
}

/** 删除任务 */
export function deleteTask(taskNo: string) {
  return http<void>({ url: `/api/task/${taskNo}`, method: 'delete' })
}

/** 任务进度 */
export function getProgress(taskNo: string) {
  return http<TaskProgressVO>({ url: `/api/task/${taskNo}/progress`, method: 'get' })
}

/** 结果明细 */
export function getResults(taskNo: string) {
  return http<TaskResultVO[]>({ url: `/api/task/${taskNo}/results`, method: 'get' })
}

/** 品牌排名 */
export function getRankings(taskNo: string) {
  return http<TaskRankingVO>({ url: `/api/task/${taskNo}/rankings`, method: 'get' })
}

/** 重试失败/超时子任务 */
export function retryFailed(taskNo: string) {
  return http<Task>({ url: `/api/task/${taskNo}/retry`, method: 'post' })
}

/** 重试全部子任务 */
export function retryAll(taskNo: string) {
  return http<Task>({ url: `/api/task/${taskNo}/retry/all`, method: 'post' })
}

/** 重试成功子任务 */
export function retrySuccess(taskNo: string) {
  return http<Task>({ url: `/api/task/${taskNo}/retry/success`, method: 'post' })
}

/** 终止任务 */
export function stopTask(taskNo: string) {
  return http<Task>({ url: `/api/task/${taskNo}/stop`, method: 'post' })
}

/** 暂停任务 */
export function pauseTask(taskNo: string) {
  return http<Task>({ url: `/api/task/${taskNo}/pause`, method: 'post' })
}

/** 恢复任务 */
export function resumeTask(taskNo: string) {
  return http<Task>({ url: `/api/task/${taskNo}/resume`, method: 'post' })
}

/** 重试单条结果 */
export function retryResult(taskResultId: number) {
  return http<Task>({ url: `/api/task/result/${taskResultId}/retry`, method: 'post' })
}

/** 删除单条结果 */
export function deleteResult(taskResultId: number) {
  return http<Task>({ url: `/api/task/result/${taskResultId}`, method: 'delete' })
}

/** 批量删除结果 */
export function batchDeleteResults(taskResultIds: number[]) {
  return http<Task>({ url: '/api/task/result/batch', method: 'delete', data: taskResultIds })
}

/** 下载问题模板（blob） */
export function downloadExcelTemplate() {
  return http<Blob>({ url: '/api/task/excel-template', method: 'get', responseType: 'blob' })
}

/** 下载白名单模板（blob） */
export function downloadWhitelistTemplate() {
  return http<Blob>({ url: '/api/task/whitelist-template', method: 'get', responseType: 'blob' })
}

/** 把一个项目下所有任务的 KPI 阈值批量更新 */
export function updateProjectKpi(projectId: string, kpi: number) {
  return http<number>({ url: `/api/task/kpi?projectId=${encodeURIComponent(projectId)}&kpi=${kpi}`, method: 'post' })
}
