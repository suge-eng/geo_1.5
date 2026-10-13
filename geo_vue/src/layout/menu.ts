export interface MenuChild {
  /** 项目内的子路径（相对 `/project/:projectId`），如 `monitor/tasks` */
  sub: string
  label: string
}

export interface MenuItem {
  key: string
  label: string
  icon: string
  /** 点击一级菜单时落到哪个子菜单（取 children[0]） */
  children: MenuChild[]
}

/**
 * 一级 + 二级菜单配置（监测/计划；监测任务/盲区分析/意图词库/监测配置）
 *
 * 注：菜单里存的是「项目内的子路径」而不是完整路径——同一个页面在不同项目下
 * 是不同的 URL，跳转时由 projectPath() 补上当前 projectId。
 *
 * 注：「数据分析」报告页（monitor/analysis）不在顶部导航中露出，
 * 它作为监测任务的结果页，由任务列表/详情的「报告」入口跳转进入。
 */
export const MENUS: MenuItem[] = [
  {
    key: 'monitor',
    label: '监测',
    icon: 'Monitor',
    children: [
      { sub: 'monitor/tasks', label: '监测任务' },
      { sub: 'monitor/blindspot', label: '盲区分析' },
      { sub: 'monitor/intent', label: '意图词库' },
      { sub: 'monitor/config', label: '监测配置' }
    ]
  },
  {
    key: 'plan',
    label: '计划',
    icon: 'Calendar',
    children: [{ sub: 'plan', label: '计划' }]
  }
]

/** 一级菜单的入口子路径 */
export function menuEntrySub(menu: MenuItem): string {
  return menu.children[0].sub
}

/** 根据项目内的子路径定位一级菜单 */
export function getActiveMenu(subPath: string): MenuItem {
  const sub = subPath.replace(/^\//, '')
  return MENUS.find(m => sub === m.key || sub.startsWith(m.key + '/')) || MENUS[0]
}
