import {
  createRouter,
  createWebHistory,
  type RouteLocation,
  type RouteLocationRaw,
  type RouteRecordRaw
} from 'vue-router'
import { ElMessage } from 'element-plus'
import AppLayout from '@/layout/AppLayout.vue'
import { LAST_PROJECT_KEY, useProjectStore } from '@/store/project'
import { PROJECT_LIST_PATH, PROJECT_ROOT } from '@/utils/projectPath'

/**
 * 项目内的业务页面。
 *
 * 路径都是相对项目根的「子路径」——同一个页面在不同项目下是不同的 URL
 * （`/project/2026.../monitor/tasks`），刷新、分享链接、多标签页都能各自定位。
 */
const PROJECT_CHILDREN: RouteRecordRaw[] = [
  {
    path: '',
    // 只带项目 ID 进来时，默认落到该项目的监测任务
    redirect: to => `${PROJECT_ROOT}/${to.params.projectId}/monitor/tasks`
  },
  {
    path: 'monitor/tasks',
    name: 'TaskList',
    component: () => import('@/views/monitor/tasks/TaskList.vue'),
    meta: { title: '监测任务', group: 'monitor' }
  },
  {
    // 必须排在 monitor/tasks/:taskNo 之前，否则 create 会被当成 taskNo
    path: 'monitor/tasks/create',
    name: 'TaskCreate',
    component: () => import('@/views/monitor/tasks/TaskCreate.vue'),
    meta: { title: '新建任务', group: 'monitor' }
  },
  {
    path: 'monitor/tasks/:taskNo',
    name: 'TaskDetail',
    component: () => import('@/views/monitor/tasks/TaskDetail.vue'),
    meta: { title: '观测详情', group: 'monitor' }
  },
  {
    path: 'monitor/analysis',
    name: 'AnalysisReport',
    component: () => import('@/views/monitor/analysis/AnalysisReport.vue'),
    meta: { title: '数据分析', group: 'monitor' }
  },
  {
    path: 'monitor/blindspot',
    name: 'BlindSpotAnalysis',
    component: () => import('@/views/monitor/blindspot/BlindSpotAnalysis.vue'),
    meta: { title: '盲区分析', group: 'monitor' }
  },
  {
    path: 'monitor/intent',
    name: 'IntentLibrary',
    component: () => import('@/views/monitor/intent/IntentLibrary.vue'),
    meta: { title: '意图词库', group: 'monitor' }
  },
  {
    path: 'monitor/config',
    name: 'MonitorConfig',
    component: () => import('@/views/monitor/config/MonitorConfig.vue'),
    meta: { title: '监测配置', group: 'monitor' }
  },
  {
    path: 'plan',
    name: 'Plan',
    component: () => import('@/views/plan/PlanView.vue'),
    meta: { title: '计划', group: 'plan' }
  }
]

/**
 * 旧路径兼容：`/monitor/**`、`/plan` 是上一版没有项目层的写法。
 * 按「最近进入的项目」展开成新的项目内路径；没进过项目就回项目列表。
 */
function legacyRedirect(to: RouteLocation): RouteLocationRaw {
  const lastProjectId = localStorage.getItem(LAST_PROJECT_KEY)
  if (!lastProjectId) return { path: PROJECT_LIST_PATH }
  return { path: `${PROJECT_ROOT}/${lastProjectId}${to.path}`, query: to.query }
}

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/Login.vue'),
    meta: { title: '登录' }
  },
  {
    // 登录后的首页：项目列表，直接占根路径（PROJECT_LIST_PATH === '/'）
    path: PROJECT_LIST_PATH,
    name: 'ProjectList',
    component: () => import('@/views/project/ProjectList.vue'),
    meta: { title: '项目列表' }
  },
  {
    path: `${PROJECT_ROOT}/:projectId`,
    component: AppLayout,
    children: PROJECT_CHILDREN
  },
  { path: '/monitor/:pathMatch(.*)*', redirect: legacyRedirect },
  { path: '/plan', redirect: legacyRedirect },
  // 兜底：未知路径（含旧首页 /projects）一律回项目列表
  { path: '/:pathMatch(.*)*', redirect: PROJECT_LIST_PATH }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

/**
 * 登录守卫 + 项目上下文校验。
 *
 * - 未登录一律回到 /login，并记录来源路径供登录后跳回；
 * - URL 里的 projectId 必须真实存在，否则退回项目列表（避免手改地址栏进到空项目）；
 * - 离开项目（回到项目列表）时清掉当前项目，顶部导航不会残留上一个项目名。
 */
router.beforeEach(async to => {
  const token = localStorage.getItem('geo_token')
  const isLoginPage = to.path === '/login'

  if (!isLoginPage && !token) {
    return {
      path: '/login',
      query: to.fullPath === '/' ? undefined : { redirect: to.fullPath }
    }
  }
  if (isLoginPage) {
    return token ? { path: PROJECT_LIST_PATH } : true
  }

  const projectId = to.params.projectId as string | undefined
  const projectStore = useProjectStore()

  if (projectId) {
    const exists = await projectStore.ensureProject(projectId)
    if (!exists) {
      ElMessage.error('项目不存在或已被删除')
      return { path: PROJECT_LIST_PATH }
    }
  } else if (to.name === 'ProjectList') {
    projectStore.clear()
  }

  return true
})

router.afterEach(to => {
  const title = to.meta.title as string | undefined
  document.title = title ? `${title} · GEO 平台` : 'GEO 生成式引擎优化平台'
})

export default router
