<template>
  <div class="app-layout">
    <Sidebar />
    <div class="app-main">
      <TopNav />
      <main class="app-content">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import Sidebar from './Sidebar.vue'
import TopNav from './TopNav.vue'
</script>

<style scoped lang="scss">
.app-layout {
  display: flex;
  height: 100%;
  background: #f5f6f8;
}

.app-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.app-content {
  flex: 1;
  overflow: auto;
  padding: 16px 20px 24px;
}
</style>
