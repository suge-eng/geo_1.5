<template>
  <div class="task-detail">
    <div class="page-container">
      <!-- 统一后的 Header -->
      <div class="page-header">
        <div class="header-left">
          <h1 class="header-title">
            <span class="project-name">【{{ projectName }}】</span>
            <span class="header-subtitle">{{ subtitle }}</span>
          </h1>
        </div>
        <div class="header-right">
          <el-button type="primary" :loading="backendStatus === 'loading'" @click="generateReport">
            {{ backendStatus === 'ready' ? '重新生成' : '生成报告' }}
          </el-button>
          <span class="header-link" @click="openHistory">
            历史报告
            <el-icon class="caret-icon"><ArrowDown /></el-icon>
          </span>
          <div class="close-btn" @click="goBack">
            关闭
          </div>
        </div>
      </div>

      <!-- 统一后的 Tab 栏 -->
      <nav class="tab-bar">
        <div class="tab-item active">数据报告</div>
        <div class="tab-item" @click="goDetail">监测详情</div>
      </nav>

      <!-- 子 Tab 栏 -->
      <nav class="sub-tab-bar">
        <div
          v-for="m in REPORT_MODULES"
          :key="m.key"
          class="sub-tab-item"
          :class="{ active: activeModule === m.key }"
          @click="switchModule(m.key)"
        >
          {{ m.label }}
        </div>
      </nav>

      <main class="main-content">
        <!-- 未生成报告：点击按钮生成 -->
        <section v-if="!USE_MOCK && backendStatus === 'idle'" class="card backend-placeholder">
          <el-empty description="暂无数据报告，点击下方按钮生成">
            <el-button type="primary" :loading="false" @click="generateReport">生成报告</el-button>
          </el-empty>
        </section>

        <!-- 加载中：后端报告尚未返回 -->
        <section v-else-if="!USE_MOCK && backendStatus === 'loading'" class="card backend-placeholder">
          <el-empty description="正在生成报告，请稍候…" />
        </section>

        <!-- 错误：后端报告获取失败 -->
        <section v-else-if="!USE_MOCK && backendStatus === 'error'" class="card backend-placeholder">
          <el-empty :description="backendErrorMsg || '报告生成失败'">
            <el-button type="primary" @click="generateReport">重试</el-button>
          </el-empty>
        </section>

        <!-- 一、数据总览 -->
        <template v-else-if="activeModule === 'overview'">
          <section class="kpi-grid">
            <div v-for="k in overview.kpis" :key="k.label" class="kpi-card">
              <div class="kpi-title">
                <span>{{ k.label }}</span>
                <span class="info-icon" @click.stop="toggleTooltip('ov-' + k.label)">?</span>
                <transition name="fade-slide">
                  <div v-show="activeTooltip === 'ov-' + k.label" class="kpi-tooltip">{{ getFormula(k.label) }}</div>
                </transition>
              </div>
              <div class="kpi-value">{{ k.value }}</div>
            </div>
          </section>

          <section class="row-2">
            <div class="card">
              <div class="card-title">{{ overview.radar.title }}</div>
              <BaseChart :option="overviewRadarOption" height="300px" />
            </div>
            <div class="card">
              <div class="card-title">{{ overview.platformCoverage.title }}</div>
              <BaseChart :option="overviewCoverageOption" height="300px" />
            </div>
          </section>

          <section class="card">
            <div class="card-title">{{ overview.intentHeatmap.title }}</div>
            <div class="table-scroll">
              <table class="heat-table">
                <thead><tr><th class="heat-row-head"></th><th v-for="c in overview.intentHeatmap.cols" :key="c">{{ c }}</th></tr></thead>
                <tbody>
                  <tr v-for="(r, ri) in overview.intentHeatmap.rows" :key="ri">
                    <td class="heat-row-head">{{ r.name }}</td>
                    <td v-for="(v, ci) in r.values" :key="ci" class="bar-cell">
                      <div class="progress-bg">
                        <div class="progress-bar" :style="{ background: getHeatStyle(v).background }" />
                        <span class="progress-text">{{ v }}%</span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section class="row-2">
            <div class="card">
              <div class="card-title">{{ overview.gapList.title }}</div>
              <div class="table-scroll">
                <table class="data-table">
                  <thead><tr><th>意图标签</th><th>覆盖层级</th><th>品牌/竞品覆盖</th><th>优先级</th></tr></thead>
                  <tbody>
                    <tr v-for="(g, i) in overview.gapList.rows" :key="i">
                      <td class="td-wrap">{{ g.query }}</td><td>{{ g.stage }}</td><td>{{ g.coverage }}</td>
                      <td><span class="td-badge" :class="g.priority === '高' ? 'badge-high' : 'badge-mid'">{{ g.priority }}</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div class="card">
              <div class="card-title">{{ overview.sourceStructure.title }}</div>
              <BaseChart :option="overviewSourceOption" height="300px" />
            </div>
          </section>
        </template>

        <!-- 二、模型对比 -->
        <template v-else-if="activeModule === 'model'">
          <section class="top-cards">
            <div v-for="c in modelTopCards" :key="c.title" class="card">
              <div class="card-sub">{{ c.title }}</div>
              <div class="card-value">{{ c.value }}</div>
              <div class="card-desc">{{ c.desc }}</div>
            </div>
          </section>

          <section class="row-2">
            <div class="card">
              <div class="card-title">各平台核心指标<span class="card-hint">模拟对话数据，模拟各平台核心指标情况</span></div>
              <table class="data-table">
                <thead><tr><th>AI平台</th><th>出现率</th><th>首位率</th><th>TOP3</th><th>平均排名</th><th>准确率</th></tr></thead>
                <tbody>
                  <tr v-for="p in model.platformTable" :key="p.name"><td>{{ p.name }}</td><td>{{ p.coverRate }}%</td><td>{{ p.firstRate }}%</td><td>{{ p.top3Rate }}%</td><td>{{ p.avgRank }}</td><td>{{ p.accuracy }}%</td></tr>
                </tbody>
              </table>
            </div>
            <div class="card">
              <div class="card-title">{{ model.structure.title }}<span class="card-hint">各平台不同位置出现的答案占比</span></div>
              <BaseChart :option="modelStructureOption" height="330px" />
            </div>
          </section>

          <section class="card">
            <div class="card-title">{{ model.heatmap.title }}<span class="card-hint">各平台对话场景、知识、事实、多轮交互等层级中的痛点点击率</span></div>
            <BaseChart :option="modelHeatmapOption" height="260px" />
          </section>
        </template>

        <!-- 三、场景覆盖 -->
        <template v-else-if="activeModule === 'scenario'">
          <section class="kpi-row">
            <div v-for="k in scenario.kpis" :key="k.label" class="kpi-plain">
              <div class="kpi-plain-label">
                <span>{{ k.label }}</span>
                <span class="info-icon" @click.stop="toggleTooltip('sc-' + k.label)">?</span>
                <transition name="fade-slide"><div v-show="activeTooltip === 'sc-' + k.label" class="kpi-tooltip">{{ getFormula(k.label) }}</div></transition>
              </div>
              <div class="kpi-plain-value">{{ k.value }}</div>
              <div class="kpi-plain-desc">{{ k.desc }}</div>
            </div>
          </section>

          <section class="row-2">
            <div class="card">
              <div class="card-head"><div><div class="card-title">{{ scenario.demandRank.title }}</div><div class="card-hint">品牌在次级场景+价值维度的覆盖占比率</div></div><div class="card-hint">{{ scenario.demandRank.count }}</div></div>
              <BaseChart :option="scenarioDemandOption" height="300px" />
            </div>
            <div class="card">
              <div class="card-head"><div><div class="card-title">{{ scenario.competition.title }}</div><div class="card-hint">自有品牌与竞品在核心需求上的覆盖对比</div></div></div>
              <table class="comp-table">
                <thead><tr><th class="tl">需求</th><th v-for="(h, hi) in scenario.competition.headers" :key="hi" :class="{ 'brand-col': hi > 0 }">{{ h }}</th></tr></thead>
                <tbody>
                  <tr v-for="(row, ri) in scenario.competition.rows" :key="ri"><td class="tl">{{ row.name }}</td><td v-for="(v, vi) in row.values" :key="vi" :class="{ 'brand-col': vi > 0 }">{{ v }}%</td></tr>
                </tbody>
              </table>
              <div class="note-box">{{ scenario.competition.footer }}</div>
            </div>
          </section>

          <section class="row-2">
            <div class="card">
              <div class="card-head"><div><div class="card-title">{{ scenario.intent.title }}</div><div class="card-hint">让用户了解你的品牌到从购买决策的最后一步和覆盖</div></div><div class="card-hint">综合 <b>{{ scenario.intent.composite }}</b></div></div>
              <div class="intent-grid">
                <div v-for="it in scenario.intent.list" :key="it.name" class="intent-item">
                  <div class="intent-header"><span class="intent-name">{{ it.name }}</span><span class="intent-tag" :class="it.tagClass">{{ it.tag }}</span></div>
                  <div class="intent-val">{{ it.val }}</div>
                  <div class="intent-progress"><div class="intent-fill" :style="{ width: it.progress + '%', background: it.color }" /></div>
                  <div class="intent-desc"><span>{{ it.desc[0] }}</span><span>{{ it.desc[1] }}</span></div>
                </div>
              </div>
            </div>
            <div class="card">
              <div class="card-head"><div><div class="card-title">{{ scenario.coverageLevels.title }}</div><div class="card-hint">名称出现，有效信息和自选推荐的逐级转化</div></div></div>
              <div class="donut-row">
                <div v-for="d in coverageRingOptions" :key="d.label" class="donut-item">
                  <BaseChart :option="d.option" height="110px" />
                  <div class="donut-label">{{ d.label }}</div>
                </div>
              </div>
              <div class="note-box">{{ scenario.coverageLevels.footer }}</div>
            </div>
          </section>

          <section class="card list-card">
            <div class="list-head"><div class="card-title">高价值场景缺口清单</div><div class="card-hint">按商业价值、竞品覆盖度由主品牌战略排序综合排序</div></div>
            <ul class="scenario-list">
              <li v-for="(s, i) in scenario.scenarioList" :key="i" class="scenario-item">
                <div class="sc-col sc-col-title">{{ s.title }}</div>
                <div class="sc-col sc-col-level">{{ s.level }}</div>
                <div class="sc-col sc-col-comp">{{ s.compInfo }}</div>
                <span class="sc-col sc-col-priority priority-badge" :class="s.prColor">{{ s.priority }}</span>
              </li>
            </ul>
          </section>
        </template>

        <!-- 四、竞品分析 -->
        <template v-else>
          <section class="kpi-row">
            <div class="kpi-plain">
              <div class="kpi-plain-label"><span>AI 声量份额排名</span><span class="info-icon" @click.stop="toggleTooltip('cp-rank')">?</span><transition name="fade-slide"><div v-show="activeTooltip === 'cp-rank'" class="kpi-tooltip">{{ getFormula('AI 声量份额排名') }}</div></transition></div>
              <div class="kpi-plain-value">{{ competitor.kpis.rank }}</div><div class="kpi-plain-desc">{{ competitor.kpis.share }}</div>
            </div>
            <div class="kpi-plain">
              <div class="kpi-plain-label"><span>对比选胜率</span><span class="info-icon" @click.stop="toggleTooltip('cp-win')">?</span><transition name="fade-slide"><div v-show="activeTooltip === 'cp-win'" class="kpi-tooltip">{{ getFormula('对比选胜率') }}</div></transition></div>
              <div class="kpi-plain-value">{{ competitor.kpis.winRate }}</div><div class="kpi-plain-desc">{{ competitor.kpis.answerCount }}</div>
            </div>
            <div class="kpi-plain">
              <div class="kpi-plain-label"><span>竞品替代率</span><span class="info-icon" @click.stop="toggleTooltip('cp-replace')">?</span><transition name="fade-slide"><div v-show="activeTooltip === 'cp-replace'" class="kpi-tooltip">{{ getFormula('竞品替代率') }}</div></transition></div>
              <div class="kpi-plain-value">{{ competitor.kpis.replaceRate }}</div><div class="kpi-plain-desc">{{ competitor.kpis.scenarioCount }}</div>
            </div>
            <div class="kpi-plain">
              <div class="kpi-plain-label"><span>最强直接竞品</span><span class="info-icon" @click.stop="toggleTooltip('cp-top')">?</span><transition name="fade-slide"><div v-show="activeTooltip === 'cp-top'" class="kpi-tooltip">{{ getFormula('最强直接竞品') }}</div></transition></div>
              <div class="kpi-plain-value is-brand">{{ competitor.kpis.topCompetitor }}</div><div class="kpi-plain-desc">{{ competitor.kpis.topCompRate }}</div>
            </div>
          </section>

          <section class="row-2">
            <div class="card">
              <div class="card-head"><div><div class="card-title">{{ competitor.ranking.title }}</div><div class="card-hint">{{ competitor.ranking.subtitle }}</div></div></div>
              <table class="data-table">
                <thead><tr><th>排名 / 品牌</th><th>出现率</th><th>首选率</th><th>Top 3</th><th>声量份额</th><th>指数</th></tr></thead>
                <tbody>
                  <tr v-for="r in competitor.ranking.list" :key="r.rank">
                    <td><span class="rank-tag" :class="{ top: r.rank <= 3 }">{{ r.rank }}</span>{{ r.name }}</td>
                    <td>{{ r.appear }}</td><td>{{ r.prefer }}</td><td>{{ r.top3 }}</td><td>{{ r.volume }}</td><td>{{ r.index }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="card">
              <div class="card-head"><div><div class="card-title">{{ competitor.comparison.title }}</div><div class="card-hint">{{ competitor.comparison.subtitle }}</div></div></div>
              <div class="vs-box">
                <div class="vs-item"><div class="vs-name">{{ competitor.comparison.a.name }}</div><div class="vs-value">{{ competitor.comparison.a.rate }}</div></div>
                <div class="vs-center">VS</div>
                <div class="vs-item"><div class="vs-name">{{ competitor.comparison.b.name }}</div><div class="vs-value red">{{ competitor.comparison.b.rate }}</div></div>
              </div>
              <div class="vs-desc">{{ competitor.comparison.desc }}</div>
              <BaseChart :option="cognitionOption" height="220px" />
            </div>
          </section>

          <section class="row-2">
            <div class="card">
              <div class="card-head"><div><div class="card-title">{{ competitor.cooccurrence.title }}</div><div class="card-hint">{{ competitor.cooccurrence.subtitle }}</div></div></div>
              <BaseChart :option="cooccurrenceOption" height="220px" />
              <div class="note-box">{{ competitor.cooccurrence.desc }}</div>
            </div>
            <div class="card">
              <div class="card-head"><div><div class="card-title">{{ competitor.replacement.title }}</div><div class="card-hint">{{ competitor.replacement.subtitle }}</div></div></div>
              <table class="data-table">
                <thead><tr><th>竞品</th><th>替代次数</th><th>主要场景</th><th>占比</th></tr></thead>
                <tbody>
                  <tr v-for="r in competitor.replacement.list" :key="r.name"><td>{{ r.name }}</td><td>{{ r.count }}</td><td>{{ r.scenario }}</td><td>{{ r.percent }}</td></tr>
                </tbody>
              </table>
            </div>
          </section>
        </template>
      </main>
    </div>

    <!-- 历史报告抽屉 -->
    <el-drawer v-model="historyVisible" title="历史报告" size="420px">
      <div v-loading="historyLoading">
        <div
          v-for="h in history"
          :key="h.id"
          class="history-item"
          :class="{ 'history-item-active': backendStatus === 'ready' && backendReport?.id === h.id }"
          @click="selectHistoryReport(h.id)"
        >
          <div class="history-head"><span class="history-title">{{ h.title || '报告' }}</span><span class="history-date">{{ formatDateTime(h.reportDate) }}</span></div>
          <div class="history-meta"><span>问题 {{ h.totalQuestions ?? '-' }}</span><span>平台 {{ h.totalPlatforms ?? '-' }}</span></div>
        </div>
        <el-empty v-if="!historyLoading && !history.length" description="暂无历史报告" />
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowDown } from '@element-plus/icons-vue'
import BaseChart from '@/components/BaseChart.vue'
import { buildHBarOption, buildHeatmapOption, buildRadarOption, buildRingOption, buildStackedBarOption, type HeatmapCell } from '@/charts/options'
import { formatDateTime, formatDateTimeDot } from '@/utils/format' // 新增 formatDateTimeDot
import { getTask } from '@/api/task' // 新增 getTask 接口
import { fetchReport } from '@/utils/report'
import { getReportHistory, getReportById } from '@/api/analysis'
import { useTaskStore } from '@/store/task'
import { COMPETITOR_DATA, MODEL_DATA, OVERVIEW_DATA, REPORT_META, REPORT_MODULES, SCENARIO_DATA, type CompetitorData, type ModelData, type OverviewData, type ScenarioData, type ModelPlatformRow, type ReportModuleKey } from '@/mock'
import { USE_MOCK } from '@/mock/flag'
import { projectPath } from '@/utils/projectPath'
import type { AnalysisReportResponse, ReportHistoryItem } from '@/types/analysis'

const route = useRoute()
const router = useRouter()
const taskStore = useTaskStore()
const MODULE_KEYS = REPORT_MODULES.map(m => m.key)

/** 把后端返回的百分比数字格式化成展示文案（null/undefined 显示「-」） */
function fmtPct(v: unknown): string {
  if (v === null || v === undefined || v === '') return '-'
  const n = Number(v)
  return Number.isFinite(n) ? `${n}%` : '-'
}

/* ------------------------- 后端报告 → 页面看板映射 ------------------------- */
/**
 * 把后端 AnalysisReportResponse 的字段映射到页面「数据总览」模块。
 * 后端没有对应字段的部分（雷达图、意图热力图、缺口清单）留空，不虚构数据。
 */
function buildOverviewFromReport(r: AnalysisReportResponse | null): OverviewData {
  const em = r?.exposureMetrics || {}
  // 每个 AI 平台上自主品牌展现的问题数（按问题去重，正确口径）
  // 后端 normalizeAiPlatformCode 可能输出的所有 code 值
  const CODE_TO_NAME: Record<string, string> = {
    doubao: '豆包',
    bytedance: '豆包',
    kimi: 'Kimi',
    moonshot: 'Kimi',
    wenxin: '文心',
    wenxin_yiyan: '文心',
    ernie: '文心',
    deepseek: 'DeepSeek',
    qianwen: '千问',
    tongyi: '千问',
    tencent: '元宝',
    yuanbao: '元宝',
    tenxun: '元宝'
  }
  const exposureMap = r?.platformSelfExposureCount || {}
  const totalQ = r?.totalQuestions || 10
  // "AI 平台覆盖率"条形图：按次数 / 总问题数 算百分比
  const platformItems = Object.entries(exposureMap).map(([code, count]) => ({
    name: CODE_TO_NAME[code] || code,
    value: Math.round((Number(count ?? 0) / totalQ) * 1000) / 10
  })).sort((a, b) => b.value - a.value)
  const sourceItems = (r?.citationSourceDistribution || []).map((s: Record<string, unknown>) => ({
    name: String(s.name ?? s.source ?? ''),
    value: Number(s.value ?? s.count ?? 0)
  }))
  // 固定 6 个 AI 平台，雷达图始终为六边形
  const FIXED_PLATFORMS = ['豆包', '元宝', '文心', 'DeepSeek', '千问', 'Kimi']
  // 中文名 → 后端 code（从 platformSelfExposureCount 取值）
  const NAME_TO_CODE: Record<string, string> = {
    '豆包': 'doubao', '元宝': 'tencent', '文心': 'wenxin',
    'DeepSeek': 'deepseek', '千问': 'qianwen', 'Kimi': 'kimi'
  }
  // 每个平台的总回答数 = 总问题数（每个平台回答一遍所有问题）
  const platformTotalQuestions = r?.totalQuestions || 10
  // 雷达图 values = 每个平台自主品牌展现的问题数（直接用次数）
  const radarIndicators = FIXED_PLATFORMS
  const radarValues = FIXED_PLATFORMS.map(name => {
    const code = NAME_TO_CODE[name]
    return Number(exposureMap[code] ?? 0)
  })
  return {
    kpis: [
      { label: '自然出现率', value: fmtPct(em.coverageRate) },
      { label: 'AI声量份额', value: em.aiShareRate !== undefined && em.aiShareRate >= 0 ? fmtPct(em.aiShareRate) : '-' },
      { label: '首位率', value: fmtPct(em.firstRate) },
      { label: 'TOP3', value: fmtPct(em.top3Rate) },
      { label: '场景覆盖率', value: em.sceneCoverageRate !== undefined && em.sceneCoverageRate >= 0 ? fmtPct(em.sceneCoverageRate) : '-' },
      { label: '信息准确率', value: fmtPct(em.positiveSentimentRate) }
    ],
    radar: { title: '品牌可见趋势', indicators: radarIndicators, values: radarValues },
    platformCoverage: { title: 'AI平台覆盖率', items: platformItems },
    sourceStructure: { title: '品牌信息来源结构', items: sourceItems },
    // 用户意图层级覆盖热力图 —— 从后端 intentHeatmap 取
    heatmap: r?.intentHeatmap,
    intentHeatmap: (() => {
      const h = r?.intentHeatmap
      if (h && h.levels && h.brands && h.levels.length > 0) {
        return {
          title: '用户意图层级覆盖热力图',
          cols: h.levels.map((lv: string) => lv.endsWith('层') ? lv.substring(0, lv.length - 1) : lv),
          rows: h.brands.map((b, idx) => ({
            name: b.selfBrand
              ? ('品牌A: ' + (b.name || '自主品牌'))
              : ('竞品' + String.fromCharCode(66 + idx - 1) + ': ' + (b.name || '')),
            values: (b.values || []).map(v => v == null ? 0 : Math.round(v))
          }))
        }
      }
      return { title: '用户意图层级覆盖热力图', cols: [], rows: [] }
    })(),
    gapList: { title: '高价值覆盖缺口', rows: (() => {
          const t = r?.gapTagList || []
          return t.map(g => ({
            query: g.tagName || '',
            stage: g.level || '',
            coverage: (Math.round(g.selfCoverage ?? 0)) + '%/' + (Math.round(g.competitorCoverage ?? 0)) + '%',
            priority: g.priority === 'P0' ? '高' : g.priority === 'P1' ? '中' : '低'
          }))
        })() }
  }
}

/** 模型对比模块：后端 platformScoreCards 字段结构未稳定，先留空 */
function buildModelFromReport(r: AnalysisReportResponse | null): ModelData {
  const platformTable = (r?.platformCoreMetrics || []).map(m => ({
    name: m.platformName || m.platformCode || '',
    coverRate: Math.round(m.coverRate ?? 0),
    firstRate: Math.round(m.firstRate ?? 0),
    top3Rate: Math.round(m.top3Rate ?? 0),
    avgRank: Math.round((m.avgRank ?? 0) * 10) / 10,
    stableRate: Math.round(m.stabilityRate ?? 0),
    accuracy: 0,
    consistency: Math.round(m.stabilityRate ?? 0),
    positiveRate: Math.round(m.positiveRate ?? 0)
  }))
  // 覆盖结构占比：用 firstRate / (top3Rate-firstRate) / (coverRate-top3Rate) 近似拆分
  // 注意：firstRate/top3Rate 分母是「含品牌回答数」，coverRate 分母是「总回答数」
  // 统一转换为总回答口径再相加（保证三段加起来 = coverRate）
  const firstArr = platformTable.map(p => +(p.coverRate * p.firstRate / 100).toFixed(1))
  const top23Arr = platformTable.map(p => +(p.coverRate * Math.max(0, p.top3Rate - p.firstRate) / 100).toFixed(1))
  const otherArr = platformTable.map(p => +(p.coverRate * Math.max(0, 100 - p.top3Rate) / 100).toFixed(1))
  const unshownArr = platformTable.map(p => +(Math.max(0, 100 - p.coverRate)).toFixed(1))
  return {
    platformTable,
    structure: {
      title: '覆盖结构占比',
      platforms: platformTable.map(p => p.name),
      first: firstArr,
      top23: top23Arr,
      other: otherArr,
      unshown: unshownArr
    },
    heatmap: {
      title: '用户意图层级覆盖热力图',
      rows: ['自然覆盖', '舆情情况', '官网引用'],
      items: platformTable.map(p => ({
        platform: p.name,
        coverRate: Math.round(p.coverRate ?? 0),
        naturalCover: p.coverRate >= 60 ? '领先' : p.coverRate >= 40 ? '较高' : p.coverRate >= 20 ? '中等' : p.coverRate >= 10 ? '偏低' : '待完善',
        emotional: Math.round(p.positiveRate ?? 0),
        officialCite: null
      }))
    }
  }
}

/** 场景覆盖模块：用 gapTagList + intentHeatmap 真实数据 */
function buildScenarioFromReport(r: AnalysisReportResponse | null): ScenarioData {
  const tags = (r?.gapTagList || []).filter(g => g.tagName)
  const total = tags.length
  const coveredCount = tags.filter(g => g.scenePassed).length
  const backendSceneRate = r?.exposureMetrics?.sceneCoverageRate ?? (total > 0 ? Math.round(coveredCount * 100 / total) : 0)
  const sortedHi = [...tags].sort((a, b) => (b.selfCoverage ?? 0) - (a.selfCoverage ?? 0))
  const top = sortedHi[0]
  const sortedLo = [...tags].sort((a, b) => (a.selfCoverage ?? 0) - (b.selfCoverage ?? 0))
  const bottom = sortedLo[0]
  const kpis = [
    { label: "覆盖功能需求", value: coveredCount + " / " + total, desc: backendSceneRate + "% 场景覆盖率" },
    { label: "最强需求关联", value: top?.tagName || "-", desc: top ? Math.round(top.selfCoverage ?? 0) + "% 自然出现率" : "" },
    { label: "高价值能力缺口", value: bottom?.tagName || "-", desc: bottom ? "仅 " + Math.round(bottom.selfCoverage ?? 0) + "% 覆盖" : "" },
    { label: "功能信息准确率", value: "-", desc: "" }
  ]
  const palette = ["#1677ff", "#00a870", "#fa8c16", "#722ed1", "#13c2c2", "#f5222d"]
  const demandItems = sortedHi.map((g, i) => ({ name: g.tagName || "", value: Math.round(g.selfCoverage ?? 0), color: palette[i % palette.length] }))
  const selfName = r?.brandName || "自主品牌"
  const headers = [selfName, ...((r?.competitionRanking as any[]) || []).filter((x: any) => !x.selfBrand).map((x: any) => x.brandName || x.name || "").filter(Boolean)]
  const compRows = sortedHi.slice(0, 5).map(g => {
    const bc = (g.brandCoverages || {}) as Record<string, number>
    const values = headers.map(h => Math.round(bc[h] ?? (h === selfName ? g.selfCoverage ?? 0 : g.competitorCoverage ?? 0)))
    return { name: g.tagName || "", values }
  })
  // 高价值场景缺口清单：筛选竞品覆盖 > 自有覆盖 的标签，按缺口大小排序
  const gapTags = tags.filter(g => (g.competitorCoverage ?? 0) > (g.selfCoverage ?? 0))
  const ranked = [...gapTags].sort((a, b) => {
    const gapB = (b.competitorCoverage ?? 0) - (b.selfCoverage ?? 0)
    const gapA = (a.competitorCoverage ?? 0) - (a.selfCoverage ?? 0)
    if (gapB !== gapA) return gapB - gapA
    return (b.questionCount ?? 0) - (a.questionCount ?? 0)
  })
  const scenarioList = ranked.slice(0, 6).map((g, idx) => {
    const bc = (g.brandCoverages || {}) as Record<string, number>
    const self = selfName
    const compEntries = Object.entries(bc).filter(([k]) => k !== self)
    compEntries.sort((a, b) => b[1] - a[1])
    const topComp = compEntries[0]
    let compInfo = ""
    if (topComp) {
      const highComps = compEntries.filter(([, v]) => v >= (g.competitorCoverage ?? 0) * 0.5)
      if (highComps.length >= 2) {
        compInfo = highComps.map(([k]) => k).join("、") + " " + Math.round(topComp[1]) + "% 覆盖"
      } else {
        compInfo = topComp[0] + " " + Math.round(topComp[1]) + "% 覆盖"
      }
    } else {
      compInfo = "竞品 " + Math.round(g.competitorCoverage ?? 0) + "% 覆盖"
    }
    const pr = idx + 1
    const prColor = "p-" + pr
    return { title: g.tagName || "", level: g.level || "", compInfo, priority: "优先级 " + pr, prColor }
  })
  return {
    kpis,
    demandRank: { title: "功能需求覆盖排名", count: total ? total + " 条需求" : "", items: demandItems },
    competition: { title: "功能心智竞争", headers, rows: compRows, footer: total > 0 ? "共 " + total + " 个意图标签" : "" },
    intent: (() => {
      const hm = r?.intentHeatmap
      const metrics = hm?.selfLevelMetrics || []
      const nameMap: Record<string, string> = { "认知层": "认知", "种草层": "种草", "甄选层": "甄选", "决策层": "决策", "反馈层": "反馈", "认知": "认知", "种草": "种草", "甄选": "甄选", "决策": "决策", "反馈": "反馈" }
      const rating = (cv: number) => {
        if (cv >= 60) return { tag: "领先", cls: "tag-green" }
        if (cv >= 40) return { tag: "较高", cls: "tag-blue" }
        if (cv >= 20) return { tag: "中等", cls: "tag-gray" }
        return { tag: "待提升", cls: "tag-orange" }
      }
      const COLORS = ["#1677ff", "#00a870", "#722ed1", "#fa8c16", "#13c2c2"]
      const list = metrics.map((m, i) => {
        const cv = Math.round(m.coverage ?? 0)
        const rt = rating(cv)
        return {
          name: nameMap[m.level || ""] || m.level || "",
          val: cv + "%",
          tag: rt.tag,
          tagClass: rt.cls,
          progress: cv,
          color: COLORS[i % COLORS.length],
          desc: [
            (m.mentionCount ?? 0) + "/" + (m.total ?? 0) + " 题出现",
            "首提 " + Math.round(m.firstRate ?? 0) + "%"
          ] as [string, string]
        }
      })
      const avg = list.length > 0 ? Math.round(list.reduce((s, x) => s + x.progress, 0) / list.length) : 0
      return { title: "五级意图覆盖情况", composite: avg + "%", list }
    })(),
    coverageLevels: (() => {
      const em = r?.exposureMetrics || ({} as any)
      const coverage = Math.round(em.coverageRate ?? 0)
      const top3 = Math.round(em.top3Rate ?? 0)
      const first = Math.round(em.firstRate ?? 0)
      const levels = [
        { label: "名称覆盖", value: coverage, color: "#1677ff" },
        { label: "前三率", value: top3, color: "#00a870" },
        { label: "首选推荐", value: first, color: "#722ed1" }
      ]
      // footer: 从 intentHeatmap.selfLevelMetrics 算哪层损耗最大
      let footer = ""
      const slm = r?.intentHeatmap?.selfLevelMetrics || []
      if (slm.length >= 2) {
        // 找 coverageRate 最低的两个相邻层级（简单版）
        const sorted = [...slm].sort((a: any, b: any) => (a.coverage ?? 0) - (b.coverage ?? 0))
        const worst = sorted[0]
        const worst2 = sorted[1]
        const lvl1 = (worst?.level || "").replace("层", "")
        const lvl2 = (worst2?.level || "").replace("层", "")
        footer = "主要损耗发生在“" + lvl1 + " → " + lvl2 + "”层级，建议优先补足选购标准、价格带、对比与购买依据。"
      } else if (slm.length === 1) {
        footer = "当前仅采集到" + (slm[0]?.level || "该层") + "数据，请增加意图标签以覆盖完整链路。"
      } else {
        footer = "主要损耗发生在中间层级，建议优先补足选购标准、价格带、对比与购买依据。"
      }
      return { title: "覆盖层级", list: levels, footer }
    })(),
    scenarioList
  }
}

/** 竞品分析模块：排名来自 competitionRanking，其余留空 */
function buildCompetitorFromReport(r: AnalysisReportResponse | null): CompetitorData {
  const rankingList = (r?.competitionRanking || []).map((item: Record<string, unknown>, idx: number) => ({
    rank: Number(item.rank ?? idx + 1),
    name: String(item.brandName ?? item.name ?? item.brand ?? ''),
    appear: String(item.appearanceRate ?? item.appear ?? '-'),
    prefer: String(item.firstRate ?? item.prefer ?? '-'),
    top3: String(item.top3Rate ?? item.top3 ?? '-'),
    volume: String(item.aiShareRate ?? item.volume ?? '-'),
    index: Number(item.score ?? item.index ?? 0)
  }))
  return {
    kpis: (() => {
      const cr = (r?.competitionRanking as any[]) || []
      const self = cr.find((x: any) => x.selfBrand === true)
      const rankVal = self?.rank ? '第 ' + self.rank + ' 名' : (cr.length > 0 ? '—' : '-')
      const scoreSelf = self?.score ?? null
      const shareStr = scoreSelf != null ? '竞争力 ' + scoreSelf + ' 分' : ''
      // 对比选胜率 = 首位率
      const em = r?.exposureMetrics || ({} as any)
      const firstRate = Math.round(em.comparisonFirstRate ?? em.firstRate ?? 0)
      const totalAns = r?.totalResults ?? 0
      const mentionCount = em.mentionCount ? String(em.mentionCount).split('/')[0] : '—'
      const winRateStr = firstRate > 0 ? firstRate + '%' : (firstRate === 0 && totalAns > 0 ? '0%' : '-')
      // 竞品替代率：暂用 0（需要历史报告比对）
      
      const _em2 = (r?.exposureMetrics as any) || {}
      const replaceRateVal = Math.round(_em2.replacementRate ?? 0)
const replaceRateStr = replaceRateVal + '%'
      // 最强直接竞品：score 最高的竞品
      const comps = cr.filter((x: any) => x.selfBrand !== true).sort((a: any, b: any) => Number(b.score ?? 0) - Number(a.score ?? 0))
      const topComp = comps[0]
      const topCompName = topComp?.brandName || topComp?.name || '-'
      const topCompScore = topComp?.score ? topComp.score + ' 分' : ''
      return {
        rank: rankVal,
        share: shareStr,
        winRate: winRateStr,
        answerCount: totalAns > 0 ? '检验 ' + totalAns + ' 条回答' : '',
        replaceRate: replaceRateStr,
        scenarioCount: '',
        topCompetitor: topCompName,
        topCompRate: topCompScore
      }
    })(),
    ranking: {
      title: '品牌竞争排名',
      subtitle: '综合出现率、首选率等 top 3 点位',
      list: rankingList
    },
    comparison: (() => {
      const em = (r?.exposureMetrics || ({} as any))
      const selfName = r?.brandName || '自主品牌'
      const total = em.comparisonTotal ?? 0
      const selfRate = Math.round(em.comparisonFirstRate ?? 0)
      const compRate = Math.round(em.competitorFirstRate ?? 0)
      const condRate = Math.round(em.conditionalRate ?? 0)
      const compCount = total > 0 ? total : 0
      const intentRates = (em.intentComparisonRates || {}) as Record<string, number>
      const cognition = Object.entries(intentRates)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([tag, rate]) => ({ name: tag, value: Math.round(rate) })) || []
      return {
        title: '直接对比结果',
        subtitle: total > 0 ? ('包含明确对比结论的 ' + total + ' 条答案') : '',
        a: { name: selfName + ' 首选', rate: selfRate + '%' },
        b: { name: '竞品首选', rate: compRate + '%' },
        desc: condRate > 0 ? (condRate + '% 的答案根据预算、场景或用户类型给出条件化选择') : '',
        cognition
      }
    })(),
    cooccurrence: (() => {
      const em = (r?.exposureMetrics || ({} as any))
      const coMap = (em.competitorCooccurrence || {}) as Record<string, number>
      const items = Object.entries(coMap)
        .sort((a, b) => b[1] - a[1])
        .map(([name, rate]) => ({ name, value: Math.round(rate) }))
      let desc = ''
      if (items.length > 0) {
        const top = items[0]
        const selfName = r?.brandName || '本品牌'
        desc = top.name + ' 是 AI 认知中与' + selfName + '联系最紧密的比较对象。'
      }
      return {
        title: '竞品共现率',
        subtitle: '自主品牌出现时，各竞品同时出现的概率',
        items,
        desc
      }
    })(),
    replacement: { title: '竞品替代去向', subtitle: '', list: [] }
  }
}

function normalizeModule(value: unknown): ReportModuleKey {
  const v = String(value ?? '')
  return (MODULE_KEYS as readonly string[]).includes(v) ? (v as ReportModuleKey) : 'overview'
}

const activeModule = ref<ReportModuleKey>(normalizeModule(route.query.module))
const activeTooltip = ref('')

const kpiFormulas: Record<string, string> = {
  '自然出现率': '自然出现率 = 非品牌提示问题中出现该品牌的有效答案数 ÷ 非品牌提示问题的有效答案总数 × 100%',
  'AI声量份额': 'AI声量份额(问题级) = 自有品牌提到的问题数 ÷ 自有品牌+所有竞对品牌提到的问题数之和 × 100%',
  '首位率': '首位率 = 该品牌作为首个品牌出现的有效答案数 ÷ 全部有效答案数 × 100%',
  'TOP3': 'TOP3 出现率 = 品牌位于前三个品牌位置的有效答案数 ÷ 全部有效答案数 × 100%',
  '场景覆盖率': '场景覆盖率 = 出现该品牌的有效场景数 ÷ 全部监测场景数 × 100%',
  '信息准确率': '信息准确率 = 准确的可核验信息点数 ÷ 全部已核验信息点数 × 100%',
  '自然点击率': '自然点击率 = 用户自然点击品牌的次数 ÷ 品牌曝光总次数 × 100%',
  'AI质量分数': 'AI质量分数 = 综合品牌在 AI 答案中的相关性、准确性与丰富度加权得分',
  '覆盖功能需求': '覆盖功能需求 = 已覆盖的功能需求数 ÷ 全部功能需求数',
  '最强需求关联': '最强需求关联 = 品牌在需求维度出现率最高时的值',
  '高价值能力缺口': '高价值能力缺口 = 商业价值高但当前覆盖率最低的能力项',
  '功能信息覆盖率': '功能信息覆盖率 = 已覆盖功能点 ÷ 全部功能点 × 100%',
  'AI 声量份额排名': 'AI 声量份额排名 = 品牌在所有监测品牌中的声量排名位次',
  '对比选胜率': '对比选胜率 = 品牌被 AI 直接对比时胜出的答案数 ÷ 直接对比答案总数 × 100%',
  '竞品替代率': '竞品替代率 = 原本选竞品的答案中 AI 转向推荐本品牌的占比',
  '最强直接竞品': '最强直接竞品 = 与品牌共现率最高的竞品'
}

function getFormula(label: string): string { return kpiFormulas[label] ?? '暂无说明' }
function toggleTooltip(key: string) { activeTooltip.value = activeTooltip.value === key ? '' : key }
function closeTooltip() { activeTooltip.value = '' }

const history = ref<ReportHistoryItem[]>([])
const historyVisible = ref(false)
const historyLoading = ref(false)
const backendReport = ref<AnalysisReportResponse | null>(null)
const backendStatus = ref<'idle' | 'loading' | 'ready' | 'error'>('idle')
const backendErrorMsg = ref('')

const taskNo = computed(() => (route.query.taskNo as string) || taskStore.currentTask?.taskNo || '')
const projectName = computed(() => taskStore.currentTask?.title || REPORT_META.projectName)
const subtitle = computed(() => {
  const task = taskStore.currentTask
  // 如果拿不到任务详情（例如接口异常），走原来的 mock 兜底
  if (!task) return REPORT_META.subtitle 

  const count = task.totalQuestionCount || 0
  const time = task.completedAt || task.updatedAt
  return `基于 ${count} 个询问句访问进行的监测数据更新：${formatDateTimeDot(time)}`
})

const overview = computed<OverviewData>(() => (USE_MOCK ? OVERVIEW_DATA : buildOverviewFromReport(backendReport.value)))
const overviewRadarOption = computed(() => buildRadarOption(overview.value.radar.indicators, overview.value.radar.values))
const overviewCoverageOption = computed(() => buildHBarOption(overview.value.platformCoverage.items))
const overviewSourceOption = computed(() => buildHBarOption(overview.value.sourceStructure.items))

const model = computed<ModelData>(() => (USE_MOCK ? MODEL_DATA : buildModelFromReport(backendReport.value)))
const modelTopCards = computed(() => {
  const list = model.value.platformTable
  if (!list.length) return []
  const bestOf = (key: keyof ModelPlatformRow): ModelPlatformRow => list.reduce((a, b) => ((b[key] as number) > (a[key] as number) ? b : a))
  const cover = bestOf('coverRate'); const first = bestOf('firstRate'); const stable = bestOf('consistency')
  return [{ title: '覆盖最高平台', value: cover.name, desc: `${cover.coverRate}%自然出现率` }, { title: '首位率最高平台', value: first.name, desc: `${first.firstRate}%首位率` }, { title: '最稳定平台', value: stable.name, desc: `${stable.consistency}%覆盖率一致性` }]
})

const modelStructureOption = computed(() => buildStackedBarOption(model.value.structure.platforms, [{ name: '首位率', data: model.value.structure.first, color: '#4f80ff' }, { name: 'TOP2-3', data: model.value.structure.top23, color: '#ffb4a3' }, { name: '其他位置', data: model.value.structure.other, color: '#4caf50' }, { name: '未展现', data: model.value.structure.unshown, color: '#dcdfe6' }]))
const NATURAL_LEVEL: Record<string, number> = { 较高: 92, 中等: 68, 偏低: 42, 待完善: 80 }
const modelHeatmapOption = computed(() => {
  const h = model.value.heatmap; const xData = h.items.map(i => i.platform); const cells: HeatmapCell[] = []
  h.items.forEach((item, xi) => { cells.push({ value: [xi, 0, Math.round(item.coverRate ?? 0)], text: item.naturalCover }); cells.push({ value: [xi, 1, Math.round(item.emotional ?? 0)], text: item.emotional != null ? Math.round(item.emotional) + '%' : undefined }); cells.push({ value: [xi, 2, null] }) })
  return buildHeatmapOption(xData, h.rows, cells)
})

const scenario = computed<ScenarioData>(() => (USE_MOCK ? SCENARIO_DATA : buildScenarioFromReport(backendReport.value)))
const scenarioDemandOption = computed(() => buildHBarOption(scenario.value.demandRank.items))
const coverageRingOptions = computed(() => scenario.value.coverageLevels.list.map(d => ({ label: d.label, option: buildRingOption(d.value, d.color, `${d.value}%`) })))
const competitor = computed<CompetitorData>(() => (USE_MOCK ? COMPETITOR_DATA : buildCompetitorFromReport(backendReport.value)))
const cognitionOption = computed(() => buildHBarOption(competitor.value.comparison.cognition))
const cooccurrenceOption = computed(() => buildHBarOption(competitor.value.cooccurrence.items))

function switchModule(key: ReportModuleKey) { if (key === activeModule.value) return; activeTooltip.value = ''; router.push({ path: route.path, query: { ...route.query, module: key } }) }
watch(() => route.query.module, v => { activeModule.value = normalizeModule(v) })

/** 当前项目 ID，页面内跳转都要带上它 */
const projectId = route.params.projectId as string | undefined
const taskListPath = projectPath(projectId, 'monitor/tasks')

function goDetail() { if (taskNo.value) router.push(projectPath(projectId, `monitor/tasks/${taskNo.value}`)); else router.push(taskListPath) }
function goBack() { router.push(taskListPath) }

const heatmapRange = computed(() => {
  const all = overview.value.intentHeatmap.rows.flatMap(r => r.values)
  if (!all.length) return { min: 0, max: 0 }
  return { min: Math.min(...all), max: Math.max(...all) }
})

function getHeatStyle(value: number): { background: string; isLight: boolean } {
  const { min, max } = heatmapRange.value
  if (max === min) return { background: 'hsl(228, 85%, 58%)', isLight: false }
  const t = (value - min) / (max - min); const lightness = 78 - t * 40
  return { background: `hsl(228, 85%, ${lightness.toFixed(1)}%)`, isLight: lightness > 62 }
}

async function openHistory() {
  if (!taskNo.value) return ElMessage.warning('请先选择监测任务')
  historyVisible.value = true; historyLoading.value = true
  try { history.value = await getReportHistory(taskNo.value) } catch { history.value = [] } finally { historyLoading.value = false }
}

async function loadBackendReport(regenerate = false) {
  if (USE_MOCK) return
  if (!taskNo.value) { backendStatus.value = 'error'; backendErrorMsg.value = '请先选择监测任务'; return }
  backendStatus.value = 'loading'
  try { backendReport.value = await fetchReport(taskNo.value, regenerate); backendStatus.value = 'ready' } catch (e) { backendStatus.value = 'error'; backendErrorMsg.value = e instanceof Error ? e.message : '后端报告获取失败' }
}

/** 点击生成报告按钮（首次生成或重新生成） */
function generateReport() {
  loadBackendReport(true)
}

/** 点击历史报告项，切换到指定报告 */
async function selectHistoryReport(reportId: number) {
  if (USE_MOCK) return
  backendStatus.value = 'loading'
  try {
    backendReport.value = await getReportById(reportId)
    backendStatus.value = 'ready'
    historyVisible.value = false
  } catch (e) {
    backendStatus.value = 'error'
    backendErrorMsg.value = e instanceof Error ? e.message : '加载历史报告失败'
  }
}

onMounted(async () => {
  if (USE_MOCK) return
  // 如果 Store 里没有任务数据，主动通过接口获取
  if (!taskStore.currentTask && taskNo.value) {
    try {
      const task = await getTask(taskNo.value)
      taskStore.setCurrentTask(task as any)
    } catch (error) {
      console.warn('获取任务详情失败，将使用 Mock 兜底', error)
    }
  }
  // 进入页面默认展示最近一份历史报告，没有则显示空状态（手动生成）
  if (taskNo.value) {
    try {
      const list = await getReportHistory(taskNo.value)
      if (list && list.length) {
        history.value = list
        await selectHistoryReport(list[0].id)
      }
    } catch {
      // 拉取历史失败时保持 idle 状态，用户可手动生成
    }
  }
})

onMounted(() => { window.addEventListener('click', closeTooltip) })
onUnmounted(() => { window.removeEventListener('click', closeTooltip) })
</script>

<style scoped lang="scss">
.task-detail {
  --primary-color: #1677ff;
  --primary-hover: #4096ff;
  --border-color: #ebebeb;
  --text-main: #333;
  --text-sub: #888;

  padding: 20px;
  background-color: #f4f6f9;
  min-height: 100%;
  font-size: 14px;
  color: var(--text-main);

  .page-container {
    background-color: #fff;
    border-radius: 4px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.05);
    display: flex;
    flex-direction: column;
    min-height: 80vh;
  }

  /* 统一 Header */
  .page-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 24px; border-bottom: 1px solid var(--border-color); }
  .header-left { min-width: 0; display: flex; align-items: baseline; }
  .header-title { margin: 0; display: flex; align-items: baseline; flex-wrap: wrap; gap: 8px; }
  .project-name { font-size: 18px; font-weight: bold; color: #000; }
  .header-subtitle { font-size: 12px; font-weight: normal; color: var(--text-sub); }
  .header-right { display: flex; flex-shrink: 0; align-items: center; gap: 16px; font-size: 13px; }
  .header-link { display: inline-flex; align-items: center; gap: 4px; padding: 4px 8px; cursor: pointer; color: var(--text-main); border-radius: 4px; transition: all 0.2s; &:hover { color: var(--primary-color); } .caret-icon { font-size: 12px; } }
  .close-btn { padding: 4px 16px; border: 1px solid var(--border-color); border-radius: 4px; cursor: pointer; transition: all 0.2s; &:hover { border-color: var(--primary-color); color: var(--primary-color); } }

  /* 统一 Tab */
  .tab-bar { display: flex; gap: 24px; padding: 0 24px; border-bottom: 1px solid var(--border-color); background: #fff; }
  .tab-item { position: relative; padding: 12px 0; font-size: 14px; color: var(--text-sub); cursor: pointer; &:hover { color: var(--text-main); } &.active { color: var(--primary-color); font-weight: 500; &::after { content: ''; position: absolute; left: 0; right: 0; bottom: -1px; height: 2px; background-color: var(--primary-color); } } }

  /* 子 Tab */
  .sub-tab-bar { display: flex; gap: 10px; background: #fff; padding: 16px 24px; border-bottom: 1px solid var(--border-color); }
  .sub-tab-item { padding: 6px 16px; border: 1px solid var(--border-color); border-radius: 16px; background: #fff; font-size: 13px; color: var(--text-main); cursor: pointer; transition: all 0.2s; &:hover:not(.active) { background: #f5f5f5; } &.active { background: var(--primary-color); border-color: var(--primary-color); color: #fff; } }

  /* 内容区 */
  .main-content { padding: 20px 24px; display: flex; flex-direction: column; gap: 20px; }

  .card { background: #fff; border: 1px solid var(--border-color); border-radius: 8px; padding: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.02); min-width: 0; }
  .card-title { font-size: 14px; font-weight: bold; color: #333; margin-bottom: 12px; }
  .card-hint { font-size: 12px; font-weight: normal; color: #999; margin-left: 6px; }
  .card-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; margin-bottom: 16px; .card-title { margin-bottom: 4px; } .card-hint { margin-left: 0; } }
  .row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; align-items: start; }

  /* KPI 等统一样式（略去繁琐细节，保持原逻辑完整性） */
  .kpi-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 16px; }
  .kpi-card { background: #fff; border: 1px solid var(--border-color); border-radius: 8px; padding: 16px; box-shadow: 0 2px 4px rgba(0,0,0,0.02); }
  .kpi-title { position: relative; display: flex; align-items: center; font-size: 12px; color: #666; margin-bottom: 8px; }
  .info-icon { display: inline-flex; align-items: center; justify-content: center; width: 14px; height: 14px; margin-left: 4px; border: 1px solid #999; border-radius: 50%; font-size: 10px; line-height: 1; color: #999; cursor: pointer; user-select: none; transition: all 0.2s; &:hover { background: var(--primary-color); color: #fff; border-color: var(--primary-color); } }
  .kpi-tooltip { position: absolute; top: calc(100% + 6px); left: 0; min-width: 220px; max-width: 300px; padding: 8px 12px; background: #f0f2f5; border-radius: 4px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); font-size: 12px; font-weight: normal; color: #555; line-height: 1.5; z-index: 100; }
  .fade-slide-enter-active, .fade-slide-leave-active { transition: opacity 0.2s ease, transform 0.2s ease; }
  .fade-slide-enter-from, .fade-slide-leave-to { opacity: 0; transform: translateY(-4px); }
  .kpi-value { font-size: 28px; font-weight: bold; color: #111; }
  .kpi-row { display: flex; gap: 16px; }
  .kpi-plain { flex: 1; background: #fff; border: 1px solid var(--border-color); border-radius: 8px; padding: 20px; min-width: 0; }
  .kpi-plain-label { position: relative; display: flex; align-items: center; font-size: 12px; color: #888; margin-bottom: 12px; }
  .kpi-plain-value { font-size: 28px; font-weight: bold; margin-bottom: 8px; color: #333; &.is-brand { color: var(--primary-color); } }
  .kpi-plain-desc { font-size: 12px; color: #888; }
  .top-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
  .card-sub { font-size: 14px; color: #666; margin-bottom: 10px; }
  .card-value { font-size: 32px; font-weight: bold; color: #333; margin-bottom: 5px; }
  .card-desc { font-size: 12px; color: #999; }

  /* 表格等 */
  .data-table { width: 100%; border-collapse: collapse; font-size: 13px; th, td { padding: 12px 10px; text-align: left; border-bottom: 1px solid #f0f0f0; } th { background: #fafafa; color: #888; font-weight: normal; font-size: 12px; } tr:last-child td { border-bottom: none; } }
  .table-scroll { max-height: 300px; overflow-y: auto; }
  .heat-table { width: 100%; border-collapse: collapse; font-size: 13px; }
  .heat-table th, .heat-table td { padding: 8px 6px; border-bottom: 1px solid #f0f0f0; width: 130px; }
  .heat-table th { background: #fafafa; color: #888; font-weight: normal; font-size: 12px; text-align: center; }
  .heat-table td.bar-cell { text-align: center; }
  .heat-row-head { width: 150px !important; color: #555; text-align: left !important; padding-left: 4px; }
  .bar-cell { }
  .progress-bg { position: relative; width: 110px; height: 26px; margin: 0 auto; border-radius: 4px; overflow: hidden; }
  .progress-bar { position: absolute; left: 0; top: 0; width: 100%; height: 100%; border-radius: 4px; transition: background 0.3s; }
  .progress-text { position: absolute; left: 0; top: 0; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; z-index: 1; font-size: 11px; font-weight: 600; color: #fff; text-shadow: 0 1px 2px rgba(0,0,0,0.2); }
  .td-wrap { min-width: 120px; font-size: 11px; color: #555; word-break: break-all; }
  .td-badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; &.badge-high { background: #e6f4ea; color: #1e8e3e; } &.badge-mid { background: #fef7e0; color: #b08800; } }
  .rank-tag { display: inline-block; min-width: 24px; padding: 2px 8px; border-radius: 4px; background: #f5f5f5; color: #333; font-size: 12px; text-align: center; margin-right: 6px; &.top { background: #e6f4ff; color: var(--primary-color); } }
  .comp-table { width: 100%; border-collapse: collapse; text-align: center; th { padding: 12px 0; border-bottom: 1px solid var(--border-color); font-size: 13px; font-weight: normal; color: #888; } td { padding: 14px 0; border-bottom: 1px solid #f0f0f0; font-size: 13px; } .tl { text-align: left; } .brand-col { color: var(--primary-color); } }
  .diff-tag { display: inline-block; padding: 4px 8px; border-radius: 12px; font-size: 12px; &.diff-pos { background: #f6ffed; color: #52c41a; } &.diff-neg { background: #fff2f0; color: #ff4d4f; } }
  .note-box { margin-top: 16px; padding: 10px; background: #fafafa; border-radius: 6px; font-size: 12px; line-height: 1.6; color: #888; }
  .intent-grid { display: flex; flex-wrap: wrap; gap: 20px; }
  .intent-item { width: calc(50% - 10px); padding-bottom: 15px; border-bottom: 1px solid var(--border-color); min-width: 0; }
  .intent-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
  .intent-name { font-size: 15px; font-weight: 500; }
  .intent-tag { padding: 2px 8px; border-radius: 4px; font-size: 11px; &.tag-blue { background: #e6f4ff; color: var(--primary-color); } &.tag-green { background: #f6ffed; color: #52c41a; } &.tag-orange { background: #fff7e6; color: #fa8c16; } &.tag-gray { background: #f5f5f5; color: #888; } }
  .intent-val { font-size: 24px; font-weight: bold; margin-bottom: 8px; }
  .intent-progress { height: 6px; border-radius: 3px; background: #f0f0f0; overflow: hidden; margin-bottom: 8px; }
  .intent-fill { height: 100%; }
  .intent-desc { display: flex; justify-content: space-between; font-size: 11px; color: #888; }
  .donut-row { display: flex; justify-content: space-around; align-items: center; margin-top: 20px; }
  .donut-item { width: 33%; text-align: center; min-width: 0; }
  .donut-label { font-size: 12px; color: #888; }
  .list-card { padding: 0; overflow: hidden; }
  .list-head { padding: 20px 20px 10px; }
  .scenario-list { margin: 0; padding: 0; list-style: none; }
  .scenario-item { display: flex; align-items: center; gap: 16px; padding: 14px 20px; border-top: 1px solid var(--border-color); font-size: 13px; }
  .sc-col { min-width: 0; }
  .sc-col-title { flex: 0 0 260px; font-weight: 500; color: #222; }
  .sc-col-level { flex: 0 0 100px; color: #888; font-size: 12px; }
  .sc-col-comp { flex: 1; color: #555; font-size: 12px; }
  .sc-col-priority { flex-shrink: 0; }
  .priority-badge { padding: 4px 10px; border-radius: 12px; font-size: 11px; &.p-1 { background: #fff2f0; color: #ff4d4f; font-weight: 600; } &.p-2 { background: #fff7e6; color: #fa8c16; } &.p-3 { background: #e6f4ff; color: var(--primary-color); } &.p-4 { background: #f5f5f5; color: #888; } }

  .vs-box { display: flex; align-items: center; justify-content: space-between; padding: 20px 0; margin-bottom: 12px; border: 1px dashed #e8e8e8; border-radius: 8px; }
  .vs-item { flex: 1; text-align: center; }
  .vs-name { font-size: 12px; color: #888; margin-bottom: 8px; }
  .vs-value { font-size: 28px; font-weight: bold; color: var(--primary-color); &.red { color: #f5222d; } }
  .vs-center { padding: 0 20px; font-size: 14px; color: #888; }
  .vs-desc { margin-bottom: 24px; font-size: 12px; color: #888; }
  .history-item { padding: 14px 16px; margin-bottom: 12px; border: 1px solid #eef0f4; border-radius: 8px; cursor: pointer; transition: all 0.2s; &:hover { border-color: var(--primary-color); background: #f0f7ff; } .history-head { display: flex; justify-content: space-between; gap: 12px; margin-bottom: 8px; } .history-title { font-size: 14px; font-weight: 600; color: #1f2329; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; } .history-date { font-size: 12px; color: #9aa1aa; white-space: nowrap; } .history-meta { display: flex; gap: 16px; font-size: 12px; color: #6b7280; } }
  .history-item-active { border-color: var(--primary-color); background: #e6f0ff; }
}

@media (max-width: 1200px) {
  .task-detail {
    .kpi-grid { grid-template-columns: repeat(3, 1fr); }
    .kpi-row { flex-wrap: wrap; .kpi-plain { min-width: 180px; } }
    .row-2, .top-cards { grid-template-columns: 1fr; }
  }
}
</style>
