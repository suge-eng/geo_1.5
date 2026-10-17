/**
 * 舆情数据报告的虚拟数据（数据总览 / 媒体来源）。
 *
 * 用途：舆情类型任务的数据报告尚在开发中，页面先用本文件的虚拟数据跑通展示。
 * 是否启用由 `@/mock/flag` 的 `USE_SENTIMENT_MOCK` 开关控制：
 *   true  → 页面使用本文件数据（脱离后端也能预览）
 *   false → 页面改走 `@/api/sentimentReport` 的真实接口
 *
 * 约定：页面所有涉及数据的地方都从本文件（或后端响应）取值，不做任何写死。
 */

import type {
  MediaSourceData,
  SentimentModuleKey,
  SentimentOverviewData
} from '@/types/sentimentReport'

/** 报告页头文案（拿不到任务详情时兜底） */
export const SENTIMENT_REPORT_META = {
  projectName: '【项目名称】',
  subtitle: '基于舆情监测数据更新：2026.10.13 15:29'
}

/** 舆情看板的两个模块（用于子 Tab） */
export const SENTIMENT_MODULES: ReadonlyArray<{ key: SentimentModuleKey; label: string }> = [
  { key: 'overview', label: '数据总览' },
  { key: 'media', label: '媒体来源' }
] as const

/* ------------------------- 模块一：数据总览 ------------------------- */

export const SENTIMENT_OVERVIEW_DATA: SentimentOverviewData = {
  kpis: [
    {
      label: '品牌相关答案',
      value: '958',
      sub: '2,480 条有效答案中出现品牌',
      accent: 'blue'
    },
    {
      label: '正向占比',
      value: '48.6%',
      trend: { text: '↑ 3.1pt 较上期', dir: 'up' },
      accent: 'green'
    },
    {
      label: '中性占比',
      value: '34.2%',
      sub: '事实描述与条件说明',
      accent: 'gray'
    },
    {
      label: '负向占比',
      value: '10.8%',
      trend: { text: '↓ 1.4pt 较上期', dir: 'down' },
      accent: 'red'
    }
  ],
  structure: {
    title: '整体舆情结构',
    total: '958 条',
    tip: '以“问题 × 平台 × 测试轮次”的有效答案为最小统计单元',
    segments: [
      { name: '正向', value: 48.6, color: '#10b981', label: '正向 48.6%' },
      { name: '中性', value: 34.2, color: '#9ca3af', label: '中性 34.2%' },
      { name: '负向', value: 10.8, color: '#ef4444' }
    ],
    legend: [
      { text: '认可、推荐、优势', color: '#10b981' },
      { text: '事实性描述', color: '#9ca3af' },
      { text: '批评、劣势、风险', color: '#ef4444' },
      { text: '正负并存', color: '#8b5cf6' }
    ]
  },
  platformTendency: {
    title: '各 AI 平台倾向差异',
    rows: [
      { name: '豆包', sample: 186, pos: '52%', neu: '33%', neg: '9%', mix: '6%', highlight: true },
      { name: 'DeepSeek', sample: 171, pos: '44%', neu: '37%', neg: '12%', mix: '7%' },
      { name: '通义千问', sample: 164, pos: '51%', neu: '34%', neg: '10%', mix: '5%' },
      { name: '文心一言', sample: 152, pos: '49%', neu: '35%', neg: '11%', mix: '5%' },
      { name: 'Kimi', sample: 145, pos: '46%', neu: '32%', neg: '13%', mix: '9%' },
      { name: 'ChatGPT', sample: 140, pos: '50%', neu: '34%', neg: '10%', mix: '6%' }
    ]
  },
  topics: {
    title: '品牌核心议题',
    tip: '议题可多标签，比例分母为 958 条品牌相关答案',
    items: [
      { name: '产品能力', value: 61, color: '#3b82f6' },
      { name: '价格价值', value: 44, color: '#10b981' },
      { name: '服务体验', value: 36, color: '#8b5cf6' },
      { name: '安全合规', value: 28, color: '#f59e0b' },
      { name: '企业经营', value: 19, color: '#06b6d4' },
      { name: '社会责任', value: 11, color: '#ef4444' }
    ]
  },
  riskSignals: {
    title: '风险信号',
    items: [
      { title: '负向答案', value: '103', sub: '其中高风险 18 条', accent: 'danger' },
      { title: '争议观点', value: '27', sub: '跨模型结论冲突', accent: 'normal' }
    ]
  },
  positiveOpinions: {
    title: '高频正向观点',
    tip: '语义聚类后按覆盖平台数与答案数排序',
    items: [
      { title: '上手门槛低', tag: '正向 91%', tagType: 'success', desc: '涉及 148 条答案', sub: 'ai总结话术' },
      { title: '团队协作能力完整', tag: '正向 86%', tagType: 'success', desc: '涉及 126 条答案', sub: '模型共识度较高，但企业权限管理的具体结论存在版本差异。' },
      { title: '中小团队性价比突出', tag: '正向 82%', tagType: 'success', desc: '涉及 103 条答案', sub: '在预算敏感和入门选择问题中更常出现。' },
      { title: '生态集成丰富', tag: '正向 76%', tagType: 'success', desc: '涉及 91 条答案', sub: '需要进一步核验部分第三方集成是否仍可用。' }
    ]
  },
  negativeOpinions: {
    title: '高频负向与争议观点',
    tip: '优先显示高频、高风险、跨平台扩散的观点簇',
    items: [
      { title: '高阶套餐价格偏高', tag: '负向 73%', tagType: 'danger', desc: '涉及 67 条答案', sub: '定价事实需匹配地区、版本和时间，19 条答案引用旧价格。' },
      { title: '专业场景能力不足', tag: '负向', tagType: 'danger', desc: '涉及 48 条答案', sub: '不同模型对能力边界的评价相反，缺少统一权威材料。' },
      { title: '客服响应速度不稳定', tag: '负向 69%', tagType: 'danger', desc: '涉及 39 条答案', sub: '主要来自用户反馈平台，需区分个案、时间段与产品版本。' },
      { title: '数据迁移成本较高', tag: '负向', tagType: 'danger', desc: '涉及 31 条答案', sub: '模型通常同时认可工具支持，但指出复杂历史系统实施成本。' }
    ]
  },
  matrix: {
    title: '议题 × 舆情倾向矩阵',
    tip: '观点可多标签统计，“覆盖”表示该议题出现于品牌相关答案的比例',
    rows: [
      { topic: '产品能力', cover: '61%', pos: '63%', neu: '23%', neg: '14%', negText: '高阶能力门槛较高' },
      { topic: '价格价值', cover: '44%', pos: '47%', neu: '27%', neg: '26%', negText: '需升级成本偏高' },
      { topic: '服务体验', cover: '36%', pos: '41%', neu: '31%', neg: '28%', negText: '复杂问题响应不稳定' },
      { topic: '安全合规', cover: '28%', pos: '38%', neu: '48%', neg: '14%', negText: '部分边界说明不充分' },
      { topic: '企业经营', cover: '19%', pos: '36%', neu: '54%', neg: '10%', negText: '旧版本信息被反复引用' },
      { topic: '社会责任', cover: '11%', pos: '31%', neu: '50%', neg: '19%', negText: '相关披露与案例偏少' }
    ]
  }
}

/* ------------------------- 模块二：媒体来源 ------------------------- */

export const MEDIA_SOURCE_DATA: MediaSourceData = {
  panorama: {
    title: '媒体类型全景',
    count: '8 类来源',
    tip: '媒体类型按“从哪来”划分，不按“是否权威”划分；同一域名只归入一个主类型',
    items: [
      { title: '① 品牌官方信源', desc: '一手事实，不代表独立于独立媒体。官网、新闻中心、公告、白皮书、帮助中心、开发者文档、认证账号。' },
      { title: '② 政务监管与公共机构', desc: '法规、处罚、许可、标准与公共事实。政府网站、市场监管、工信、网信、法院文书、公共数据平台。' },
      { title: '③ 央视与主流新闻媒体', desc: '公共议题和重大事件报道。新华社、人民日报、央视网、中国新闻网及各级党媒。' },
      { title: '④ 财经商业媒体', desc: '经营、资本、产业与商业分析。财新、第一财经、21世纪经济报道、经济观察报、中国经营报。' },
      { title: '⑤ 科技与行业垂直媒体', desc: '产品、技术、产业和评测。36氪、极客、钛媒体、雷锋网、极客公园及行业专业媒体。' },
      { title: '⑥ 研究与专业机构', desc: '方法论、评级、咨询与标准。行业协会、标准组织、学术机构、咨询公司、第三方机构报告。' },
      { title: '⑦ 门户与内容聚合平台', desc: '转载、聚合、编辑聚合与来源。腾讯新闻、网易新闻、新浪、搜狐、新闻聚合与转载站。' },
      { title: '⑧ 社交、社区与消费反馈', desc: '用户生成内容与线索，不等同于已核实事实。微博、微信、小红书、知乎、抖音、B站、论坛、应用商店、投诉和电商评价。' }
    ]
  },
  authority: {
    title: '品牌 A 相关权威媒体候选',
    tip: '原型示例：实际名单须按品牌所属行业、地域及本期引用动态生成',
    rows: [
      { source: '品牌 A 官网与公告', sub: '官方域名白名单', type: '官方 T0', score: 96, rel: '100%', cite: '214', fact: '产品、价格、政策、版本' },
      { source: '国家及行业主管部门', sub: '政府与监管域名', type: '公共 T0', score: 95, rel: '87%', cite: '38', fact: '许可、合规、处罚、标准' },
      { source: '新华社 / 人民日报 / 央视网', sub: '重大事件与公共议题', type: '央媒 T1', score: 92, rel: '78%', cite: '61', fact: '重大事件、公共事实' },
      { source: '财新 / 第一财经', sub: '财经商业报道', type: '财经 T1', score: 88, rel: '82%', cite: '49', fact: '经营、资本、产业' },
      { source: '行业协会 / 标准组织', sub: '需配置所属行业名单', type: '行业 T1', score: 90, rel: '91%', cite: '33', fact: '标准、资质、行业排名' },
      { source: '科技与垂直专业媒体', sub: '36氪、钛媒体、行业媒体等', type: '专业 T2', score: 78, rel: '86%', cite: '126', fact: '产品测评、技术与生态' },
      { source: '专业研究与咨询机构', sub: '以报告原文和方法透明度为准', type: '研究 T1/T2', score: 84, rel: '74%', cite: '52', fact: '市场规模、份额、趋势' }
    ]
  },
  rules: {
    title: '权威来源识别规则',
    tip: '支持域名白名单、机构实体库与人工复核',
    formulas: [
      '权威分 = 机构公信力 30% + 一手性 25% + 专业匹配度 15% + 内容质量 10% + 可追溯性 10% + 时效性 10%',
      '品牌相关性 = 品牌主体命中 40% + 业务/产品命中 25% + 行业匹配 15% + 地域匹配 10% + 时间匹配 10%',
      '权威来源覆盖率 = 含 T0/T1 有效引用的品牌相关答案数 ÷ 含有效引用的品牌相关答案数'
    ],
    note: '转载内容必须回溯首发；同一文章多 URL 按内容指纹去重；仅有域名权威但正文与品牌无关，不计品牌权威来源。'
  },
  sourceRatio: {
    title: '来源类型引用占比',
    items: [
      { name: '官方信源', value: 28.7, color: '#3b82f6' },
      { name: '科技行业媒体', value: 23.6, color: '#10b981' },
      { name: '主流新闻媒体', value: 14.8, color: '#8b5cf6' },
      { name: '财经商业媒体', value: 12.4, color: '#f59e0b' },
      { name: '社交社区反馈', value: 11.9, color: '#ef4444' },
      { name: '研究/监管...', value: 8.6, color: '#06b6d4' }
    ]
  },
  riskEvents: {
    title: '风险事件监测台',
    tip: '同一主体、议题、事实发生时间接近的负向观点会聚合为一个事件',
    rows: [
      { event: '旧版本价格被当作当前价格', level: '高 86', levelType: 'danger', platform: '19', source: '5/6', mainSource: '历史评测、聚合页', status: '口径不一致', statusType: 'danger', suggestion: '更新价格结构化数据' },
      { event: '专业能力边界被错误描述', level: '高 82', levelType: 'danger', platform: '14', source: '4/6', mainSource: '科技媒体、问答社区', status: '待跟踪', statusType: 'warning', suggestion: '发布能力边界说明' },
      { event: '客服响应慢部分功能细化', level: '高 80', levelType: 'danger', platform: '12', source: '3/6', mainSource: '投诉平台、社交内容', status: '待跟踪', statusType: 'warning', suggestion: '补充服务 SLA 证据' },
      { event: '数据存储地域说明不清', level: '中 68', levelType: 'warning', platform: '9', source: '3/6', mainSource: '论坛、旧版文档', status: '待纠正', statusType: 'warning', suggestion: '更新合规 FAQ' },
      { event: '第三方接口下线信息仍被引用', level: '中 61', levelType: 'warning', platform: '7', source: '2/6', mainSource: '开发者社区', status: '已定位来源', statusType: 'success', suggestion: '维护开发者文档' }
    ]
  }
}
