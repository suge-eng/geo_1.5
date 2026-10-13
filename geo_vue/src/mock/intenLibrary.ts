// src/mock/intenLibrary.ts
// ============================================================
// 意图词库相关虚拟数据统一出口
// 由 @/mock/flag 中的 USE_MOCK 开关控制是否生效
//   - USE_MOCK = true  ：返回完整假数据用于本地演示
//   - USE_MOCK = false ：返回空数组 / 空数据，等待真实接口
// ============================================================
import { USE_MOCK } from './flag'

// -------------------- 类型定义 --------------------

export interface IntentWord {
  id: number
  projectId?: string
  keyword: string
  level: string
  scene: string
  tag: string
  type: string
  competitiveness: string
  questionCount: number
  status: boolean
}

export interface IntentQuestion {
  id: number
  text: string
  status: boolean
}

export interface IntentLayer {
  label: string
  value: string
}

/** 新建抽屉：勾选列表项 */
export interface DrawerKeyword {
  id: string
  keyword: string
  levelFull: string
  levelShort: string
  scene: string
  tag: string
  selected: boolean
}

// -------------------- 意图层级配置 --------------------
// 五个固定意图层级，与后端 intent_definition 表一致，不受 USE_MOCK 控制

export const INTENT_LAYERS: IntentLayer[] = [
  { label: '认知层', value: 'cognition' },
  { label: '种草层', value: 'seeding' },
  { label: '甄选层', value: 'selection' },
  { label: '决策层', value: 'decision' },
  { label: '反馈层', value: 'feedback' }
]

export const INTENT_LAYER_ALL: IntentLayer = { label: '总计', value: 'all' }

/** 层级简称映射：仅用于抽屉内关键词列表展示，属于纯展示配置 */
export const INTENT_LEVEL_SHORT_MAP: Record<string, string> = {
  认知层: '认知',
  种草层: '种草',
  甄选层: '甄选',
  决策层: '决策',
  反馈层: '反馈'
}

// -------------------- 下拉选项数据 --------------------

export const MOCK_INTENT_TAGS: string[] = USE_MOCK
  ? ['降低营销成本', '提升品牌认知', '加速购买决策', '激发用户兴趣']
  : []

export const MOCK_KEYWORD_TYPES: string[] = USE_MOCK
  ? ['品牌词', '通用词', '精准词', '长尾词']
  : []

// -------------------- 意图词主列表 --------------------

const LEVEL_LABELS = ['认知层', '场景层', '筛选层', '决策层', '反馈层']

export const MOCK_INTENT_WORDS: IntentWord[] = USE_MOCK
  ? Array.from({ length: 195 }, (_, i) => ({
      id: i + 1,
      keyword: i < 3 ? '红神化裁' : `示例关键词 ${i + 1}`,
      level: LEVEL_LABELS[i % LEVEL_LABELS.length],
      scene: i < 3 ? '痤疮/毛囊炎' : '示例场景',
      tag: i < 3 ? '红神化裁' : '示例标签',
      type: i < 3 ? '精准词' : '长尾词',
      competitiveness: i < 3 ? '弱' : '中',
      questionCount: Math.floor(Math.random() * 50) + 1,
      status: i % 2 === 0
    }))
  : []

// -------------------- 关联询问句 --------------------

export const MOCK_INTENT_QUESTIONS: IntentQuestion[] = USE_MOCK
  ? Array.from({ length: 25 }, (_, i) => ({
      id: i + 1,
      text: i < 15 ? '网站建设哪家好' : `示例询问句 ${i + 1}`,
       status: i % 3 !== 0  
    }))
  : []

// -------------------- 「新增询问句」弹窗：AI 拓展多批次 --------------------

export const MOCK_AI_EXPAND_BATCHES: string[] = USE_MOCK
  ? [
      '网站建设公司哪家靠谱？\n高端建站公司怎么选？\n品牌型企业官网定制服务公司推荐',
      '企业官网设计陈旧怎么改版？\n营销型网站建设哪家好？\n外贸独立站建设公司推荐',
      '响应式网站建设哪家好？\nB2B 行业网站建设推荐\n集团官网设计公司排名'
    ]
  : []

// -------------------- 「新建意图词」抽屉：AI 拓展关键词池 --------------------

export const AI_EXPAND_KEYWORD_SEEDS: string[] = USE_MOCK
  ? [
      '脸上长斑',
      '斑块形态',
      '日晒老化',
      '黄褐斑怎么去除',
      '黄褐斑形成原因',
      '激光祛斑效果',
      '黄褐斑能根治吗',
      '祛斑产品推荐',
      '黄褐斑和雀斑区别',
      '内分泌失调长斑',
      '妊娠斑怎么淡化',
      '晒斑修复方法',
      '祛斑大概多少钱',
      '美白淡斑精华',
      '医美祛斑靠谱吗',
      '黄褐斑颜色加深',
      '日常淡斑护理',
      '斑块边界清晰',
      '色斑反复发作',
      '光子嫩肤祛斑'
    ]
  : []

// -------------------- 工具：模拟 AI 返回 --------------------

/**
 * 从关键词池随机抽取一批结果（模拟 AI 拓展）。
 * USE_MOCK 关闭时返回空数组，调用方可自行走真实接口。
 */
export function pickAiKeywords(count = 14): string[] {
  if (!USE_MOCK) return []
  const pool = [...AI_EXPAND_KEYWORD_SEEDS]
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[pool[i], pool[j]] = [pool[j], pool[i]]
  }
  return pool.slice(0, Math.min(count, pool.length))
}