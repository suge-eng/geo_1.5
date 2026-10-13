import { http } from '@/utils/request'
import { USE_MOCK } from '@/mock/flag'
import { MOCK_PROJECTS, computeServiceTime, generateProjectId } from '@/mock/project'
import type { Project, ProjectCreateRequest } from '@/types/project'

/**
 * 项目服务。
 *
 * - USE_MOCK = true 时全部走 src/mock/project.ts 的虚拟数据，新建项目会真的写进虚拟表；
 * - USE_MOCK = false 时走后端真实接口 /api/project/*。
 */

/** 模拟网络延迟，让 loading 态可见 */
function delay<T>(data: T, ms = 260): Promise<T> {
  return new Promise(resolve => setTimeout(() => resolve(data), ms))
}

/** 项目列表（全量，无分页；分页由页面客户端切片） */
export function listProjects(): Promise<Project[]> {
  if (USE_MOCK) return delay(MOCK_PROJECTS.map(p => ({ ...p })))
  return http<Project[]>({ url: '/api/project/list', method: 'get' })
}

/** 项目详情（路由守卫用它校验 URL 里的 projectId 是否存在） */
export function getProject(id: string): Promise<Project> {
  if (USE_MOCK) {
    const hit = MOCK_PROJECTS.find(p => p.id === id)
    return hit ? delay({ ...hit }) : Promise.reject(new Error('项目不存在'))
  }
  return http<Project>({ url: `/api/project/${id}`, method: 'get' })
}

/** 新建项目 */
export function createProject(data: ProjectCreateRequest): Promise<Project> {
  if (USE_MOCK) {
    const project: Project = {
      id: generateProjectId(),
      name: data.name,
      packageType: data.packageType,
      serviceTime: computeServiceTime(data.startDate, data.packageType),
      createdAt: new Date().toISOString()
    }
    MOCK_PROJECTS.unshift(project)
    return delay({ ...project })
  }
  return http<Project>({
    url: '/api/project',
    method: 'post',
    data: {
      name: data.name,
      packageType: data.packageType,
      startDate: data.startDate,
      endDate: data.endDate
    }
  })
}
