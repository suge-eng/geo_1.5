<template>
  <div class="sentiment-report">
    <div class="page-container">
      <!-- 统一 Header（与声量报告页保持一致） -->
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
          <div class="close-btn" @click="goBack">关闭</div>
        </div>
      </div>

      <!-- 主 Tab -->
      <nav class="tab-bar">
        <div class="tab-item active">数据报告</div>
        <div class="tab-item" @click="goDetail">监测详情</div>
      </nav>

      <!-- 子 Tab：舆情报告只有「数据总览 / 媒体来源」两个模块 -->
      <nav class="sub-tab-bar">
        <div
          v-for="m in SENTIMENT_MODULES"
          :key="m.key"
          class="sub-tab-item"
          :class="{ active: activeModule === m.key }"
          @click="switchModule(m.key)"
        >
          {{ m.label }}
        </div>
      </nav>

      <main class="main-content">
        <!-- 后端模式下的空态 / 加载 / 错误 -->
        <section v-if="!USE_SENTIMENT_MOCK && backendStatus === 'idle'" class="card backend-placeholder">
          <el-empty description="暂无舆情数据报告，点击下方按钮生成">
            <el-button type="primary" @click="generateReport">生成报告</el-button>
          </el-empty>
        </section>
        <section v-else-if="!USE_SENTIMENT_MOCK && backendStatus === 'loading'" class="card backend-placeholder">
          <el-empty description="正在生成舆情报告，请稍候…" />
        </section>
        <section v-else-if="!USE_SENTIMENT_MOCK && backendStatus === 'error'" class="card backend-placeholder">
          <el-empty :description="backendErrorMsg || '舆情报告生成失败'">
            <el-button type="primary" @click="generateReport">重试</el-button>
          </el-empty>
        </section>

        <!-- ==================== 一、数据总览 ==================== -->
        <template v-else-if="activeModule === 'overview'">
          <!-- 顶部指标卡 -->
          <section class="kpi-grid">
            <div
              v-for="(k, ki) in overview.kpis"
              :key="ki"
              class="kpi-card"
              :class="k.accent ? 'kpi-border-' + k.accent : ''"
            >
              <div class="kpi-label">{{ k.label }}</div>
              <div class="kpi-number">{{ k.value }}</div>
              <div v-if="k.trend" class="kpi-trend" :class="k.trend.dir === 'up' ? 'trend-up' : 'trend-down'">
                {{ k.trend.text }}
              </div>
              <div v-else-if="k.sub" class="kpi-sub">{{ k.sub }}</div>
            </div>
          </section>

          <!-- 左 2/3：舆情结构 + 平台倾向；右 1/3：核心议题 + 风险信号 -->
          <section class="split-2-1">
            <div class="col-left">
              <div class="card">
                <div class="card-head">
                  <div class="card-title-inline">{{ overview.structure.title }}</div>
                  <div class="muted-sm">{{ overview.structure.total }}</div>
                </div>
                <div class="muted-sm mb-8">{{ overview.structure.tip }}</div>
                <div class="stacked-bar">
                  <div
                    v-for="(s, si) in overview.structure.segments"
                    :key="si"
                    class="stacked-segment"
                    :style="{ width: s.value + '%', backgroundColor: s.color }"
                  >
                    {{ s.label || '' }}
                  </div>
                </div>
                <div class="legend-row">
                  <span v-for="(l, li) in overview.structure.legend" :key="li" :style="{ color: l.color }">
                    ● {{ l.text }}
                  </span>
                </div>
              </div>

              <div class="card">
                <div class="card-title">{{ overview.platformTendency.title }}</div>
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>平台</th><th>样本</th><th>正向</th><th>中性</th><th>负向</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(r, ri) in overview.platformTendency.rows" :key="ri">
                      <td class="text-bold">{{ r.name }}</td>
                      <td>{{ r.sample }}</td>
                      <td :class="{ 'text-green': r.highlight }">{{ r.pos }}</td>
                      <td>{{ r.neu }}</td>
                      <td>{{ r.neg }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div class="col-right">
              <div class="card card-grow">
                <div class="card-title">{{ overview.topics.title }}</div>
                <div class="muted-sm mb-12">{{ overview.topics.tip }}</div>
                <div class="topic-list">
                  <div v-for="(t, ti) in overview.topics.items" :key="ti" class="topic-item">
                    <div class="topic-head">
                      <span class="muted-sm">{{ t.name }}</span>
                      <span class="muted-sm text-bold">{{ t.value }}%</span>
                    </div>
                    <div class="progress-bg"><div class="progress-fill" :style="{ width: t.value + '%', backgroundColor: t.color }" /></div>
                  </div>
                </div>
              </div>

              <div class="card">
                <div class="card-title">{{ overview.riskSignals.title }}</div>
                <div class="risk-grid">
                  <div v-for="(s, si) in overview.riskSignals.items" :key="si" class="risk-box">
                    <div class="muted-sm mb-6">{{ s.title }}</div>
                    <div class="risk-number" :class="{ 'risk-danger': s.accent === 'danger' }">{{ s.value }}</div>
                    <div class="muted-sm">{{ s.sub }}</div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <!-- 高频正向 / 负向观点 -->
          <section class="split-2">
            <div class="card">
              <div class="card-head">
                <div class="card-title-inline">{{ overview.positiveOpinions.title }}</div>
                <div class="muted-sm">{{ overview.positiveOpinions.tip }}</div>
              </div>
              <div class="opinion-grid">
                <div v-for="(o, oi) in overview.positiveOpinions.items" :key="oi" class="opinion-card">
                  <div class="opinion-head">
                    <span class="opinion-title">{{ o.title }}</span>
                    <span class="badge" :class="'badge-' + o.tagType">{{ o.tag }}</span>
                  </div>
                  <div class="muted-sm mb-6">{{ o.desc }}</div>
                  <div class="muted-sm">{{ o.sub }}</div>
                </div>
              </div>
            </div>
            <div class="card">
              <div class="card-head">
                <div class="card-title-inline">{{ overview.negativeOpinions.title }}</div>
                <div class="muted-sm">{{ overview.negativeOpinions.tip }}</div>
              </div>
              <div class="opinion-grid">
                <div v-for="(o, oi) in overview.negativeOpinions.items" :key="oi" class="opinion-card">
                  <div class="opinion-head">
                    <span class="opinion-title">{{ o.title }}</span>
                    <span class="badge" :class="'badge-' + o.tagType">{{ o.tag }}</span>
                  </div>
                  <div class="muted-sm mb-6">{{ o.desc }}</div>
                  <div class="muted-sm">{{ o.sub }}</div>
                </div>
              </div>
            </div>
          </section>

          <!-- 议题 × 舆情倾向矩阵 -->
          <section class="card">
            <div class="card-title">{{ overview.matrix.title }}</div>
            <div class="muted-sm mb-12">{{ overview.matrix.tip }}</div>
            <table class="data-table">
              <thead>
                <tr>
                  <th>一级议题</th><th>覆盖</th><th>正向观点</th><th>中性观点</th><th>负向观点</th><th>主要负向表达</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(r, ri) in overview.matrix.rows" :key="ri">
                  <td class="text-bold">{{ r.topic }}</td>
                  <td>{{ r.cover }}</td>
                  <td class="text-green">{{ r.pos }}</td>
                  <td>{{ r.neu }}</td>
                  <td class="text-red">{{ r.neg }}</td>
                  <td class="text-muted">{{ r.negText }}</td>
                </tr>
              </tbody>
            </table>
          </section>
        </template>

        <!-- ==================== 二、媒体来源 ==================== -->
        <template v-else>
          <!-- 媒体类型全景 -->
          <section class="card">
            <div class="card-head">
              <div class="card-title-inline">{{ media.panorama.title }}</div>
              <div class="muted-sm">{{ media.panorama.count }}</div>
            </div>
            <div class="muted-sm mb-12">{{ media.panorama.tip }}</div>
            <div class="panorama-grid">
              <div v-for="(m, mi) in media.panorama.items" :key="mi" class="media-card">
                <div class="media-title">{{ m.title }}</div>
                <div class="media-desc">{{ m.desc }}</div>
              </div>
            </div>
          </section>

          <!-- 左 2.5/3：权威媒体候选；右 1/3：识别规则 + 来源占比 -->
          <section class="split-25-1">
            <div class="card">
              <div class="card-head">
                <div class="card-title-inline">{{ media.authority.title }}</div>
                <div class="muted-sm">T0 / T1 优先</div>
              </div>
              <div class="muted-sm mb-12">{{ media.authority.tip }}</div>
              <table class="data-table">
                <thead>
                  <tr>
                    <th>来源</th><th>类型 / 等级</th><th>权威分</th><th>品牌相关性</th><th>本期引用</th><th>适用事实</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(r, ri) in authorityRows" :key="ri">
                    <td>
                      <div class="text-bold">{{ r.source }}</div>
                      <div class="muted-sm">{{ r.sub }}</div>
                    </td>
                    <td><span class="badge badge-blue">{{ r.type }}</span></td>
                    <td>
                      <span
                        class="score-badge"
                        :style="{ backgroundColor: r.bgColor, color: r.textColor }"
                      >{{ r.score }}</span>
                    </td>
                    <td>{{ r.rel }}</td>
                    <td>{{ r.cite }}</td>
                    <td>{{ r.fact }}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="col-right">
              <div class="card card-grow">
                <div class="card-title">{{ media.rules.title }}</div>
                <div class="muted-sm mb-12">{{ media.rules.tip }}</div>
                <div class="formula-list">
                  <div v-for="(f, fi) in media.rules.formulas" :key="fi" class="formula-box">{{ f }}</div>
                </div>
                <div class="muted-sm mt-8">{{ media.rules.note }}</div>
              </div>
              <div class="card">
                <div class="card-title mb-12">{{ media.sourceRatio.title }}</div>
                <div class="ratio-list">
                  <div v-for="(s, si) in media.sourceRatio.items" :key="si" class="ratio-item">
                    <div class="ratio-label">{{ s.name }}</div>
                    <div class="ratio-bar-bg"><div class="ratio-bar" :style="{ width: s.value + '%', backgroundColor: s.color }" /></div>
                    <div class="ratio-value">{{ s.value }}%</div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <!-- 风险事件监测台 -->
          <section class="card">
            <div class="card-title">{{ media.riskEvents.title }}</div>
            <div class="muted-sm mb-12">{{ media.riskEvents.tip }}</div>
            <table class="data-table">
              <thead>
                <tr>
                  <th>风险事件</th><th>风险等级</th><th>影响平台</th><th>主要来源</th><th>事件状态</th><th>页面建议</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(r, ri) in media.riskEvents.rows" :key="ri">
                  <td class="text-bold">{{ r.event }}</td>
                  <td><span class="badge" :class="'badge-' + r.levelType">{{ r.level }}</span></td>
                  <td>{{ r.platform }}</td>
                  <td>{{ r.source }}</td>
                  <td><span class="badge" :class="'badge-' + r.statusType">{{ r.status }}</span></td>
                  <td class="text-muted">{{ r.suggestion }}</td>
                </tr>
              </tbody>
            </table>
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
          @click="selectHistoryReport(h.id as number)"
        >
          <div class="history-head">
            <span class="history-title">{{ h.title || '报告' }}</span>
            <span class="history-date">{{ formatDateTime(h.reportDate) }}</span>
          </div>
          <div class="history-meta">
            <span>问题 {{ h.totalQuestions ?? '-' }}</span>
            <span>平台 {{ h.totalPlatforms ?? '-' }}</span>
          </div>
        </div>
        <el-empty v-if="!historyLoading && !history.length" description="暂无历史报告" />
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowDown } from '@element-plus/icons-vue'
import { formatDateTime, formatDateTimeDot } from '@/utils/format'
import { getTask } from '@/api/task'
import {
  getSentimentReportById,
  getSentimentReportHistory
} from '@/api/sentimentReport'
import { fetchSentimentReport } from '@/utils/sentimentReport'
import { useTaskStore } from '@/store/task'
import { projectPath } from '@/utils/projectPath'
import {
  MEDIA_SOURCE_DATA,
  SENTIMENT_MODULES,
  SENTIMENT_OVERVIEW_DATA,
  SENTIMENT_REPORT_META
} from '@/mock'
import { USE_SENTIMENT_MOCK } from '@/mock/flag'
import type {
  MediaSourceData,
  SentimentModuleKey,
  SentimentOverviewData,
  SentimentReportHistoryItem,
  SentimentReportResponse
} from '@/types/sentimentReport'

const route = useRoute()
const router = useRouter()
const taskStore = useTaskStore()

const MODULE_KEYS = SENTIMENT_MODULES.map(m => m.key)

function normalizeModule(value: unknown): SentimentModuleKey {
  const v = String(value ?? '')
  return (MODULE_KEYS as readonly string[]).includes(v) ? (v as SentimentModuleKey) : 'overview'
}

const activeModule = ref<SentimentModuleKey>(normalizeModule(route.query.module))

/* ------------------------- 后端报告 → 页面数据映射 ------------------------- */

/** 后端未返回「数据总览」时的空态（不虚构数据，仅保证图/表结构存在） */
function emptyOverview(): SentimentOverviewData {
  return {
    kpis: [],
    structure: { title: '整体舆情结构', total: '', tip: '', segments: [], legend: [] },
    platformTendency: { title: '各 AI 平台倾向差异', rows: [] },
    topics: { title: '品牌核心议题', tip: '', items: [] },
    riskSignals: { title: '风险信号', items: [] },
    positiveOpinions: { title: '高频正向观点', tip: '', items: [] },
    negativeOpinions: { title: '高频负向与争议观点', tip: '', items: [] },
    matrix: { title: '议题 × 舆情倾向矩阵', tip: '', rows: [] }
  }
}

/** 后端未返回「媒体来源」时的空态 */
function emptyMedia(): MediaSourceData {
  return {
    panorama: { title: '媒体类型全景', count: '', tip: '', items: [] },
    authority: { title: '相关权威媒体候选', tip: '', rows: [] },
    rules: { title: '权威来源识别规则', tip: '', formulas: [], note: '' },
    sourceRatio: { title: '来源类型引用占比', items: [] },
    riskEvents: { title: '风险事件监测台', tip: '', rows: [] }
  }
}

const backendReport = ref<SentimentReportResponse | null>(null)
const backendStatus = ref<'idle' | 'loading' | 'ready' | 'error'>(
  USE_SENTIMENT_MOCK ? 'ready' : 'idle'
)
const backendErrorMsg = ref('')

/** 数据总览数据：mock 开关开启时用虚拟数据，否则用后端返回的 overview 分组 */
const overview = computed<SentimentOverviewData>(() =>
  USE_SENTIMENT_MOCK ? SENTIMENT_OVERVIEW_DATA : (backendReport.value?.overview ?? emptyOverview())
)

/** 媒体来源数据：mock 开关开启时用虚拟数据，否则用后端返回的 mediaSource 分组 */
const media = computed<MediaSourceData>(() =>
  USE_SENTIMENT_MOCK ? MEDIA_SOURCE_DATA : (backendReport.value?.mediaSource ?? emptyMedia())
)

/** 权威分色阶：分数越高颜色越深（映射自 mock / 后端行数据，非写死） */
const authorityRows = computed(() => {
  const rows = media.value.authority.rows
  if (!rows.length) return []
  const scores = rows.map(r => r.score)
  const max = Math.max(...scores)
  const min = Math.min(...scores)
  return rows.map(r => {
    const ratio = max === min ? 0.5 : (r.score - min) / (max - min)
    const alpha = 0.2 + ratio * 0.7
    return {
      ...r,
      bgColor: `rgba(59, 130, 246, ${alpha.toFixed(2)})`,
      textColor: alpha > 0.5 ? '#ffffff' : '#1e40af'
    }
  })
})

/* ------------------------- 页头信息 ------------------------- */
const taskNo = computed(() => (route.query.taskNo as string) || taskStore.currentTask?.taskNo || '')
const projectName = computed(() => taskStore.currentTask?.title || SENTIMENT_REPORT_META.projectName)
const subtitle = computed(() => {
  const task = taskStore.currentTask
  if (!task) return SENTIMENT_REPORT_META.subtitle
  const count = task.totalQuestionCount || 0
  const time = task.completedAt || task.updatedAt
  return `基于 ${count} 个询问句访问进行的舆情监测数据更新：${formatDateTimeDot(time)}`
})

/* ------------------------- 模块切换 & 跳转 ------------------------- */
function switchModule(key: SentimentModuleKey) {
  if (key === activeModule.value) return
  router.push({ path: route.path, query: { ...route.query, module: key } })
}
watch(() => route.query.module, v => { activeModule.value = normalizeModule(v) })

const projectId = route.params.projectId as string | undefined
const taskListPath = projectPath(projectId, 'monitor/tasks')

function goDetail() {
  if (taskNo.value) router.push(projectPath(projectId, `monitor/tasks/${taskNo.value}`))
  else router.push(taskListPath)
}
function goBack() { router.push(taskListPath) }

/* ------------------------- 后端交互（预留） ------------------------- */
const history = ref<SentimentReportHistoryItem[]>([])
const historyVisible = ref(false)
const historyLoading = ref(false)

async function openHistory() {
  if (USE_SENTIMENT_MOCK) {
    ElMessage.info('当前为虚拟数据演示模式，历史报告功能待后端接入')
    return
  }
  if (!taskNo.value) return ElMessage.warning('请先选择监测任务')
  historyVisible.value = true
  historyLoading.value = true
  try {
    history.value = await getSentimentReportHistory(taskNo.value)
  } catch {
    history.value = []
  } finally {
    historyLoading.value = false
  }
}

/** 点击「生成报告 / 重新生成」按钮 */
function generateReport() {
  if (USE_SENTIMENT_MOCK) {
    ElMessage.info('当前为虚拟数据演示模式，请将 USE_SENTIMENT_MOCK 置为 false 后接入后端')
    return
  }
  loadBackendReport(true)
}

async function loadBackendReport(regenerate = false) {
  if (USE_SENTIMENT_MOCK) return
  if (!taskNo.value) {
    backendStatus.value = 'error'
    backendErrorMsg.value = '请先选择监测任务'
    return
  }
  backendStatus.value = 'loading'
  try {
    backendReport.value = await fetchSentimentReport(taskNo.value, regenerate)
    backendStatus.value = 'ready'
  } catch (e) {
    backendStatus.value = 'error'
    backendErrorMsg.value = e instanceof Error ? e.message : '舆情报告获取失败'
  }
}

async function selectHistoryReport(reportId: number) {
  if (USE_SENTIMENT_MOCK || !reportId) return
  backendStatus.value = 'loading'
  try {
    backendReport.value = await getSentimentReportById(reportId)
    backendStatus.value = 'ready'
    historyVisible.value = false
  } catch (e) {
    backendStatus.value = 'error'
    backendErrorMsg.value = e instanceof Error ? e.message : '加载历史舆情报告失败'
  }
}

onMounted(async () => {
  if (USE_SENTIMENT_MOCK) return
  if (!taskStore.currentTask && taskNo.value) {
    try {
      const task = await getTask(taskNo.value)
      taskStore.setCurrentTask(task)
    } catch (error) {
      console.warn('获取任务详情失败，将使用兜底文案', error)
    }
  }
  if (taskNo.value) {
    try {
      const list = await getSentimentReportHistory(taskNo.value)
      if (list && list.length) {
        history.value = list
        await selectHistoryReport(list[0].id as number)
      }
    } catch {
      // 拉取历史失败时保持 idle 状态，用户可手动生成
    }
  }
})
</script>

<style scoped lang="scss">
.sentiment-report {
  --s-primary: #3b82f6;
  --s-success: #10b981;
  --s-warning: #f59e0b;
  --s-danger: #ef4444;
  --s-border: #e5e7eb;
  --s-text: #111827;
  --s-text-sub: #4b5563;
  --s-muted: #6b7280;

  padding: 20px;
  background-color: #f4f6f9;
  min-height: 100%;
  font-size: 14px;
  color: var(--s-text);

  .page-container {
    background-color: #fff;
    border-radius: 4px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    display: flex;
    flex-direction: column;
    min-height: 80vh;
  }

  /* Header */
  .page-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 24px; border-bottom: 1px solid var(--s-border); }
  .header-left { min-width: 0; display: flex; align-items: baseline; }
  .header-title { margin: 0; display: flex; align-items: baseline; flex-wrap: wrap; gap: 8px; }
  .project-name { font-size: 18px; font-weight: bold; color: #000; }
  .header-subtitle { font-size: 12px; font-weight: normal; color: var(--s-muted); }
  .header-right { display: flex; flex-shrink: 0; align-items: center; gap: 16px; font-size: 13px; }
  .header-link { display: inline-flex; align-items: center; gap: 4px; padding: 4px 8px; cursor: pointer; color: var(--s-text); border-radius: 4px; transition: all 0.2s; &:hover { color: var(--s-primary); } .caret-icon { font-size: 12px; } }
  .close-btn { padding: 4px 16px; border: 1px solid var(--s-border); border-radius: 4px; cursor: pointer; transition: all 0.2s; &:hover { border-color: var(--s-primary); color: var(--s-primary); } }

  /* Tab */
  .tab-bar { display: flex; gap: 24px; padding: 0 24px; border-bottom: 1px solid var(--s-border); background: #fff; }
  .tab-item { position: relative; padding: 12px 0; font-size: 14px; color: var(--s-muted); cursor: pointer; &:hover { color: var(--s-text); } &.active { color: var(--s-primary); font-weight: 500; &::after { content: ''; position: absolute; left: 0; right: 0; bottom: -1px; height: 2px; background-color: var(--s-primary); } } }
  .sub-tab-bar { display: flex; gap: 10px; background: #fff; padding: 16px 24px; border-bottom: 1px solid var(--s-border); }
  .sub-tab-item { padding: 6px 16px; border: 1px solid var(--s-border); border-radius: 16px; background: #fff; font-size: 13px; color: var(--s-text); cursor: pointer; transition: all 0.2s; user-select: none; &:hover:not(.active) { background: #f5f5f5; } &.active { background: var(--s-primary); border-color: var(--s-primary); color: #fff; } }

  /* 内容区 */
  .main-content { padding: 20px 24px; display: flex; flex-direction: column; gap: 20px; }
  .backend-placeholder { display: flex; align-items: center; justify-content: center; min-height: 360px; }

  .card { background: #fff; border: 1px solid var(--s-border); border-radius: 8px; padding: 20px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02); min-width: 0; border-left-width: 1px; }
  .card-grow { flex: 1; display: flex; flex-direction: column; }
  .card-title { font-size: 14px; font-weight: bold; color: #333; margin-bottom: 12px; }
  .card-title-inline { font-size: 14px; font-weight: bold; color: #333; }
  .card-head { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; margin-bottom: 10px; }
  .split-2-1 { display: grid; grid-template-columns: 2fr 1fr; gap: 20px; align-items: stretch; }
  .split-25-1 { display: grid; grid-template-columns: 2.5fr 1fr; gap: 20px; align-items: stretch; }
  .split-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; align-items: start; }
  .col-left { display: flex; flex-direction: column; gap: 20px; min-width: 0; }
  .col-right { display: flex; flex-direction: column; gap: 20px; min-width: 0; }

  /* 通用工具 */
  .muted-sm { font-size: 12px; color: var(--s-muted); }
  .text-bold { font-weight: 600; }
  .text-green { color: var(--s-success); font-weight: 600; }
  .text-red { color: var(--s-danger); font-weight: 600; }
  .text-muted { color: var(--s-muted); }
  .mb-6 { margin-bottom: 6px; }
  .mb-8 { margin-bottom: 8px; }
  .mb-12 { margin-bottom: 12px; }
  .mt-8 { margin-top: 8px; }

  /* KPI 卡 */
  .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
  .kpi-card { background: #fff; border: 1px solid var(--s-border); border-radius: 8px; padding: 16px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02); }
  .kpi-border-blue { border-left: 4px solid var(--s-primary); }
  .kpi-border-green { border-left: 4px solid var(--s-success); }
  .kpi-border-gray { border-left: 4px solid #9ca3af; }
  .kpi-border-red { border-left: 4px solid var(--s-danger); }
  .kpi-label { font-size: 13px; color: var(--s-text-sub); margin-bottom: 6px; }
  .kpi-number { font-size: 28px; font-weight: 700; color: var(--s-text); margin-bottom: 4px; }
  .kpi-sub { font-size: 12px; color: var(--s-muted); }
  .trend-up { color: var(--s-success); font-size: 12px; }
  .trend-down { color: var(--s-danger); font-size: 12px; }

  /* 堆叠条 */
  .stacked-bar { display: flex; height: 24px; border-radius: 4px; overflow: hidden; margin: 10px 0; }
  .stacked-segment { display: flex; align-items: center; justify-content: center; color: #fff; font-size: 12px; font-weight: 500; overflow: hidden; white-space: nowrap; }
  .legend-row { display: flex; flex-wrap: wrap; gap: 16px; font-size: 12px; margin-top: 8px; }

  /* 核心议题 */
  .topic-list { display: flex; flex-direction: column; justify-content: space-around; gap: 14px; flex: 1; }
  .topic-item { width: 100%; }
  .topic-head { display: flex; justify-content: space-between; margin-bottom: 4px; }
  .progress-bg { width: 100%; height: 8px; background: #f3f4f6; border-radius: 4px; overflow: hidden; }
  .progress-fill { height: 100%; border-radius: 4px; transition: width 0.3s; }

  /* 风险信号 */
  .risk-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
  .risk-box { background: #f9fafb; border: 1px solid var(--s-border); border-radius: 6px; padding: 16px; text-align: center; }
  .risk-number { font-size: 24px; font-weight: 700; color: var(--s-text); margin-bottom: 4px; }
  .risk-danger { color: var(--s-danger); }

  /* 观点卡 */
  .opinion-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .opinion-card { border: 1px solid var(--s-border); border-radius: 6px; padding: 16px; background: #fff; }
  .opinion-head { display: flex; justify-content: space-between; align-items: center; gap: 8px; margin-bottom: 8px; }
  .opinion-title { font-weight: 600; font-size: 14px; }

  /* 标签 */
  .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 500; white-space: nowrap; }
  .badge-success { background: #d1fae5; color: #065f46; }
  .badge-danger { background: #fee2e2; color: #991b1b; }
  .badge-warning { background: #fef3c7; color: #92400e; }
  .badge-gray { background: #f3f4f6; color: #4b5563; }
  .badge-blue { background: #dbeafe; color: #1e40af; }

  /* 表格 */
  .data-table { width: 100%; border-collapse: collapse; font-size: 13px; th, td { padding: 12px 10px; text-align: left; border-bottom: 1px solid #f0f0f0; vertical-align: top; } th { background: #fafafa; color: #888; font-weight: 500; font-size: 12px; } tr:last-child td { border-bottom: none; } }

  /* 媒体类型全景 */
  .panorama-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
  .media-card { border: 1px solid var(--s-border); border-radius: 8px; padding: 16px; background: #fff; }
  .media-title { font-weight: 600; font-size: 14px; margin-bottom: 8px; }
  .media-desc { font-size: 12px; color: var(--s-muted); line-height: 1.6; }

  /* 权威分色阶徽标 */
  .score-badge { display: inline-block; padding: 4px 10px; border-radius: 4px; font-size: 14px; font-weight: 600; transition: all 0.3s ease; }

  /* 识别规则 */
  .formula-list { display: flex; flex-direction: column; gap: 10px; }
  .formula-box { background: #f8fafc; border: 1px solid var(--s-border); border-radius: 6px; padding: 12px; font-family: monospace; font-size: 12px; color: var(--s-text-sub); line-height: 1.8; }

  /* 来源类型占比 */
  .ratio-list { display: flex; flex-direction: column; gap: 12px; }
  .ratio-item { display: flex; align-items: center; gap: 12px; }
  .ratio-label { width: 100px; font-size: 13px; color: var(--s-text-sub); flex-shrink: 0; }
  .ratio-bar-bg { flex: 1; height: 8px; background: #f3f4f6; border-radius: 4px; overflow: hidden; }
  .ratio-bar { height: 100%; border-radius: 4px; transition: width 0.3s; }
  .ratio-value { width: 50px; text-align: right; font-size: 13px; font-weight: 600; flex-shrink: 0; }

  /* 历史报告 */
  .history-item { padding: 14px 16px; margin-bottom: 12px; border: 1px solid #eef0f4; border-radius: 8px; cursor: pointer; transition: all 0.2s; &:hover { border-color: var(--s-primary); background: #f0f7ff; } .history-head { display: flex; justify-content: space-between; gap: 12px; margin-bottom: 8px; } .history-title { font-size: 14px; font-weight: 600; color: #1f2329; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; } .history-date { font-size: 12px; color: #9aa1aa; white-space: nowrap; } .history-meta { display: flex; gap: 16px; font-size: 12px; color: #6b7280; } }
}

@media (max-width: 1200px) {
  .sentiment-report {
    .kpi-grid { grid-template-columns: repeat(2, 1fr); }
    .split-2-1, .split-25-1, .split-2 { grid-template-columns: 1fr; }
    .panorama-grid { grid-template-columns: repeat(2, 1fr); }
  }
}
@media (max-width: 768px) {
  .sentiment-report {
    .kpi-grid, .panorama-grid, .opinion-grid, .risk-grid { grid-template-columns: 1fr; }
  }
}
</style>
