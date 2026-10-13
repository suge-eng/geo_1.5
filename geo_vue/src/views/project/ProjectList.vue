<template>
  <div class="project-page">
    <!-- 顶部导航栏 -->
    <header class="project-header">
      <div class="header-inner">
        <div class="header-left">
          <div class="logo-mark">G</div>
          <div class="welcome">
            <span class="welcome-text">欢迎回来！</span>
            <span class="account-text">账号：{{ accountName }}</span>
          </div>
        </div>
        
        <div class="header-right">
          <el-dropdown trigger="hover" @command="handleCommand" popper-class="modern-dropdown">
            <div class="user-dropdown">
              <div class="avatar-circle">{{ authStore.avatarText }}</div>
              <span class="username">{{ accountName }}</span>
              <el-icon class="arrow-icon"><ArrowDown /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="edit">
                  <el-icon><Edit /></el-icon>编辑资料
                </el-dropdown-item>
                <el-dropdown-item command="logout" divided>
                  <el-icon><SwitchButton /></el-icon>退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
    </header>

    <!-- 主体内容区域 -->
    <main class="main-content">
      <div class="toolbar">
        <el-input
          v-model="keyword"
          placeholder="请输入项目名称或项目ID"
          clearable
          class="search-input"
          @keyup.enter="onSearch"
          @clear="onSearch"
        >
          <template #prefix><el-icon><Search /></el-icon></template>
        </el-input>
        <div class="toolbar-actions">
          <el-button type="primary" class="action-btn" @click="onSearch">查询</el-button>
          <el-button type="primary" :icon="Plus" class="action-btn" @click="openCreate">新建项目</el-button>
        </div>
      </div>

      <div v-loading="loading" class="project-grid">
        <!-- 核心修改点：将 click 改为 dblclick，并添加 user-select: none 防止双击选中文字 -->
        <div
          v-for="(project, index) in pagedProjects"
          :key="project.id"
          class="project-card"
          :style="{ animationDelay: `${index * 0.04}s` }"
          @dblclick="enterProject(project)"
          title="双击卡片可快速进入项目"
        >
          <div class="card-header">
            <div class="project-name" :title="project.name">{{ project.name }}</div>
            <div class="project-id">ID: {{ project.id }}</div>
          </div>
          <div class="card-body">
            <div class="info-row">
              <span class="info-label">套餐类型</span>
              <span class="info-value tag">{{ project.packageType }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">服务时间</span>
              <span class="info-value time-text">{{ project.serviceTime }}</span>
            </div>
          </div>
          
          <!-- 优化底部：左侧是双击提示，右侧是单击按钮 -->
          <div class="card-footer">
            <span class="dbl-tip">双击卡片进入</span>
            <el-button type="primary" size="small" class="enter-btn" @click.stop="enterProject(project)">进入项目</el-button>
          </div>
        </div>
      </div>

      <el-empty v-if="!loading && filteredProjects.length === 0" description="没有匹配的项目" class="empty-state" />

      <div v-if="!loading && filteredProjects.length > 0" class="pagination">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :total="filteredProjects.length"
          :page-sizes="[8, 16, 32]" 
          layout="total, prev, pager, next, sizes, jumper"
          background
        />
      </div>
    </main>

    <!-- 新建项目弹窗 -->
    <el-dialog
      v-model="createVisible"
      title="新建项目"
      width="520px" 
      append-to-body
      @closed="resetForm"
      class="modern-dialog"
      align-center
      :show-close="true"
      destroy-on-close
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-position="top" 
        class="modern-form"
      >
        <el-form-item label="项目名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入项目名称" maxlength="30" size="large" @keyup.enter="onSubmit" />
        </el-form-item>
        
        <el-form-item label="套餐类型" prop="packageType">
          <el-select v-model="form.packageType" placeholder="请选择服务套餐" class="full-width" size="large">
            <el-option v-for="pkg in PROJECT_PACKAGES" :key="pkg" :label="pkg" :value="pkg" />
          </el-select>
        </el-form-item>

        <el-form-item label="项目时间" required>
          <div class="date-range-wrapper">
            <el-date-picker
              v-model="form.startDate"
              type="date"
              placeholder="开始日期"
              value-format="YYYY-MM-DD"
              size="large"
              class="flex-date-picker"
              :disabled-date="(time: Date) => time.getTime() > new Date(form.endDate || Infinity).getTime()"
            />
            <span class="date-separator">-</span>
            <el-date-picker
              v-model="form.endDate"
              type="date"
              placeholder="结束日期"
              value-format="YYYY-MM-DD"
              size="large"
              class="flex-date-picker"
              :disabled-date="(time: Date) => time.getTime() < new Date(form.startDate || 0).getTime()"
            />
          </div>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <div class="modern-dialog-footer">
          <el-button size="large" @click="createVisible = false">取消</el-button>
          <el-button type="primary" size="large" :loading="submitting" @click="onSubmit">确认创建</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { Plus, Search, ArrowDown, Edit, SwitchButton } from '@element-plus/icons-vue'
import { createProject, listProjects } from '@/api/project'
import { PROJECT_PACKAGES } from '@/mock'
import { useAuthStore } from '@/store/auth'
import { projectPath } from '@/utils/projectPath'
import type { Project } from '@/types/project'

const router = useRouter()
const authStore = useAuthStore()
const accountName = computed(() => authStore.user?.nickname || '管理员')

/* ------------------------- 列表逻辑 ------------------------- */
const loading = ref(false)
const projects = ref<Project[]>([])
const keyword = ref('')
const activeKeyword = ref('')
const page = ref(1)
const pageSize = ref(8)

const filteredProjects = computed(() => {
  const kw = activeKeyword.value.trim().toLowerCase()
  if (!kw) return projects.value
  return projects.value.filter(p => p.name.toLowerCase().includes(kw) || p.id.includes(kw))
})

const pagedProjects = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return filteredProjects.value.slice(start, start + pageSize.value)
})

watch([filteredProjects, pageSize], () => { page.value = 1 })

async function fetchProjects() {
  loading.value = true
  try { projects.value = await listProjects() } 
  catch { projects.value = [] } 
  finally { loading.value = false }
}

function onSearch() { activeKeyword.value = keyword.value; page.value = 1 }
function enterProject(project: Project) { router.push(projectPath(project.id, 'monitor/tasks')) }
function handleCommand(command: string) {
  if (command === 'edit') ElMessage.info('点击了编辑资料（演示）')
  else if (command === 'logout') {
    authStore.logout(); ElMessage.success('已退出登录'); router.push('/login')
  }
}

/* ------------------------- 新建项目逻辑 ------------------------- */
const createVisible = ref(false)
const submitting = ref(false)
const formRef = ref<FormInstance>()

const form = reactive({
  name: '',
  packageType: '',
  startDate: '',
  endDate: ''
})

const validateDates = (rule: any, value: any, callback: any) => {
  if (!form.startDate || !form.endDate) {
    callback(new Error('请选择完整的项目开始和结束日期'))
  } else {
    callback()
  }
}

const rules: FormRules = {
  name: [{ required: true, message: '请输入项目名称', trigger: 'blur' }],
  packageType: [{ required: true, message: '请选择套餐类型', trigger: 'change' }],
  startDate: [{ validator: validateDates, trigger: 'change' }]
}

function openCreate() { createVisible.value = true }

function resetForm() {
  form.name = ''
  form.packageType = ''
  form.startDate = ''
  form.endDate = ''
  formRef.value?.clearValidate()
}

async function onSubmit() {
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    await createProject({
      name: form.name.trim(),
      packageType: form.packageType,
      startDate: form.startDate,
      endDate: form.endDate
    })
    createVisible.value = false
    keyword.value = ''
    activeKeyword.value = ''
    await fetchProjects()
    ElMessage.success('项目创建成功！')
  } catch { /* 错误已由拦截器提示 */ } 
  finally { submitting.value = false }
}

onMounted(fetchProjects)
</script>

<style scoped lang="scss">
/* 色彩与变量 */
$primary: #1677ff;
$bg-body: #f5f7fa;
$bg-card: #ffffff;
$text-title: #1f2329;
$text-body: #4e5969;
$text-muted: #86909c;
$border-light: #e5e6eb;
$shadow-card: 0 1px 2px rgba(0, 0, 0, 0.03);
$shadow-hover: 0 6px 16px rgba(0, 0, 0, 0.08);

/* 顶部导航栏 */
.project-page { min-height: 100vh; background-color: $bg-body; display: flex; flex-direction: column; }
.project-header { width: 100%; background: rgba(255, 255, 255, 0.85); backdrop-filter: blur(12px); border-bottom: 1px solid $border-light; position: sticky; top: 0; z-index: 100; }
.header-inner { max-width: 1400px; margin: 0 auto; padding: 0 24px; height: 64px; display: flex; align-items: center; justify-content: space-between; }
.header-left { display: flex; align-items: center; gap: 16px; }
.logo-mark { width: 36px; height: 36px; border-radius: 8px; background: $primary; color: #fff; font-weight: 700; font-size: 16px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(22, 119, 255, 0.3); }
.welcome { display: flex; flex-direction: column; line-height: 1.4; }
.welcome-text { font-size: 14px; font-weight: 600; color: $primary; }
.account-text { font-size: 12px; color: $text-muted; }
.header-right { display: flex; align-items: center; }
.user-dropdown { display: flex; align-items: center; gap: 8px; padding: 4px 8px; border-radius: 6px; cursor: pointer; transition: background-color 0.2s; outline: none; &:hover { background-color: rgba(0, 0, 0, 0.04); .arrow-icon { transform: rotate(180deg); } } }
.avatar-circle { width: 32px; height: 32px; border-radius: 50%; background: #e8f3ff; color: $primary; font-size: 14px; font-weight: 600; display: flex; align-items: center; justify-content: center; }
.username { font-size: 14px; color: $text-title; font-weight: 500; }
.arrow-icon { font-size: 12px; color: $text-muted; transition: transform 0.3s ease; }

/* 主体内容 */
.main-content { flex: 1; width: 100%; max-width: 1400px; margin: 0 auto; padding: 32px 24px; }
.toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; gap: 16px; }
.search-input { width: 320px; :deep(.el-input__wrapper) { border-radius: 6px; box-shadow: 0 0 0 1px $border-light inset; padding: 6px 12px; background-color: #fff; transition: all 0.3s; &:hover { box-shadow: 0 0 0 1px #c9cdd4 inset; } &.is-focus { box-shadow: 0 0 0 2px rgba(22,119,255,0.2), 0 0 0 1px $primary inset; } } }
.toolbar-actions { display: flex; gap: 12px; }
.action-btn { border-radius: 6px; font-weight: 500; padding: 8px 20px; transition: all 0.2s; &:active { transform: scale(0.98); } }

/* 卡片网格与卡片 */
.project-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; min-height: 200px; }
.project-card {
  display: flex; flex-direction: column; background: $bg-card; border: 1px solid $border-light;
  border-radius: 12px; padding: 20px; cursor: pointer; box-shadow: $shadow-card;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1); 
  opacity: 0; animation: slideUp 0.5s ease-out forwards;
  
  /* 🛑 关键优化：防止双击时选中卡片内的文字 */
  user-select: none; 
  
  &:hover { 
    transform: translateY(-4px); 
    box-shadow: $shadow-hover; 
    border-color: rgba(22, 119, 255, 0.3); 
    /* 鼠标悬停时显示提示 */
    .dbl-tip { opacity: 1; }
  }

  /* 🛑 关键优化：双击时的微小按压反馈，让手感更好 */
  &:active {
    transform: scale(0.985);
    transition: transform 0.1s;
  }
}

@keyframes slideUp { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }

.card-header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px dashed #f2f3f5; }
.project-name { font-size: 16px; font-weight: 600; color: $text-title; max-width: 55%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.project-id { font-size: 12px; font-family: monospace; color: $text-muted; }
.card-body { flex: 1; display: flex; flex-direction: column; gap: 12px; }
.info-row { display: flex; align-items: center; font-size: 13px; }
.info-label { color: $text-muted; width: 60px; flex-shrink: 0; }
.info-value { color: $text-body; font-weight: 500; word-break: break-all; &.tag { background: #e8f3ff; color: $primary; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 500; } &.time-text { font-size: 12px; } }

/* 卡片底部优化 */
.card-footer {
  margin-top: 20px; 
  display: flex; 
  justify-content: space-between; 
  align-items: center;
}

.dbl-tip {
  font-size: 12px;
  color: $text-muted;
  opacity: 0; /* 默认隐藏 */
  transition: opacity 0.3s ease;
  /* 加一点微小的箭头动画提示 */
  &::before {
    content: '👉';
    margin-right: 4px;
    font-size: 10px;
  }
}

.enter-btn { border-radius: 6px; padding: 6px 16px; transition: all 0.2s; }

.pagination { display: flex; justify-content: flex-end; margin-top: 32px; padding-top: 16px; }
.full-width { width: 100%; }

/* ================= 弹窗样式 ================= */
:deep(.el-overlay) { backdrop-filter: blur(12px) saturate(120%); background-color: rgba(0, 0, 0, 0.2); }
:deep(.modern-dialog) { border-radius: 16px; box-shadow: 0 24px 48px -12px rgba(0, 0, 0, 0.18); border: 1px solid rgba(255, 255, 255, 0.6); overflow: hidden; padding: 0; }
:deep(.el-dialog__header) { padding: 24px 32px; margin-right: 0; border-bottom: 1px solid #f2f3f5; .el-dialog__title { font-size: 18px; font-weight: 600; color: $text-title; letter-spacing: -0.02em; } }
:deep(.el-dialog__body) { padding: 32px; }
:deep(.el-dialog__footer) { padding: 0; background-color: #ffffff; }

.modern-form {
  :deep(.el-form-item__label) { font-size: 14px; font-weight: 500; color: $text-title; padding-bottom: 8px; }
  :deep(.el-form-item) { margin-bottom: 24px; }
  :deep(.el-input__wrapper), :deep(.el-textarea__inner) {
    border-radius: 8px; box-shadow: 0 0 0 1px $border-light inset; background-color: #f9fafb; transition: all 0.2s;
    &:hover { box-shadow: 0 0 0 1px #c9cdd4 inset; }
    &.is-focus { background-color: #fff; box-shadow: 0 0 0 2px rgba(22,119,255,0.15), 0 0 0 1px $primary inset; }
  }
}

.date-range-wrapper {
  display: flex; align-items: center; gap: 12px; width: 100%;
  .flex-date-picker { flex: 1; width: 100%;
    :deep(.el-input__wrapper) { border-radius: 8px; background-color: #f9fafb; box-shadow: 0 0 0 1px $border-light inset; &:hover { box-shadow: 0 0 0 1px #c9cdd4 inset; } &.is-focus { background-color: #fff; box-shadow: 0 0 0 2px rgba(22,119,255,0.15), 0 0 0 1px $primary inset; } }
  }
  .date-separator { color: $text-muted; font-weight: 500; font-size: 16px; }
}

.modern-dialog-footer {
  display: flex; justify-content: flex-end; gap: 12px; padding: 20px 32px 24px; background: transparent;
  .el-button { border-radius: 8px; font-weight: 500; padding: 10px 24px; }
  .el-button--default { background: #f2f3f5; border: none; color: $text-body; &:hover { background: #e5e6eb; color: $text-title; } }
}

/* 响应式 */
@media (max-width: 1280px) { .project-grid { grid-template-columns: repeat(3, 1fr); } }
@media (max-width: 960px) { .project-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 640px) {
  .header-inner, .main-content { padding-left: 16px; padding-right: 16px; }
  .toolbar { flex-direction: column; align-items: stretch; }
  .search-input { width: 100%; }
  .toolbar-actions { justify-content: flex-end; }
  .project-grid { grid-template-columns: 1fr; }
  
  .date-range-wrapper { flex-direction: column; align-items: stretch; gap: 8px; .date-separator { text-align: center; } }
  
  /* 移动端隐藏双击提示，因为移动端通常没有双击操作 */
  .dbl-tip { display: none; }
}
</style>