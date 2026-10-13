import { http } from '@/utils/request'
import type { TaskPoolOverview } from '@/types/task'

/** 任务池看板 */
export function getTaskPool() {
  return http<TaskPoolOverview>({ url: '/api/rpa/pool', method: 'get' })
}
