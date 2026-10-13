<template>
  <div class="blindspot-page">
    <!-- 头部及标签切换 -->
    <div class="header">
      <h1>{{ BLINDSPOT_PAGE.title }}</h1>
      <div class="desc">
        {{ BLINDSPOT_PAGE.desc }}<a @click="onDetail">详情</a>
      </div>
      <div class="tabs">
        <div
          v-for="t in VIEWS"
          :key="t.key"
          class="tab"
          :class="{ active: activeView === t.key }"
          @click="switchView(t.key)"
        >
          {{ t.label }}
        </div>
      </div>
    </div>

    <!-- ================= 视图1: 盲区清单 ================= -->
    <div
      v-if="activeView === 'list'"
      class="view-section"
    >
      <template v-if="USE_MOCK">
        <!-- 1. 顶部指标卡片 -->
        <div class="metrics-grid">
          <div
            v-for="item in BLINDSPOT_LIST_METRICS"
            :key="item.title"
            class="metric-card"
            :class="item.color"
          >
            <div class="metric-title">
              {{ item.title }}
            </div>
            <div class="metric-value">
              {{ item.value }}
            </div>
            <div class="metric-sub">
              {{ item.sub }}
            </div>
          </div>
        </div>

        <!-- 2. 中间区域 -->
        <div class="middle-section">
          <div class="card chart-section">
            <div class="card-header">
              <div class="card-title-wrap">
                <div class="card-title">
                  {{ BLINDSPOT_INTENT_TITLE }}
                </div>
                <div class="card-subtitle">
                  {{ BLINDSPOT_INTENT_SUBTITLE }}
                </div>
              </div>
              <span class="intent-badge">{{ BLINDSPOT_INTENT_BADGE }}</span>
            </div>
            <div class="chart-list">
              <div
                v-for="item in BLINDSPOT_INTENT_BARS"
                :key="item.name"
                class="chart-row"
              >
                <div class="chart-label">
                  {{ item.name }}
                </div>
                <div class="chart-bar-container">
                  <div
                    class="chart-bar"
                    :style="{ width: item.value + '%', backgroundColor: item.color }"
                  />
                </div>
                <div class="chart-value">
                  {{ item.value }}%
                </div>
              </div>
            </div>
            <div class="chart-footer">
              {{ BLINDSPOT_INTENT_FOOTER }}
            </div>
          </div>

          <div class="card signal-section">
            <div class="card-header signal-header">
              <div class="card-title-wrap">
                <div class="card-title">
                  盲区信号
                </div>
                <div class="card-subtitle">
                  标签可以重叠，用于判断缺失形态
                </div>
              </div>
            </div>
            <div class="signal-grid">
              <div
                v-for="item in BLINDSPOT_SIGNALS"
                :key="item.title"
                class="signal-card"
              >
                <div class="signal-title">
                  {{ item.title }}
                </div>
                <div class="signal-value">
                  {{ item.value }}
                </div>
                <div class="signal-desc">
                  {{ item.desc }}
                </div>
              </div>
            </div>
            <div class="signal-notice">
              {{ BLINDSPOT_SIGNAL_NOTICE }}
            </div>
          </div>
        </div>

        <!-- 3. 底部表格 -->
        <div class="table-section">
          <div class="card-title table-title">
            泛需求盲区问题清单
          </div>
          <table class="data-table">
            <thead>
              <tr>
                <th style="width: 25%;">
                  泛需求问句
                </th>
                <th style="width: 20%;">
                  意图与标签
                </th>
                <th style="width: 15%;">
                  目标品牌缺失
                </th>
                <th style="width: 15%;">
                  竞品占位
                </th>
                <th style="width: 10%;">
                  覆盖平台
                </th>
                <th style="width: 8%;">
                  变化
                </th>
                <th style="width: 7%;">
                  优先级
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="row in BLINDSPOT_ROWS"
                :key="row.meta"
              >
                <td>
                  <div class="cell-question">
                    {{ row.question }}
                  </div>
                  <div class="sub-text">
                    {{ row.meta }}
                  </div>
                </td>
                <td>
                  <span
                    v-for="tag in row.tags"
                    :key="tag"
                    class="tag"
                  >{{ tag }}</span>
                </td>
                <td>
                  <div class="cell-missing">
                    {{ row.missing }}
                  </div>
                  <div class="sub-text text-red">
                    {{ row.missRate }}
                  </div>
                </td>
                <td>
                  <div class="brand-info">
                    <div
                      v-for="(c, i) in row.competitors"
                      :key="i"
                      :class="{ 'text-gray': !c.name }"
                    >
                      {{ c.name ? `${c.name} ${c.rate}` : '无稳定竞品' }}
                    </div>
                  </div>
                </td>
                <td>{{ row.platform }}</td>
                <td>
                  <span
                    class="badge"
                    :class="CHANGE_CLASS[row.change]"
                  >{{ row.change }}</span>
                </td>
                <td>
                  <span
                    class="badge"
                    :class="row.priorityLevel"
                  >{{ row.priority }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>

      <el-empty
        v-else
        description="接口待接入"
      />
    </div>

    <!-- ================= 视图2: 盲区分布 ================= -->
    <div
      v-else
      class="view-section"
    >
      <template v-if="USE_MOCK">
        <!-- 1. 顶部指标卡片 -->
        <div class="metrics-grid-dist">
          <div
            v-for="item in BLINDSPOT_DIST_METRICS"
            :key="item.title"
            class="metric-card"
          >
            <div class="metric-title">
              {{ item.title }}
            </div>
            <div class="metric-value">
              {{ item.value }}
            </div>
            <div class="metric-sub">
              {{ item.sub }}
            </div>
          </div>
        </div>

        <!-- 2. 双图表区域 -->
        <div class="charts-section">
          <div class="card">
            <div class="card-header">
              <div class="card-title-wrap">
                <div class="card-title">
                  {{ BLINDSPOT_AI_TITLE }}
                </div>
                <div class="card-subtitle">
                  {{ BLINDSPOT_AI_SUBTITLE }}
                </div>
              </div>
              <span class="badge-log">{{ BLINDSPOT_AI_BADGE }}</span>
            </div>
            <div class="chart-list">
              <div
                v-for="item in BLINDSPOT_AI_BARS"
                :key="item.name"
                class="chart-row"
              >
                <div class="chart-label">
                  {{ item.name }}
                </div>
                <div class="chart-bar-container">
                  <div
                    class="chart-bar"
                    :style="{ width: item.value + '%', backgroundColor: item.color }"
                  />
                </div>
                <div class="chart-value">
                  {{ item.value }}%
                </div>
              </div>
            </div>
            <div class="chart-footer">
              {{ BLINDSPOT_AI_FOOTER }}
            </div>
          </div>

          <div class="card">
            <div class="card-header func-header">
              <div class="card-title-wrap">
                <div class="card-title">
                  {{ BLINDSPOT_FUNC_TITLE }}
                </div>
                <div class="card-subtitle">
                  {{ BLINDSPOT_FUNC_SUBTITLE }}
                </div>
              </div>
            </div>
            <div class="chart-list">
              <div
                v-for="item in BLINDSPOT_FUNC_BARS"
                :key="item.name"
                class="chart-row"
              >
                <div class="chart-label">
                  {{ item.name }}
                </div>
                <div class="chart-bar-container">
                  <div
                    class="chart-bar"
                    :style="{ width: item.value + '%', backgroundColor: item.color }"
                  />
                </div>
                <div class="chart-value">
                  {{ item.value }}%
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 3. 底部矩阵 -->
        <div class="matrix-section">
          <div class="card-header matrix-header">
            <div class="card-title-wrap">
              <div class="card-title">
                {{ BLINDSPOT_MATRIX_TITLE }}
              </div>
              <div class="card-subtitle">
                {{ BLINDSPOT_MATRIX_SUBTITLE }}
              </div>
            </div>
            <span class="badge-log">{{ BLINDSPOT_MATRIX_BADGE }}</span>
          </div>
          <table class="matrix-table">
            <thead>
              <tr>
                <th />
                <th
                  v-for="col in BLINDSPOT_MATRIX_COLS"
                  :key="col"
                >
                  {{ col }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="row in BLINDSPOT_MATRIX_ROWS"
                :key="row.region"
              >
                <td class="matrix-label">
                  {{ row.region }}
                </td>
                <td
                  v-for="(val, i) in row.values"
                  :key="i"
                >
                  <div
                    class="matrix-cell"
                    :class="cellClass(val)"
                    :style="{ backgroundColor: cellStyle(val) }"
                  >
                    {{ val }}%
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>

      <el-empty
        v-else
        description="接口待接入"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  BLINDSPOT_AI_BADGE,
  BLINDSPOT_AI_BARS,
  BLINDSPOT_AI_FOOTER,
  BLINDSPOT_AI_SUBTITLE,
  BLINDSPOT_AI_TITLE,
  BLINDSPOT_DIST_METRICS,
  BLINDSPOT_FUNC_BARS,
  BLINDSPOT_FUNC_SUBTITLE,
  BLINDSPOT_FUNC_TITLE,
  BLINDSPOT_INTENT_BADGE,
  BLINDSPOT_INTENT_BARS,
  BLINDSPOT_INTENT_FOOTER,
  BLINDSPOT_INTENT_SUBTITLE,
  BLINDSPOT_INTENT_TITLE,
  BLINDSPOT_LIST_METRICS,
  BLINDSPOT_MATRIX_BADGE,
  BLINDSPOT_MATRIX_COLS,
  BLINDSPOT_MATRIX_ROWS,
  BLINDSPOT_MATRIX_SUBTITLE,
  BLINDSPOT_MATRIX_TITLE,
  BLINDSPOT_PAGE,
  BLINDSPOT_ROWS,
  BLINDSPOT_SIGNAL_NOTICE,
  BLINDSPOT_SIGNALS
} from '@/mock'
import { USE_MOCK } from '@/mock/flag'

type ViewKey = 'list' | 'distribution'

const VIEWS: Array<{ key: ViewKey; label: string }> = [
  { key: 'list', label: '盲区清单' },
  { key: 'distribution', label: '盲区分布' }
]

const CHANGE_CLASS: Record<string, string> = {
  新增: 'new',
  持续: 'continue',
  扩大: 'expand',
  纯空白: 'blank'
}

const route = useRoute()
const router = useRouter()

function normalizeView(value: unknown): ViewKey {
  return value === 'distribution' ? 'distribution' : 'list'
}

const activeView = ref<ViewKey>(normalizeView(route.query.view))

/** 视图切换写进 query，刷新/分享后仍停留原视图 */
function switchView(key: ViewKey) {
  if (key === activeView.value) return
  router.push({ path: route.path, query: { ...route.query, view: key } })
}

watch(
  () => route.query.view,
  v => {
    activeView.value = normalizeView(v)
  }
)

function onDetail() {
  // TODO: 说明页就绪后再跳转盲区口径详情
  ElMessage.info('盲区口径说明页待提供')
}

/** 矩阵单元格配色：离散蓝色阶梯，越高越深 */
function cellStyle(value: number): string {
  if (value < 20) return '#e0e7ff'
  if (value < 30) return '#c7d2fe'
  if (value < 40) return '#a5b4fc'
  if (value < 50) return '#818cf8'
  if (value < 60) return '#6366f1'
  return '#4f46e5'
}

function cellClass(value: number): string {
  return value < 50 ? 'cell-light' : 'cell-dark'
}
</script>

<style scoped lang="scss">
/* 配色与尺寸对齐原型 盲区分析.html */
.blindspot-page {
  --bs-card-bg: #ffffff;
  --bs-border: #e0e4e8;
  --bs-text-main: #1d2129;
  --bs-text-secondary: #4e5969;
  --bs-text-light: #86909c;
  --bs-red: #f53f3f;
  --bs-orange: #ff9a2e;
  --bs-purple: #8a2be2;
  --bs-blue: #3491fa;
  --bs-green: #20b8a6;

  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
  color: var(--bs-text-main);
  font-size: 14px;

  /* ----- 头部区域 & 切换Tabs ----- */
  .header {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 8px;

    h1 {
      font-size: 24px;
      font-weight: 600;
      color: #0e1119;
      margin: 0;
    }

    .desc {
      color: var(--bs-text-secondary);
      font-size: 13px;

      a {
        color: var(--bs-blue);
        text-decoration: none;
        margin-left: 4px;
        cursor: pointer;

        &:hover {
          text-decoration: underline;
        }
      }
    }
  }

  .tabs {
    display: flex;
    gap: 12px;
    margin-top: 16px;
  }

  .tab {
    padding: 8px 20px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    border: 1px solid var(--bs-border);
    background: #fff;
    color: var(--bs-text-main);
    transition: all 0.2s;
    user-select: none;

    &.active {
      background: #3b72fa;
      color: #fff;
      border-color: #3b72fa;
    }
  }

  /* ----- 卡片通用样式 ----- */
  .card {
    background: var(--bs-card-bg);
    border: 1px solid var(--bs-border);
    border-radius: 8px;
    padding: 20px;
  }

  .card-header {
    margin-bottom: 16px;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }

  .card-title-wrap {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .card-title {
    font-size: 15px;
    font-weight: 600;
    color: var(--bs-text-main);
  }

  .card-subtitle {
    font-size: 12px;
    color: var(--bs-text-light);
  }

  .badge-log {
    font-size: 12px;
    color: var(--bs-text-light);
    border: 1px solid var(--bs-border);
    padding: 2px 10px;
    border-radius: 12px;
    white-space: nowrap;
  }

  .intent-badge {
    font-size: 12px;
    color: #3491fa;
    background: #e8f3ff;
    padding: 2px 8px;
    border-radius: 12px;
    white-space: nowrap;
  }

  /* ----- 1. 顶部指标卡片 ----- */
  .metrics-grid {
    display: grid;
    gap: 16px;
    grid-template-columns: repeat(5, 1fr);
  }

  .metrics-grid-dist {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
  }

  .metric-card {
    background: var(--bs-card-bg);
    border: 1px solid var(--bs-border);
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .metric-title {
    font-size: 13px;
  }

  .metric-value {
    font-weight: 700;
    line-height: 1;
    color: var(--bs-text-main);
  }

  .metric-sub {
    font-size: 12px;
    color: var(--bs-text-light);
  }

  /* 盲区清单页：5 个，左侧彩条 */
  .metrics-grid .metric-card {
    padding: 16px 20px;
    border-left: 4px solid transparent;

    &.red {
      border-left-color: var(--bs-red);
    }

    &.orange {
      border-left-color: var(--bs-orange);
    }

    &.purple {
      border-left-color: var(--bs-purple);
    }

    &.blue {
      border-left-color: var(--bs-blue);
    }

    &.green {
      border-left-color: var(--bs-green);

      .metric-sub {
        color: var(--bs-green);
      }
    }
  }

  .metrics-grid .metric-title {
    color: var(--bs-text-secondary);
  }

  .metrics-grid .metric-value {
    font-size: 32px;
  }

  /* 盲区分布页：4 个，纯灰框 */
  .metrics-grid-dist .metric-card {
    padding: 20px;
    gap: 12px;
  }

  .metrics-grid-dist .metric-title {
    color: var(--bs-text-light);
  }

  .metrics-grid-dist .metric-value {
    font-size: 28px;
  }

  .metrics-grid-dist .metric-sub {
    font-size: 13px;
  }

  /* ----- 2. 中间区域 (图表 + 信号) ----- */
  .middle-section {
    display: flex;
    gap: 16px;
  }

  .chart-section {
    flex: 6;
    min-width: 0;
  }

  .signal-section {
    flex: 4;
    min-width: 0;
  }

  /* 水平条形图通用样式 */
  .chart-row {
    display: flex;
    align-items: center;
    margin-bottom: 20px;
    font-size: 13px;
  }

  .chart-label {
    color: var(--bs-text-main);
    width: 50px;
  }

  .chart-bar-container {
    flex: 1;
    height: 8px;
    background: #f2f3f5;
    border-radius: 4px;
    margin: 0 16px;
    overflow: hidden;
  }

  .chart-bar {
    height: 100%;
    border-radius: 4px;
  }

  .chart-value {
    text-align: right;
    font-weight: 600;
    color: var(--bs-text-main);
    width: 40px;
  }

  .chart-footer {
    font-size: 12px;
    color: var(--bs-text-light);
    margin-top: 24px;
  }

  /* ----- 4. 双图表区域 (分布页，标签列更宽) ----- */
  .charts-section {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;

    .chart-label {
      width: 80px;
      font-size: 14px;
    }

    .chart-value {
      width: 40px;
      font-size: 14px;
    }
  }

  .func-header {
    margin-bottom: 24px;
  }

  /* 信号卡片 */
  .signal-header {
    margin-bottom: 0;
  }

  .signal-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin-top: 16px;
  }

  .signal-card {
    background: #fcfcfd;
    border: 1px solid var(--bs-border);
    border-radius: 6px;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .signal-title {
    font-size: 13px;
    color: var(--bs-text-secondary);
  }

  .signal-value {
    font-size: 24px;
    font-weight: 700;
    color: var(--bs-text-main);
  }

  .signal-desc {
    font-size: 12px;
    color: var(--bs-text-light);
  }

  .signal-notice {
    margin-top: 16px;
    background: #edf2ff;
    color: #61708b;
    font-size: 12px;
    padding: 10px 14px;
    border-radius: 6px;
    line-height: 1.6;
  }

  /* ----- 3. 底部表格区域 (清单页) ----- */
  .table-section {
    background: var(--bs-card-bg);
    border: 1px solid var(--bs-border);
    border-radius: 8px;
    padding: 20px;
    overflow-x: auto;
  }

  .table-title {
    margin-bottom: 20px;
  }

  .data-table {
    width: 100%;
    border-collapse: collapse;
    text-align: left;
    font-size: 13px;
    min-width: 1000px;

    th,
    td {
      padding: 16px 12px;
      border-bottom: 1px solid var(--bs-border);
      vertical-align: middle;
    }

    th {
      color: var(--bs-text-light);
      font-weight: 500;
      padding-top: 0;
    }

    tbody tr:first-child td {
      background-color: #fff9f9;
    }
  }

  .cell-question {
    font-weight: 500;
    margin-bottom: 6px;
    color: #1d2129;
  }

  .cell-missing {
    font-weight: 600;
  }

  .sub-text {
    font-size: 12px;
    color: var(--bs-text-light);
    margin-top: 4px;
  }

  .text-red {
    color: var(--bs-red);
  }

  .text-gray {
    color: var(--bs-text-light);
  }

  .brand-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .tag {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 4px;
    background: #f2f3f5;
    color: var(--bs-text-secondary);
    font-size: 12px;
    margin-right: 6px;
    margin-bottom: 4px;
  }

  .badge {
    display: inline-block;
    padding: 4px 10px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 500;
    text-align: center;

    &.new {
      background: #ffece8;
      color: var(--bs-red);
    }

    &.continue {
      background: #f2f3f5;
      color: var(--bs-text-secondary);
    }

    &.expand {
      background: #fff7e8;
      color: var(--bs-orange);
    }

    &.blank {
      background: #f5e8ff;
      color: var(--bs-purple);
    }

    &.high {
      background: #fff7e8;
      color: var(--bs-orange);
    }

    &.mid {
      background: #f2f3f5;
      color: var(--bs-text-secondary);
    }
  }

  /* ----- 5. 底部矩阵区域 (分布页) ----- */
  .matrix-section {
    background: var(--bs-card-bg);
    border: 1px solid var(--bs-border);
    border-radius: 8px;
    padding: 20px;
    overflow-x: auto;
  }

  .matrix-header {
    margin-bottom: 20px;
  }

  .matrix-table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 8px;
    text-align: center;

    th {
      font-size: 13px;
      font-weight: 500;
      color: var(--bs-text-light);
      padding: 10px 0;
    }

    td {
      padding: 0;
    }
  }

  .matrix-label {
    font-size: 13px;
    color: var(--bs-text-main);
    text-align: left;
    padding-left: 20px;
    width: 80px;
    background: #f7f8fa;
    height: 40px;
    border-radius: 4px;
  }

  .matrix-cell {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 44px;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 500;
    transition: transform 0.1s;

    &:hover {
      transform: scale(1.02);
    }

    &.cell-light {
      color: var(--bs-text-main);
    }

    &.cell-dark {
      color: #ffffff;
    }
  }

  /* 视图容器 */
  .view-section {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
}
</style>
