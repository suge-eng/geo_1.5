/**
 * 图表调色板（品牌主题 · 亮色面）
 *
 * 分类色采用固定顺序、不循环，已通过 dataviz 校验：
 * 相邻对 CVD / 正常视觉 Delta E 均达标，品牌主色蓝位于槽位 3。
 * 文字永不使用数据色——文字始终使用 INK 墨色 token。
 */
export const CATEGORICAL = [
  '#2a78d6', // 1 蓝
  '#eb6834', // 2 橙
  '#3662ec', // 3 蓝（品牌）
  '#eda100', // 4 黄
  '#e87ba4', // 5 品红
  '#008300', // 6 绿
  '#4a3aa7', // 7 紫
  '#e34948' // 8 红
] as const

/** 品牌主色（单一序列 / 强调色） */
export const BRAND = '#3662ec'

/** 图表墨色 */
export const INK = {
  primary: '#1f2329',
  secondary: '#4b5563',
  muted: '#9aa1aa'
} as const

/** 图表 chrome（面 / 网格线 / 轴线） */
export const CHROME = {
  surface: '#ffffff',
  gridline: '#eef0f4',
  axis: '#d0d5dd'
} as const

/** 状态色（固定语义，不复用为序列色） */
export const STATUS = {
  good: '#0ca30c',
  critical: '#d03b3b'
} as const
