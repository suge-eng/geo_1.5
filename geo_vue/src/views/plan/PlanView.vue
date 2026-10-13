<template>
  <div class="plan-view">
    <div class="page-header">
      <div class="page-title">
        监测计划
      </div>
      <div class="header-actions">
        <el-input
          v-model="keyword"
          placeholder="搜索项目名称"
          clearable
          class="search-input"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-button
          :icon="Refresh"
          @click="loadPlans"
        >
          刷新
        </el-button>
      </div>
    </div>

    <div class="stat-grid">
      <div class="card stat-tile">
        <div class="stat-value">
          {{ singleCount }}
        </div>
        <div class="stat-label">
          单次任务
        </div>
      </div>
      <div class="card stat-tile">
        <div class="stat-value">
          {{ dailyCount }}
        </div>
        <div class="stat-label">
          每天执行
        </div>
      </div>
      <div class="card stat-tile">
        <div class="stat-value">
          {{ weeklyCount }}
        </div>
        <div class="stat-label">
          每周执行
        </div>
      </div>
      <div class="card stat-tile">
        <div class="stat-value">
          {{ nextDueCount }}
        </div>
        <div class="stat-label">
          待执行计划
        </div>
      </div>
    </div>

    <div class="card">
      <div class="chart-title">
        定时执行计划
      </div>
      <el-table
        v-loading="loading"
        :data="filteredPlans"
        size="small"
        border
      >
        <el-table-column
          label="项目名称"
          min-width="200"
          show-overflow-tooltip
        >
          <template #default="{ row }">
            <span class="plan-title">{{ row.title || '未命名任务' }}</span>
          </template>
        </el-table-column>
        <el-table-column
          label="品牌"
          width="140"
        >
          <template #default="{ row }">
            {{ row.brandName || '-' }}
          </template>
        </el-table-column>
        <el-table-column
          label="执行频次"
          width="110"
        >
          <template #default="{ row }">
            <el-tag
              size="small"
              :type="frequencyTag(row.executionFrequency)"
              effect="light"
            >
              {{ frequencyLabel(row.executionFrequency) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          label="下次执行"
          width="170"
        >
          <template #default="{ row }">
            {{ formatDateTime(row.nextRunTime) }}
          </template>
        </el-table-column>
        <el-table-column
          label="状态"
          width="100"
        >
          <template #default="{ row }">
            <StatusTag :status="row.status" />
          </template>
        </el-table-column>
        <el-table-column
          label="操作"
          width="110"
          fixed="right"
        >
          <template #default="{ row }">
            <el-button
              link
              type="primary"
              size="small"
              @click="goDetail(row)"
            >
              查看详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-empty
        v-if="!loading && filteredPlans.length === 0"
        description="暂无定时执行计划"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Refresh, Search } from '@element-plus/icons-vue'
import StatusTag from '@/components/StatusTag.vue'
import { FREQUENCY_MAP } from '@/types/enums'
import { formatDateTime } from '@/utils/format'
import { listTasks } from '@/api/task'
import type { Task } from '@/types/task'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const tasks = ref<Task[]>([])
const keyword = ref('')

const singleCount = computed(() => tasks.value.filter(t => !t.executionFrequency || t.executionFrequency === 'single').length)
const dailyCount = computed(() => tasks.value.filter(t => t.executionFrequency === 'daily').length)
const weeklyCount = computed(() => tasks.value.filter(t => t.executionFrequency === 'weekly').length)

const nextDueCount = computed(() =>
  tasks.value.filter(t => {
    if (!t.nextRunTime) return false
    return t.executionFrequency === 'daily' || t.executionFrequency === 'weekly'
  }).length
)

const filteredPlans = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  return tasks.value.filter(t => {
    if (!(t.executionFrequency === 'daily' || t.executionFrequency === 'weekly')) return false
    if (kw && !(t.title || '').toLowerCase().includes(kw)) return false
    return true
  })
})

function frequencyLabel(f?: string): string {
  return FREQUENCY_MAP[f || ''] ?? f ?? '-'
}

function frequencyTag(f?: string): 'primary' | 'warning' | 'info' {
  if (f === 'daily') return 'primary'
  if (f === 'weekly') return 'warning'
  return 'info'
}

function goDetail(task: Task) {
  router.push(`/monitor/tasks/${task.taskNo}`)
}

async function loadPlans() {
  loading.value = true
  try {
    tasks.value = await listTasks(route.params.projectId as string | undefined)
  } catch {
    tasks.value = []
  } finally {
    loading.value = false
  }
}

onMounted(loadPlans)
</script>

<style scoped lang="scss">
.plan-view {
  .header-actions {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .search-input {
    width: 240px;
  }

  .card {
    background: #fff;
    border-radius: 10px;
    padding: 18px 20px;
    border: 1px solid #eef0f4;
    margin-bottom: 16px;
  }

  .stat-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    margin-bottom: 16px;
  }

  .stat-tile {
    margin-bottom: 0;
    text-align: center;
    padding: 20px 8px;

    .stat-value {
      font-size: 28px;
      font-weight: 700;
      color: #3662ec;
      line-height: 1;
    }

    .stat-label {
      margin-top: 8px;
      font-size: 12px;
      color: #9aa1aa;
    }
  }

  .chart-title {
    font-size: 14px;
    font-weight: 600;
    color: #1f2329;
    margin-bottom: 12px;
  }

  .plan-title {
    color: #1f2329;
    font-weight: 500;
  }
}
</style>



