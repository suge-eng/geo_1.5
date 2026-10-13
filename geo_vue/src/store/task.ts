import { defineStore } from 'pinia'
import { listTasks, getTask } from '@/api/task'
import type { Task } from '@/types/task'

/**
 * 任务状态：taskList 用于列表页；currentTask 跨路由共享
 * （列表 → 详情 → 数据分析报告 之间传递选中任务）
 */
export const useTaskStore = defineStore('task', {
  state: () => ({
    taskList: [] as Task[],
    loading: false,
    currentTask: null as Task | null
  }),
  actions: {
    async fetchTaskList(projectId?: string) {
      this.loading = true
      try {
        this.taskList = await listTasks(projectId)
      } finally {
        this.loading = false
      }
    },
    async fetchCurrentTask(taskNo: string) {
      this.currentTask = await getTask(taskNo)
      return this.currentTask
    },
    setCurrentTask(task: Task | null) {
      this.currentTask = task
    }
  }
})
