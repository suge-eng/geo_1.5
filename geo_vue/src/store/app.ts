import { defineStore } from 'pinia'

/** 应用级 UI 状态 */
export const useAppStore = defineStore('app', {
  state: () => ({
    appTitle: 'GEO 生成式引擎优化平台',
    /** 左侧一级菜单是否折叠（默认展开，固定侧栏） */
    sidebarCollapsed: false
  }),
  actions: {
    toggleSidebar() {
      this.sidebarCollapsed = !this.sidebarCollapsed
    }
  }
})
