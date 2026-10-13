<template>
  <div class="task-detail">
    <div class="page-container">
      <!-- 统一后的 Header -->
      <div class="page-header">
        <div class="header-left">
          <h1 class="header-title">
            <span class="project-name">【{{ currentTask?.title || '观测详情' }}】</span>
            <span class="header-subtitle">{{ headerSubtitle }}</span>
          </h1>
        </div>
        <div class="header-right">
          <span class="header-link" @click="goReport">
            历史报告
            <el-icon class="caret-icon"><ArrowDown /></el-icon>
          </span>
          <div class="close-btn" title="关闭页面" @click="goBack">
            关闭
          </div>
        </div>
      </div>

      <!-- 统一后的 Tab 栏 -->
      <div class="tab-bar">
        <div class="tab-item" @click="goReport">数据报告</div>
        <div class="tab-item active">监测详情</div>
      </div>

      <!-- 内容区 -->
      <div class="main-content">
        <!-- 查询列表标题 -->
        <div class="report-title">查询列表</div>

        <!-- 筛选栏 -->
        <div class="filter-bar">
          <!-- 搜索框与按钮（修复放大镜不显示问题） -->
          <div class="search-wrapper">
            <el-input
              v-model="filters.keyword"
              placeholder="请输入关键词搜索"
              class="search-input"
              @keyup.enter="handleSearch"
            />
            <button class="search-btn" @click="handleSearch">
              <el-icon><Search /></el-icon>
            </button>
          </div>

          <div class="filter-item">
            <span class="filter-label">层级</span>
            <el-select v-model="filters.level" placeholder="全部" clearable class="filter-select">
              <el-option v-for="item in levelOptions" :key="item" :label="item" :value="item" />
            </el-select>
          </div>

          <div class="filter-item">
            <span class="filter-label">展现</span>
            <el-select v-model="filters.showStatus" placeholder="请选择" clearable class="filter-select">
              <el-option label="已展现" value="SUCCESS" />
              <el-option label="未展现" value="FAIL" />
            </el-select>
          </div>

          <div class="filter-item">
            <span class="filter-label">舆情</span>
            <el-select v-model="filters.sentiment" placeholder="全部" clearable class="filter-select">
              <el-option label="正面" value="positive" />
              <el-option label="负面" value="negative" />
              <el-option label="中性" value="neutral" />
            </el-select>
          </div>

          <div class="filter-item">
            <span class="filter-label">平台</span>
            <el-select v-model="filters.platform" placeholder="请选择" clearable class="filter-select">
              <el-option v-for="p in platformOptions" :key="p.value" :label="p.label" :value="p.value" />
            </el-select>
          </div>

          <div class="filter-item">
            <span class="filter-label">查询状态</span>
            <el-select v-model="filters.status" placeholder="请选择" clearable class="filter-select">
              <el-option v-for="s in statusOptions" :key="s.value" :label="s.label" :value="s.value" />
            </el-select>
          </div>

          <button class="btn btn-primary btn-query" @click="handleSearch">查询</button>
        </div>

        <!-- 批量操作 -->
        <div class="action-bar">
          <button class="btn btn-outline" @click="exportCsv(false)">导出详情</button>
          <button class="btn btn-outline" @click="onExportReport">导出问答</button>
          <button class="btn btn-outline" @click="exportCsv(true)">导出联网记录</button>
          <button class="btn btn-primary" @click="onBatchExecute">重新执行</button>
          <button class="btn btn-outline btn-danger" :disabled="!selectedIds.length" @click="onBatchDelete">删除选中</button>
        </div>

        <!-- 结果表 -->
        <div class="table-container">
          <el-table ref="tableRef" v-loading="resultsLoading" :data="pagedResults" row-key="id" size="small" @selection-change="onSelectionChange">
            <el-table-column type="selection" width="42" reserve-selection />
            <el-table-column label="询问词" min-width="200" show-overflow-tooltip>
              <template #default="{ row }">{{ row.questionText || '-' }}</template>
            </el-table-column>
            <el-table-column label="层级" width="90">
              <template #default="{ row }">{{ row.level || '-' }}</template>
            </el-table-column>
            <el-table-column label="标签" width="90">
              <template #default="{ row }">{{ row.tag || '-' }}</template>
            </el-table-column>
            <el-table-column label="关键词" width="100">
              <template #default="{ row }">{{ row.keyword || '-' }}</template>
            </el-table-column>
            
            <el-table-column label="展现" width="70" align="center">
              <template #default="{ row }">
                <span v-if="row.showStatus === 'SUCCESS'" class="show-status show-yes">✓</span>
                <span v-else class="show-status show-no">✗</span>
              </template>
            </el-table-column>
            
            <el-table-column label="品牌" width="100" align="center" show-overflow-tooltip>
              <template #default="{ row }">{{ row.brand || '-' }}</template>
            </el-table-column>
            
            <!-- 舆情列：未展现的不显示舆情 -->
            <el-table-column label="舆情" width="90" align="center">
              <template #default="{ row }">
                <template v-if="row.showStatus === 'SUCCESS' && row.sentiment">
                  <div class="sentiment-wrap">
                    <span class="sentiment-dot" :class="row.sentiment"></span>
                    <span>{{ SENTIMENT_MAP[row.sentiment]?.label || row.sentiment }}</span>
                  </div>
                </template>
                <span v-else class="cell-muted">-</span>
              </template>
            </el-table-column>
            
            <el-table-column label="平台" width="110">
              <template #default="{ row }">{{ row.aiDisplayName || '-' }}</template>
            </el-table-column>
            <el-table-column label="查询时间" width="150">
              <template #default="{ row }">{{ formatDateTime(row.queryTime || row.createdAt) }}</template>
            </el-table-column>
            <el-table-column label="查询状态" width="96">
              <template #default="{ row }"><StatusTag :status="row.status" kind="result" /></template>
            </el-table-column>
            <el-table-column label="查询结果" width="170">
              <template #default="{ row }">
                <span v-if="row.status === 'SUCCESS'" class="link-text" @click="openQa(row)">问答</span>
                <span v-if="row.status === 'SUCCESS'" class="link-text" @click="openRanking(row)">排名</span>
                <span v-if="row.screenshotUrls?.length" class="link-text" @click="openScreenshots(row)">截图</span>
                <span v-if="row.status !== 'SUCCESS' && !row.screenshotUrls?.length" class="cell-muted">-</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="200" fixed="right">
              <template #default="{ row }">
                <span class="link-text" @click="openNetwork(row)">查询记录</span>
                <span class="link-text" @click="onRetryOne(row)">重新执行</span>
                <span class="link-danger" :class="{ 'is-disabled': row.status === 'RUNNING' }" @click="handleDeleteClick(row)">删除</span>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <!-- 🌟 分页：完全替换为 el-pagination，完美复刻图2 -->
        <div class="pagination-wrapper">
          <el-pagination
            v-model:current-page="page"
            v-model:page-size="pageSize"
            :total="filteredResults.length"
            :page-sizes="[10, 20, 50, 100]"
            layout="total, prev, pager, next, sizes, jumper"
            background
          />
        </div>
      </div>
    </div>

    <!-- 弹窗部分 -->
    <el-dialog v-model="qa.show" title="问答详情" width="720px" align-center>
      <div class="qa-section">
        <div class="qa-label">问题</div>
        <div class="qa-text">{{ qa.questionText }}</div>
      </div>
      <div class="qa-section">
        <div class="qa-label">思考过程</div>
        <div class="qa-text markdown-body" v-html="qa.thinkingContent" />
      </div>
      <div class="qa-section">
        <div class="qa-label">回答结果</div>
        <div class="qa-text markdown-body" v-html="qa.answerText" />
      </div>
    </el-dialog>

    <el-dialog v-model="ranking.show" title="品牌出现顺序排名" width="620px" align-center>
      <div v-loading="ranking.loading">
        <div class="ranking-head">
          <span>询问：{{ ranking.questionText }}</span>
          <span>平台：{{ ranking.aiDisplayName }}</span>
        </div>
        <el-table :data="ranking.brandRankings" size="small" border>
          <el-table-column label="名次" width="80" align="center">
            <template #default="{ row }">
              <span v-if="row.rank" class="rank-badge" :class="rankClass(row.rank)">{{ row.rank }}</span>
              <span v-else class="rank-none">-</span>
            </template>
          </el-table-column>
          <el-table-column label="品牌名称" prop="brandName" />
          <el-table-column label="品牌类型" width="120">
            <template #default="{ row }">
              <el-tag v-if="row.isSelfBrand" size="small" type="success">自主品牌</el-tag>
              <el-tag v-else size="small" type="info">竞品品牌</el-tag>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-dialog>

    <el-dialog v-model="screenshot.show" title="截图预览" width="760px" align-center>
      <div class="screenshot-grid">
        <el-image v-for="(url, i) in screenshot.urls" :key="url + i" :src="url" :preview-src-list="screenshot.urls" :initial-index="i" fit="contain" class="screenshot-item" />
      </div>
    </el-dialog>

    <el-dialog v-model="network.show" title="查询记录" width="900px" align-center>
      <el-table :data="network.sources" size="small" border>
        <el-table-column label="引用序号" width="80" align="center">
          <template #default="{ row }">{{ row.index }}</template>
        </el-table-column>
        <el-table-column label="网站名称" width="140">
          <template #default="{ row }">{{ row.siteName }}</template>
        </el-table-column>
        <el-table-column label="标题" min-width="220" show-overflow-tooltip>
          <template #default="{ row }">{{ row.title }}</template>
        </el-table-column>
        <el-table-column label="地址" min-width="260" show-overflow-tooltip>
          <template #default="{ row }"><a :href="row.url" target="_blank" rel="noopener">{{ row.url }}</a></template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { TableInstance } from 'element-plus'
import { Search, ArrowDown } from '@element-plus/icons-vue'
import StatusTag from '@/components/StatusTag.vue'
import { RESULT_STATUS_MAP, SENTIMENT_MAP, platformLabel } from '@/types/enums'
import { formatDateTime, formatDateTimeDot, parseSourceInfo } from '@/utils/format'
import { renderMarkdown } from '@/utils/markdown'
import { projectPath } from '@/utils/projectPath'
import { useTaskStore } from '@/store/task'
import { getTask, getProgress, getResults, getRankings, retryResult, deleteResult, batchDeleteResults } from '@/api/task'
import { EMPTY_MOCK_FIELDS, MOCK_LEVELS, mockFieldsFor } from '@/mock'
import { USE_MOCK } from '@/mock/flag'
import type { TaskResultMockFields } from '@/mock'
import type { Task, TaskResultVO, TaskRankingVO, BrandRankingItem } from '@/types/task'

interface EnrichedResult extends TaskResultVO { mock: TaskResultMockFields }

const route = useRoute()
const router = useRouter()
const taskStore = useTaskStore()

const taskNo = route.params.taskNo as string
const projectId = route.params.projectId as string | undefined
const currentTask = ref<Task | null>(taskStore.currentTask || null)
const progress = reactive({ total: 0, completed: 0, failed: 0, percentage: 0 })
const results = ref<TaskResultVO[]>([])
const resultsLoading = ref(false)
const selectedIds = ref<number[]>([])
const rankingVO = ref<TaskRankingVO | null>(null)
const tableRef = ref<TableInstance>()

const page = ref(1)
// 🌟 改为 ref，支持 el-pagination 切换每页条数
const pageSize = ref(10)
const filters = reactive({ keyword: '', level: '', showStatus: '', sentiment: '', platform: '', status: '' })

let progressTimer: number | undefined
let resultTimer: number | undefined

const qa = reactive({ show: false, questionText: '', thinkingContent: '', answerText: '' })
const ranking = reactive({ show: false, loading: false, questionText: '', aiDisplayName: '', brandRankings: [] as BrandRankingItem[] })
const screenshot = reactive({ show: false, urls: [] as string[] })
const network = reactive({ show: false, sources: [] as ReturnType<typeof parseSourceInfo> })

const headerSubtitle = computed(() => {
  const count = currentTask.value?.totalQuestionCount || progress.total || 0
  const time = currentTask.value?.completedAt || currentTask.value?.updatedAt || new Date().toISOString()
  return `基于 ${count} 个询问句访问进行的监测数据更新：${formatDateTimeDot(time)}`
})

const statusOptions = Object.entries(RESULT_STATUS_MAP).map(([value, meta]) => ({ value, label: meta.label }))

const platformOptions = computed(() => {
  const map = new Map<string, string>()
  results.value.forEach(r => { if (r.aiPlatform) map.set(r.aiPlatform, platformLabel(r.aiPlatform)) })
  return Array.from(map.entries()).map(([value, label]) => ({ value, label }))
})

const enrichedResults = computed<EnrichedResult[]>(() =>
  results.value.map(r => ({ ...r, mock: USE_MOCK ? mockFieldsFor(r.questionText || '') : EMPTY_MOCK_FIELDS }))
)

const levelOptions = computed(() => {
  const set = new Set<string>()
  results.value.forEach(r => { if (r.level) set.add(r.level) })
  return Array.from(set)
})

const filteredResults = computed<EnrichedResult[]>(() => {
  const kw = filters.keyword.trim().toLowerCase()
  return enrichedResults.value.filter(r => {
    if (kw) {
      const haystack = `${r.questionText || ''} ${r.keyword || ''}`.toLowerCase()
      if (!haystack.includes(kw)) return false
    }
    if (filters.level && r.level !== filters.level) return false
    if (filters.showStatus && r.showStatus !== filters.showStatus) return false
    if (filters.sentiment && r.sentiment !== filters.sentiment) return false
    if (filters.platform && r.aiPlatform !== filters.platform) return false
    if (filters.status && r.status !== filters.status) return false
    return true
  })
})

// 🌟 使用 pageSize.value 计算分页
const pagedResults = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return filteredResults.value.slice(start, start + pageSize.value)
})

// 监听筛选条件变化，重置回第一页
watch(filters, () => { page.value = 1 })

function handleSearch() {
  page.value = 1
}

function isRunning(status?: string): boolean { return status === 'RUNNING' || status === 'PROCESSING' }
function rankClass(rank: number): string { return rank === 1 ? 'rank-1' : rank <= 3 ? 'rank-3' : 'rank-normal' }
function onSelectionChange(rows: EnrichedResult[]) { selectedIds.value = rows.map(r => r.id) }

async function loadProgress() {
  try { const data = await getProgress(taskNo); progress.total = data.totalCount || 0; progress.completed = data.completedCount || 0; progress.failed = data.failedCount || 0; progress.percentage = data.percentage || 0 } catch {}
}
async function loadResults() {
  resultsLoading.value = true
  try { results.value = await getResults(taskNo) } catch { results.value = [] } finally { resultsLoading.value = false }
}
async function loadRankings() {
  try { rankingVO.value = await getRankings(taskNo) } catch { rankingVO.value = null }
}

function openQa(row: TaskResultVO) {
  qa.questionText = row.questionText || ''; qa.thinkingContent = row.thinkingContent || '暂无思考内容'; qa.answerText = row.answerText || '暂无回答'; qa.show = true
}

async function openRanking(row: TaskResultVO) {
  ranking.show = true; ranking.loading = true; ranking.questionText = row.questionText || ''; ranking.aiDisplayName = row.aiDisplayName || ''; ranking.brandRankings = []
  if (!rankingVO.value) await loadRankings()
  const qr = rankingVO.value?.questionRankings?.find(q => q.resultId === row.id)
  if (qr?.brandRankings) { ranking.brandRankings = qr.brandRankings } else {
    const brands: BrandRankingItem[] = []
    if (rankingVO.value?.brandName) brands.push({ brandName: rankingVO.value.brandName, isSelfBrand: true, rank: null })
    rankingVO.value?.competitorBrands?.forEach(b => brands.push({ brandName: b, isSelfBrand: false, rank: null }))
    ranking.brandRankings = brands
  }
  ranking.loading = false
}

function openScreenshots(row: TaskResultVO) { screenshot.urls = row.screenshotUrls || []; screenshot.show = true }
function openNetwork(row: TaskResultVO) { network.sources = parseSourceInfo(row.sourceInfo); network.show = true }

async function onRetryOne(row: TaskResultVO) { await retryResult(row.id); ElMessage.success('已重新调度'); loadProgress(); loadResults() }
async function onDeleteOne(row: EnrichedResult) {
  await ElMessageBox.confirm('确定删除该问题？删除后不再出现在报告中。', '提示', { type: 'warning' })
  await deleteResult(row.id); ElMessage.success('已删除'); selectedIds.value = selectedIds.value.filter(id => id !== row.id); loadResults(); loadProgress()
}
function handleDeleteClick(row: EnrichedResult) { if (row.status === 'RUNNING') return; onDeleteOne(row) }

async function onBatchDelete() {
  if (!selectedIds.value.length) return
  await ElMessageBox.confirm(`确定删除选中的 ${selectedIds.value.length} 个问题？`, '提示', { type: 'warning' })
  await batchDeleteResults(selectedIds.value); ElMessage.success('已批量删除'); tableRef.value?.clearSelection(); selectedIds.value = []; loadResults(); loadProgress()
}

function onBatchExecute() { if (!selectedIds.value.length) return ElMessage.warning('请先勾选要执行的询问句'); ElMessage.info(`已选中 ${selectedIds.value.length} 条，批量执行接口待后端提供`) }
function onExportReport() { ElMessage.info('导出报告接口待后端提供') }
function goReport() { taskStore.setCurrentTask(currentTask.value); router.push({ path: projectPath(projectId, 'monitor/analysis'), query: { taskNo } }) }
function goBack() { router.push(projectPath(projectId, 'monitor/tasks')) }

function exportCsv(includeNetwork: boolean) {
  if (!selectedIds.value.length) return ElMessage.warning('请先勾选要导出的询问句')
  const selected = results.value.filter(r => selectedIds.value.includes(r.id))
  const escape = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`
  let rows: string[][]; let headers: string[]
  if (includeNetwork) {
    headers = ['询问句', '网站名称', '地址', '标题']
    rows = selected.flatMap(r => { const sources = parseSourceInfo(r.sourceInfo); return (sources.length ? sources : [{} as any]).map(s => [r.questionText || '', s.siteName || '', s.url || '', s.title || '']) })
  } else {
    headers = ['询问句', '品牌', '舆情', '平台', '展现', '查询时间', '查询状态']
    rows = selected.map(r => [r.questionText || '', r.brand || '-', SENTIMENT_MAP[r.sentiment || '']?.label || '未提及', r.aiDisplayName || '-', r.showStatus === 'SUCCESS' ? '是' : '否', formatDateTime(r.queryTime || r.createdAt), r.status || '-'])
  }
  const csv = '﻿' + [headers, ...rows].map(row => row.map(escape).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' }); const url = URL.createObjectURL(blob); const a = document.createElement('a')
  a.href = url; a.download = `${currentTask.value?.title || '观测任务'}-${includeNetwork ? '查询记录' : '详情'}.csv`; a.click(); URL.revokeObjectURL(url); ElMessage.success('导出成功')
}

onMounted(async () => {
  if (!taskStore.currentTask) {
    try {
      currentTask.value = await getTask(taskNo)
    } catch {
      currentTask.value = taskStore.currentTask
    }
  } else {
    try {
      const freshTask = await getTask(taskNo)
      currentTask.value = freshTask
      taskStore.setCurrentTask(freshTask as any) 
    } catch { /* 忽略静默更新的错误 */ }
  }

  await Promise.all([loadProgress(), loadResults(), loadRankings()])
  
  if (isRunning(currentTask.value?.status)) {
    progressTimer = window.setInterval(loadProgress, 2000)
    resultTimer = window.setInterval(loadResults, 3000)
  }
})

onBeforeUnmount(() => { if (progressTimer) clearInterval(progressTimer); if (resultTimer) clearInterval(resultTimer) })
</script>

<style scoped lang="scss">
.task-detail {
  --primary-color: #1677ff;
  --primary-hover: #4096ff;
  --danger-color: #ff4d4f;
  --border-color: #ebebeb;
  --text-main: #333;
  --text-sub: #888;

  padding: 20px;
  font-size: 14px;
  color: var(--text-main);
  background-color: #f4f6f9;
  min-height: 100%;

  .page-container {
    background-color: #fff;
    border-radius: 4px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.05);
    display: flex;
    flex-direction: column;
    min-height: 80vh;
  }

  /* 统一 Header */
  .page-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 24px;
    border-bottom: 1px solid var(--border-color);
  }
  .header-left { min-width: 0; display: flex; align-items: baseline; }
  .header-title { margin: 0; display: flex; align-items: baseline; flex-wrap: wrap; gap: 8px; }
  .project-name { font-size: 18px; font-weight: bold; color: #000; }
  .header-subtitle { font-size: 12px; font-weight: normal; color: var(--text-sub); }
  .header-right { display: flex; flex-shrink: 0; align-items: center; gap: 16px; font-size: 13px; }
  .header-link {
    display: inline-flex; align-items: center; gap: 4px; padding: 4px 8px; cursor: pointer; color: var(--text-main); border-radius: 4px; transition: all 0.2s;
    &:hover { color: var(--primary-color); }
    .caret-icon { font-size: 12px; }
  }
  .close-btn { padding: 4px 16px; border: 1px solid var(--border-color); border-radius: 4px; cursor: pointer; transition: all 0.2s; &:hover { border-color: var(--primary-color); color: var(--primary-color); } }

  /* 统一 Tab */
  .tab-bar { display: flex; gap: 24px; padding: 0 24px; border-bottom: 1px solid var(--border-color); background: #fff; }
  .tab-item {
    position: relative; padding: 12px 0; font-size: 14px; color: var(--text-sub); cursor: pointer;
    &:hover { color: var(--text-main); }
    &.active { color: var(--primary-color); font-weight: 500; &::after { content: ''; position: absolute; left: 0; right: 0; bottom: -1px; height: 2px; background-color: var(--primary-color); } }
  }

  /* 内容区 */
  .main-content { padding: 20px 24px; display: flex; flex-direction: column; gap: 16px; }
  .report-title { font-size: 14px; font-weight: 600; color: #1f2329; }

  /* 筛选栏 */
  .filter-bar { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; }
  .filter-item { display: flex; align-items: center; gap: 6px; font-size: 13px; color: var(--text-sub); flex-shrink: 0; }
  .filter-label { white-space: nowrap; }
  
  /* 🌟 搜索框重构：Flex 布局确保 100% 显示按钮 */
  .search-wrapper {
    display: flex;
    align-items: center;
    width: 240px;
    flex-shrink: 0;
  }
  .search-input {
    flex: 1;
    :deep(.el-input__wrapper) {
      border-top-right-radius: 0;
      border-bottom-right-radius: 0;
      box-shadow: 0 0 0 1px var(--border-color) inset;
      &:hover { box-shadow: 0 0 0 1px var(--primary-hover) inset; }
      &.is-focus { box-shadow: 0 0 0 1px var(--primary-color) inset; }
    }
  }
  .search-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 30px;
    background-color: var(--primary-color);
    color: #fff;
    border: none;
    border-top-right-radius: 4px;
    border-bottom-right-radius: 4px;
    cursor: pointer;
    transition: all 0.2s;
    flex-shrink: 0;
    &:hover { background-color: var(--primary-hover); }
    .el-icon { font-size: 14px; }
  }

  .filter-select { width: 100px; }
  .btn-query { margin-left: 4px; }

  /* 操作栏 */
  .action-bar { display: flex; justify-content: flex-end; gap: 12px; padding: 4px 0; }

  /* 按钮 */
  .btn { padding: 6px 16px; font-size: 13px; border: none; border-radius: 4px; cursor: pointer; transition: all 0.2s; &:disabled { opacity: 0.5; cursor: not-allowed; } }
  .btn-primary { color: #fff; background-color: var(--primary-color); &:hover:not(:disabled) { background-color: var(--primary-hover); } }
  .btn-outline { color: var(--text-main); background: #fff; border: 1px solid var(--border-color); &:hover:not(:disabled) { color: var(--primary-color); border-color: var(--primary-color); } }
  .btn-danger { color: var(--danger-color); &:hover:not(:disabled) { color: var(--danger-color); border-color: var(--danger-color); } }

  /* 表格与分页 */
  .table-container { flex: 1; overflow-x: auto; }
  
  /* 展现状态 */
  .show-status {
    font-size: 14px;
    font-weight: bold;
    &.show-yes { color: #52c41a; }
    &.show-no { color: var(--danger-color); }
  }

  /* 舆情状态（颜色修复） */
  .sentiment-wrap {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
  }
  .sentiment-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: #d9d9d9;
    &.positive { background-color: #52c41a; }
    &.negative { background-color: #ff4d4f; }
    &.neutral { background-color: #d9d9d9; }
  }

  .cell-muted { color: #c0c4cc; }
  .link-text { margin-right: 8px; font-size: 13px; color: var(--primary-color); cursor: pointer; &:hover { text-decoration: underline; } }
  .link-danger { font-size: 13px; color: var(--danger-color); cursor: pointer; &:hover { text-decoration: underline; } &.is-disabled { color: #c0c4cc; cursor: not-allowed; pointer-events: none; } }

  /* 🌟 分页样式（替代了之前的手写分页） */
  .pagination-wrapper {
    display: flex;
    justify-content: flex-end;
    padding-top: 16px;
    border-top: 1px solid var(--border-color);
  }

  /* 弹窗内部样式 */
  .qa-section { margin-bottom: 18px; .qa-label { margin-bottom: 6px; font-size: 13px; font-weight: 600; color: #6b7280; } .qa-text { max-height: 360px; padding: 12px 14px; overflow: auto; font-size: 13px; line-height: 1.7; color: #242932; white-space: pre-wrap; background: #f8f9fb; border-radius: 8px; } }
  .ranking-head { display: flex; gap: 24px; margin-bottom: 12px; font-size: 13px; color: #6b7280; }
  .rank-badge { display: inline-flex; align-items: center; justify-content: center; width: 22px; height: 22px; font-size: 12px; font-weight: 600; border-radius: 6px; &.rank-1 { color: #b8860b; background: #fff3cd; } &.rank-3 { color: #3662ec; background: #ebeffd; } &.rank-normal { color: #6b7280; background: #f3f4f6; } }
  .rank-none { color: #c0c4cc; }
  .screenshot-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; .screenshot-item { width: 100%; height: 200px; background: #f8f9fb; border: 1px solid #eef0f4; border-radius: 8px; } }

  /* Element Plus 覆盖 */
  :deep(.el-select) { .el-select__wrapper { min-height: 30px; padding: 0 10px; font-size: 13px; border-radius: 4px; box-shadow: 0 0 0 1px var(--border-color) inset; transition: box-shadow 0.2s; &:hover { box-shadow: 0 0 0 1px var(--primary-hover) inset; } &.is-focused { box-shadow: 0 0 0 1px var(--primary-color) inset; } } .el-select__placeholder { font-size: 13px; color: #bbb; &.is-transparent { color: var(--text-main); } } }
  :deep(.el-table) {
    --el-table-border-color: var(--border-color); --el-table-header-text-color: var(--text-main); --el-table-text-color: var(--text-main); --el-table-row-hover-bg-color: #fafafa; width: 100%; font-size: 13px;
    &::before, .el-table__inner-wrapper::before { display: none; }
    th.el-table__cell { padding: 12px 0; font-size: 13px; font-weight: bold; color: var(--text-main); background-color: #fff; border-bottom: 1px solid var(--border-color); .cell { padding: 0 8px; font-weight: bold; } }
    td.el-table__cell { padding: 12px 0; border-bottom: 1px solid var(--border-color); .cell { padding: 0 8px; line-height: 1.6; } }
    .el-table__body tr:hover > td.el-table__cell { background-color: #fafafa; }
    .el-table-fixed-column--right.is-first-column::before, .el-table-fixed-column--left.is-last-column::before { box-shadow: none; }
  }
  :deep(.el-table__empty-block) { min-height: 160px; }
  :deep(.el-table__empty-text) { font-size: 13px; color: var(--text-sub); }
  :deep(.el-tag) { border-radius: 4px; }
  
  /* el-pagination 深度样式适配 */
  :deep(.el-pagination) {
    --el-pagination-font-size: 13px;
    --el-pagination-button-bg-color: #f4f6f9;
    --el-pagination-hover-color: var(--primary-color);
    font-size: 13px;
    .el-pagination__sizes { margin-right: 10px; }
    .el-pagination__jump { margin-left: 10px; }
    .el-pagination__total { color: var(--text-sub); }
  }
}

:global(.el-dialog) { border-radius: 8px; .el-dialog__header { padding: 16px 20px; margin-right: 0; border-bottom: 1px solid #ebebeb; } .el-dialog__title { font-size: 15px; font-weight: 600; color: #1f2329; } .el-dialog__body { padding: 16px 20px; } .el-dialog__headerbtn { top: 12px; } }
</style>
