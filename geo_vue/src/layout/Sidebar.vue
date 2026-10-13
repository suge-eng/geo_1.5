<template>
  <aside
    class="sidebar"
    :class="{ collapsed }"
  >
    <div class="logo">
      <div class="logo-mark">
        G
      </div>
      <div
        v-show="!collapsed"
        class="logo-text"
      >
        <span class="logo-title">GEO 观测</span>
        <span class="logo-sub">生成式引擎优化</span>
      </div>
    </div>

    <nav class="menu">
      <el-tooltip
        v-for="menu in MENUS"
        :key="menu.key"
        :content="menu.label"
        placement="right"
        :disabled="!collapsed"
      >
        <div
          class="menu-item"
          :class="{ active: activeMenu.key === menu.key }"
          @click="navigate(menu)"
        >
          <el-icon class="menu-icon">
            <component :is="menu.icon" />
          </el-icon>
          <span
            v-show="!collapsed"
            class="menu-label"
          >{{ menu.label }}</span>
        </div>
      </el-tooltip>
    </nav>

    <div
      class="collapse-bar"
      :title="collapsed ? '展开侧边栏' : '收起侧边栏'"
      @click="collapsed = !collapsed"
    >
      <el-icon class="collapse-icon">
        <component :is="collapsed ? 'Expand' : 'Fold'" />
      </el-icon>
      <span
        v-show="!collapsed"
        class="collapse-text"
      >收起侧边栏</span>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { MENUS, getActiveMenu, menuEntrySub } from './menu'
import { projectPath, projectSubPath } from '@/utils/projectPath'

const route = useRoute()
const router = useRouter()

/** 侧边栏收起态持久化 key */
const SIDEBAR_COLLAPSED_KEY = 'geo_sidebar_collapsed'

/** 侧边栏收起态：仅保留图标，宽度收窄到 64px；从 localStorage 恢复，刷新后保持 */
const collapsed = ref(localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === '1')

// 状态变化即写入 localStorage，保证刷新/重开后不回到展开态
watch(collapsed, val => {
  localStorage.setItem(SIDEBAR_COLLAPSED_KEY, val ? '1' : '0')
})

/** 当前项目 ID（AppLayout 挂在 /project/:projectId 下，必然存在） */
const projectId = computed(() => route.params.projectId as string | undefined)

/** 项目内的子路径，用于高亮判断 */
const subPath = computed(() => projectSubPath(route.path))

const activeMenu = computed(() => getActiveMenu(subPath.value))

function navigate(menu: (typeof MENUS)[number]) {
  router.push(projectPath(projectId.value, menuEntrySub(menu)))
}
</script>

<style scoped lang="scss">
.sidebar {
  width: var(--geo-sidebar-width);
  background: #fff;
  border-right: 1px solid #e7e9ee;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  overflow: hidden;
  transition: width 0.2s ease;

  &.collapsed {
    width: 64px;
  }
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 18px;
  border-bottom: 1px solid #f0f2f5;
  flex-shrink: 0;
}

.sidebar.collapsed .logo {
  padding: 0 15px;
}

.logo-mark {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  background: linear-gradient(135deg, #5b82f0, #2b4ebd);
  color: #fff;
  font-weight: 700;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  letter-spacing: 0;
  flex-shrink: 0;
}

.logo-text {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
  white-space: nowrap;
}

.logo-title {
  font-size: 15px;
  font-weight: 600;
  color: #1f2329;
}

.logo-sub {
  font-size: 11px;
  color: #9aa1aa;
}

.menu {
  flex: 1;
  padding: 12px 10px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  overflow-y: auto;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 42px;
  padding: 0 14px;
  border-radius: 8px;
  cursor: pointer;
  color: #4b5563;
  font-size: 14px;
  transition: all 0.18s;
  white-space: nowrap;

  &:hover {
    background: #f3f4f6;
    color: #1f2329;
  }

  &.active {
    background: var(--el-color-primary-light-9);
    color: var(--el-color-primary);

    .menu-icon {
      color: var(--el-color-primary);
    }
  }
}

.sidebar.collapsed .menu-item {
  padding: 0;
  justify-content: center;
}

.menu-icon {
  font-size: 18px;
  color: #9aa1aa;
  transition: color 0.18s;
  flex-shrink: 0;
}

.menu-label {
  font-weight: 500;
}

.collapse-bar {
  height: 44px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 24px;
  border-top: 1px solid #f0f2f5;
  cursor: pointer;
  color: #9aa1aa;
  font-size: 13px;
  white-space: nowrap;
  user-select: none;
  transition: all 0.18s;
  flex-shrink: 0;

  &:hover {
    background: #f3f4f6;
    color: var(--el-color-primary);
  }
}

.sidebar.collapsed .collapse-bar {
  padding: 0;
  justify-content: center;
}

.collapse-icon {
  font-size: 16px;
  flex-shrink: 0;
}
</style>
