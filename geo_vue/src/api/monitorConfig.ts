import { http } from '@/utils/request'
import { USE_MOCK } from '@/mock/flag'
import { MOCK_INTENT_DEFINITIONS, MOCK_LEXICON } from '@/mock/config'
import type { IntentDefinition, LexiconItem } from '@/mock/config'
import type { IntentWord, IntentQuestion } from '@/mock/intenLibrary'

/**
 * 监测配置服务。
 *
 * 后端暂无「配置」域接口（见 docs/后端API分析报告.md），与 api/project.ts 同属
 * 「后端还没有这一层、先用虚拟数据跑通」的情况：USE_MOCK = true 时全部走
 * src/mock/config.ts 的虚拟数据，编辑意图定义会真的写回虚拟表，保存后表格立即更新。
 *
 * ⚠️ 下方 `/api/monitor/config/*` 是**占位路径**，不是从后端源码读到的真实路由。
 * 后端补齐配置域接口后，请以实际路由为准替换这里的 url，再把 USE_MOCK 置为 false。
 */

/** 模拟网络延迟，让 loading 态可见 */
function delay<T>(data: T, ms = 260): Promise<T> {
  return new Promise(resolve => setTimeout(() => resolve(data), ms))
}

/** 意图定义列表（全量，无分页） */
export function listIntentDefinitions(): Promise<IntentDefinition[]> {
  if (USE_MOCK) return delay(MOCK_INTENT_DEFINITIONS.map(d => ({ ...d })))
  // 真实接口：GET /api/monitor/config/intents
  return http<IntentDefinition[]>({ url: '/api/monitor/config/intents', method: 'get' })
}

/** 保存意图定义（按 id 覆盖） */
export function updateIntentDefinition(data: IntentDefinition): Promise<IntentDefinition> {
  if (USE_MOCK) {
    const index = MOCK_INTENT_DEFINITIONS.findIndex(d => d.id === data.id)
    if (index > -1) Object.assign(MOCK_INTENT_DEFINITIONS[index], data)
    return delay({ ...data })
  }
  // 真实接口：PUT /api/monitor/config/intents/{id}
  return http<IntentDefinition>({
    url: `/api/monitor/config/intents/${data.id}`,
    method: 'put',
    data
  })
}

/** 词库资料列表（按项目隔离，独立表 lexicon_item） */
export function listLexicon(projectId: string): Promise<LexiconItem[]> {
  if (USE_MOCK) return delay(MOCK_LEXICON.map(l => ({ ...l })))
  return http<LexiconItem[]>({
    url: '/api/monitor/config/intents/lexicon',
    method: 'get',
    params: { projectId }
  })
}

/** 导入词库资料表格（Excel / CSV），归属到指定项目，覆盖式 */
export function importLexicon(file: File, projectId: string): Promise<LexiconItem[]> {
  if (USE_MOCK) return delay([] as LexiconItem[], 1200)
  const formData = new FormData()
  formData.append('file', file)
  return http<LexiconItem[]>({
    url: '/api/monitor/config/intents/lexicon/import',
    method: 'post',
    params: { projectId },
    data: formData
  })
}

/** 新增单条词库资料 */
export function createLexicon(data: Partial<LexiconItem>, projectId: string): Promise<LexiconItem> {
  return http<LexiconItem>({
    url: '/api/monitor/config/intents/lexicon',
    method: 'post',
    params: { projectId },
    data
  })
}

/** 更新单条词库资料 */
export function updateLexicon(id: number, data: Partial<LexiconItem>): Promise<LexiconItem> {
  return http<LexiconItem>({
    url: `/api/monitor/config/intents/lexicon/${id}`,
    method: 'put',
    data
  })
}

/** 删除单条词库资料 */
export function deleteLexicon(id: number): Promise<void> {
  return http<void>({
    url: `/api/monitor/config/intents/lexicon/${id}`,
    method: 'delete'
  })
}

/**
 * AI 拓展关键词。
 * 根据意图层级 / 核心场景 / 意图标签调用后端 AI 接口生成关键词。
 * 真实接口：POST /api/monitor/config/intents/ai-expand
 */
export function aiExpandKeywords(params: {
  level: string
  scene: string
  tag: string
}): Promise<string[]> {
  return http<string[]>({
    url: '/api/monitor/config/intents/ai-expand',
    method: 'post',
    data: params
  })
}

/** AI 拓展询问句：根据该意图层级的询问提示词生成 20 个独立询问句 */
export function aiExpandQuestions(params: {
  level: string
  scene: string
  tag: string
}): Promise<string[]> {
  return http<string[]>({
    url: '/api/monitor/config/intents/questions/ai-expand',
    method: 'post',
    data: params
  })
}

/* ==================== 意图词（intent_word） ==================== */

/** 按项目查询"启用"的意图词（停用的不返回），给新建任务关键词下拉用 */
export function listEnabledIntentWords(projectId: string): Promise<IntentWord[]> {
  return http<IntentWord[]>({
    url: '/api/monitor/config/intents/words/enabled',
    method: 'get',
    params: { projectId }
  })
}

/** 按项目查询意图词（含停用的，意图词库页面用） */
export function listIntentWords(projectId: string): Promise<IntentWord[]> {
  return http<IntentWord[]>({
    url: '/api/monitor/config/intents/words',
    method: 'get',
    params: { projectId }
  })
}

/** 批量新增意图词（归属到指定项目） */
export function batchCreateIntentWords(words: IntentWord[], projectId: string): Promise<IntentWord[]> {
  return http<IntentWord[]>({
    url: '/api/monitor/config/intents/words/batch',
    method: 'post',
    params: { projectId },
    data: words
  })
}

/** 删除单个意图词 */
export function deleteIntentWord(id: number): Promise<void> {
  return http<void>({
    url: `/api/monitor/config/intents/words/${id}`,
    method: 'delete'
  })
}

/** 更新单个意图词 */
export function updateIntentWord(id: number, data: Partial<IntentWord>): Promise<IntentWord> {
  return http<IntentWord>({
    url: `/api/monitor/config/intents/words/${id}`,
    method: 'put',
    data
  })
}

/* ==================== 询问句（intent_question） ==================== */

/** 按意图词 ID 查询关联询问句 */
export function listIntentQuestions(wordId: number): Promise<IntentQuestion[]> {
  return http<IntentQuestion[]>({
    url: `/api/monitor/config/intents/words/${wordId}/questions`,
    method: 'get'
  }).then(list => (list || []).map(q => ({ ...q, status: !!q.status })))
}

/** 批量新增询问句 */
export function batchCreateIntentQuestions(
  wordId: number,
  texts: string[],
  projectId: string
): Promise<IntentQuestion[]> {
  return http<IntentQuestion[]>({
    url: `/api/monitor/config/intents/words/${wordId}/questions/batch`,
    method: 'post',
    data: { texts, projectId }
  }).then(list => (list || []).map(q => ({ ...q, status: !!q.status })))
}

/** 删除单个询问句 */
export function deleteIntentQuestion(id: number): Promise<void> {
  return http<void>({
    url: `/api/monitor/config/intents/questions/${id}`,
    method: 'delete'
  })
}

/** 更新单个询问句 */
export function updateIntentQuestion(id: number, data: Partial<IntentQuestion>): Promise<IntentQuestion> {
  const payload: Record<string, unknown> = { ...data }
  if (typeof data.status === 'boolean') payload.status = data.status ? 1 : 0
  return http<IntentQuestion>({
    url: `/api/monitor/config/intents/questions/${id}`,
    method: 'put',
    data: payload
  }).then(q => ({ ...q, status: !!q.status }))
}
