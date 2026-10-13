import { LAST_PROJECT_KEY } from '@/store/project'

/**
 * 项目内路由路径工具。
 *
 * 项目内的页面统一挂在 `/project/:projectId/...` 下，页面里跳转时必须带上
 * 当前项目 ID。用具名路径拼接容易漏参数，这里集中一处，缺 ID 时兜底回项目列表。
 */

/**
 * 项目列表页路径。
 *
 * 项目列表就是登录后的首页，直接占根路径 `/`（`http://localhost:5173/`），
 * 不再额外挂一层 `/projects`。旧的 `/projects` 地址由路由兜底规则重定向过来。
 */
export const PROJECT_LIST_PATH = '/'

/** 项目根路径前缀，与路由 `/project/:projectId` 对应 */
export const PROJECT_ROOT = '/project'

/**
 * 拼出当前项目下的完整路径。
 *
 * @param projectId 路由参数里的项目 ID；为空时回退到 localStorage 里最近进入的项目
 * @param sub 项目内的子路径，如 `monitor/tasks/create`（不带首尾斜杠）
 */
export function projectPath(projectId: string | undefined | null, sub: string): string {
  const id = projectId || localStorage.getItem(LAST_PROJECT_KEY) || ''
  if (!id) return PROJECT_LIST_PATH
  return `${PROJECT_ROOT}/${id}/${sub.replace(/^\//, '')}`
}

/**
 * 剥掉 `/project/:projectId/` 前缀，得到菜单/高亮判断用的子路径。
 * 例：`/project/2026.../monitor/tasks` → `monitor/tasks`
 */
export function projectSubPath(path: string): string {
  const matched = /^\/project\/[^/]+\/?(.*)$/.exec(path)
  return matched ? matched[1] : path.replace(/^\//, '')
}
