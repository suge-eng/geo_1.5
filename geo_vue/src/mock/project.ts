/**
 * 项目列表虚拟数据。
 *
 * 后端暂无「项目」这一层（见 docs/后端API分析报告.md），
 * 项目列表页先按原型 项目列表.html 用本文件的虚拟数据跑通全流程。
 *
 * 与 mock/index.ts 里那些「只读」的展示型假数据不同，这里的 MOCK_PROJECTS
 * 是**可变**的：新建项目会真的 unshift 进去，因此新建后刷新列表能看到新数据。
 * 页面只与 api/project.ts 交互，后端接口就绪后把 api 层的 USE_MOCK 分支去掉即可。
 */

import dayjs from 'dayjs'
import type { Project } from '@/types/project'

/** 套餐类型（新建项目下拉选项） */
export const PROJECT_PACKAGES = ['年服务', '季度服务', '月服务'] as const

/** 套餐时长（月），用于由开始日期推算服务结束日期 */
const PACKAGE_MONTHS: Record<string, number> = {
  年服务: 12,
  季度服务: 3,
  月服务: 1
}

/** 列表默认条数：与原型「共58条」一致 */
const MOCK_PROJECT_COUNT = 58

/** 项目名称池（循环取用，超出后追加序号） */
const PROJECT_NAMES = [
  '孚诺', '优健荟', '云诊科技', '康泰生物', '智联医疗', '和济堂', '麦禾健康', '青蓝教育',
  '星野出行', '海纳数据', '数联云科', '橙心优选', '万橡家居', '青竹软件', '远望智能',
  '沁园食品', '安愈医疗', '融创咨询', '佳沃农业', '天启能源', '沐光文旅', '巨浪传媒',
  '尚品零售', '聚元资本', '凯尔化工', '博斯教育', '云天物流', '明泽环保', '鸿信安防',
  '金瑞建材', '悦活健身', '思远律所', '耕读文化', '新程汽车', '朗润药业', '睿智电子',
  '泛海航运', '禾颂食品', '青藤设计', '迅达供应链', '品诺母婴', '长安机械', '光合能源',
  '知了课堂', '曦和生物', '弘毅体育', '若水茶业', '南栀家居', '问渠科技', '砚山文创',
  '珀莱医美', '鹿鸣宠物', '云栖民宿', '远山户外', '川流餐饮', '子规教育', '松风电器',
  '溪谷农业', '初阳母婴'
]

/** 项目服务起始日的基准点：原型两条示例均为 2026.09.09 */
const SERVICE_BASE_DATE = '2026-09-09'

/** 项目ID 的格式：14 位时间戳 YYYYMMDDHHmmss，如 20260909121112 */
const PROJECT_ID_FORMAT = 'YYYYMMDDHHmmss'

/**
 * 由开始日期 + 套餐类型推算服务时间区间，格式 `2026.09.09-2027.09.09`。
 * 日期非法时返回空串，交由调用方校验。
 */
export function computeServiceTime(startDate: string, packageType: string): string {
  const start = dayjs(startDate)
  if (!start.isValid()) return ''
  const end = start.add(PACKAGE_MONTHS[packageType] ?? 0, 'month')
  return `${start.format('YYYY.MM.DD')}-${end.format('YYYY.MM.DD')}`
}

/** 原型 项目列表.html 里的两条示例项目，逐字段照搬 */
const PROTOTYPE_PROJECTS: Project[] = [
  {
    id: '20260909121112',
    name: '孚诺',
    packageType: '年服务',
    serviceTime: '2026.09.09-2027.09.09',
    createdAt: dayjs('2026-09-09 12:11:12').toISOString()
  },
  {
    id: '20260909121113',
    name: '优健荟',
    packageType: '季度服务',
    serviceTime: '2026.09.09-2026.12.09',
    createdAt: dayjs('2026-09-09 12:11:13').toISOString()
  }
]

/** 确定性造数：同一序号每次得到同一条项目，避免刷新抖动 */
function createMockProjects(): Project[] {
  const rest = Array.from(
    { length: MOCK_PROJECT_COUNT - PROTOTYPE_PROJECTS.length },
    (_, n) => {
      const i = n + PROTOTYPE_PROJECTS.length
      const name = PROJECT_NAMES[i % PROJECT_NAMES.length] +
        (i >= PROJECT_NAMES.length ? ` ${Math.floor(i / PROJECT_NAMES.length) + 1}号` : '')
      const packageType = PROJECT_PACKAGES[i % PROJECT_PACKAGES.length]
      // 服务起始日从原型基准日整体往前铺开，列表看起来有真实的时间跨度
      const start = dayjs(`${SERVICE_BASE_DATE} 12:11:12`).subtract(i * 13, 'day')
      return {
        // 每条间隔一天，保证 14 位时间戳不重复
        id: start.format(PROJECT_ID_FORMAT),
        name,
        packageType,
        serviceTime: computeServiceTime(start.format('YYYY-MM-DD'), packageType),
        createdAt: start.toISOString()
      }
    }
  )
  return [...PROTOTYPE_PROJECTS, ...rest]
}

/**
 * 虚拟项目表。
 *
 * 页面不直接改这个数组，只通过 api/project.ts 读写；
 * 这里导出可变引用是为了让「新建项目」在本次会话内真实生效。
 */
export const MOCK_PROJECTS: Project[] = createMockProjects()

/**
 * 生成新项目 ID：取当前时间的 14 位时间戳，与原型示例 20260909121112 同构。
 * 同一秒内连续新建会撞 ID，这里顺延一秒直到不重复。
 */
export function generateProjectId(): string {
  let ts = dayjs()
  let id = ts.format(PROJECT_ID_FORMAT)
  while (MOCK_PROJECTS.some(p => p.id === id)) {
    ts = ts.add(1, 'second')
    id = ts.format(PROJECT_ID_FORMAT)
  }
  return id
}
