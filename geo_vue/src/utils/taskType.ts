import type { MonitorTarget, Task } from '@/types/task'

/**
 * 任务监测目标（声量 / 舆情）的解析工具。
 *
 * 背景：用户在「新建监测」里选择的监测目标（声量 / 舆情）当前并未随任务提交给后端，
 * Task 实体也没有对应字段，导致创建后无法判断任务类型，报告页只能写死走声量页。
 *
 * 本工具提供兜底方案：
 *  1. 优先读后端返回的 `task.monitorTarget`（后端就绪后自动生效）；
 *  2. 其次读创建任务时写入的本地记录（见 setTaskMonitorTarget）；
 *  3. 都没有时按 `volume`（声量）处理，保持现有行为不变。
 */

const STORAGE_KEY = 'geo_task_monitor_target'

function readMap(): Record<string, MonitorTarget> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, MonitorTarget>) : {}
  } catch {
    return {}
  }
}

/** 创建任务成功后，本地记录该任务的监测目标 */
export function setTaskMonitorTarget(taskNo: string | undefined | null, target: MonitorTarget) {
  if (!taskNo) return
  const map = readMap()
  map[taskNo] = target
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
  } catch {
    /* 本地存储不可用时静默忽略，不影响主流程 */
  }
}

/** 读取本地记录的监测目标 */
export function getTaskMonitorTarget(taskNo?: string | null): MonitorTarget | undefined {
  if (!taskNo) return undefined
  const value = readMap()[taskNo]
  return value === 'sentiment' || value === 'volume' ? value : undefined
}

/** 解析任务监测目标：后端字段 > 本地记录 > 默认声量 */
export function resolveTaskMonitorTarget(task?: Partial<Task> | null): MonitorTarget {
  const backend = task?.monitorTarget
  if (backend === 'sentiment' || backend === 'volume') return backend
  return getTaskMonitorTarget(task?.taskNo) || 'volume'
}

/** 是否为舆情类型任务 */
export function isSentimentTask(task?: Partial<Task> | null): boolean {
  return resolveTaskMonitorTarget(task) === 'sentiment'
}
