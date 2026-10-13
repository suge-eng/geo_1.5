<template>
  <header class="topnav">
    <div class="topnav-left">
      <!-- 当前项目 + 返回项目列表 -->
      <el-tooltip
        content="返回项目列表"
        placement="bottom"
      >
        <div
          class="topnav-project"
          @click="goProjects"
        >
          <el-icon class="project-back-icon">
            <ArrowLeft />
          </el-icon>
          <span class="project-name">{{ projectStore.projectName || '未选择项目' }}</span>
          <span class="project-switch">切换项目</span>
        </div>
      </el-tooltip>

      <div class="topnav-tabs">
        <div
          v-for="child in activeMenu.children"
          :key="child.sub"
          class="topnav-tab"
          :class="{ active: isActive(child.sub) }"
          @click="router.push(projectPath(projectId, child.sub))"
        >
          {{ child.label }}
        </div>
      </div>
    </div>

    <!-- ================= 右上角用户下拉菜单 (优化为悬浮展开) ================= -->
    <el-dropdown
      trigger="hover"
      @command="onCommand"
      popper-class="modern-dropdown"
    >
      <div class="user-dropdown">
        <div class="avatar-circle">{{ authStore.avatarText }}</div>
        <span class="username">{{ authStore.user?.nickname || '用户' }}</span>
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

    <!-- 编辑资料弹窗 -->
    <el-dialog
      v-model="editVisible"
      title="编辑资料"
      width="400px"
      append-to-body
      class="modern-dialog"
      align-center
    >
      <el-form
        label-width="72px"
        @submit.prevent
        class="modern-form"
      >
        <el-form-item label="昵称">
          <el-input
            v-model="editNickname"
            placeholder="请输入昵称"
            maxlength="20"
            size="large"
            @keyup.enter="saveEdit"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="modern-dialog-footer">
          <el-button size="large" @click="editVisible = false">取消</el-button>
          <el-button type="primary" size="large" @click="saveEdit">保存</el-button>
        </div>
      </template>
    </el-dialog>
  </header>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowDown, ArrowLeft, Edit, SwitchButton } from '@element-plus/icons-vue'
import { getActiveMenu } from './menu'
import { projectPath, projectSubPath, PROJECT_LIST_PATH } from '@/utils/projectPath'
import { useAuthStore } from '@/store/auth'
import { useProjectStore } from '@/store/project'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const projectStore = useProjectStore()

/** 当前项目 ID（AppLayout 挂在 /project/:projectId 下，必然存在） */
const projectId = computed(() => route.params.projectId as string | undefined)

/** 项目内的子路径，用于高亮判断 */
const subPath = computed(() => projectSubPath(route.path))

const activeMenu = computed(() => getActiveMenu(subPath.value))

function isActive(sub: string): boolean {
  return subPath.value === sub || subPath.value.startsWith(sub + '/')
}

function goProjects() {
  router.push(PROJECT_LIST_PATH)
}

/* ------------------------- 头像下拉逻辑 ------------------------- */

const editVisible = ref(false)
const editNickname = ref('')

function onCommand(command: string) {
  if (command === 'edit') {
    editNickname.value = authStore.user?.nickname || ''
    editVisible.value = true
  } else if (command === 'logout') {
    logout()
  }
}

function saveEdit() {
  const nickname = editNickname.value.trim()
  if (!nickname) {
    ElMessage.warning('请输入昵称')
    return
  }
  // TODO: 后端用户体系就绪后改为 PUT /api/user
  authStore.updateUser({ ...(authStore.user || {}), nickname })
  editVisible.value = false
  ElMessage.success('资料已更新')
}

function logout() {
  // TODO: 后端鉴权就绪后调用登出接口使 token 失效
  authStore.logout()
  router.push('/login')
}
</script>

<style scoped lang="scss">
.topnav {
  height: var(--geo-topbar-height);
  background: #fff;
  border-bottom: 1px solid #e7e9ee;
  display: flex;
  align-items: center;
  padding: 0 24px;
  flex-shrink: 0;
  justify-content: space-between; 
}

.topnav-left {
  display: flex;
  align-items: center;
  gap: 24px;
  height: 100%;
  min-width: 0;
}

/* ---------- 当前项目 / 返回项目列表 ---------- */
.topnav-project {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 30px;
  padding: 0 10px;
  border-radius: 15px;
  background: #f3f5f9;
  color: #4b5563;
  font-size: 13px;
  cursor: pointer;
  outline: none;
  transition: background 0.18s;

  &:hover {
    background: var(--el-color-primary-light-9);
    color: var(--el-color-primary);
  }
}

.project-back-icon {
  font-size: 13px;
  color: #9aa1aa;
  flex-shrink: 0;
}

.project-name {
  max-width: 140px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 500;
}

.project-switch {
  flex-shrink: 0;
  padding-left: 6px;
  border-left: 1px solid #dde1e8;
  color: #9aa1aa;
  font-size: 12px;
}

.topnav-project:hover .project-back-icon,
.topnav-project:hover .project-switch {
  color: var(--el-color-primary);
}

.topnav-tabs {
  display: flex;
  gap: 28px;
  height: 100%;
  align-items: center;
}

.topnav-tab {
  position: relative;
  height: 100%;
  display: flex;
  align-items: center;
  font-size: 14px;
  color: #6b7280;
  cursor: pointer;
  white-space: nowrap;
  transition: color 0.18s;

  &:hover {
    color: #1f2329;
  }

  &.active {
    color: var(--el-color-primary);
    font-weight: 600;

    &::after {
      content: '';
      position: absolute;
      left: 0;
      right: 0;
      bottom: 0;
      height: 2px;
      background: var(--el-color-primary);
      border-radius: 2px 2px 0 0;
    }
  }
}

/* ================= 右上角用户下拉菜单 (全新现代化样式) ================= */
.user-dropdown {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.2s;
  outline: none;

  &:hover {
    background-color: rgba(0, 0, 0, 0.04);
    /* 箭头旋转的微动画 */
    .arrow-icon {
      transform: rotate(180deg);
    }
  }
}

.avatar-circle {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #e8f3ff; /* 去掉了原有的渐变，采用现代扁平色 */
  color: #1677ff;
  font-size: 14px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  user-select: none;
}

.username {
  font-size: 14px;
  color: #1f2329;
  font-weight: 500;
  max-width: 140px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.arrow-icon {
  font-size: 12px;
  color: #86909c;
  transition: transform 0.3s ease;
}

/* 弹出层深度样式覆盖，保证与项目列表页弹窗一致 */
:deep(.modern-dropdown) {
  border-radius: 8px;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
  border: 1px solid #e5e6eb;
  padding: 4px;
  
  .el-dropdown-menu__item {
    border-radius: 4px;
    padding: 8px 16px;
    font-size: 14px;
    transition: all 0.2s;
    &:hover {
      background-color: #f2f3f5;
      color: #1677ff;
    }
  }
}

/* ================= 弹窗样式优化 (保持与整体设计一致) ================= */
:deep(.modern-dialog) {
  border-radius: 16px;
  box-shadow: 0 24px 48px -12px rgba(0, 0, 0, 0.18); 
  border: 1px solid rgba(255, 255, 255, 0.6);
  overflow: hidden;
  padding: 0;
}
:deep(.el-dialog__header) {
  padding: 24px 32px;
  margin-right: 0;
  border-bottom: 1px solid #f2f3f5;
  .el-dialog__title {
    font-size: 18px;
    font-weight: 600;
    color: #1f2329;
  }
}
:deep(.el-dialog__body) {
  padding: 32px;
}
.modern-form {
  :deep(.el-form-item__label) {
    font-size: 14px;
    font-weight: 500;
    color: #1f2329;
    padding-bottom: 8px;
  }
  :deep(.el-input__wrapper) {
    border-radius: 8px;
    box-shadow: 0 0 0 1px #e5e6eb inset;
    background-color: #f9fafb;
    transition: all 0.2s;
    &:hover { box-shadow: 0 0 0 1px #c9cdd4 inset; }
    &.is-focus { background-color: #fff; box-shadow: 0 0 0 2px rgba(22,119,255,0.15), 0 0 0 1px #1677ff inset; }
  }
}
.modern-dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px 32px 24px;
  background: transparent;
  .el-button {
    border-radius: 8px;
    font-weight: 500;
    padding: 10px 24px;
  }
}
</style>