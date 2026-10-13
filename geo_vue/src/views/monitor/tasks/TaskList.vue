<template>
  <div class="task-list">
    <div class="page-header">
      <div class="page-title">
        监测任务
      </div>
      <div class="header-actions">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索项目名称"
          clearable
          class="search-input"
          @keyup.enter="page = 1"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-button
          type="primary"
          :icon="Plus"
          @click="goCreate"
        >
          新建任务
        </el-button>
      </div>
    </div>

    <div
      v-loading="loading"
      class="task-grid"
    >
      <el-card
        v-for="task in pagedTasks"
        :key="task.taskNo"
        class="task-card"
        shadow="never"
      >
        <div class="task-card-head">
          <div class="task-title-line">
            <el-tag
              v-if="task.scope === 'GLOBAL'"
              size="small"
              type="warning"
              effect="plain"
            >
              全局
            </el-tag>
            <span
              class="task-title"
              :title="task.title || '未命名任务'"
            >{{ task.title || '未命名任务' }}</span>
          </div>
          <div class="task-head-icons">
            <el-button
              link
              class="head-icon"
              :icon="Edit"
              title="编辑"
              @click="onEdit"
            />
            <el-button
              v-if="['PENDING', 'COMPLETED', 'FAILED', 'PARTIAL_FAILED'].includes(task.status)"
              link
              class="head-icon danger"
              :icon="Delete"
              title="删除"
              @click="onDelete(task)"
            />
          </div>
        </div>

        <div class="task-progress">
          <div class="progress-bar">
            <el-progress
              :percentage="progressOf(task)"
              :status="task.status === 'COMPLETED' ? 'success' : undefined"
              :stroke-width="8"
            />
          </div>
          <span class="progress-percent">{{ progressOf(task) }}%</span>
          <StatusTag :status="task.status" />
        </div>

        <div class="task-meta">
          <div class="meta-row">
            <span>意图词/询问词</span><b>{{ task.intentCount || 0 }}/{{ task.questionCount || 0 }}</b>
          </div>
          <div class="meta-row">
            <span>频次</span><b>{{ frequencyLabel(task.executionFrequency) }}</b>
          </div>
          <div
            v-if="isPeriodic(task.executionFrequency)"
            class="meta-row"
          >
            <span>下次开始的时间</span><b>{{ formatDateTime(task.nextRunTime) }}</b>
          </div>
        </div>

        <div class="task-actions">
          <el-button
            v-if="canShowHistory(task)"
            size="small"
            @click="openHistory(task)"
          >
            历史报告
          </el-button>
          <el-button
            v-if="task.status === 'PENDING'"
            size="small"
            type="primary"
            @click="onSubmit(task)"
          >
            开始任务
          </el-button>
          <el-button
            v-if="isRunning(task.status)"
            size="small"
            type="warning"
            @click="onPause(task)"
          >
            暂停
          </el-button>
          <el-button
            v-if="task.status === 'PAUSED'"
            size="small"
            type="primary"
            @click="onResume(task)"
          >
            恢复
          </el-button>
          <el-button
            v-if="isRunning(task.status) || task.status === 'PAUSED'"
            size="small"
            type="danger"
            plain
            @click="onStop(task)"
          >
            终止任务
          </el-button>
          <el-button
            v-if="['COMPLETED', 'PARTIAL_FAILED', 'FAILED'].includes(task.status)"
            size="small"
            @click="onRetryAll(task)"
          >
            重新执行
          </el-button>
          <el-button
            size="small"
            type="primary"
            plain
            @click="goDetail(task)"
          >
            查看详情
          </el-button>
        </div>

        <div class="task-ai-web">
          <span class="ai-items"><span class="ai-key">Web：</span><span class="ai-value">{{ platformText(task, false) }}</span></span>
        </div>
        <div class="task-ai-app">
          <span class="ai-item"><span class="ai-key">App：</span><span class="ai-value">{{ platformText(task, true) }}</span></span>
        </div>
      </el-card>
    </div>

    <el-empty
      v-if="!loading && filteredTasks.length === 0"
      description="暂无监测任务"
    />

    <div
      v-if="filteredTasks.length > 0"
      class="pagination-wrap"
    >
      <el-pagination
        v-model:current-page="page"
        :page-size="pageSize"
        :total="filteredTasks.length"
        layout="total, prev, pager, next"
        background
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Delete, Edit, Plus, Search } from '@element-plus/icons-vue'
import StatusTag from '@/components/StatusTag.vue'
import { AI_PLATFORMS, FREQUENCY_MAP } from '@/types/enums'
import { formatDateTime } from '@/utils/format'
import { projectPath } from '@/utils/projectPath'
import {
  listTasks,
  getResults,
  submitTask,
  pauseTask,
  resumeTask,
  stopTask,
  retryAll,
  deleteTask
} from '@/api/task'
import type { Task, TaskResultVO } from '@/types/task'

const route = useRoute()
const router = useRouter()

/** 当前项目 ID，页面内跳转都要带上它 */
const projectId = computed(() => route.params.projectId as string | undefined)

const loading = ref(false)
const tasks = ref<Task[]>([])
const searchKeyword = ref('')
const page = ref(1)
const pageSize = 12

interface PlatformItem {
  code: string
  label: string
  isApp: boolean
}

const platformMap = ref<Record<string, PlatformItem[]>>({})

const filteredTasks = computed(() => {
  const kw = searchKeyword.value.trim().toLowerCase()
  if (!kw) return tasks.value
  return tasks.value.filter(t => (t.title || '').toLowerCase().includes(kw))
})

const pagedTasks = computed(() => {
  const start = (page.value - 1) * pageSize
  return filteredTasks.value.slice(start, start + pageSize)
})

function progressOf(task: Task): number {
  if (!task.totalCount) return 0
  return Math.round((task.completedCount / task.totalCount) * 100)
}

function frequencyLabel(f?: string): string {
  return FREQUENCY_MAP[f || ''] ?? f ?? '-'
}

/** 仅「每周 / 每月」这类周期任务才显示下次执行时间 */
function isPeriodic(f?: string): boolean {
  return f === 'weekly' || f === 'monthly'
}

function taskPlatforms(task: Task): PlatformItem[] {
  return platformMap.value[task.taskNo] ?? []
}

/** Web / App 平台名拼接（无则返回 '-'） */
function platformText(task: Task, isApp: boolean): string {
  const items = taskPlatforms(task).filter(p => p.isApp === isApp)
  return items.length ? items.map(p => p.label).join('、') : '-'
}

function isRunning(status: string): boolean {
  return status === 'RUNNING' || status === 'PROCESSING'
}

async function fetchList() {
  loading.value = true
  try {
    tasks.value = await listTasks(projectId.value)
    fetchPlatforms()
  } catch {
    tasks.value = []
  } finally {
    loading.value = false
  }
}

/** 从每个任务的结果明细推导所选 AI 平台（Web/App）；后端列表接口不直接返回平台清单 */
async function fetchPlatforms() {
  const list = tasks.value
  if (!list.length) {
    platformMap.value = {}
    return
  }
  const settled = await Promise.allSettled(list.map(t => getResults(t.taskNo)))
  const map: Record<string, PlatformItem[]> = {}
  list.forEach((t, i) => {
    const r = settled[i]
    if (r.status !== 'fulfilled') return
    const codes = new Set<string>()
    ;(r.value as TaskResultVO[]).forEach(res => {
      if (res.aiPlatform) codes.add(res.aiPlatform)
    })
    const items = AI_PLATFORMS.filter(p => codes.has(p.value)).map(p => ({
      code: p.value,
      label: p.label,
      isApp: p.value.endsWith('_app')
    }))
    if (items.length) map[t.taskNo] = items
  })
  platformMap.value = map
}

async function onSubmit(task: Task) {
  await submitTask(task.taskNo, { executionFrequency: task.executionFrequency || 'single' })
  ElMessage.success('任务已提交')
  fetchList()
}

async function onPause(task: Task) {
  await pauseTask(task.taskNo)
  ElMessage.success('任务已暂停')
  fetchList()
}

async function onResume(task: Task) {
  await resumeTask(task.taskNo)
  ElMessage.success('任务已恢复')
  fetchList()
}

async function onStop(task: Task) {
  await ElMessageBox.confirm(`确定终止任务「${task.title}」？`, '提示', { type: 'warning' })
  await stopTask(task.taskNo)
  ElMessage.success('任务已终止')
  fetchList()
}

async function onRetryAll(task: Task) {
  await retryAll(task.taskNo)
  ElMessage.success('任务已重新调度')
  fetchList()
}

async function onDelete(task: Task) {
  await ElMessageBox.confirm(`确定删除任务「${task.title || '未命名任务'}」？`, '提示', { type: 'warning' })
  await deleteTask(task.taskNo)
  ElMessage.success('任务已删除')
  fetchList()
}

function goDetail(task: Task) {
  router.push(projectPath(projectId.value, `monitor/tasks/${task.taskNo}`))
}

function goCreate() {
  router.push(projectPath(projectId.value, 'monitor/tasks/create'))
}

function openHistory(task: Task) {
  router.push({ path: projectPath(projectId.value, 'monitor/analysis'), query: { taskNo: task.taskNo } })
}

function canShowHistory(task: Task): boolean {
  return task.status === 'COMPLETED' || task.status === 'PARTIAL_FAILED'
}

function onEdit() {
  ElMessage.info('后端暂未提供编辑任务接口')
}

onMounted(fetchList)
</script>

<style scoped lang="scss">
.task-list {
  .header-actions {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .search-input {
    width: 240px;
  }

  .task-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 16px;
    min-height: 120px;
  }

  .task-card {
    border-radius: 10px;
    border: 1px solid #eef0f4;
    transition: box-shadow 0.2s ease, border-color 0.2s ease;

    &:hover {
      border-color: #c3d0f9;
      box-shadow: 0 6px 20px rgba(54, 98, 236, 0.1);
    }

    :deep(.el-card__body) {
      padding: 16px;
    }
  }

  .task-card-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  .task-head-icons {
    display: flex;
    align-items: center;
    gap: 4px;
    flex-shrink: 0;
  }

  .head-icon {
    padding: 4px;
    font-size: 16px;
    color: #9aa1aa;

    &:hover {
      color: var(--el-color-primary);
    }

    &.danger:hover {
      color: #d03b3b;
    }
  }

  .task-title-line {
    display: flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
  }

  .task-title {
    font-size: 15px;
    font-weight: 600;
    color: #1f2329;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .task-progress {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 14px 0;

    .progress-bar {
      flex: 1;
      min-width: 0;
    }
  }

  .progress-percent {
    font-size: 12px;
    color: #6b7280;
    white-space: nowrap;
    font-variant-numeric: tabular-nums;
  }

  .task-ai-web {
    display: flex;
    flex-wrap: wrap;
    column-gap: 16px;
    row-gap: 4px;
    margin-top: 12px;
    font-size: 12px;

    .ai-item {
      display: inline-flex;
      align-items: baseline;
    }

    .ai-key {
      color: #9aa1aa;
      margin-right: 4px;
    }

    .ai-value {
      color: #4b5563;
      word-break: break-word;
    }
  }

  .task-ai-app {
    display: flex;
    flex-wrap: wrap;
    column-gap: 16px;
    row-gap: 4px;
    margin-top: 12px;
    font-size: 12px;

    .ai-item {
      display: inline-flex;
      align-items: baseline;
    }

    .ai-key {
      color: #9aa1aa;
      margin-right: 4px;
    }

    .ai-value {
      color: #4b5563;
      word-break: break-word;
    }
  }

  .task-meta {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-bottom: 14px;
  }

  .meta-row {
    display: flex;
    justify-content: space-between;
    font-size: 12px;

    span {
      color: #9aa1aa;
    }

    b {
      font-weight: 500;
      color: #4b5563;
    }
  }

  .task-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    padding-top: 12px;
    border-top: 1px solid #f0f2f5;

    :deep(.el-button) {
      margin: 0;
    }
  }

  .pagination-wrap {
    display: flex;
    justify-content: flex-end;
    margin-top: 20px;
  }
}
</style>
