import type { EChartsOption } from 'echarts'
import { CATEGORICAL, INK, CHROME } from './palette'

const tooltipBase = {
  backgroundColor: '#ffffff',
  borderColor: CHROME.gridline,
  borderWidth: 1,
  padding: [8, 12] as [number, number],
  textStyle: { color: INK.primary, fontSize: 12 },
  extraCssText: 'box-shadow:0 6px 16px rgba(0,0,0,0.08);border-radius:8px;'
}

export interface BarItem {
  name: string
  value: number
}

/** 横向条形图（排序型排名，单一序列，数值标于条端） */
export function buildBarOption(items: BarItem[], color: string = CATEGORICAL[2]): EChartsOption {
  const sorted = [...items].sort((a, b) => a.value - b.value)
  return {
    tooltip: { ...tooltipBase, trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: 8, right: 44, top: 8, bottom: 8, containLabel: true },
    xAxis: {
      type: 'value',
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: INK.muted, fontSize: 11 },
      splitLine: { lineStyle: { color: CHROME.gridline, width: 1 } }
    },
    yAxis: {
      type: 'category',
      data: sorted.map(d => d.name),
      axisLine: { lineStyle: { color: CHROME.axis, width: 1 } },
      axisTick: { show: false },
      axisLabel: { color: INK.secondary, fontSize: 12, width: 120, overflow: 'truncate' }
    },
    series: [
      {
        type: 'bar',
        data: sorted.map(d => d.value),
        barWidth: 14,
        itemStyle: { color, borderRadius: [0, 4, 4, 0] },
        label: { show: true, position: 'right', color: INK.secondary, fontSize: 11 }
      }
    ]
  }
}

/** 环形图（引用来源分布，<=6 段，超出折叠为「其他」） */
export function buildDonutOption(items: BarItem[]): EChartsOption {
  const MAX = 6
  let data = [...items].sort((a, b) => b.value - a.value)
  let others = 0
  if (data.length > MAX) {
    const rest = data.slice(MAX - 1)
    others = rest.reduce((s, d) => s + d.value, 0)
    data = data.slice(0, MAX - 1)
  }
  const mapped: Array<{ name: string; value: number; itemStyle: { color: string } }> = data.map(
    (d, i) => ({
      name: d.name,
      value: d.value,
      itemStyle: { color: CATEGORICAL[i % CATEGORICAL.length] }
    })
  )
  if (others > 0) {
    mapped.push({ name: '其他', value: others, itemStyle: { color: '#c3c2b7' } })
  }
  return {
    tooltip: { ...tooltipBase, trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: {
      bottom: 0,
      type: 'scroll',
      icon: 'circle',
      itemWidth: 8,
      itemHeight: 8,
      itemGap: 14,
      textStyle: { color: INK.secondary, fontSize: 12 }
    },
    series: [
      {
        type: 'pie',
        radius: ['54%', '74%'],
        center: ['50%', '42%'],
        avoidLabelOverlap: true,
        itemStyle: { borderColor: CHROME.surface, borderWidth: 2, borderRadius: 4 },
        label: { show: false },
        emphasis: { scaleSize: 4 },
        data: mapped
      }
    ]
  }
}

export interface TrendSeriesInput {
  name?: string
  data?: number[]
  color?: string
}

/** 趋势折线（单序列无图例；多序列按固定顺序着色并加图例） */
export function buildTrendOption(
  dates: string[],
  seriesList: TrendSeriesInput[],
  baseColor: string
): EChartsOption {
  const multi = seriesList.length > 1
  const series = seriesList.map((s, i) => {
    const color = s.color || (multi ? CATEGORICAL[i % CATEGORICAL.length] : baseColor)
    return {
      name: s.name || `系列 ${i + 1}`,
      type: 'line' as const,
      data: s.data ?? [],
      smooth: true,
      symbol: 'none' as const,
      lineStyle: { width: 2, color },
      itemStyle: { color },
      areaStyle: { opacity: 0.1, color }
    }
  })
  return {
    tooltip: { ...tooltipBase, trigger: 'axis' },
    ...(multi
      ? {
          legend: {
            top: 0,
            right: 0,
            icon: 'roundRect',
            itemWidth: 10,
            itemHeight: 4,
            textStyle: { color: INK.secondary, fontSize: 11 }
          }
        }
      : {}),
    grid: { left: 8, right: 16, top: multi ? 30 : 12, bottom: 8, containLabel: true },
    xAxis: {
      type: 'category',
      data: dates,
      boundaryGap: false,
      axisLine: { lineStyle: { color: CHROME.axis, width: 1 } },
      axisTick: { show: false },
      axisLabel: { color: INK.muted, fontSize: 10, hideOverlap: true }
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: INK.muted, fontSize: 10 },
      splitLine: { lineStyle: { color: CHROME.gridline, width: 1 } }
    },
    series
  }
}

/** 雷达图（品牌可见趋势，单一序列，自动按数据缩放） */
export function buildRadarOption(
  indicators: string[],
  values: number[],
  color: string = CATEGORICAL[2]
): EChartsOption {
  // 雷达图无数据时返回空配置，避免 ECharts radarLayout 崩溃（Cannot read properties of undefined 'push'）
  if (!indicators || indicators.length === 0) return {}
  return {
    tooltip: { ...tooltipBase },
    radar: {
      indicator: indicators.map(name => ({ name })),
      radius: '62%',
      center: ['50%', '54%'],
      splitNumber: 4,
      axisName: { color: INK.secondary, fontSize: 11 },
      axisLine: { lineStyle: { color: CHROME.gridline } },
      splitLine: { lineStyle: { color: CHROME.gridline } },
      splitArea: { show: false }
    },
    series: [
      {
        type: 'radar',
        symbolSize: 4,
        data: [
          {
            value: values,
            name: '实际数据',
            lineStyle: { color, width: 2 },
            itemStyle: { color },
            areaStyle: { color, opacity: 0.18 }
          }
        ]
      }
    ]
  }
}

export interface ColoredBarItem {
  name: string
  value: number
  color?: string
}

/** 横向条形（保留传入顺序，支持逐项配色，条端标 {value}%） */
export function buildHBarOption(items: ColoredBarItem[], max = 100): EChartsOption {
  const reversed = [...items].reverse()
  return {
    tooltip: { ...tooltipBase, trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { top: 6, left: 6, right: 48, bottom: 6, containLabel: true },
    xAxis: { type: 'value', show: false, max },
    yAxis: {
      type: 'category',
      data: reversed.map(d => d.name),
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: INK.secondary, fontSize: 11 }
    },
    series: [
      {
        type: 'bar',
        barWidth: 10,
        data: reversed.map(d => ({
          value: d.value,
          itemStyle: { color: d.color || CATEGORICAL[0], borderRadius: [0, 4, 4, 0] }
        })),
        label: { show: true, position: 'right', formatter: '{c}%', color: INK.secondary, fontSize: 11 }
      }
    ]
  }
}

export interface StackedSeriesInput {
  name: string
  data: number[]
  color: string
}

/** 横向堆叠条形（覆盖结构占比：首位 / TOP2-3 / 其他） */
export function buildStackedBarOption(
  categories: string[],
  seriesList: StackedSeriesInput[]
): EChartsOption {
  return {
    tooltip: { ...tooltipBase, trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: {
      bottom: 0,
      icon: 'circle',
      itemWidth: 8,
      itemHeight: 8,
      itemGap: 16,
      textStyle: { color: INK.secondary, fontSize: 12 }
    },
    grid: { top: 8, left: 6, right: 8, bottom: 34, containLabel: true },
    xAxis: { type: 'value', show: false },
    yAxis: {
      type: 'category',
      data: categories,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: INK.secondary, fontSize: 12 }
    },
    series: seriesList.map(s => ({
      name: s.name,
      type: 'bar' as const,
      stack: 'total',
      barWidth: 14,
      data: s.data,
      itemStyle: { color: s.color }
    }))
  }
}

export interface HeatmapCell {
  /** [xIndex, yIndex, value] */
  value: [number, number, number]
  /** 覆盖默认的格内文案（默认按 `{value}%` 展示） */
  text?: string
}

/** 热力图（格内默认标 {value}%，可用 cell.text 覆盖为文案档位） */
export function buildHeatmapOption(
  xData: string[],
  yData: string[],
  cells: HeatmapCell[]
): EChartsOption {
  return {
    tooltip: { ...tooltipBase, position: 'top' },
    grid: { top: 10, left: 6, right: 6, bottom: 6, containLabel: true },
    xAxis: {
      type: 'category',
      position: 'top',
      data: xData,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: INK.secondary, fontSize: 11 }
    },
    yAxis: {
      type: 'category',
      data: yData,
      inverse: true,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: INK.secondary, fontSize: 11 }
    },
    visualMap: {
      show: false,
      min: 0,
      max: 100,
      inRange: { color: ['#f2f6ff', '#c7d8fb', '#8fb0f4', '#5c85ee'] }
    },
    series: [
      {
        type: 'heatmap',
        data: cells.map(c =>
          c.text
            ? {
                value: c.value,
                label: { show: true, formatter: c.text, fontSize: 11, color: INK.primary }
              }
            : { value: c.value }
        ),
        label: { show: true, formatter: (p) => Math.round(p.value[2]) + '%', fontSize: 11, color: INK.primary },
        itemStyle: { borderColor: CHROME.surface, borderWidth: 2 },
        emphasis: { itemStyle: { shadowBlur: 6, shadowColor: 'rgba(0,0,0,0.18)' } }
      }
    ]
  }
}

/** 环形进度图（覆盖层级，中心显示百分比文字） */
export function buildRingOption(
  value: number,
  color: string,
  centerText: string
): EChartsOption {
  const v = Math.max(0, Math.min(100, value))
  return {
    tooltip: { ...tooltipBase, trigger: 'item', formatter: '{b}: {c}%' },
    title: {
      text: centerText,
      left: 'center',
      top: 'middle',
      textStyle: { fontSize: 16, fontWeight: 'bold', color: INK.primary }
    },
    series: [
      {
        type: 'pie',
        radius: ['66%', '86%'],
        center: ['50%', '50%'],
        silent: true,
        label: { show: false },
        labelLine: { show: false },
        data: [
          { value: v, name: '已覆盖', itemStyle: { color } },
          { value: 100 - v, name: '未覆盖', itemStyle: { color: '#f0f0f0' } }
        ]
      }
    ]
  }
}