<template>
  <div
    v-if="modelValue"
    class="modal-overlay"
  >
    <div
      class="modal"
      :style="modalStyle"
    >
      <div class="modal-header">
        <span>{{ title }}</span>
        <span
          class="modal-close"
          @click="close"
        >&times;</span>
      </div>
      <div
        class="modal-body"
        :style="{ overflowY: scrollBody ? 'auto' : 'hidden' }"
      >
        <slot />
      </div>
      <div
        v-if="$slots.footer"
        class="modal-footer"
        :class="footerAlign === 'left' ? 'align-left' : footerAlign === 'between' ? 'space-between' : ''"
      >
        <slot name="footer" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

/**
 * 弹窗外壳：样式对齐原型 HTML 的 .modal-overlay / .modal 一套，
 * 供意图词库等页面复用，避免每个弹窗重复一遍结构。
 *
 * 注意：这里**不**做 Teleport，弹窗仍渲染在父组件内部（遮罩仍是 position: fixed，
 * 依然盖住整个视口）。这样父组件的 scoped 样式与 CSS 变量才能作用到插槽内容上。
 */
const props = withDefaults(
  defineProps<{
    modelValue: boolean
    title: string
    /** 弹窗宽度，如 '450px' */
    width?: string
    /** 弹窗高度，如 '80vh'；不传则由内容撑开（上限 90vh） */
    height?: string
    /** 底栏对齐方式 */
    footerAlign?: 'right' | 'left' | 'between'
    /** 内容区是否可滚动 */
    scrollBody?: boolean
  }>(),
  {
    width: '500px',
    height: '',
    footerAlign: 'right',
    scrollBody: true
  }
)

const emit = defineEmits<{ 'update:modelValue': [boolean] }>()

const modalStyle = computed(() => ({
  width: props.width,
  ...(props.height ? { height: props.height } : {})
}))

function close() {
  emit('update:modelValue', false)
}
</script>

<style scoped lang="scss">
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: #fff;
  border-radius: 8px;
  max-width: 90%;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  max-height: 90vh;
}

.modal-header {
  padding: 16px 20px;
  border-bottom: 1px solid #eef0f4;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 16px;
  font-weight: 500;
  color: #1f2329;
  flex-shrink: 0;
}

.modal-close {
  cursor: pointer;
  font-size: 20px;
  line-height: 1;
  color: #909399;

  &:hover {
    color: #606266;
  }
}

.modal-body {
  padding: 20px;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.modal-footer {
  padding: 16px 20px;
  border-top: 1px solid #eef0f4;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  flex-shrink: 0;

  &.align-left {
    justify-content: flex-start;
  }

  &.space-between {
    justify-content: space-between;
  }
}
</style>
