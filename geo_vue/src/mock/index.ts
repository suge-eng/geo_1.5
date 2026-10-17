/**
 * 前端虚拟数据统一出口。
 *
 * 背景：后端 `task_result` 表只落库「问题 × 平台」的执行结果，
 * 不含「层级 / 标签 / 关键词 / 意图 / 阈值」这类业务标注字段。
 * 这些列与筛选项先用本文件的虚拟数据兜底；
 * 后续后端补齐字段后，只需把这里的取值替换为真实接口字段即可。
 */

/** 结果行中后端未提供的扩展字段 */
export interface TaskResultMockFields {
  /** 层级 */
  level: string
  /** 标签 */
  tag: string
  /** 命中关键词 */
  keyword: string
  /** 意图 */
  intent: string
  /** 关键词阈值 */
  threshold1: string
  /** 品牌阈值 */
  threshold2: string
}

/** 层级 */
export const MOCK_LEVELS = ['决策层', '认知层', '洞察层', '行动层'] as const

/** 意图 */
export const MOCK_INTENTS = ['治疗方案', '用药咨询', '病因查询', '检查诊断', '康复护理'] as const

/** 标签 */
export const MOCK_TAGS = ['标签词', '品牌词', '竞品词', '通用词'] as const

/** 命中关键词 */
export const MOCK_KEYWORDS = ['关键词', '未登录', '已登录'] as const

/** 阈值（关键词阈值 / 品牌阈值共用） */
export const MOCK_THRESHOLDS = ['1', '2', '3', '5'] as const

/** FNV-1a 字符串哈希，保证同一询问词每次得到同一组虚拟字段 */
function hashString(str: string): number {
  let hash = 2166136261
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function pick<T extends string>(list: readonly T[], seed: number): T {
  return list[seed % list.length]
}

/** 后端补齐字段前的空占位（开关关闭时使用） */
export const EMPTY_MOCK_FIELDS: TaskResultMockFields = {
  level: '',
  tag: '',
  keyword: '',
  intent: '',
  threshold1: '',
  threshold2: ''
}

/**
 * 按询问词生成稳定的虚拟扩展字段。
 * 同一询问词在不同平台下取值一致，对齐原型中「同一问题跨平台标注相同」的表现。
 */
export function mockFieldsFor(questionText: string): TaskResultMockFields {
  const seed = hashString(questionText || '')
  return {
    level: pick(MOCK_LEVELS, seed),
    tag: pick(MOCK_TAGS, seed >>> 3),
    keyword: pick(MOCK_KEYWORDS, seed >>> 6),
    intent: pick(MOCK_INTENTS, seed >>> 9),
    threshold1: pick(MOCK_THRESHOLDS, seed >>> 12),
    threshold2: pick(MOCK_THRESHOLDS, seed >>> 15)
  }
}


/** 通用 KPI 卡 */
export interface MockKpi {
  label: string
  value: string
  desc?: string
}

/** 通用条形项（可选独立配色） */
export interface MockBarItem {
  name: string
  value: number
  color?: string
}

/** 报告页头文案 */
export const REPORT_META = {
  projectName: '【项目名称】',
  dimension: '覆盖维度',
  subtitle: '基于151个询问句访问进行的监测数据更新：2023.09.09 12:00'
}

/* ------------------------- 模块一：数据总览 ------------------------- */

/** 覆盖缺口清单行 */
export interface MockGapRow {
  query: string
  stage: string
  coverage: string
  priority: string
}

export interface OverviewData {
  kpis: MockKpi[]
  radar: { title: string; indicators: string[]; values: number[] }
  platformCoverage: { title: string; items: MockBarItem[] }
  sourceStructure: { title: string; items: MockBarItem[] }
  intentHeatmap: {
    title: string
    cols: string[]
    rows: Array<{ name: string; values: number[] }>
  }
  gapList: { title: string; rows: MockGapRow[] }
}

export const OVERVIEW_DATA: OverviewData = {
  kpis: [
    { label: '自然出现率', value: '38.9%' },
    { label: 'AI声量份额', value: '38.9%' },
    { label: '首位率', value: '38.9%' },
    { label: 'TOP3', value: '38.9%' },
    { label: '场景覆盖率', value: '38.9%' },
    { label: '信息准确率', value: '38.9%' }
  ],
  radar: {
    title: '品牌可见趋势',
    indicators: ['DeepSeek', '豆包', '文心一言', '文心助手', '元宝', 'Kimi'],
    values: [48, 48, 48, 48, 48, 48]
  },
  platformCoverage: {
    title: 'AI平台覆盖率',
    items: [
      { name: '豆包', value: 48, color: '#1976d2' },
      { name: 'Deepseek', value: 48, color: '#4285f4' },
      { name: '文心一言', value: 48, color: '#5c9af5' },
      { name: '元宝', value: 48, color: '#718df2' },
      { name: 'kimi', value: 48, color: '#718df2' },
      { name: '千问', value: 48, color: '#718df2' }
    ]
  },
  sourceStructure: {
    title: '品牌信息来源结构',
    items: [
      { name: '官网', value: 48, color: '#1976d2' },
      { name: '行业媒体', value: 48, color: '#4285f4' },
      { name: '电商平台', value: 48, color: '#5c9af5' },
      { name: '内容平台', value: 48, color: '#718df2' },
      { name: '其他来源', value: 48, color: '#1976d2' }
    ]
  },
  intentHeatmap: {
    title: '用户意图阶段覆盖热力图',
    cols: ['认知', '种草', '甄选', '决策', '反馈'],
    rows: [
      { name: '品牌A、自主品牌', values: [73, 63, 48, 33, 43] },
      { name: '类目、品牌', values: [73, 63, 48, 33, 42] },
      { name: '类目、品牌', values: [72, 62, 48, 33, 42] },
      { name: '类目、品牌', values: [73, 63, 48, 33, 42] },
      { name: '类目、品牌', values: [72, 62, 48, 32, 42] }
    ]
  },
  gapList: {
    title: '高价值覆盖缺口',
    rows: [
      { query: '询问句询问句询问句询问句询问句询问句询问句询问句', stage: '决策', coverage: '竞品B、C', priority: '高' },
      { query: '询问句询问句询问句询问句询问句询问句询问句询问句', stage: '决策', coverage: '竞品B、C', priority: '中' },
      { query: '询问句询问句询问句询问句询问句询问句询问句询问句', stage: '决策', coverage: '竞品B、C', priority: '高' },
      { query: '询问句询问句询问句询问句询问句询问句询问句询问句', stage: '决策', coverage: '竞品B、C', priority: '高' },
      { query: '询问句询问句询问句询问句询问句询问句询问句询问句', stage: '决策', coverage: '竞品B、C', priority: '高' }
    ]
  }
}

/* ------------------------- 模块二：模型对比 ------------------------- */

/** 各平台核心指标 */
export interface ModelPlatformRow {
  name: string
  coverRate: number
  firstRate: number
  top3Rate: number
  avgRank: number
  stableRate: number
  accuracy: number
  consistency: number
}

export interface ModelData {
  platformTable: ModelPlatformRow[]
  structure: { title: string; platforms: string[]; first: number[]; top23: number[]; other: number[] }
  heatmap: {
    title: string
    /** 行维度（y 轴） */
    rows: string[]
    /** 每个平台一列（x 轴） */
    items: Array<{
      platform: string
      /** 自然覆盖为文案档位（较高/中等/偏低/待完善） */
      naturalCover: string
      emotional: number
      officialCite: number
    }>
  }
}

export const MODEL_DATA: ModelData = {
  platformTable: [
    { name: 'Deepseek', coverRate: 48.3, firstRate: 18.9, top3Rate: 39.7, avgRank: 3.8, stableRate: 83.8, accuracy: 96.8, consistency: 87.4 },
    { name: '豆包', coverRate: 48.3, firstRate: 18.9, top3Rate: 39.7, avgRank: 3.8, stableRate: 83.8, accuracy: 96.8, consistency: 96.6 },
    { name: '元宝', coverRate: 48.3, firstRate: 18.9, top3Rate: 39.7, avgRank: 3.8, stableRate: 83.8, accuracy: 96.8, consistency: 83.8 },
    { name: 'Kimi', coverRate: 48.3, firstRate: 18.9, top3Rate: 39.7, avgRank: 3.8, stableRate: 83.8, accuracy: 96.8, consistency: 87.4 },
    { name: '千问', coverRate: 48.3, firstRate: 18.9, top3Rate: 39.7, avgRank: 3.8, stableRate: 83.8, accuracy: 96.8, consistency: 83.8 },
    { name: '文心一言', coverRate: 48.3, firstRate: 18.9, top3Rate: 39.7, avgRank: 3.8, stableRate: 83.8, accuracy: 96.8, consistency: 93.8 }
  ],
  structure: {
    title: '覆盖结构占比',
    platforms: ['deepseek', '豆包', '文心一言', '元宝', 'kimi', '千问'],
    first: [40, 35, 45, 40, 35, 40],
    top23: [30, 30, 25, 30, 30, 30],
    other: [15, 20, 15, 15, 20, 15]
  },
  heatmap: {
    title: '用户意图层级覆盖热力图',
    /** 行维度（y 轴） */
    rows: ['自然覆盖', '舆情情况', '官网引用'],
    /** 每个平台一列（x 轴） */
    items: [
      { platform: 'Deepseek', naturalCover: '较高', emotional: 72, officialCite: 72 },
      { platform: '元宝', naturalCover: '中等', emotional: 61, officialCite: 61 },
      { platform: '豆包', naturalCover: '偏低', emotional: 48, officialCite: 48 },
      { platform: 'Kimi', naturalCover: '偏低', emotional: 31, officialCite: 31 },
      { platform: '千问', naturalCover: '偏低', emotional: 41, officialCite: 41 },
      { platform: '文心一言', naturalCover: '待完善', emotional: 80, officialCite: 80 }
    ]
  }
}

/* ------------------------- 模块三：场景覆盖 ------------------------- */

export interface ScenarioIntentItem {
  name: string
  val: string
  tag: string
  tagClass: 'tag-blue' | 'tag-green' | 'tag-orange' | 'tag-gray'
  progress: number
  color: string
  desc: [string, string]
}

export interface ScenarioData {
  kpis: MockKpi[]
  demandRank: { title: string; count: string; items: MockBarItem[] }
  competition: {
    title: string
    headers: string[]
    rows: Array<{ name: string; values: number[] }>
    footer: string
  }
  intent: { title: string; composite: string; list: ScenarioIntentItem[] }
  coverageLevels: { title: string; list: Array<{ label: string; value: number; color: string }>; footer: string }
  scenarioList: Array<{ title: string; desc: [string, string]; priority: string; level: number }>
}

export const SCENARIO_DATA: ScenarioData = {
  kpis: [
    { label: '覆盖功能需求', value: '4 / 20', desc: '0% 功能覆盖率' },
    { label: '最强需求关联', value: '易用性', desc: '71.0% 目标出现率' },
    { label: '高价值能力缺口', value: '数据迁移', desc: '仅 29.0% 覆盖' },
    { label: '功能信息覆盖率', value: '89.6%', desc: '缺 238 个功能点' }
  ],
  demandRank: {
    title: '功能需求覆盖排名',
    count: '20 条需求',
    items: [
      { name: '易用性', value: 71, color: '#1677ff' },
      { name: '性价比', value: 66, color: '#00a870' },
      { name: '基础功能', value: 62, color: '#fa8c16' },
      { name: '团队协作', value: 48, color: '#722ed1' },
      { name: '专业功能', value: 37, color: '#13c2c2' },
      { name: '系统集成', value: 34, color: '#1677ff' },
      { name: '数据迁移', value: 29, color: '#f5222d' }
    ]
  },
  competition: {
    title: '功能心智竞争',
    list: [
      { name: '易用性', brandA: 71, brandB: 58, diff: '+13pt' },
      { name: '性价比', brandA: 66, brandB: 61, diff: '+5pt' },
      { name: '团队协作', brandA: 48, brandB: 64, diff: '-16pt' },
      { name: '专业功能', brandA: 37, brandB: 72, diff: '-35pt' },
      { name: '数据迁移', brandA: 29, brandB: 57, diff: '-28pt' }
    ],
    footer: '品牌 A 已形成“易用、高性价比”心智；需优先增强专业功能、协作和数据迁移的学习内容。'
  },
  intent: {
    title: '五级意图覆盖情况',
    composite: '64.5%',
    list: [
      { name: '认知', val: '72%', tag: '较高', tagClass: 'tag-blue', progress: 72, color: '#1677ff', desc: ['86/120 提及过', '首选 31%'] },
      { name: '种草', val: '61%', tag: '较高', tagClass: 'tag-blue', progress: 61, color: '#00a870', desc: ['73/120 提及过', '推荐 44%'] },
      { name: '甄选', val: '48%', tag: '中等', tagClass: 'tag-green', progress: 48, color: '#1677ff', desc: ['56/120 提及过', 'Top 3 41%'] },
      { name: '决策', val: '31%', tag: '高价值缺口', tagClass: 'tag-orange', progress: 31, color: '#f5222d', desc: ['37/120 提及过', '首选 14%'] },
      { name: '反馈', val: '41%', tag: '待提升', tagClass: 'tag-gray', progress: 41, color: '#fa8c16', desc: ['49/120 提及过', '有效信息 76%'] }
    ]
  },
  coverageLevels: {
    title: '覆盖层级',
    list: [
      { label: '名称覆盖', value: 64.5, color: '#1677ff' },
      { label: '有效信息', value: 46, color: '#00a870' },
      { label: '首推推荐', value: 18.4, color: '#1677ff' }
    ],
    footer: '主要损耗发生在“甄选 → 决策”层级，建议优先补足选购标准、价格等、对比与购买体验。'
  },
  scenarioList: [
    { title: '3,000 元预算的专业型产品选择', desc: ['决策', '竞品 B 78% 覆盖'], priority: '优先级 1', level: 1 },
    { title: '小型团队入门方案推荐', desc: ['甄选', '竞品 A, C'], priority: '优先级 2', level: 2 },
    { title: '异地协作与数据迁移', desc: ['功能需求', '竞品 C 65% 覆盖'], priority: '优先级 3', level: 3 },
    { title: '华东地区中小企业采购', desc: ['地域 x 人群', '竞品 D 52% 覆盖'], priority: '优先级 4', level: 4 }
  ]
}

/* ------------------------- 模块四：竞品分析 ------------------------- */

export interface CompetitorData {
  kpis: {
    rank: string
    share: string
    winRate: string
    answerCount: string
    replaceRate: string
    scenarioCount: string
    topCompetitor: string
    topCompRate: string
  }
  ranking: {
    title: string
    subtitle: string
    list: Array<{
      rank: number
      name: string
      appear: string
      prefer: string
      top3: string
      volume: string
      index: number
    }>
  }
  comparison: {
    title: string
    subtitle: string
    a: { name: string; rate: string }
    b: { name: string; rate: string }
    desc: string
    cognition: MockBarItem[]
  }
  cooccurrence: { title: string; subtitle: string; items: MockBarItem[]; desc: string }
  replacement: {
    title: string
    subtitle: string
    list: Array<{ name: string; count: number; scenario: string; percent: string }>
  }
}

export const COMPETITOR_DATA: CompetitorData = {
  kpis: {
    rank: '#2',
    share: '27.4% 份额',
    winRate: '42.8%',
    answerCount: '1.3k 较上期',
    replaceRate: '31.5%',
    scenarioCount: '126 个品牌用户答案',
    topCompetitor: '竞品 B',
    topCompRate: '50.1% 共现率'
  },
  ranking: {
    title: '品牌竞争排名',
    subtitle: '综合出现率、首选率等 top 3 点位',
    list: [
      { rank: 1, name: '竞品 B', appear: '51.2%', prefer: '24.1%', top3: '46.8%', volume: '34.7%', index: 82.6 },
      { rank: 2, name: '品牌 A', appear: '36.6%', prefer: '16.6%', top3: '31.2%', volume: '27.4%', index: 68.2 },
      { rank: 3, name: '竞品 C', appear: '35.8%', prefer: '14.3%', top3: '29.6%', volume: '22.1%', index: 61.4 },
      { rank: 4, name: '竞品 D', appear: '26.9%', prefer: '9.8%', top3: '21.5%', volume: '15.8%', index: 49.7 }
    ]
  },
  comparison: {
    title: '直接对比结果',
    subtitle: '包含明确对比组合的 342 条语案',
    a: { name: '品牌 A 首选', rate: '42.8%' },
    b: { name: '竞品首选', rate: '47.5%' },
    desc: '9.7% 的答案根据预算、场景或用户类型给出条件化选择。',
    cognition: [
      { name: '认知度图', value: 58, color: '#1677ff' },
      { name: '性价比筛选', value: 52, color: '#00a870' },
      { name: '专业用户选择', value: 36, color: '#fa8c16' },
      { name: '高预算购买', value: 28, color: '#f5222d' }
    ]
  },
  cooccurrence: {
    title: '竞品共现率',
    subtitle: '在与品牌A出现时，各竞品同时出现的概率',
    items: [
      { name: '竞品 B', value: 52.1, color: '#1677ff' },
      { name: '竞品 C', value: 37.8, color: '#00a870' },
      { name: '竞品 D', value: 22.4, color: '#722ed1' }
    ],
    desc: '竞品 B 是 AI 认知中与品牌 A 联系最紧密的对比对象。'
  },
  replacement: {
    title: '竞品替代去向',
    subtitle: '在用户选择品牌 A 的语境中，AI 将原先选择的竞品',
    list: [
      { name: '竞品 B', count: 46, scenario: '专业、高预算', percent: '58%' },
      { name: '竞品 C', count: 21, scenario: '团队协作', percent: '27%' },
      { name: '竞品 D', count: 12, scenario: '本地服务', percent: '15%' }
    ]
  }
}

/** 四个看板模块（用于模块 tab） */
export const REPORT_MODULES = [
  { key: 'overview', label: '数据总览' },
  { key: 'model', label: '模型对比' },
  { key: 'scenario', label: '场景覆盖' },
  { key: 'competitor', label: '竞品分析' }
] as const

export type ReportModuleKey = (typeof REPORT_MODULES)[number]['key']

/* ------------------------- 新建监测页 ------------------------- */

/** 下拉选项（层级 / 意图标签等） */
export interface SelectOption {
  label: string
  value: string
}

/** 询问句穿梭框条目 */
export interface TransferItem {
  key: number
  label: string
}

/** 关键词勾选项 */
export const MOCK_KEYWORD_OPTIONS: string[] = [
  '关键词1', '关键词1', '关键词1', '关键词1', '关键词1',
  '关键词1', '关键词1', '关键词1', '关键词1'
]

/** 询问句穿梭框候选 */
export const MOCK_TRANSFER_ITEMS: TransferItem[] = [
  { key: 1, label: '关键词1' },
  { key: 2, label: '关键词1' },
  { key: 3, label: '关键词1' },
  { key: 4, label: '关键词1' },
  { key: 5, label: '关键词1' },
  { key: 6, label: '关键词1' },
  { key: 7, label: '关键词1' },
  { key: 8, label: '关键词1' },
  { key: 9, label: '关键词1' }
]

/**
 * 层级选项
 *
 * 后端接口就绪后，把这里换成接口返回值即可。
 */
export const MOCK_LEVEL_OPTIONS: SelectOption[] = [
  { label: '认知', value: 'cognition' },
  { label: '种草', value: 'seeding' },
  { label: '甄选', value: 'selection' },
  { label: '决策', value: 'decision' },
  { label: '反馈', value: 'feedback' }
]

/**
 * 意图标签选项
 *
 * 后端接口就绪后，把这里换成接口返回值即可。
 */
export const MOCK_INTENT_TAG_OPTIONS: SelectOption[] = [
  { label: '标签1', value: 'brand' },
  { label: '标签2', value: 'compare' },
  { label: '标签3', value: 'purchase' }
]

/* ------------------------- 盲区分析 ------------------------- */

/** 指标卡（左侧彩条配色） */
export interface BlindSpotMetric {
  title: string
  value: string
  sub: string
  /** 左侧彩条颜色，缺省为无彩条 */
  color?: 'red' | 'orange' | 'purple' | 'blue' | 'green'
}

export const BLINDSPOT_PAGE = {
  title: '盲区分析',
  desc: '监测识别泛需求问询中未提及目标品牌的问题，定位稳定缺失、竞品占位及新出现的覆盖空白。'
}

/** 盲区清单：顶部 5 张指标卡 */
export const BLINDSPOT_LIST_METRICS: BlindSpotMetric[] = [
  { title: '问题极盲区', value: '126', sub: '420 个可评估泛需求问题', color: 'red' },
  { title: '问题盲区率', value: '30.0%', sub: '126 ÷ 420', color: 'orange' },
  { title: '稳定盲区', value: '48', sub: '≥3 平台且 ≥5 条有效答案', color: 'purple' },
  { title: '竞品占位盲区', value: '73', sub: '目标缺失且竞品出现率 ≥40%', color: 'blue' },
  { title: '高优先级盲区', value: '21', sub: '建议优先补充内容', color: 'green' }
]

/** 盲区清单：盲区意图分布（横向条形，逐项配色） */
export const BLINDSPOT_INTENT_BARS: MockBarItem[] = [
  { name: '决策', value: 46, color: '#f76965' },
  { name: '甄选', value: 38, color: '#ffb248' },
  { name: '种草', value: 31, color: '#a871e3' },
  { name: '反馈', value: 27, color: '#3491fa' },
  { name: '认知', value: 18, color: '#20b8a6' }
]

export const BLINDSPOT_INTENT_TITLE = '盲区意图分布'
export const BLINDSPOT_INTENT_SUBTITLE = '各意图内问题级盲区数与盲区率'
export const BLINDSPOT_INTENT_BADGE = '126 个问题'
export const BLINDSPOT_INTENT_FOOTER =
  '每条比例的分母为该意图下可评估泛需求问题数，不是全部 420 个问题。'

/** 盲区清单：盲区信号（标签可重叠） */
export const BLINDSPOT_SIGNALS = [
  { title: '无任何品牌', value: '32', desc: '回答未出现同品类品牌' },
  { title: '竞品占位', value: '73', desc: '至少一竞品稳定出现' },
  { title: '多平台盲区', value: '48', desc: '≥3 平台均为零提及' },
  { title: '单平台盲区', value: '41', desc: '仅个别平台持续缺失' }
]

export const BLINDSPOT_SIGNAL_NOTICE =
  '盲区信号不是互斥构成。例如一个问题可同时属于“竞品占位”和“多平台盲区”，数量不应相加。'

/** 盲区清单：表格行 */
export interface BlindSpotRow {
  /** 泛需求问句 */
  question: string
  /** 问句编号 / 类型 / 有效答案数说明 */
  meta: string
  /** 意图与标签 */
  tags: string[]
  /** 目标品牌缺失（命中 / 总数） */
  missing: string
  /** 缺失率文案 */
  missRate: string
  /** 竞品占位；name 为空表示无稳定竞品 */
  competitors: Array<{ name: string; rate: string }>
  /** 覆盖平台 */
  platform: string
  /** 变化形态 */
  change: '新增' | '持续' | '扩大' | '纯空白'
  /** 优先级文案（含分值） */
  priority: string
  /** 优先级档位 */
  priorityLevel: 'high' | 'mid'
}

export const BLINDSPOT_ROWS: BlindSpotRow[] = [
  {
    question: '适合跨部门远程协作的工具有哪些？',
    meta: 'Q-000428 · 泛需求 · 12 条有效答案',
    tags: ['种草', '中小企业', '团队协作'],
    missing: '12 / 12',
    missRate: '缺失率 100%',
    competitors: [
      { name: '竞品 B', rate: '83%' },
      { name: '竞品 C', rate: '42%' }
    ],
    platform: '6 / 6',
    change: '新增',
    priority: '高 · 82',
    priorityLevel: 'high'
  },
  {
    question: '三千元预算内专业团队最终怎么选？',
    meta: 'Q-000184 · 泛需求 · 10 条有效答案',
    tags: ['决策', '专业用户', '高预算'],
    missing: '10 / 10',
    missRate: '缺失率 100%',
    competitors: [
      { name: '竞品 B', rate: '80%' },
      { name: '竞品 C', rate: '50%' }
    ],
    platform: '5 / 6',
    change: '持续',
    priority: '高 · 79',
    priorityLevel: 'high'
  },
  {
    question: '系统更换时如何减少历史数据迁移成本？',
    meta: 'Q-000231 · 泛需求 · 9 条有效答案',
    tags: ['甄选', '数据迁移'],
    missing: '9 / 9',
    missRate: '缺失率 100%',
    competitors: [
      { name: '竞品 C', rate: '67%' },
      { name: '竞品 D', rate: '33%' }
    ],
    platform: '4 / 6',
    change: '持续',
    priority: '高 · 75',
    priorityLevel: 'high'
  },
  {
    question: '华西地区小型团队有哪些本地服务方案？',
    meta: 'Q-000514 · 泛需求 · 8 条有效答案',
    tags: ['种草', '小型团队', '西南'],
    missing: '8 / 8',
    missRate: '缺失率 100%',
    competitors: [{ name: '竞品 D', rate: '63%' }],
    platform: '4 / 6',
    change: '扩大',
    priority: '中 · 64',
    priorityLevel: 'mid'
  },
  {
    question: '购买后如何获得数据导入和培训支持？',
    meta: 'Q-000392 · 泛需求 · 11 条有效答案',
    tags: ['反馈', '售后服务'],
    missing: '11 / 11',
    missRate: '缺失率 100%',
    competitors: [{ name: '', rate: '' }],
    platform: '5 / 6',
    change: '纯空白',
    priority: '中 · 56',
    priorityLevel: 'mid'
  }
]

/** 盲区分布：顶部 4 张指标卡（纯灰框） */
export const BLINDSPOT_DIST_METRICS: BlindSpotMetric[] = [
  { title: '最高盲区意图', value: '决策', sub: '问题盲区率 46%' },
  { title: '最高盲区平台', value: 'DeepSeek', sub: '平台问题盲区率 44%' },
  { title: '最高盲区需求', value: '数据迁移', sub: '问题盲区率 57%' },
  { title: '最高盲区地域场景', value: '西南', sub: '问题盲区率 44%' }
]

/** 盲区分布：AI 平台盲区 */
export const BLINDSPOT_AI_BARS: MockBarItem[] = [
  { name: 'DeepSeek', value: 44, color: '#f76965' },
  { name: '豆包', value: 39, color: '#ffb248' },
  { name: 'Kimi', value: 35, color: '#a871e3' },
  { name: '通义千问', value: 31, color: '#3491fa' },
  { name: '文心一言', value: 27, color: '#20b8a6' }
]

export const BLINDSPOT_AI_TITLE = 'AI 平台盲区'
export const BLINDSPOT_AI_SUBTITLE =
  '该平台全部有效轮次均未提及目标品牌的问题数 ÷ 该平台可评估泛需求问题数'
export const BLINDSPOT_AI_BADGE = '来源：运行日志'
export const BLINDSPOT_AI_FOOTER =
  '用户人群不从问询句推断。未接入真实用户标签时，不展示人群盲区率。'

/** 盲区分布：功能需求盲区 */
export const BLINDSPOT_FUNC_BARS: MockBarItem[] = [
  { name: '数据迁移', value: 57, color: '#f76965' },
  { name: '专业功能', value: 49, color: '#ffb248' },
  { name: '系统集成', value: 43, color: '#a871e3' },
  { name: '团队协作', value: 35, color: '#3491fa' },
  { name: '易用性', value: 16, color: '#20b8a6' }
]

export const BLINDSPOT_FUNC_TITLE = '功能需求盲区'
export const BLINDSPOT_FUNC_SUBTITLE = '可点击需求下钻到对应泛需求问询句'

/** 盲区分布：地域场景 × 意图盲区矩阵 */
export const BLINDSPOT_MATRIX_TITLE = '地域场景 × 意图盲区矩阵'
export const BLINDSPOT_MATRIX_SUBTITLE =
  '每格为题库地域场景和意图交集内的问题盲区率，不代表真实用户所在地；灰色表示问题样本不足'
export const BLINDSPOT_MATRIX_BADGE = '目标品牌 A'

export interface BlindSpotMatrixRow {
  region: string
  values: number[]
}

export const BLINDSPOT_MATRIX_COLS = ['认知', '种草', '甄选', '决策', '反馈']

export const BLINDSPOT_MATRIX_ROWS: BlindSpotMatrixRow[] = [
  { region: '华东', values: [18, 24, 32, 38, 26] },
  { region: '华南', values: [20, 28, 36, 42, 30] },
  { region: '华北', values: [23, 31, 39, 46, 33] },
  { region: '西南', values: [29, 42, 55, 62, 40] },
  { region: '西北', values: [26, 36, 47, 53, 38] }
]

/* ------------------------- 意图词库 ------------------------- */

/** 意图层级（左栏筛选项 + 属性设置下拉） */
export const INTENT_LAYERS: SelectOption[] = [
  { label: '认知层', value: 'cognition' },
  { label: '场景层', value: 'scene' },
  { label: '筛选层', value: 'filter' },
  { label: '决策层', value: 'decision' },
  { label: '反馈层', value: 'feedback' }
]

/** 左栏「全部」筛选项 */
export const INTENT_LAYER_ALL = { label: '总计', value: 'all' }

/** 关键词类型 */
export const MOCK_KEYWORD_TYPES = ['精准词', '长尾词'] as const

/** 竞争力档位 */
export const MOCK_COMPETITIVENESS = ['强', '中', '弱'] as const

/** 核心场景候选 */
export const MOCK_INTENT_SCENES = ['痤疮/毛囊炎', '网站建设', '数据迁移', '团队协作', '售后服务'] as const

/** 意图标签候选 */
export const MOCK_INTENT_TAGS = ['降低营销成本', '红神化裁', '品牌认知', '竞品对比'] as const

/** 意图词条目 */
export interface IntentWord {
  id: number
  /** 关键词 */
  keyword: string
  /** 意图层级（存 label，与下拉一致） */
  level: string
  /** 核心场景 */
  scene: string
  /** 意图标签 */
  tag: string
  /** 关键词类型 */
  type: string
  /** 竞争力 */
  competitiveness: string
  /** 关联询问句数量 */
  questionCount: number
  /** 启用状态 */
  status: boolean
}

/** 关联询问句条目 */
export interface IntentQuestion {
  id: number
  text: string
  status: boolean
}

/** 确定性生成：同一序号每次得到同一组取值，避免随机数导致刷新抖动 */
function generateIntentWords(count: number): IntentWord[] {
  return Array.from({ length: count }, (_, i) => {
    const seed = hashString(`intent-word-${i}`)
    const isDemo = i < 3
    return {
      id: i + 1,
      keyword: isDemo ? '红神化裁' : `示例关键词 ${i + 1}`,
      level: INTENT_LAYERS[i % INTENT_LAYERS.length].label,
      scene: isDemo ? '痤疮/毛囊炎' : pick(MOCK_INTENT_SCENES, seed),
      tag: isDemo ? '红神化裁' : pick(MOCK_INTENT_TAGS, seed >>> 4),
      type: isDemo ? '精准词' : pick(MOCK_KEYWORD_TYPES, seed >>> 8),
      competitiveness: isDemo ? '弱' : pick(MOCK_COMPETITIVENESS, seed >>> 12),
      questionCount: (seed % 50) + 1,
      status: (seed & 1) === 1
    }
  })
}

/** 意图词库主表数据 */
export const MOCK_INTENT_WORDS: IntentWord[] = generateIntentWords(195)

/** 关联询问句（弹窗内列表） */
export const MOCK_INTENT_QUESTIONS: IntentQuestion[] = Array.from({ length: 25 }, (_, i) => {
  const seed = hashString(`intent-question-${i}`)
  return {
    id: i + 1,
    text: i < 15 ? '网站建设哪家好' : `示例询问句 ${i + 1}`,
    status: (seed & 1) === 1
  }
})

/** AI 拓展结果批次（「换一批」循环取用） */
export const MOCK_AI_EXPAND_BATCHES: string[] = [
  '网站建设公司哪家靠谱？\n高端建站公司怎么选？\n品牌型企业官网定制服务公司推荐',
  '企业官网设计陈旧怎么改版？\n营销型网站建设哪家好？\n外贸独立站建设公司推荐',
  '中小企业建站预算多少合适？\n定制网站和模板建站怎么选？\n建站服务商需要提供哪些售后？'
]

/* ------------------------- 登录 ------------------------- */

/** 虚拟登录账号 */
export interface MockLoginUser {
  username: string
  password: string
  /** 登录后顶部头像旁显示的昵称 */
  nickname: string
}

/**
 * 虚拟登录数据：与原型 登录.html 的 VALID_USERNAME / VALID_PASSWORD 一致。
 * USE_MOCK = true 时按此表校验；false 时改走真实后端 /api/auth/login。
 */
export const MOCK_LOGIN_USERS: MockLoginUser[] = [
  { username: 'admin', password: '123456', nickname: '管理员' },
  { username: 'geo', password: '123456', nickname: 'GEO 运营' }
]

/* ------------------------- 项目列表 ------------------------- */

/**
 * 项目（登录后首页）的虚拟数据。
 *
 * 数据量较大，单独放在 ./project.ts；这里只做统一出口转出，
 * 页面仍按约定从 `@/mock` 或 `@/api/project` 取数。
 */
export { MOCK_PROJECTS, PROJECT_PACKAGES, computeServiceTime, generateProjectId } from './project'

/* ------------------------- 监测配置 ------------------------- */

/**
 * 监测配置（意图定义 / 词库资料）的虚拟数据。
 *
 * 同样因为数据量较大单独放在 ./config；
 * 其中 MOCK_INTENT_DEFINITIONS 可变，编辑保存会真实写回。
 */
export {
  MOCK_INTENT_DEFINITIONS,
  MOCK_LEXICON,
  INTENT_NAME_OPTIONS,
  LEXICON_IMPORT_EXTENSIONS,
  LEXICON_IMPORT_MAX_SIZE
} from './config'
export type { IntentDefinition, LexiconItem } from './config'

/* ------------------------- 舆情数据报告 ------------------------- */

/**
 * 舆情类型任务的数据报告（数据总览 / 媒体来源）虚拟数据。
 *
 * 数据量较大，单独放在 ./sentimentReport；由 ./flag 的 USE_SENTIMENT_MOCK 控制启停。
 */
export {
  SENTIMENT_REPORT_META,
  SENTIMENT_MODULES,
  SENTIMENT_OVERVIEW_DATA,
  MEDIA_SOURCE_DATA
} from './sentimentReport'
