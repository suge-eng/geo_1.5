<template>
  <div class="task-create">
    <!-- 页面标题 -->
    <div class="page-header">
      <div
        class="back-link"
        @click="goBack"
      >
        <el-icon>
          <Back />
        </el-icon>
        <span>新建监测</span>
      </div>
    </div>

    <div class="create-content">
      <!-- ================================================= -->
      <!-- 第一、二步：顶部区域 -->
      <!-- ================================================= -->
      <div class="top-steps">
        <!-- 第一步 -->
        <section class="step-section step-project">
          <div class="section-title">
            <span class="req">*</span>
            第一步：输入项目名称
          </div>

          <el-input
            v-model="form.title"
            placeholder="请输入项目名称"
            maxlength="10"
            show-word-limit
          />
        </section>

        <!-- 第二步 -->
        <section class="step-section step-platform">
          <div class="section-title">
            <span class="req">*</span>
            第二步：选择 AI 平台
          </div>

          <div class="platform-row">
            <span class="platform-label">
              Web端
            </span>

            <div class="platform-list">
              <div
                v-for="p in webPlatforms"
                :key="p.value"
                class="platform-item"
              >
                <el-switch
                  v-model="platformMap[p.value]"
                  size="small"
                />

                <span>{{ p.label }}</span>
              </div>
            </div>
          </div>

          <div class="platform-row">
            <span class="platform-label">
              App端
            </span>

            <div class="platform-list">
              <div
                v-for="p in appPlatforms"
                :key="p.value"
                class="platform-item"
              >
                <el-switch
                  v-model="platformMap[p.value]"
                  size="small"
                />

                <span>{{ p.label }}</span>
              </div>
            </div>
          </div>
        </section>
      </div>

      <!-- ================================================= -->
      <!-- 主体：第三步 + 右侧第四五六步 -->
      <!-- ================================================= -->
      <div class="main-layout">
        <!-- ================= 第三步 ================= -->
        <section class="step-section step-third">
          <div class="section-title">
            <span class="req">*</span>
            第三步：选择询问句
          </div>

          <!-- 筛选条件 -->
          <div class="filter-bar">
            <div class="filter-item monitor-target">
              <span class="filter-label">
                监测目标：
              </span>

              <el-radio-group v-model="form.monitorTarget">
                <el-radio value="volume">
                  声量
                </el-radio>

                <el-radio value="sentiment">
                  舆情
                </el-radio>
              </el-radio-group>
            </div>

            <el-select
              v-model="form.level"
              placeholder="选择层级"
              size="small"
              class="filter-select"
              clearable
            >
              <el-option
                v-for="item in levelOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>

            <el-select
              v-model="form.intentTag"
              placeholder="意图标签"
              size="small"
              class="filter-select"
              clearable
            >
              <el-option
                v-for="item in intentTagOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>

            <el-button
              type="primary"
              size="small"
              @click="onSearch"
            >
              查询
            </el-button>
          </div>

          <!-- 询问句 -->
          <div class="question-area">
            <!-- 关键词 -->
            <div class="keyword-panel">
              <div class="panel-header">
                <div class="panel-title">
                  关键词
                </div>

                <div class="panel-search">
                  <el-input
                    v-model="keywordSearchText"
                    placeholder="请输入"
                    size="small"
                    clearable
                  />
                </div>
              </div>

              <div class="panel-body">
                <el-checkbox-group
                  v-model="selectedKeywordIds"
                  @change="onKeywordToggle"
                >
                  <el-checkbox
                    v-for="kw in filteredKeywords"
                    :key="kw.id"
                    :value="kw.id"
                    class="keyword-check"
                  >
                    {{ kw.keyword }}
                  </el-checkbox>
                </el-checkbox-group>
                <div
                  v-if="filteredKeywords.length === 0"
                  class="empty-tip"
                >
                  暂无关键词，请先查询
                </div>
              </div>

              <div
                class="panel-footer"
                @click="resetKeywords"
              >
                重置
              </div>
            </div>

            <!-- 中间询问句（待选） -->
            <div class="transfer-panel">
              <div class="transfer-header">
                <span>询问句</span>
                <span>{{ checkedMiddleIds.length }}/{{ middleQuestions.length }}</span>
              </div>

              <div class="transfer-list">
                <el-checkbox-group v-model="checkedMiddleIds">
                  <el-checkbox
                    v-for="q in middleQuestions"
                    :key="q.id"
                    :value="q.id"
                    class="transfer-item"
                  >
                    {{ q.text }}
                  </el-checkbox>
                </el-checkbox-group>
                <div
                  v-if="middleQuestions.length === 0"
                  class="empty-tip"
                >
                  请先选择关键词
                </div>
              </div>

              <div
                class="panel-footer"
                @click="resetMiddle"
              >
                重置
              </div>
            </div>

            <!-- 穿梭按钮 -->
            <div class="transfer-actions">
              <el-button
                text
                class="transfer-arrow"
                @click="moveToLeft"
              >
                ‹
              </el-button>

              <el-button
                text
                class="transfer-arrow"
                @click="moveToRight"
              >
                ›
              </el-button>
            </div>

            <!-- 右侧询问句（已选） -->
            <div class="transfer-panel">
              <div class="transfer-header">
                <span>询问句</span>
                <span>{{ checkedRightIds.length }}/{{ rightQuestions.length }}</span>
              </div>

              <div class="transfer-list">
                <el-checkbox-group v-model="checkedRightIds">
                  <el-checkbox
                    v-for="q in rightQuestions"
                    :key="q.id"
                    :value="q.id"
                    class="transfer-item"
                  >
                    {{ q.text }}
                  </el-checkbox>
                </el-checkbox-group>
                <div
                  v-if="rightQuestions.length === 0"
                  class="empty-tip"
                >
                  未选择询问句
                </div>
              </div>

              <div
                class="panel-footer"
                @click="resetRight"
              >
                重置
              </div>
            </div>
          </div>
        </section>

        <!-- ================= 右侧 ================= -->
        <div class="right-steps">
          <!-- ================= 第四步 ================= -->
          <section class="step-section step-fourth">
            <div class="section-title">
              第四步：输入品牌
            </div>

            <div class="brand-grid">
              <div class="form-group">
                <label>
                  <span class="req">*</span>
                  自主品牌
                </label>

                <el-input
                  v-model="form.brandName"
                  placeholder="请输入自主品牌"
                  maxlength="10"
                  show-word-limit
                  size="small"
                />
              </div>

              <div class="form-group">
                <label>
                  单品
                </label>

                <el-input
                  v-model="form.productName"
                  placeholder="请输入单品名称"
                  maxlength="10"
                  show-word-limit
                  size="small"
                />
              </div>

              <div class="form-group form-group--full">
                <label>
                  竞对品牌
                </label>

                <div class="competitor-grid">
                  <el-input
                    v-for="(_, index) in form.competitors"
                    :key="index"
                    v-model="form.competitors[index]"
                    placeholder="请输入竞对品牌"
                    maxlength="10"
                    size="small"
                  />
                </div>
              </div>
            </div>
          </section>

          <!-- ================= 第五步 ================= -->
          <section class="step-section step-fifth">
            <div class="section-title">
              第五步：选择频次
            </div>

            <div class="schedule-options">
              <el-radio-group v-model="form.frequency">
                <el-radio value="single">
                  单次
                </el-radio>

                <el-radio value="weekly">
                  每周
                </el-radio>

                <el-radio value="monthly">
                  每月
                </el-radio>
              </el-radio-group>
            </div>

            <!-- 每周 -->
            <div
              v-if="form.frequency === 'weekly'"
              class="week-days"
            >
              <div
                v-for="(day, i) in weekOptions"
                :key="day"
                class="day-btn"
                :class="{
                  active: weekDays.includes(i)
                }"
                @click="toggleWeekDay(i)"
              >
                {{ day.replace('周', '') }}
              </div>
            </div>

            <!-- 每月 -->
            <div
              v-if="form.frequency === 'monthly'"
              class="monthly-container"
            >
              <el-popover
                v-model:visible="monthlyVisible"
                placement="bottom-start"
                :width="300"
                trigger="click"
                :teleported="false"
              >
                <template #reference>
                  <el-button size="small">
                    选择每月日期
                    <span class="month-count">
                      （已选{{ monthDays.length }}天）
                    </span>
                  </el-button>
                </template>

                <div class="popover-title">
                  选择每月的固定日期
                </div>

                <div class="monthly-grid">
                  <div
                    v-for="d in 31"
                    :key="d"
                    class="day-btn"
                    :class="{
                      active: monthDays.includes(d)
                    }"
                    @click="toggleMonthDay(d)"
                  >
                    {{ d }}
                  </div>
                </div>
              </el-popover>
            </div>
          </section>

          <!-- ================= 第六步 ================= -->
          <section class="step-section step-sixth">
            <div class="section-title">
              第六步：企业资料信息维护
            </div>

            <div class="upload-note">
              备注：可核验信息包括，影响与信息准确率
            </div>

            <div class="upload-area">
              <el-upload
                drag
                :auto-upload="false"
                multiple
                :on-change="onAttachmentChange"
              >
                <div class="upload-content">
                  <el-icon>
                    <UploadFilled />
                  </el-icon>

                  <span>
                    拖拽或
                    <em>点击上传</em>
                    附件
                  </span>
                </div>

                <template #tip>
                  <div class="el-upload__tip">
                    支持扩展名：.pdf .doc .docx .xls .xlsx，
                    文件大小不超过10MB
                  </div>
                </template>
              </el-upload>
            </div>
          </section>
        </div>
      </div>

      <!-- ================================================= -->
      <!-- 底部操作 -->
      <!-- ================================================= -->
      <div class="footer-actions">
        <el-button
          type="primary"
          :loading="submitting"
          @click="onSubmit"
        >
          提交
        </el-button>

        <el-button @click="goBack">
          取消
        </el-button>
      </div>
    </div>
  </div>
</template>



<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Back, UploadFilled } from '@element-plus/icons-vue'
import { AI_PLATFORMS } from '@/types/enums'
import { createTask } from '@/api/task'
import { projectPath } from '@/utils/projectPath'
import { listLexicon, listIntentQuestions, listEnabledIntentWords } from '@/api/monitorConfig'
import type { LexiconItem } from '@/mock/config'
import type { IntentQuestion, IntentWord } from '@/mock/intenLibrary'
import { USE_MOCK } from '@/mock/flag'
import { setTaskMonitorTarget } from '@/utils/taskType'
import type { MonitorTarget } from '@/types/task'

const route = useRoute()
const router = useRouter()
const submitting = ref(false)

/** 当前项目 ID，页面内跳转都要带上它 */
const projectId = computed(() => route.params.projectId as string | undefined)

/** 项目内的监测任务列表路径 */
const taskListPath = computed(() => projectPath(projectId.value, 'monitor/tasks'))

// ---------- 表单（必须在引用它的 computed/watch 之前声明） ----------
const form = reactive({
  title: '',
  monitorTarget: 'volume' as MonitorTarget,
  level: '',
  intentTag: '',
  brandName: '',
  productName: '',
  competitors: ['', '', '', ''] as string[],
  frequency: 'weekly'
})

/* ============================================================
 * 第三步：选择询问句
 * ============================================================ */

/** 监测目标 → 可选层级映射 */
const VOLUME_LEVELS = ['认知层', '种草层', '甄选层']
const SENTIMENT_LEVELS = ['决策层', '反馈层']

/** 词库资料（从后端加载，用于级联 意图层级→核心场景→意图标签） */
const lexiconList = ref<LexiconItem[]>([])

/** 层级选项：根据监测目标动态变化 */
const levelOptions = computed(() => {
  const levels = form.monitorTarget === 'volume' ? VOLUME_LEVELS : SENTIMENT_LEVELS
  return levels.map(l => ({ label: l, value: l }))
})

/** 意图标签选项：从词库资料中，按当前选中的层级去重过滤 */
const intentTagOptions = computed(() => {
  if (!form.level) return []
  const tags = lexiconList.value
    .filter(item => item.intent === form.level)
    .map(item => item.tag)
  return [...new Set(tags)].map(t => ({ label: t, value: t }))
})

/** 查询出来的关键词列表（intent_word 表，按 level+tag 过滤） */
const keywordList = ref<IntentWord[]>([])

/** 关键词搜索框文本 */
const keywordSearchText = ref('')

/** 关键词搜索过滤后的列表 */
const filteredKeywords = computed(() => {
  if (!keywordSearchText.value) return keywordList.value
  const kw = keywordSearchText.value.toLowerCase()
  return keywordList.value.filter(w => w.keyword.toLowerCase().includes(kw))
})

/** 已勾选的关键词 ID */
const selectedKeywordIds = ref<number[]>([])

/** 已勾选关键词对应的全部询问句（从 intent_question 表加载） */
const allQuestions = ref<IntentQuestion[]>([])

/** 中间框勾选的询问句 ID（准备移到右侧） */
const checkedMiddleIds = ref<number[]>([])

/** 右侧框勾选的询问句 ID（准备移回左侧） */
const checkedRightIds = ref<number[]>([])

/** 已选询问句 ID（右侧框内容） */
const selectedQuestionIds = ref<number[]>([])

/** 中间框 = 全部询问句中，还没被选到右侧的 */
const middleQuestions = computed(() =>
  allQuestions.value.filter(q => !selectedQuestionIds.value.includes(q.id))
)

/** 右侧框 = 已选询问句 */
const rightQuestions = computed(() =>
  allQuestions.value.filter(q => selectedQuestionIds.value.includes(q.id))
)

/** 监测目标变化时，清空已选层级和标签 */
watch(() => form.monitorTarget, () => {
  form.level = ''
  form.intentTag = ''
  keywordList.value = []
  selectedKeywordIds.value = []
  allQuestions.value = []
  selectedQuestionIds.value = []
})

/** 层级变化时，清空标签 */
watch(() => form.level, () => {
  form.intentTag = ''
})

/** 点击查询：根据 层级+标签 过滤关键词 */
async function onSearch() {
  if (USE_MOCK) {
    ElMessage.info('筛选条件为演示数据，暂未接入后端')
    return
  }
  if (!form.level) {
    ElMessage.warning('请先选择层级')
    return
  }
  if (!form.intentTag) {
    ElMessage.warning('请先选择意图标签')
    return
  }
  try {
    const words = await listEnabledIntentWords(projectId.value || '')
    keywordList.value = words.filter(
      w => w.level === form.level && w.tag === form.intentTag
    )
    // 只清关键词上下文；询问句右侧已选的跨层级保留不清
    selectedKeywordIds.value = []
    checkedMiddleIds.value = []
    checkedRightIds.value = []
  } catch (e) {
    console.error('查询关键词失败', e)
    ElMessage.error('查询失败，请重试')
  }
}

/** 勾选/取消关键词时，加载该关键词的询问句（增量合并，跨层级保留） */
async function onKeywordToggle() {
  if (USE_MOCK) return
  try {
    // 收集所有当前勾选关键词的询问句
    const fresh: IntentQuestion[] = []
    for (const id of selectedKeywordIds.value) {
      const qs = await listIntentQuestions(id)
      fresh.push(...(qs || []))
    }
    // 把新查出来的询问句合并到 allQuestions（按 id 去重），已被选进右侧的永不丢
    const selectedSet = new Set(selectedQuestionIds.value)
    const merged = new Map<number, IntentQuestion>()
    for (const q of allQuestions.value) {
      if (selectedSet.has(q.id)) merged.set(q.id, q) // 已选的：永远保留
    }
    for (const q of fresh) {
      merged.set(q.id, q) // 新加载的：覆盖追加
    }
    allQuestions.value = Array.from(merged.values())
  } catch (e) {
    console.error('加载询问句失败', e)
  }
}

/** 右箭头：把中间框勾选的询问句移到右侧 */
function moveToRight() {
  if (checkedMiddleIds.value.length === 0) return
  selectedQuestionIds.value = [
    ...selectedQuestionIds.value,
    ...checkedMiddleIds.value
  ]
  checkedMiddleIds.value = []
}

/** 左箭头：把右侧框勾选的询问句移回中间 */
function moveToLeft() {
  if (checkedRightIds.value.length === 0) return
  selectedQuestionIds.value = selectedQuestionIds.value.filter(
    id => !checkedRightIds.value.includes(id)
  )
  checkedRightIds.value = []
}

/** 重置关键词筛选 */
function resetKeywords() {
  form.level = ''
  form.intentTag = ''
  keywordList.value = []
  selectedKeywordIds.value = []
  allQuestions.value = []
  selectedQuestionIds.value = []
  checkedMiddleIds.value = []
  checkedRightIds.value = []
}

/** 重置中间询问句勾选 */
function resetMiddle() {
  checkedMiddleIds.value = []
}

/** 重置右侧询问句 */
function resetRight() {
  selectedQuestionIds.value = []
  checkedRightIds.value = []
}

/** 页面挂载时加载词库资料（用于级联） */
onMounted(async () => {
  if (USE_MOCK) return
  try {
    lexiconList.value = await listLexicon(projectId.value || '')
  } catch (e) {
    console.error('加载词库资料失败', e)
  }
})

// ---------- 平台选择 ----------

const platformMap = reactive<Record<string, boolean>>({})
AI_PLATFORMS.forEach(p => {
  platformMap[p.value] = false
})

const webPlatforms = AI_PLATFORMS.filter(p => !p.value.endsWith('_app'))
const appPlatforms = AI_PLATFORMS.filter(p => p.value.endsWith('_app'))

const weekOptions = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
const weekDays = ref<number[]>([2, 4])
const monthDays = ref<number[]>([])
const monthlyVisible = ref(false)

function selectedPlatforms(): string[] {
  return AI_PLATFORMS.filter(p => platformMap[p.value]).map(p => p.value)
}

function toggleWeekDay(i: number) {
  const idx = weekDays.value.indexOf(i)
  if (idx >= 0) weekDays.value.splice(idx, 1)
  else weekDays.value.push(i)
}

function toggleMonthDay(d: number) {
  const idx = monthDays.value.indexOf(d)
  if (idx >= 0) monthDays.value.splice(idx, 1)
  else monthDays.value.push(d)
}

function onAttachmentChange() {
  /* 企业资料附件为演示项，暂未接入后端 */
}

function goBack() {
  router.push(taskListPath.value)
}

async function onSubmit() {
  const platforms = selectedPlatforms()
  if (!form.title.trim()) return ElMessage.warning('请填写项目名称')
  if (!platforms.length) return ElMessage.warning('请选择 AI 平台')
  if (selectedQuestionIds.value.length === 0) return ElMessage.warning('请选择询问句')
  if (!form.brandName.trim()) return ElMessage.warning('请填写自主品牌')

  const questions = rightQuestions.value.map(q => q.text)
  const wordIds = rightQuestions.value.map(q => q.wordId ?? null)
  const competitors = form.competitors.filter(c => c.trim())

  submitting.value = true
  try {
    const created = await createTask({
      aiPlatforms: platforms,
      questions,
      wordIds,
      title: form.title,
      brandName: form.brandName,
      productName: form.productName || undefined,
      competitors,
      executionFrequency: form.frequency,
      scope: 'LOCAL',
      projectId: projectId.value || '',
      monitorTarget: form.monitorTarget
    })
    // 后端暂未持久化监测目标，先本地记录，供报告页按任务类型分流（声量/舆情）
    setTaskMonitorTarget(created?.taskNo, form.monitorTarget)
    ElMessage.success('任务创建成功')
    router.push(taskListPath.value)
  } catch {
    /* 错误已由拦截器提示 */
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped lang="scss">
.task-create {
  width: 100%;
  min-height: 100%;
  padding: 0;
  box-sizing: border-box;
  background: #f5f6f8;

  // ==================================================
  // 页面头部
  // ==================================================

  .page-header {
    height: 36px;
    padding: 0 12px;

    display: flex;
    align-items: center;

    background: #f5f6f8;
    box-sizing: border-box;
  }

  .back-link {
    display: flex;
    align-items: center;
    gap: 3px;

    color: #999;
    font-size: 11px;

    cursor: pointer;

    &:hover {
      color: #409eff;
    }

    .el-icon {
      font-size: 12px;
    }
  }

  // ==================================================
  // 整体内容
  // ==================================================

  .create-content {
    width: 100%;
  }

  // ==================================================
  // 每一个步骤都是独立白色区域
  // ==================================================

  .step-section {
    background: #fff;
    box-sizing: border-box;
  }

  // ==================================================
  // 通用标题
  // ==================================================

  .section-title {
    height: 20px;
    line-height: 20px;

    margin-bottom: 9px;

    color: #333;
    font-size: 12px;
    font-weight: 500;

    .req {
      color: #ff4d4f;
      margin-right: 2px;
    }
  }

  // ==================================================
  // 第一、二步
  // ==================================================

  .top-steps {
    display: grid;
    grid-template-columns: 32% 68%;
    gap: 0;

    margin-bottom: 10px;

    background: #f5f6f8;
  }

  .step-project {
    min-width: 0;
    padding: 12px 20px;

    border-right: 10px solid #f5f6f8;

    :deep(.el-input) {
      width: 285px;
    }
  }

  .step-platform {
    min-width: 0;
    padding: 12px 20px;
  }

  // ==================================================
  // AI 平台
  // ==================================================

  .platform-row {
    display: flex;
    align-items: center;

    height: 27px;
  }

  .platform-label {
    width: 42px;
    flex-shrink: 0;

    color: #666;
    font-size: 11px;
  }

  .platform-list {
    display: flex;
    align-items: center;

    gap: 20px;
  }

  .platform-item {
    display: flex;
    align-items: center;
    gap: 5px;

    color: #666;
    font-size: 11px;
    white-space: nowrap;

    :deep(.el-switch) {
      --el-switch-on-color: #409eff;
    }
  }

  // ==================================================
  // 主体
  // ==================================================

  .main-layout {
    display: grid;
    grid-template-columns: 57% 43%;

    gap: 10px;

    align-items: start;

    background: #f5f6f8;
  }

  // 左侧第三步
  .step-third {
    min-width: 0;
    padding: 12px;
    height: 496px;
  }

  // 右侧 4 / 5 / 6
  .right-steps {
    min-width: 0;

    display: flex;
    flex-direction: column;

    gap: 10px;
  }

  .right-steps > .step-section {
    padding: 12px;
  }

  // ==================================================
  // 第三步筛选
  // ==================================================

  .filter-bar {
    height: 38px;

    display: flex;
    align-items: center;

    gap: 10px;

    padding: 5px 8px;

    box-sizing: border-box;

    background: #f7f8fa;
    border-radius: 3px;

    margin-bottom: 10px;
  }

  .filter-item {
    display: flex;
    align-items: center;
  }

  .filter-label {
    flex-shrink: 0;

    color: #666;
    font-size: 11px;
  }

  .monitor-target {
    :deep(.el-radio) {
      margin-right: 10px;
    }

    :deep(.el-radio__label) {
      padding-left: 3px;
      font-size: 11px;
    }
  }

  .filter-select {
    width: 120px;

    :deep(.el-input__wrapper) {
      min-height: 26px;
      padding: 0 8px;
    }

    :deep(.el-input__inner) {
      font-size: 11px;
    }
  }

  .filter-bar > .el-button {
    width: 50px;
    height: 26px;

    padding: 0;

    font-size: 11px;
  }

  // ==================================================
  // 第三步询问句
  // ==================================================

  .question-area {
    display: flex;
    align-items: stretch;

    gap: 8px;

    height: 250px;
  }

  // ==================================================
  // 关键词
  // ==================================================

  .keyword-panel {
    width: 23%;
    min-width: 115px;
    flex-shrink: 0;
    height: 300px;
    display: flex;
    flex-direction: column;

    border: 1px solid #dcdfe6;
    border-radius: 5px;

    background: #fff;

    overflow: hidden;
  }

  .panel-header {
    min-height: 30px;

    display: flex;
    align-items: center;

    padding: 0 8px;

    border-bottom: 1px solid #ebeef5;

    box-sizing: border-box;
  }

  .panel-title {
    flex: 1;

    color: #555;
    font-size: 11px;
  }

  .panel-search {
    width: 65px;

    :deep(.el-input__wrapper) {
      min-height: 22px;
      padding: 0 5px;
      box-shadow: none;
    }

    :deep(.el-input__inner) {
      font-size: 10px;
    }
  }

  .panel-body {
    flex: 1;
    min-height: 0;

    padding: 5px 8px;

    overflow-y: auto;

    &::-webkit-scrollbar {
      width: 4px;
    }

    &::-webkit-scrollbar-thumb {
      background: #409eff;
      border-radius: 4px;
    }
  }

  .keyword-check {
    display: flex;
    align-items: center;

    height: 26px;

    margin: 0 !important;

    :deep(.el-checkbox__label) {
      padding-left: 4px;

      color: #555;
      font-size: 10px;
    }
  }

  // ==================================================
  // 询问句面板
  // ==================================================

  .transfer-panel {
    flex: 1;
    min-width: 0;
    height: 300px;
    display: flex;
    flex-direction: column;

    border: 1px solid #dcdfe6;
    border-radius: 5px;

    background: #fff;

    overflow: hidden;
  }

  .transfer-header {
    height: 30px;

    flex-shrink: 0;

    display: flex;
    align-items: center;
    justify-content: space-between;

    padding: 0 8px;

    border-bottom: 1px solid #ebeef5;

    color: #555;
    font-size: 10px;
  }

  .transfer-list {
    flex: 1;
    min-height: 0;

    padding: 5px 8px;

    overflow-y: auto;

    &::-webkit-scrollbar {
      width: 4px;
    }

    &::-webkit-scrollbar-thumb {
      background: #409eff;
      border-radius: 4px;
    }
  }

  .transfer-item {
    display: flex;
    align-items: center;

    height: 26px;

    margin: 0 !important;

    :deep(.el-checkbox__label) {
      padding-left: 4px;

      color: #555;
      font-size: 10px;

      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  .panel-footer {
    height: 23px;

    flex-shrink: 0;

    display: flex;
    align-items: center;
    justify-content: flex-end;

    padding: 0 8px;

    color: #777;
    font-size: 10px;
  }

  // ==================================================
  // 穿梭按钮
  // ==================================================

  .transfer-actions {
    width: 30px;

    flex-shrink: 0;

    display: flex;
    flex-direction: column;

    align-items: center;
    justify-content: center;

    gap: 8px;
  }

  .transfer-arrow {
    width: 26px;
    height: 26px;

    padding: 0;

    color: #999;
    font-size: 20px;

    &:hover {
      color: #409eff;
    }
  }

  // ==================================================
  // 第四步
  // ==================================================

  .brand-grid {
    display: grid;

    grid-template-columns: 1fr 1fr;

    gap: 10px 12px;
  }

  .form-group {
    display: flex;
    flex-direction: column;

    gap: 5px;

    min-width: 0;

    label {
      color: #666;
      font-size: 11px;
      line-height: 18px;

      .req {
        color: #ff4d4f;
      }
    }

    &--full {
      grid-column: 1 / -1;
    }
  }

  .competitor-grid {
    display: grid;

    grid-template-columns: 1fr 1fr;

    gap: 9px 12px;
  }

  // ==================================================
  // 第五步
  // ==================================================

  .schedule-options {
    height: 27px;

    display: flex;
    align-items: center;
  }

  :deep(.schedule-options .el-radio) {
    margin-right: 22px;
  }

  :deep(.schedule-options .el-radio__label) {
    padding-left: 4px;
    font-size: 11px;
  }

  .week-days {
    display: flex;
    gap: 8px;

    margin-top: 5px;
  }

  .day-btn {
    width: 25px;
    height: 25px;

    display: flex;
    align-items: center;
    justify-content: center;

    background: #e5e6e8;

    color: #555;

    font-size: 10px;

    cursor: pointer;

    transition: all 0.15s;

    &:hover {
      background: #dbeafe;
    }

    &.active {
      background: #409eff;
      color: #fff;
    }
  }

  .monthly-container {
    margin-top: 5px;
  }

  .month-count {
    color: #999;
    font-size: 10px;
  }

  // ==================================================
  // 第六步
  // ==================================================

  .upload-note {
    margin-bottom: 6px;

    color: #999;
    font-size: 10px;
  }

  .upload-area {
    width: 100%;

    :deep(.el-upload) {
      width: 100%;
    }

    :deep(.el-upload-dragger) {
      width: 100%;
      height: 68px;

      padding: 0;

      box-sizing: border-box;

      border: 1px solid #dcdfe6;
      border-radius: 5px;
    }

    :deep(.el-upload-dragger:hover) {
      border-color: #409eff;
    }
  }

  .upload-content {
    height: 43px;

    display: flex;
    align-items: center;
    justify-content: center;

    gap: 5px;

    color: #666;
    font-size: 11px;

    .el-icon {
      color: #999;
      font-size: 18px;
    }

    em {
      color: #409eff;
      font-style: normal;
    }
  }

  :deep(.el-upload__tip) {
    margin: -2px 0 0;

    color: #aaa;
    font-size: 9px;

    line-height: 15px;

    text-align: center;
  }

  // ==================================================
  // 底部按钮区域
  // ==================================================

  .footer-actions {
    min-height: 52px;

    display: flex;
    align-items: center;

    gap: 22px;

    margin-top: 10px;
    padding: 10px 20px;

    box-sizing: border-box;

    background: #fff;

    .el-button {
      width: 48px;
      height: 28px;

      padding: 0;

      font-size: 11px;
    }
  }

  // ==================================================
  // Element Plus 输入框统一尺寸
  // ==================================================

  :deep(.el-input__wrapper) {
    min-height: 28px;

    padding: 1px 8px;

    border-radius: 3px;

    box-shadow:
      0 0 0 1px #dcdfe6 inset;
  }

  :deep(.el-input__inner) {
    font-size: 11px;
  }

  :deep(.el-input__count) {
    font-size: 9px;
  }

  // ==================================================
  // Popover
  // ==================================================

  .popover-title {
    margin-bottom: 10px;

    color: #666;
    font-size: 12px;
    text-align: center;
  }

  .monthly-grid {
    display: grid;

    grid-template-columns: repeat(7, 1fr);

    gap: 6px;

    .day-btn {
      width: 28px;
      height: 28px;
    }
  }
}
</style>



