<template>
  <el-tag
    :type="tagType"
    size="small"
    effect="light"
    round
  >
    {{ label }}
  </el-tag>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { TASK_STATUS_MAP, RESULT_STATUS_MAP } from '@/types/enums'

const props = withDefaults(defineProps<{ status?: string; kind?: 'task' | 'result' }>(), {
  status: '',
  kind: 'task'
})

const map = computed(() => (props.kind === 'result' ? RESULT_STATUS_MAP : TASK_STATUS_MAP))

const tagType = computed(() => map.value[props.status]?.type ?? 'info')
const label = computed(() => map.value[props.status]?.label ?? props.status ?? '-')
</script>
