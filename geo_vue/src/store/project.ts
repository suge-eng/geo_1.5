import { defineStore } from 'pinia'
import { getProject } from '@/api/project'
import type { Project } from '@/types/project'

/**
 * 当前项目上下文。
 *
 * 项目 ID 以路由参数（/project/:projectId/...）为准，store 只缓存它的详情，
 * 供顶部导航显示项目名、以及旧路径（/monitor/**）兼容跳转时回退使用。
 */

/** 最近进入的项目 ID，供旧路径兼容跳转兜底 */
export const LAST_PROJECT_KEY = 'geo_last_project'

export const useProjectStore = defineStore('project', {
  state: () => ({
    currentProject: null as Project | null
  }),
  getters: {
    projectId: state => state.currentProject?.id || '',
    projectName: state => state.currentProject?.name || ''
  },
  actions: {
    /**
     * 让 store 里的当前项目与路由中的 projectId 对齐。
     *
     * 返回 false 表示该项目不存在（或已删除），调用方据此退回项目列表。
     * 同一个项目重复进入不会重复请求。
     */
    async ensureProject(projectId: string): Promise<boolean> {
      if (this.currentProject?.id === projectId) return true
      try {
        this.currentProject = await getProject(projectId)
        localStorage.setItem(LAST_PROJECT_KEY, projectId)
        return true
      } catch {
        this.currentProject = null
        localStorage.removeItem(LAST_PROJECT_KEY)
        return false
      }
    },
    /** 回到项目列表时清空，避免顶部导航残留上一个项目名 */
    clear() {
      this.currentProject = null
      localStorage.removeItem(LAST_PROJECT_KEY)
    }
  }
})
