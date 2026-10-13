<template>
  <div class="intent-page">
    <!-- 左侧导航 -->
    <aside class="sidebar">
      <div
        v-for="item in layerData"
        :key="item.value"
        class="nav-item"
        :class="{ active: activeLayer === item.value }"
        @click="changeLayer(item.value)"
      >
        {{ item.label }}: {{ item.count }}
      </div>
    </aside>

    <!-- 主内容区 -->
    <main class="main-content">
      <div class="card">
        <div class="filter-bar">
          <div class="filter-item search-group">
            <input
              v-model="searchText"
              type="text"
              class="search-input"
              placeholder="请输入..."
              @keyup.enter="handleSearch"
            >
            <button
              class="search-btn"
              @click="handleSearch"
            >
              搜索
            </button>
          </div>
          <div class="filter-item">
            <span class="filter-label">意图层级</span>
            <input
              v-model="filterForm.level"
              type="text"
              class="filter-input"
              placeholder="请输入..."
            >
          </div>
          <div class="filter-item">
            <span class="filter-label">意图场景</span>
            <input
              v-model="filterForm.scene"
              type="text"
              class="filter-input"
              placeholder="请输入..."
            >
          </div>
          <div class="filter-item">
            <span class="filter-label">意图标签</span>
            <input
              v-model="filterForm.tag"
              type="text"
              class="filter-input"
              placeholder="请输入..."
            >
          </div>
          <div class="filter-item filter-item-grow">
            <span class="filter-label">关键词</span>
            <input v-model="filterForm.keyword" type="text" class="filter-input" placeholder="请输入...">
          </div>
          <div class="filter-item filter-create">
            <button
              class="btn btn-primary"
              @click="onCreate"
            >
              新建
            </button>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th
                  class="text-center"
                  style="width: 60px;"
                >
                  序号
                </th>
                <th>关键词</th>
                <th class="text-center">
                  意图层级
                </th>
                <th>核心场景</th>
                <th>意图标签</th>
                <th class="text-center">
                  关键词类型
                </th>
                <th class="text-center">
                  竞争力
                </th>
                <th class="text-center">
                  关联询问句
                </th>
                <th class="text-center">
                  状态
                </th>
                <th
                  class="text-center"
                  style="width: 160px;"
                >
                  操作
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(row, index) in pageData"
                :key="row.id"
              >
                <td class="text-center">
                  {{ (currentPage - 1) * pageSize + index + 1 }}
                </td>
                <td>{{ row.keyword }}</td>
                <td class="text-center">
                  {{ row.level }}
                </td>
                <td>{{ row.scene }}</td>
                <td>{{ row.tag }}</td>
                <td class="text-center">
                  {{ row.type }}
                </td>
                <td class="text-center">
                  {{ row.competitiveness }}
                </td>
                <td class="text-center">
                  <button
                    class="btn-link"
                    @click="openQuestionDialog(row)"
                  >
                    {{ row.questionCount }}
                  </button>
                </td>
                <td class="text-center">
                  <!-- 主页面表格使用普通蓝色无文字开关 -->
                  <label class="switch-normal">
                    <input
                      v-model="row.status"
                      type="checkbox"
                      @change="toggleStatus(row)"
                    >
                    <span class="slider" />
                  </label>
                </td>
                <td class="text-center">
                  <button
                    class="btn-link"
                    @click="openSettingDialog(row)"
                  >
                    属性设置
                  </button>
                  <button
                    class="btn-link"
                    @click="confirmDelete('intent', row)"
                  >
                    删除
                  </button>
                </td>
              </tr>
              <tr v-if="pageData.length === 0">
                <td
                  colspan="10"
                  class="text-center empty-cell"
                >
                  {{ USE_MOCK ? '暂无数据' : '接口待接入' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="pagination">
          <span class="page-total">共 {{ filteredData.length }} 条</span>
          <div class="page-navigator">
            <button
              class="page-btn"
              :disabled="currentPage === 1 || totalPages === 0"
              @click="changePage(-1)"
            >
              &lt;
            </button>
            <span class="page-numbers">
              <template
                v-for="(item, i) in pageNumbers"
                :key="i"
              >
                <span
                  v-if="item === '...'"
                  class="page-ellipsis"
                >...</span>
                <button
                  v-else
                  class="page-number"
                  :class="{ active: item === currentPage }"
                  @click="goToPage(item as number)"
                >
                  {{ item }}
                </button>
              </template>
            </span>
            <button
              class="page-btn"
              :disabled="currentPage === totalPages || totalPages === 0"
              @click="changePage(1)"
            >
              &gt;
            </button>
          </div>
          <select
            v-model.number="pageSize"
            class="page-size-select"
            @change="changePageSize"
          >
            <option :value="10">
              10条/页
            </option>
            <option :value="20">
              20条/页
            </option>
            <option :value="50">
              50条/页
            </option>
          </select>
          <div class="page-jump">
            <span>前往</span>
            <input
              v-model.number="jumpPage"
              type="number"
              min="1"
              @change="jumpToPage"
            >
          </div>
        </div>
      </div>
    </main>

    <!-- 弹窗：属性设置 -->
    <AppModal
      v-model="settingVisible"
      title="属性设置"
      width="450px"
    >
      <p class="dialog-label setting-label">
        意图词：<span>{{ currentRow?.keyword }}</span>
      </p>
      <div class="form-item">
        <label>意图层级</label>
        <select v-model="settingForm.level">
          <option
            v-for="l in levelOptions"
            :key="l"
            :value="l"
          >
            {{ l }}
          </option>
        </select>
      </div>
      <div class="form-item">
        <label>意图标签</label>
        <select v-model="settingForm.tag">
          <option
            v-for="t in tagOptions"
            :key="t"
            :value="t"
          >
            {{ t }}
          </option>
        </select>
      </div>
      <div class="form-item">
        <label>意图词类型</label>
        <select v-model="settingForm.type">
          <option
            v-for="t in typeOptions"
            :key="t"
            :value="t"
          >
            {{ t }}
          </option>
        </select>
      </div>
      <template #footer>
        <button
          class="btn btn-primary btn-confirm"
          @click="saveSetting"
        >
          确定
        </button>
      </template>
    </AppModal>

    <!-- 弹窗：关联询问句 -->
    <AppModal
      v-model="questionVisible"
      title="关联询问句"
      width="600px"
      height="80vh"
      :scroll-body="false"
    >
      <div class="question-top-bar">
        <p class="dialog-label setting-label">
          意图词：<span>{{ currentRow?.keyword }}</span>
        </p>
        <button
          class="btn btn-primary btn-sm"
          @click="openAddQuestion"
        >
          + 新增询问句
        </button>
      </div>
      <div class="question-table-wrapper">
        <table class="question-table">
          <thead>
            <tr>
              <th class="th-dark">
                询问句
              </th>
              <th
                class="text-center th-dark"
                style="width: 80px;"
              >
                状态
              </th>
              <th
                class="text-center th-dark"
                style="width: 120px;"
              >
                操作
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in questions"
              :key="row.id"
            >
              <td class="question-text-blue">
                {{ row.text }}
              </td>
              <td class="text-center">
                <!-- 弹窗内使用青色带文字开关 -->
                <label class="switch-dialog">
                  <input
                    v-model="row.status"
                    type="checkbox"
                    @change="toggleQuestionStatus(row)"
                  >
                  <span class="slider" />
                </label>
              </td>
              <td class="text-center">
                <button
                  class="btn-link"
                  @click="openEditQuestionDialog(row)"
                >
                  编辑
                </button>
                <button
                  class="btn-link"
                  @click="confirmDelete('question', row)"
                >
                  删除
                </button>
              </td>
            </tr>
            <tr v-if="questions.length === 0">
              <td
                colspan="3"
                class="text-center empty-cell"
              >
                暂无数据
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </AppModal>

    <!-- 弹窗：新增询问句 -->
    <AppModal
      v-model="addQuestionVisible"
      title="新增询问句"
      width="500px"
    >
      <textarea
        v-model="addQuestionText"
        rows="8"
        placeholder="一行一句询问词"
      />
      <template #footer>
        <button
          class="btn btn-link"
          @click="openAiExpand"
        >
          <span style="margin-right: 4px;">✨</span> AI 拓展
        </button>
        <button
          class="btn btn-primary"
          @click="saveNewQuestion"
        >
          确定
        </button>
      </template>
    </AppModal>

    <!-- 弹窗：编辑询问句 -->
    <AppModal
      v-model="editQuestionVisible"
      title="编辑询问句"
      width="500px"
    >
      <textarea
        v-model="editQuestionText"
        rows="8"
        placeholder="请输入询问句"
      />
      <template #footer>
        <button
          class="btn btn-primary"
          @click="saveEditQuestion"
        >
          确定
        </button>
      </template>
    </AppModal>

    <!-- 弹窗：AI拓展 -->
    <AppModal
      v-model="aiExpandVisible"
      title="AI拓展"
      width="500px"
    >
      <textarea
        v-model="aiExpandText"
        rows="10"
        readonly
        :placeholder="aiExpandingQuestions ? 'AI 正在生成询问句，请稍候...' : ''"
      />
      <template #footer>
        <button
          class="btn btn-link"
          :disabled="aiExpandingQuestions"
          @click="refreshAiExpand"
        >
          <span style="margin-right: 4px;">🔄</span> 换一批
        </button>
        <button
          class="btn btn-primary"
          :disabled="aiExpandingQuestions"
          @click="applyAiExpand"
        >
          {{ aiExpandingQuestions ? '生成中...' : '确定' }}
        </button>
      </template>
    </AppModal>

    <!-- 弹窗：删除确认（按钮靠左） -->
    <AppModal
      v-model="deleteVisible"
      title="温馨提示"
      width="400px"
      footer-align="left"
    >
      <div class="delete-confirm-content">
        {{ deleteMessage }}
      </div>
      <template #footer>
        <button
          class="btn btn-primary"
          @click="executeDelete"
        >
          确定
        </button>
        <button
          class="btn"
          @click="deleteVisible = false"
        >
          取消
        </button>
      </template>
    </AppModal>

    <!-- ==================================================
         抽屉：新建意图词
         流程：填写层级/场景/标签 → AI 拓展 → 勾选关键词 → 确定入库
         ================================================== -->
    <div
      class="drawer-mask"
      :class="{ active: createDrawerVisible }"
      @click="closeCreateDrawer"
    />
    <aside
      class="drawer"
      :class="{ active: createDrawerVisible }"
    >
      <div class="drawer-header">
        <div class="drawer-header-title">
          <span class="drawer-title">新建意图词</span>
          <span class="drawer-subtitle">选择意图层级与关键词，快速补充意图词库</span>
        </div>
        <button
          class="drawer-close"
          aria-label="关闭"
          @click="closeCreateDrawer"
        >
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
            <path
              d="M2.5 2.5l11 11M13.5 2.5l-11 11"
              stroke="currentColor"
              stroke-width="1.6"
              stroke-linecap="round"
            />
          </svg>
        </button>
      </div>

      <div class="drawer-body">
        <!-- 左列 -->
        <div class="drawer-col-left">
          <section class="panel">
            <div class="panel-title">
              <span>选择意图层级与意图标签</span>
            </div>
            <div class="filter-row">
              <label>意图层级</label>
              <select v-model="createForm.level">
                <option value="">
                  请选择
                </option>
                <option
                  v-for="l in levelOptions"
                  :key="l"
                  :value="l"
                >
                  {{ l }}
                </option>
              </select>
              <label>核心场景</label>
              <select
                v-model="createForm.scene"
                :disabled="!createForm.level"
              >
                <option
                  value=""
                  disabled
                >请选择</option>
                <option
                  v-for="s in scenarioOptions"
                  :key="s"
                  :value="s"
                >
                  {{ s }}
                </option>
              </select>
              <label>意图标签</label>
              <select
                v-model="createForm.tag"
                :disabled="!createForm.scene"
              >
                <option
                  value=""
                  disabled
                >请选择</option>
                <option
                  v-for="t in lexiconTagOptions"
                  :key="t"
                  :value="t"
                >
                  {{ t }}
                </option>
              </select>
              <button
                class="btn btn-primary btn-ai"
                :class="{ loading: aiExpanding }"
                @click="handleAiExpand"
              >
                <span
                  v-if="aiExpanding"
                  class="spinner"
                />
                <span class="btn-ai-text">{{ aiExpanding ? '生成中' : 'AI拓展' }}</span>
              </button>
            </div>
          </section>

          <section class="panel panel-grow">
            <div class="panel-title">
              <span>选择关键词</span>
              <span class="panel-extra">{{ kwSummary }}</span>
            </div>
            <div class="kw-table-wrap">
              <table
                v-show="drawerKeywords.length > 0"
                class="kw-table"
              >
                <thead>
                  <tr>
                    <th style="width: 46px;">
                      <input
                        ref="checkAllRef"
                        type="checkbox"
                        class="kw-check"
                        :checked="allSelected"
                        @change="toggleAllKeywords(($event.target as HTMLInputElement).checked)"
                      >
                    </th>
                    <th>关键词</th>
                    <th style="width: 78px;">
                      意图
                    </th>
                    <th style="width: 118px;">
                      核心场景
                    </th>
                    <th style="width: 118px;">
                      意图标签
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(item, i) in drawerKeywords"
                    :key="item.id"
                    :class="{ selected: item.selected }"
                    :style="{ animationDelay: Math.min(i * 22, 320) + 'ms' }"
                    @click="toggleKeyword(item, !item.selected)"
                  >
                    <td @click.stop>
                      <input
                        type="checkbox"
                        class="kw-check"
                        :checked="item.selected"
                        @change="toggleKeyword(item, ($event.target as HTMLInputElement).checked)"
                      >
                    </td>
                    <td>{{ item.keyword }}</td>
                    <td>{{ item.levelShort }}</td>
                    <td>{{ item.scene }}</td>
                    <td>{{ item.tag }}</td>
                  </tr>
                </tbody>
              </table>
              <div
                v-if="drawerKeywords.length === 0"
                class="kw-empty"
              >
                <div class="kw-empty-icon">
                  ✦
                </div>
                <p>
                  填写意图层级、核心场景与意图标签后<br>
                  点击「AI拓展」生成关键词
                </p>
              </div>
            </div>
          </section>
        </div>

        <!-- 右列 -->
        <div class="drawer-col-right">
          <section class="panel panel-grow">
            <div class="panel-title">
              <span>已选 <em>({{ selectedKeywordList.length }}/1000)</em></span>
              <button
                class="btn-link"
                style="font-size: 12px;"
                @click="clearSelected"
              >
                清空
              </button>
            </div>
            <div class="selected-tags">
              <template v-if="selectedKeywordList.length > 0">
                <div
                  v-for="(item, i) in selectedKeywordList"
                  :key="item.keyword"
                  class="tag-chip"
                  :style="{ animationDelay: Math.min(i * 16, 200) + 'ms' }"
                  :title="item.keyword"
                >
                  <span>{{ item.keyword }}</span>
                  <button
                    class="tag-remove"
                    @click="removeSelectedKeyword(item.keyword)"
                  >
                    &times;
                  </button>
                </div>
              </template>
              <div
                v-else
                class="selected-empty"
              >
                暂未选择关键词
                <span>勾选左侧关键词后会自动加入</span>
              </div>
            </div>
          </section>
        </div>
      </div>

      <div class="drawer-footer">
        <span class="footer-tip">
          {{ selectedKeywordList.length > 0 ? `已选择 ${selectedKeywordList.length} 个关键词` : '' }}
        </span>
        <button
          class="btn"
          @click="closeCreateDrawer"
        >
          取消
        </button>
        <button
          class="btn btn-primary"
          @click="saveCreateFromDrawer"
        >
          确定
        </button>
      </div>
    </aside>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref, watch, watchEffect } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import AppModal from '@/components/AppModal.vue'
import {
  INTENT_LAYERS,
  INTENT_LAYER_ALL,
  INTENT_LEVEL_SHORT_MAP,
  MOCK_AI_EXPAND_BATCHES,
  MOCK_INTENT_QUESTIONS,
  MOCK_INTENT_TAGS,
  MOCK_INTENT_WORDS,
  MOCK_KEYWORD_TYPES,
  pickAiKeywords,
  type DrawerKeyword,
  type IntentQuestion,
  type IntentWord
} from '@/mock/intenLibrary'
import { USE_MOCK } from '@/mock/flag'
import type { LexiconItem } from '@/mock/config'
import { aiExpandKeywords, aiExpandQuestions, listIntentWords, batchCreateIntentWords, deleteIntentWord, updateIntentWord, listIntentQuestions, batchCreateIntentQuestions, deleteIntentQuestion, updateIntentQuestion, listLexicon } from '@/api/monitorConfig'

type DeleteTarget = 'intent' | 'question'

/* ------------------------- 当前项目 ------------------------- */
const route = useRoute()
const projectId = computed(() => route.params.projectId as string | undefined)

/* ------------------------- 基础数据 ------------------------- */

const words = ref<IntentWord[]>(USE_MOCK ? MOCK_INTENT_WORDS.map(w => ({ ...w })) : [])

/** 词库资料（从 Excel 导入），用于核心场景和意图标签的下拉选项 */
const lexiconItems = ref<LexiconItem[]>([])

const levelOptions = computed(() => INTENT_LAYERS.map(l => l.label))
/** 核心场景下拉选项：根据已选意图层级从词库资料中筛选并去重 */
const scenarioOptions = computed(() => {
  const level = createForm.level
  const list = level ? lexiconItems.value.filter(i => i.intent === level) : lexiconItems.value
  return Array.from(new Set(list.map(i => i.scenario).filter(Boolean)))
})
/** 意图标签下拉选项：根据已选意图层级 + 核心场景从词库资料中筛选并去重 */
const lexiconTagOptions = computed(() => {
  const level = createForm.level
  const scene = createForm.scene
  let list = lexiconItems.value
  if (level) list = list.filter(i => i.intent === level)
  if (scene) list = list.filter(i => i.scenario === scene)
  return Array.from(new Set(list.map(i => i.tag).filter(Boolean)))
})
const tagOptions = computed(() => (USE_MOCK ? [...MOCK_INTENT_TAGS] : lexiconTagOptions.value))
const typeOptions = computed(() => (USE_MOCK ? [...MOCK_KEYWORD_TYPES] : []))

/* ------------------------- 页面挂载：从后端加载意图词 + 词库资料 ------------------------- */

onMounted(async () => {
  if (USE_MOCK) return
  try {
    const [list, lexicon] = await Promise.all([
      listIntentWords(projectId.value || ''),
      listLexicon(projectId.value || '')
    ])
    words.value = list || []
    lexiconItems.value = lexicon || []
  } catch (e) {
    console.error('加载意图词列表失败', e)
    ElMessage.error('加载意图词列表失败')
  }
})

/* ------------------------- 左侧导航 ------------------------- */

const activeLayer = ref<string>(INTENT_LAYER_ALL.value)

const layerData = computed(() => {
  const items = [
    { label: INTENT_LAYER_ALL.label, value: INTENT_LAYER_ALL.value, count: words.value.length }
  ]
  for (const l of INTENT_LAYERS) {
    items.push({
      label: l.label,
      value: l.value,
      count: words.value.filter(w => w.level === l.label).length
    })
  }
  return items
})

function changeLayer(layer: string) {
  if (activeLayer.value === layer) return
  activeLayer.value = layer
  currentPage.value = 1
}

/* ------------------------- 筛选 ------------------------- */

const searchText = ref('')
const appliedSearch = ref('')

const filterForm = reactive({ level: '', scene: '', tag: '', keyword: '' })
const appliedFilter = reactive({ level: '', scene: '', tag: '', keyword: '' })

function handleSearch() {
  appliedSearch.value = searchText.value
  Object.assign(appliedFilter, filterForm)
  currentPage.value = 1
  if (!USE_MOCK) ElMessage.info('查询接口待后端提供')
}

const filteredData = computed(() =>
  words.value.filter(w => {
    if (activeLayer.value !== INTENT_LAYER_ALL.value) {
      const layer = INTENT_LAYERS.find(l => l.value === activeLayer.value)
      if (layer && w.level !== layer.label) return false
    }
    if (appliedSearch.value && !w.keyword.includes(appliedSearch.value)) return false
    if (appliedFilter.level && !w.level.includes(appliedFilter.level)) return false
    if (appliedFilter.scene && !w.scene.includes(appliedFilter.scene)) return false
    if (appliedFilter.tag && !w.tag.includes(appliedFilter.tag)) return false
    if (appliedFilter.keyword && !w.keyword.includes(appliedFilter.keyword)) return false
    return true
  })
)

/* ------------------------- 分页 ------------------------- */

const currentPage = ref(1)
const pageSize = ref(10)
const jumpPage = ref(1)

const totalPages = computed(() => Math.ceil(filteredData.value.length / pageSize.value))

const pageData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredData.value.slice(start, start + pageSize.value)
})

const pageNumbers = computed<Array<number | '...'>>(() => {
  const total = totalPages.value
  if (total === 0) return []
  let startPage = Math.max(1, currentPage.value - 2)
  let endPage = Math.min(total, startPage + 4)
  if (currentPage.value <= 3) {
    startPage = 1
    endPage = Math.min(5, total)
  } else if (currentPage.value >= total - 2) {
    startPage = Math.max(1, total - 4)
    endPage = total
  }

  const list: Array<number | '...'> = []
  if (startPage > 1) {
    list.push(1)
    if (startPage > 2) list.push('...')
  }
  for (let i = startPage; i <= endPage; i++) list.push(i)
  if (endPage < total) {
    if (endPage < total - 1) list.push('...')
    list.push(total)
  }
  return list
})

watch([activeLayer, () => filteredData.value.length], () => {
  currentPage.value = 1
})

watch(
  [currentPage, totalPages],
  () => {
    jumpPage.value = currentPage.value
  },
  { immediate: true }
)

function goToPage(page: number) {
  currentPage.value = page
}

function changePage(delta: number) {
  const next = currentPage.value + delta
  if (next >= 1 && next <= totalPages.value) currentPage.value = next
}

function changePageSize() {
  currentPage.value = 1
}

function jumpToPage() {
  let page = jumpPage.value
  if (!page || page < 1) page = 1
  if (page > totalPages.value) page = totalPages.value
  if (totalPages.value === 0) page = 1
  jumpPage.value = page
  currentPage.value = page
}

/* ------------------------- 状态开关 ------------------------- */

async function toggleStatus(row: IntentWord) {
  // v-model 已把 row.status 更新为新值，直接提交给后端
  const newStatus = row.status
  try {
    const updated = await updateIntentWord(row.id, { status: newStatus })
    row.status = updated.status
    ElMessage.success(newStatus ? '已启用' : '已停用')
  } catch (e) {
    // 失败回滚
    row.status = !newStatus
    console.error('切换状态失败', e)
    ElMessage.error('操作失败，请重试')
  }
}

async function toggleQuestionStatus(row: IntentQuestion) {
  if (USE_MOCK) {
    ElMessage.info(`接口待后端提供，已本地${row.status ? '启用' : '停用'}该询问句`)
    return
  }
  // v-model 已把 row.status 更新为新值，直接把新值提交给后端
  const newStatus = row.status
  try {
    const updated = await updateIntentQuestion(row.id, { status: newStatus })
    row.status = updated.status
    ElMessage.success(newStatus ? '已启用' : '已停用')
  } catch (e) {
    // 失败则回滚
    row.status = !newStatus
    console.error('切换询问句状态失败', e)
    ElMessage.error('操作失败，请重试')
  }
}

/* ------------------------- 属性设置 ------------------------- */

const settingVisible = ref(false)
const currentRow = ref<IntentWord | null>(null)
const settingForm = reactive({ level: '', tag: '', type: '' })

function openSettingDialog(row: IntentWord) {
  currentRow.value = row
  settingForm.level = row.level
  settingForm.tag = row.tag
  settingForm.type = row.type
  settingVisible.value = true
}

async function saveSetting() {
  const row = currentRow.value
  if (row) {
    try {
      const updated = await updateIntentWord(row.id, {
        level: settingForm.level,
        tag: settingForm.tag,
        type: settingForm.type
      })
      row.level = updated.level
      row.tag = updated.tag
      row.type = updated.type
      ElMessage.success('保存成功')
    } catch (e) {
      console.error('保存属性失败', e)
      ElMessage.error('保存失败，请重试')
      return
    }
  }
  settingVisible.value = false
}

/* ------------------------- 关联询问句 ------------------------- */

const questionVisible = ref(false)
const questions = ref<IntentQuestion[]>([])
let questionIdSeed = 0

function openQuestionDialog(row: IntentWord) {
  currentRow.value = row
  questionVisible.value = true
  if (USE_MOCK) {
    questions.value = MOCK_INTENT_QUESTIONS.slice(0, row.questionCount).map(q => ({
      ...q,
      id: q.id + row.id * 1000
    }))
    questionIdSeed = questions.value.reduce((max, q) => Math.max(max, q.id), 0)
  } else {
    // 从后端加载该意图词的询问句
    listIntentQuestions(row.id)
      .then(list => {
        questions.value = list || []
        questionIdSeed = questions.value.reduce((max, q) => Math.max(max, q.id), 0)
      })
      .catch(e => {
        console.error('加载询问句失败', e)
        ElMessage.error('加载询问句失败')
      })
  }
}

function syncQuestionCount() {
  if (!currentRow.value) return
  const count = questions.value.length
  currentRow.value.questionCount = count
  // 同步到数据库（非 mock 模式）
  if (!USE_MOCK) {
    updateIntentWord(currentRow.value.id, { questionCount: count }).catch(e => {
      console.error('同步询问句数量失败', e)
    })
  }
}

/* ------------------------- 新增询问句 ------------------------- */

const addQuestionVisible = ref(false)
const addQuestionText = ref('')

function openAddQuestion() {
  addQuestionText.value = ''
  addQuestionVisible.value = true
}

async function saveNewQuestion() {
  const text = addQuestionText.value.trim()
  if (!text) return
  const lines = text
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
  if (lines.length === 0) return

  if (USE_MOCK) {
    lines.forEach((line, index) => {
      questions.value.unshift({ id: questionIdSeed + index + 1, text: line, status: true })
    })
    questionIdSeed += lines.length
    syncQuestionCount()
  } else {
    try {
      const created = await batchCreateIntentQuestions(
        currentRow.value!.id,
        lines,
        projectId.value || ''
      )
      // 新创建的插入到列表头部
      questions.value.unshift(...(created || []))
      questionIdSeed = questions.value.reduce((max, q) => Math.max(max, q.id), 0)
      syncQuestionCount()
      ElMessage.success(`已新增 ${lines.length} 条询问句`)
    } catch (e) {
      console.error('新增询问句失败', e)
      ElMessage.error('新增失败，请重试')
      return
    }
  }
  addQuestionText.value = ''
  addQuestionVisible.value = false
}

/* ------------------------- 编辑询问句 ------------------------- */

const editQuestionVisible = ref(false)
const editQuestionText = ref('')
const currentEditQuestion = ref<IntentQuestion | null>(null)

function openEditQuestionDialog(row: IntentQuestion) {
  currentEditQuestion.value = row
  editQuestionText.value = row.text
  editQuestionVisible.value = true
}

async function saveEditQuestion() {
  const row = currentEditQuestion.value
  if (!row) return
  if (USE_MOCK) {
    row.text = editQuestionText.value
  } else {
    try {
      const updated = await updateIntentQuestion(row.id, { text: editQuestionText.value })
      row.text = updated.text
    } catch (e) {
      console.error('编辑询问句失败', e)
      ElMessage.error('编辑失败，请重试')
      return
    }
  }
  editQuestionVisible.value = false
}

/* ------------------------- AI 拓展（询问句弹窗用） ------------------------- */

const aiExpandVisible = ref(false)
const aiExpandText = ref('')
const aiExpandingQuestions = ref(false)

async function openAiExpand() {
  if (!currentRow.value) return
  if (aiExpandingQuestions.value) return

  aiExpandVisible.value = true
  aiExpandText.value = ''
  aiExpandingQuestions.value = true

  try {
    const list = await aiExpandQuestions({
      level: currentRow.value.level,
      scene: currentRow.value.scene,
      tag: currentRow.value.tag
    })
    // 每条询问句独立一行
    aiExpandText.value = (list || []).join('\n')
  } catch (e) {
    console.error('AI 拓展询问句失败', e)
    ElMessage.error('AI 拓展失败，请稍后重试')
  } finally {
    aiExpandingQuestions.value = false
  }
}

function refreshAiExpand() {
  // 换一批：重新调用 AI 生成
  openAiExpand()
}

function applyAiExpand() {
  addQuestionText.value = aiExpandText.value
  aiExpandVisible.value = false
  addQuestionVisible.value = true
}

/* ------------------------- 删除确认 ------------------------- */

const deleteVisible = ref(false)
const deleteMessage = ref('')
const deleteTarget = ref<{ type: DeleteTarget; id: number } | null>(null)

function confirmDelete(type: DeleteTarget, row: IntentWord | IntentQuestion) {
  deleteTarget.value = { type, id: row.id }
  deleteMessage.value =
    type === 'intent'
      ? '删除该意图词后将无法恢复，确认删除吗？'
      : '删除该关联询问句后将无法恢复，确认删除吗？'
  deleteVisible.value = true
}

async function executeDelete() {
  const target = deleteTarget.value
  if (target) {
    if (target.type === 'intent') {
      if (!USE_MOCK) {
        try {
          await deleteIntentWord(target.id)
        } catch (e) {
          console.error('删除意图词失败', e)
          ElMessage.error('删除失败，请稍后重试')
          return
        }
      }
      words.value = words.value.filter(item => item.id !== target.id)
      ElMessage.success('已删除')
    } else {
      if (!USE_MOCK) {
        try {
          await deleteIntentQuestion(target.id)
        } catch (e) {
          console.error('删除询问句失败', e)
          ElMessage.error('删除失败，请稍后重试')
          return
        }
      }
      questions.value = questions.value.filter(item => item.id !== target.id)
      syncQuestionCount()
      ElMessage.success('已删除')
    }
  }
  deleteVisible.value = false
  deleteTarget.value = null
}

/* ============================================================
   新建意图词抽屉
   ============================================================ */

const createDrawerVisible = ref(false)

/** 抽屉表单（层级 / 场景 / 标签） */
const createForm = reactive({ level: '', scene: '', tag: '' })

/** 级联筛选：意图层级变化时清空核心场景和意图标签 */
watch(() => createForm.level, () => {
  createForm.scene = ''
  createForm.tag = ''
})
/** 级联筛选：核心场景变化时清空意图标签 */
watch(() => createForm.scene, () => {
  createForm.tag = ''
})

/** 当前已生成的关键词列表 */
const drawerKeywords = ref<DrawerKeyword[]>([])

/** 已选关键词：以 keyword 文本为 key，避免重复勾选 */
const selectedKeywordMap = ref<Map<string, DrawerKeyword>>(new Map())

const selectedKeywordList = computed(() => Array.from(selectedKeywordMap.value.values()))

const aiExpanding = ref(false)

const allSelected = computed(
  () => drawerKeywords.value.length > 0 && drawerKeywords.value.every(k => k.selected)
)
const someSelected = computed(
  () => drawerKeywords.value.some(k => k.selected) && !allSelected.value
)

const kwSummary = computed(() => {
  const total = drawerKeywords.value.length
  if (total === 0) return ''
  const sel = drawerKeywords.value.filter(k => k.selected).length
  return `共 ${total} 个 · 已选 ${sel} 个`
})

/** 全选复选框的 indeterminate 状态需操作原生 DOM */
const checkAllRef = ref<HTMLInputElement | null>(null)
watchEffect(() => {
  if (checkAllRef.value) {
    checkAllRef.value.indeterminate = someSelected.value
  }
})

function openCreateDrawer() {
  createForm.level = ''
  createForm.scene = ''
  createForm.tag = ''
  drawerKeywords.value = []
  selectedKeywordMap.value = new Map()
  createDrawerVisible.value = true
}

function closeCreateDrawer() {
  createDrawerVisible.value = false
}

/** 点击「新建」 */
function onCreate() {
  openCreateDrawer()
}

/** 点击「AI拓展」：调用后端 AI 接口生成关键词 */
async function handleAiExpand() {
  if (aiExpanding.value) return

  if (!createForm.level) {
    ElMessage.warning('请先选择意图层级')
    return
  }
  if (!createForm.scene) {
    ElMessage.warning('请选择核心场景')
    return
  }
  if (!createForm.tag) {
    ElMessage.warning('请选择意图标签')
    return
  }

  aiExpanding.value = true

  try {
    const keywords = await aiExpandKeywords({
      level: createForm.level,
      scene: createForm.scene.trim(),
      tag: createForm.tag.trim()
    })

    const pool = (keywords && keywords.length > 0) ? keywords : pickAiKeywords(12 + Math.floor(Math.random() * 4))

    drawerKeywords.value = pool.map((kw, i) => ({
      id: `kw_${Date.now()}_${i}`,
      keyword: kw,
      levelFull: createForm.level,
      levelShort: INTENT_LEVEL_SHORT_MAP[createForm.level] ?? createForm.level,
      scene: createForm.scene.trim(),
      tag: createForm.tag.trim(),
      selected: selectedKeywordMap.value.has(kw)
    }))

    ElMessage.success(`已生成 ${drawerKeywords.value.length} 个关键词`)
  } catch (e) {
    ElMessage.error('AI 拓展失败，请稍后重试')
    console.error(e)
  } finally {
    aiExpanding.value = false
  }
}

/** 单行勾选/取消 */
function toggleKeyword(item: DrawerKeyword, checked: boolean) {
  item.selected = checked
  const map = new Map(selectedKeywordMap.value)
  if (checked) map.set(item.keyword, item)
  else map.delete(item.keyword)
  selectedKeywordMap.value = map
}

/** 全选/取消全选 */
function toggleAllKeywords(checked: boolean) {
  const map = new Map(selectedKeywordMap.value)
  drawerKeywords.value.forEach(item => {
    item.selected = checked
    if (checked) map.set(item.keyword, item)
    else map.delete(item.keyword)
  })
  selectedKeywordMap.value = map
  // 立即同步原生复选框状态（防止视图抖动）
  nextTick(() => {
    if (checkAllRef.value) checkAllRef.value.indeterminate = someSelected.value
  })
}

/** 从已选标签里移除 */
function removeSelectedKeyword(keyword: string) {
  const map = new Map(selectedKeywordMap.value)
  map.delete(keyword)
  selectedKeywordMap.value = map

  const item = drawerKeywords.value.find(k => k.keyword === keyword)
  if (item) item.selected = false
}

/** 清空已选 */
function clearSelected() {
  if (selectedKeywordMap.value.size === 0) return
  selectedKeywordMap.value = new Map()
  drawerKeywords.value.forEach(k => (k.selected = false))
}

/** 抽屉确定：把已选关键词写入主表 */
async function saveCreateFromDrawer() {
  const list = selectedKeywordList.value
  if (list.length === 0) {
    ElMessage.warning('请至少选择一个关键词')
    return
  }

  // 构造要保存的意图词列表
  const toSave: IntentWord[] = list.map(item => ({
    id: 0,
    keyword: item.keyword,
    level: item.levelFull,
    scene: item.scene,
    tag: item.tag,
    type: '通用词',
    competitiveness: '中',
    questionCount: 0,
    status: true
  }))

  if (USE_MOCK) {
    // mock 模式：直接加到本地
    const base = Date.now()
    toSave.forEach((item, i) => {
      words.value.unshift({ ...item, id: base + i })
    })
  } else {
    // 真实模式：调用后端批量保存
    try {
      const saved = await batchCreateIntentWords(toSave, projectId.value || '')
      // 把后端返回的（带真实 id）插到列表头部
      saved.forEach(item => words.value.unshift(item))
    } catch (e) {
      console.error('保存意图词失败', e)
      ElMessage.error('保存失败，请稍后重试')
      return
    }
  }

  activeLayer.value = INTENT_LAYER_ALL.value
  currentPage.value = 1

  closeCreateDrawer()
  ElMessage.success(`已新增 ${list.length} 个意图词`)
}
</script>

<style scoped lang="scss">
/* 配色与尺寸对齐原型 意图词库.html */
.intent-page {
  --it-primary: #3662ec;
  --it-bg: #f5f7fa;
  --it-border: #eef0f4;
  --it-text-primary: #1f2329;
  --it-text-secondary: #9aa1aa;
  --it-input-border: #dcdfe6;
  --it-switch-green: #13ce66;

  display: flex;
  gap: 16px;
  color: var(--it-text-primary);

  /* 左侧导航 */
  .sidebar {
    width: 140px;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .nav-item {
    padding: 10px 12px;
    background: #fff;
    border-radius: 4px;
    font-size: 13px;
    color: var(--it-text-primary);
    cursor: pointer;
    border: 1px solid var(--it-border);
    transition: all 0.2s;

    &:hover {
      color: var(--it-primary);
    }

    &.active {
      background: var(--it-primary);
      color: #fff;
      border-color: var(--it-primary);
    }
  }

  /* 主内容区 */
  .main-content {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .card {
    background: #fff;
    border-radius: 8px;
    padding: 20px 24px;
    border: 1px solid var(--it-border);
  }

  /* 顶部筛选栏 */
  .filter-bar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 12px 16px;
  }

  .filter-item {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
  }

  .filter-item-grow {
    flex: 1;
    min-width: 160px;
  }

  .filter-item-grow .filter-input {
    width: 100%;
  }

  .filter-label {
    font-size: 13px;
    color: #333;
    white-space: nowrap;
  }

  .filter-input {
    height: 32px;
    padding: 0 10px;
    border: 1px solid var(--it-input-border);
    border-radius: 4px;
    font-size: 13px;
    outline: none;
    color: var(--it-text-primary);
    width: 120px;
    transition: border-color 0.2s;

    &:focus {
      border-color: var(--it-primary);
    }
  }

  .filter-create {
    flex-shrink: 0;
  }

  /* 搜索框与按钮无缝连接 */
  .search-group {
    gap: 0;
  }

  .search-input {
    height: 32px;
    padding: 0 10px;
    border: 1px solid var(--it-input-border);
    border-right: none;
    border-radius: 4px 0 0 4px;
    font-size: 13px;
    outline: none;
    width: 150px;
    color: var(--it-text-primary);
    transition: border-color 0.2s;

    &:focus {
      border-color: var(--it-primary);
    }
  }

  .search-btn {
    height: 32px;
    padding: 0 16px;
    border-radius: 0 4px 4px 0;
    border: 1px solid var(--it-primary);
    background: var(--it-primary);
    color: #fff;
    cursor: pointer;
    font-size: 13px;
    transition: background 0.2s;

    &:hover {
      background: #2b50d0;
    }
  }

  /* 通用按钮 */
  .btn {
    height: 32px;
    padding: 0 16px;
    border-radius: 4px;
    border: 1px solid var(--it-input-border);
    background: #fff;
    cursor: pointer;
    font-size: 13px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    color: var(--it-text-primary);
  }

  .btn-primary {
    background: var(--it-primary);
    color: #fff;
    border-color: var(--it-primary);

    &:hover {
      background: #2b50d0;
    }
  }

  .btn-link {
    background: transparent;
    border: none;
    color: var(--it-primary);
    padding: 0 8px;
    height: auto;
    cursor: pointer;
    font-size: 13px;

    &:hover {
      text-decoration: underline;
    }
  }

  .btn-sm {
    height: 28px;
    padding: 0 12px;
    font-size: 12px;
  }

  .btn-confirm {
    width: 100px;
  }

  /* 表格样式 */
  .table-container {
    width: 100%;
    overflow-x: auto;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
    text-align: left;
  }

  th,
  td {
    padding: 12px 10px;
    border: 1px solid var(--it-border);
  }

  th {
    background: #fafafa;
    font-weight: 500;
    color: #606266;
    white-space: nowrap;
  }

  tr:hover {
    background: #f5f7fa;
  }

  .text-center {
    text-align: center;
  }

  .empty-cell {
    padding: 40px 0;
    color: #909399;
  }

  /* 状态开关（主表格） */
  .switch-normal {
    position: relative;
    display: inline-block;
    width: 40px;
    height: 20px;
    vertical-align: middle;

    input {
      opacity: 0;
      width: 0;
      height: 0;
    }

    .slider {
      position: absolute;
      cursor: pointer;
      inset: 0;
      background-color: #dcdfe6;
      transition: 0.4s;
      border-radius: 20px;

      &::before {
        position: absolute;
        content: '';
        height: 16px;
        width: 16px;
        left: 2px;
        bottom: 2px;
        background-color: white;
        transition: 0.4s;
        border-radius: 50%;
      }
    }

    input:checked + .slider {
      background-color: var(--it-primary);

      &::before {
        transform: translateX(20px);
      }
    }
  }

  /* 状态开关（弹窗内：青色带文字） */
  .switch-dialog {
    position: relative;
    display: inline-block;
    width: 44px;
    height: 20px;
    vertical-align: middle;

    input {
      opacity: 0;
      width: 0;
      height: 0;
    }

    .slider {
      position: absolute;
      cursor: pointer;
      inset: 0;
      background-color: #dcdfe6;
      transition: 0.4s;
      border-radius: 20px;

      &::before {
        position: absolute;
        content: '';
        height: 16px;
        width: 16px;
        left: 2px;
        bottom: 2px;
        background-color: white;
        transition: 0.4s;
        border-radius: 50%;
        z-index: 2;
      }

      &::after {
        content: '关';
        position: absolute;
        right: 6px;
        top: 50%;
        transform: translateY(-50%);
        color: #fff;
        font-size: 10px;
        transition: 0.4s;
      }
    }

    input:checked + .slider {
      background-color: var(--it-switch-green);

      &::before {
        transform: translateX(24px);
      }

      &::after {
        content: '开';
        left: 6px;
        right: auto;
      }
    }
  }

  /* 分页栏 */
  .pagination {
    display: flex;
    flex-direction: row;
    justify-content: flex-end;
    align-items: center;
    gap: 16px;
    font-size: 13px;
    color: #606266;
    margin-top: 20px;
    user-select: none;
  }

  .page-total {
    color: #606266;
    margin-right: 8px;
  }

  .page-navigator {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 4px;
  }

  .page-numbers {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .page-btn {
    background: transparent;
    border: none;
    cursor: pointer;
    color: #606266;
    width: 28px;
    height: 28px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;

    &:hover:not(:disabled) {
      color: var(--it-primary);
    }

    &:disabled {
      color: #c0c4cc;
      cursor: not-allowed;
    }
  }

  .page-number {
    background: transparent;
    border: none;
    cursor: pointer;
    color: #606266;
    min-width: 28px;
    height: 28px;
    padding: 0 4px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    font-size: 13px;

    &:hover {
      color: var(--it-primary);
    }

    &.active {
      font-weight: 700;
      color: #1f2329;
      cursor: default;
    }
  }

  .page-ellipsis {
    color: #606266;
    padding: 0 4px;
    display: inline-flex;
    align-items: center;
    height: 28px;
  }

  .page-size-select {
    border: none;
    background: transparent;
    color: #606266;
    font-size: 13px;
    cursor: pointer;
    outline: none;
    height: 28px;

    &:hover {
      color: var(--it-primary);
    }
  }

  .page-jump {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #606266;

    input {
      width: 40px;
      height: 28px;
      border: 1px solid var(--it-input-border);
      border-radius: 4px;
      text-align: center;
      outline: none;
      font-size: 13px;
      color: #1f2329;
      background-color: #f5f7fa;

      &:focus {
        border-color: var(--it-primary);
        background-color: #fff;
      }
    }
  }

  /* 表单与文本 */
  .form-item {
    display: flex;
    align-items: center;
    margin-bottom: 16px;

    label {
      width: 80px;
      font-size: 13px;
      color: #606266;
      flex-shrink: 0;
    }

    select,
    input {
      flex: 1;
      height: 32px;
      padding: 0 10px;
      border: 1px solid var(--it-input-border);
      border-radius: 4px;
      outline: none;
      color: var(--it-text-primary);
    }
  }

  .dialog-label {
    font-size: 14px;
    color: var(--it-text-primary);
    font-weight: 500;
    margin: 0;
  }

  .setting-label {
    margin-bottom: 20px;
  }

  /* 关联询问句 */
  .question-top-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;

    .setting-label {
      margin-bottom: 0;
    }
  }

  .question-text-blue {
    color: var(--it-primary);
  }

  .question-table-wrapper {
    flex: 1;
    overflow-y: auto;
    border: 1px solid var(--it-border);
    border-radius: 4px;
    max-height: calc(90vh - 180px);

    .question-table {
      font-size: 12px;
      margin: 0;
      border: none;
      table-layout: fixed;

      th,
      td {
        border: none;
      }

      thead th {
        position: sticky;
        top: 0;
        z-index: 10;
        background: #fafafa;
        box-shadow: 0 1px 0 var(--it-border);
        padding: 10px;
        text-align: left;
        font-weight: 500;
        color: #606266;
      }

      tbody td {
        padding: 10px;
        border-top: 1px solid var(--it-border);
      }

      tbody tr:hover {
        background: #f5f7fa;
      }
    }
  }

  .th-dark {
    color: #333;
  }

  textarea {
    width: 100%;
    padding: 10px;
    border: 1px solid var(--it-input-border);
    border-radius: 4px;
    resize: vertical;
    font-family: inherit;
    font-size: 13px;
    outline: none;
    color: var(--it-text-primary);

    &:focus {
      border-color: var(--it-primary);
    }
  }

  .delete-confirm-content {
    padding: 10px 0;
    font-size: 14px;
    color: var(--it-text-primary);
  }

  /* ============================================================
     抽屉：新建意图词
     ============================================================ */

  .drawer-mask {
    position: fixed;
    inset: 0;
    background: rgba(17, 24, 39, 0.42);
    opacity: 0;
    visibility: hidden;
    z-index: 1100;
    transition: opacity 0.3s ease, visibility 0.3s ease;

    &.active {
      opacity: 1;
      visibility: visible;
    }
  }

  .drawer {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    width: min(1120px, 94vw);
    background: var(--it-bg);
    z-index: 1101;
    display: flex;
    flex-direction: column;
    transform: translateX(100%);
    transition: transform 0.44s cubic-bezier(0.22, 0.61, 0.36, 1);
    box-shadow: -16px 0 48px rgba(15, 23, 42, 0.14);
    border-radius: 12px 0 0 12px;
    overflow: hidden;

    &.active {
      transform: translateX(0);
    }
  }

  .drawer-header {
    flex-shrink: 0;
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    padding: 18px 24px 16px;
    background: #fff;
    border-bottom: 1px solid var(--it-border);
  }

  .drawer-header-title {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  .drawer-title {
    font-size: 16px;
    font-weight: 600;
    color: var(--it-text-primary);
    letter-spacing: 0.2px;
  }

  .drawer-subtitle {
    font-size: 12px;
    color: var(--it-text-secondary);
  }

  .drawer-close {
    width: 30px;
    height: 30px;
    border-radius: 6px;
    border: none;
    background: transparent;
    color: #909399;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s, color 0.2s, transform 0.2s;

    &:hover {
      background: #f2f3f5;
      color: var(--it-text-primary);
      transform: rotate(90deg);
    }
  }

  .drawer-body {
    flex: 1;
    min-height: 0;
    display: flex;
    gap: 16px;
    padding: 16px 24px;
    overflow: hidden;
  }

  .drawer-col-left {
    flex: 1 1 auto;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .drawer-col-right {
    width: 340px;
    flex-shrink: 0;
    display: flex;
  }

  .panel {
    background: #fff;
    border: 1px solid var(--it-border);
    border-radius: 8px;
    padding: 16px 18px;
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  .panel-grow {
    flex: 1;
    min-height: 0;
  }

  .drawer-col-right .panel {
    flex: 1;
    min-height: 0;
    width: 100%;
  }

  .panel-title {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 13px;
    font-weight: 600;
    color: var(--it-text-primary);
    margin-bottom: 14px;
    flex-shrink: 0;

    > span:first-child {
      display: inline-flex;
      align-items: center;
      gap: 8px;

      &::before {
        content: '';
        width: 3px;
        height: 12px;
        border-radius: 2px;
        background: var(--it-primary);
      }
    }

    em {
      font-style: normal;
      font-weight: 400;
      font-size: 12px;
      color: var(--it-text-secondary);
    }
  }

  .panel-extra {
    font-size: 12px;
    font-weight: 400;
    color: var(--it-text-secondary);
  }

  .filter-row {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;

    > label {
      font-size: 13px;
      color: #606266;
      white-space: nowrap;
      flex-shrink: 0;
    }

    select,
    input[type='text'] {
      height: 32px;
      padding: 0 10px;
      border: 1px solid var(--it-input-border);
      border-radius: 4px;
      font-size: 13px;
      outline: none;
      color: var(--it-text-primary);
      background: #fff;
      transition: border-color 0.2s, box-shadow 0.2s;
    }

    select {
      width: 108px;
      cursor: pointer;
    }

    input[type='text'] {
      width: 128px;
    }

    select:focus,
    input[type='text']:focus {
      border-color: var(--it-primary);
      box-shadow: 0 0 0 3px rgba(54, 98, 236, 0.1);
    }
  }

  .btn-ai {
    margin-left: auto;
    gap: 6px;
    min-width: 92px;

    &.loading {
      pointer-events: none;
      opacity: 0.85;
    }

    .spinner {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      border: 2px solid rgba(255, 255, 255, 0.38);
      border-top-color: #fff;
      animation: spin 0.7s linear infinite;
    }
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .kw-table-wrap {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    position: relative;
    border: 1px solid var(--it-border);
    border-radius: 6px;
  }

  .kw-table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
    font-size: 13px;
    table-layout: fixed;

    thead th {
      position: sticky;
      top: 0;
      z-index: 2;
      background: #fafbfc;
      color: #606266;
      font-weight: 500;
      font-size: 12px;
      text-align: left;
      padding: 10px 12px;
      border: none;
      border-bottom: 1px solid var(--it-border);
      white-space: nowrap;
    }

    tbody td {
      padding: 11px 12px;
      border: none;
      border-bottom: 1px solid #f4f5f7;
      color: var(--it-text-primary);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    tbody tr {
      cursor: pointer;
      transition: background 0.18s ease;

      &:hover {
        background: #f7f9ff;
      }

      &.selected {
        background: #f0f4ff;
      }

      &:last-child td {
        border-bottom: none;
      }
    }

    th:first-child,
    td:first-child {
      text-align: center;
      padding-left: 0;
      padding-right: 0;
    }
  }

  .kw-check {
    appearance: none;
    -webkit-appearance: none;
    width: 16px;
    height: 16px;
    border: 1px solid #c9cdd4;
    border-radius: 4px;
    background: #fff;
    cursor: pointer;
    position: relative;
    vertical-align: middle;
    transition: background 0.18s, border-color 0.18s, transform 0.12s;
    margin: 0;

    &:hover {
      border-color: var(--it-primary);
    }

    &:active {
      transform: scale(0.88);
    }

    &:checked {
      background: var(--it-primary);
      border-color: var(--it-primary);

      &::after {
        content: '';
        position: absolute;
        left: 5px;
        top: 2px;
        width: 4px;
        height: 8px;
        border: solid #fff;
        border-width: 0 1.6px 1.6px 0;
        transform: rotate(45deg);
      }
    }
  }

  .kw-empty {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 40px;
    color: var(--it-text-secondary);
    font-size: 13px;
    text-align: center;
    line-height: 1.7;
  }

  .kw-empty-icon {
    width: 46px;
    height: 46px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #eef2ff, #f7f9ff);
    font-size: 20px;
    color: var(--it-primary);
    box-shadow: inset 0 0 0 1px #e6ecff;
  }

  .selected-tags {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    display: flex;
    flex-wrap: wrap;
    align-content: flex-start;
    gap: 8px;
    padding-right: 2px;
  }

  .tag-chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    height: 28px;
    padding: 0 6px 0 10px;
    border-radius: 6px;
    background: #f2f5ff;
    border: 1px solid #dde5ff;
    color: var(--it-primary);
    font-size: 12px;
    max-width: 100%;
    animation: chipIn 0.24s cubic-bezier(0.34, 1.4, 0.64, 1) both;

    > span {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      max-width: 190px;
    }

    .tag-remove {
      width: 16px;
      height: 16px;
      border-radius: 50%;
      border: none;
      background: transparent;
      color: currentColor;
      opacity: 0.5;
      cursor: pointer;
      font-size: 14px;
      line-height: 1;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0;
      flex-shrink: 0;
      transition: opacity 0.15s, background 0.15s, transform 0.15s;

      &:hover {
        opacity: 1;
        background: rgba(54, 98, 236, 0.14);
        transform: scale(1.08);
      }
    }
  }

  @keyframes chipIn {
    from {
      opacity: 0;
      transform: scale(0.8) translateY(4px);
    }
    to {
      opacity: 1;
      transform: none;
    }
  }

  .selected-empty {
    width: 100%;
    padding: 70px 0;
    text-align: center;
    color: var(--it-text-secondary);
    font-size: 12px;
    line-height: 2.1;

    span {
      display: block;
      color: #c2c7cf;
      font-size: 11px;
    }
  }

  .drawer-footer {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 12px;
    padding: 14px 24px;
    background: #fff;
    border-top: 1px solid var(--it-border);

    .footer-tip {
      margin-right: auto;
      font-size: 12px;
      color: var(--it-text-secondary);
    }
  }

  @keyframes rowIn {
    from {
      opacity: 0;
      transform: translateY(6px);
    }
    to {
      opacity: 1;
      transform: none;
    }
  }

  .kw-table tbody tr {
    animation: rowIn 0.28s ease both;
  }

  @media (max-width: 1180px) {
    .drawer-col-right {
      width: 280px;
    }
  }

  /* 滚动条美化 */
  .kw-table-wrap::-webkit-scrollbar,
  .selected-tags::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }

  .kw-table-wrap::-webkit-scrollbar-thumb,
  .selected-tags::-webkit-scrollbar-thumb {
    background: #dfe3e8;
    border-radius: 3px;

    &:hover {
      background: #c9cdd4;
    }
  }

  .kw-table-wrap::-webkit-scrollbar-track,
  .selected-tags::-webkit-scrollbar-track {
    background: transparent;
  }
}
</style>