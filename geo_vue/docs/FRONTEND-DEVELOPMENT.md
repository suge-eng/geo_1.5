# GEO 前端开发文档

> 本文档是 `geo_vue`（Vue3 + TypeScript + Vite）前端工程的建设与维护说明，覆盖从环境搭建、目录结构、架构分层到每个页面的实现细节、图表规范、错误处理与已知问题的完整链路。
> 配套文档：[`后端API分析报告.md`](./后端API分析报告.md)（后端接口与数据结构）、[`API-MAPPING.md`](./API-MAPPING.md)（菜单→页面→接口映射）、[`PROJECT-STRUCTURE.md`](./PROJECT-STRUCTURE.md)（完整目录树）。

---

## 1. 项目概述

`geo_vue` 是为微服务后端 `geo_1.3-main` 配套的前端管理平台，用于：

- **监测任务**：创建（手动 / Excel 批量）、提交、暂停、恢复、终止、重试、删除监测任务；
- **观测详情**：查看任务进度、结果明细（问答 / 排名 / 截图 / 联网记录）、单条与批量重试删除、导出 CSV；
- **盲区分析**：生成并查看品牌分析报告（综合评分、曝光指标、排名、引用来源、关键词云、AI 总结、全局趋势、历史报告）；
- **意图词库**：聚合各任务的「询问句」，统一查看品牌意图表达；
- **监测配置**：维护五级意图定义（定义 / 心智占领 / 客户心理阶段 / 标题 / 询问提示词）与词库资料，支持导入 Excel；
- **计划**：查看定时（每天 / 每周）执行的监测任务及其下次执行时间。

> **四条铁律**（贯穿全部开发）：
> 1. **不改后端**——只读取 / 分析 / 调用后端代码与接口，绝不修改后端任何 Java / 配置 / 表结构；
> 2. **不虚构 API**——所有接口均来自后端源码，不猜测 `/api/xxx`；
> 3. **真实接口优先于 Mock**——最终产物不依赖 `setTimeout` 假数据、不依赖随机数；
> 4. **不降功能**——不隐藏按钮、不删功能、不用写死列表逃避复杂度。

---

## 2. 技术栈

| 层 | 选型 | 版本 |
| --- | --- | --- |
| 框架 | Vue 3（`<script setup>` + Composition API） | ^3.4 |
| 语言 | TypeScript（strict） | ^5.4 |
| 构建 | Vite | ^5.3 |
| 路由 | Vue Router | ^4.4 |
| 状态 | Pinia | ^2.1 |
| HTTP | Axios | ^1.7 |
| UI 组件 | Element Plus（全量引入 + 全局图标） | ^2.7 |
| 图表 | ECharts | ^5.5 |
| 样式 | SCSS（Sass） | ^1.77 |
| 工具 | dayjs / lodash-es | — |
| 质量 | ESLint + Prettier + vue-tsc | — |

---

## 3. 目录结构

见 [`PROJECT-STRUCTURE.md`](./PROJECT-STRUCTURE.md)。核心分层：

- `src/api/`：按后端域拆分的接口函数（task / analysis / rpa）；
- `src/types/`：与后端 DTO/VO 对齐的类型 + 枚举常量；
- `src/store/`：Pinia 状态（跨路由共享 `currentTask`）；
- `src/layout/`：`AppLayout`（左侧一级菜单 + 顶部二级导航 + 内容区）；
- `src/views/`：五个业务页面（按路由分组）；
- `src/components/`：通用组件（`StatusTag` / `BaseChart`）；
- `src/charts/`：图表调色板与配置工厂（遵循 dataviz 规范）；
- `src/utils/`：请求封装、报告轮询、格式化、下载、Markdown 渲染。

---

## 4. 快速开始

```bash
# 1. 安装依赖
cd geo_vue
npm install

# 2. 启动开发服务器（默认 http://localhost:5173）
npm run dev

# 3. 类型检查 + 生产构建
npm run build

# 4. 预览生产构建
npm run preview

# 5. 代码检查 / 格式化
npm run lint
npm run format
```

> 前提：后端网关已在 `localhost:8080` 启动（`geo-gateway`）。前端开发时通过 Vite 代理访问 `/api/**`，无需跨域配置。

---

## 5. 环境与代理配置

`vite.config.ts` 中：

- `resolve.alias['@']` → `src/`；
- `server.proxy['/api']` → `http://localhost:8080`（`changeOrigin: true`）；
- 开发端口 `5173`，`host: true`。

后端网关将请求按前缀转发到各微服务：

| 前缀 | 目标服务 |
| --- | --- |
| `/api/task/**` | geo-task-service (8081) |
| `/api/analysis/**` | geo-analysis-service (8082) |
| `/api/file/**` | geo-file-service (8083) |
| `/api/rpa/**` | geo-rpa-service (8084) |

生产环境：前端 `dist/` 与网关同域部署，`baseURL` 留空即可，接口走相对路径 `/api/**`。

---

## 6. 后端接口约定

前端适配层必须遵循以下约定（详见 [`后端API分析报告.md`](./后端API分析报告.md)）：

1. **统一响应**：`{ code: number, message: string, data: T }`；
2. **成功判定**：`code === 200`（**不是** HTTP 状态码）；
3. **业务错误**：HTTP `200` + `code ∈ 1001–1011`（校验类 `400`、不存在 `404`）；
4. **无鉴权 / 无登录 / 无 Token**：前端不实现登录页；
5. **无分页**：列表接口返回全量 `List<T>`，分页在前端客户端完成；
6. **报告双模式**：同步 `200` 直接返回报告；异步 `202` 返回状态 payload，需轮询。

---

## 7. 请求层设计（axios 拦截器）

`src/utils/request.ts`：

- **请求拦截器**：GET 请求自动追加 `Cache-Control: no-cache` / `Pragma: no-cache` 头与 `_t=Date.now()` 时间戳（防浏览器 / 网关缓存）；POST 空 body 兜底为 `{}`；
- **响应拦截器**：
  - `responseType === 'blob'`（文件下载）→ 原样返回 `data`；
  - 对象且含 `code` → `code === 200` 时**解包返回 `data`**；否则 `ElMessage.error(message)` 并 `reject`；
  - HTTP 错误 → 按 `400 / 404 / 其他` 给出提示并 `reject`；
- **泛型封装** `http<T>()`：直接拿到后端 `data` 字段（类型 T），业务代码无需处理 `{ code, message }` 外壳。

```ts
export function http<T = unknown>(config: AxiosRequestConfig): Promise<T> {
  return service(config) as unknown as Promise<T>
}
```

---

## 8. API 层组织

每个后端域一个文件，函数签名与后端路由一一对应：

- `src/api/task.ts`：24 个任务接口（`listTasks` / `createTask` / `createTaskFromExcel` / `parseWhitelist` / `getTask` / `getProgress` / `getResults` / `getRankings` / `retry*` / `stop` / `pause` / `resume` / `delete*` / 模板下载等）；
- `src/api/analysis.ts`：6 个分析接口（`getReport` / `regenerateReport` / `getReportStatus` / `getReportHistory` / `getReportById` / `generateGlobalReport`）；
- `src/api/monitorConfig.ts`：监测配置 4 个接口（`listIntentDefinitions` / `updateIntentDefinition` / `listLexicon` / `importLexicon`），`USE_MOCK` 下走 `src/mock/config.ts`；
- `src/api/rpa.ts`：`getTaskPool`（任务池看板，`GET /api/rpa/pool`）——监测配置页改版后暂无调用方，保留待用。

> 截图 URL 直接渲染（`el-image` 的 `src`），经 `/api/file/**` 网关转发，无需单独封装 `file.ts`。

---

## 9. 类型定义与枚举

- `src/types/common.ts`：`Result<T>`、`PageParams`（前端客户端分页用）；
- `src/types/enums.ts`：`AiPlatform`（12 平台）、`AI_PLATFORMS`（展示顺序）、`TaskStatus` / `ResultStatus` 及 `*_STATUS_MAP`（状态 → 中文 + 标签色）、`SENTIMENT_MAP`、`FREQUENCY_MAP`、`platformLabel()`；
- `src/types/task.ts`：`Task` / `TaskSubmitRequest` / `TaskProgressVO` / `TaskResultVO` / `TaskRankingVO` / `TaskPoolOverview` 等，字段与后端 DTO/VO 对齐；
- `src/types/analysis.ts`：`AnalysisReportResponse`（**宽松类型 + 索引签名**，应对报告字段漂移）、`ExposureMetrics` / `AiSummary` / `GlobalTrends` / `ReportStatusPayload` / `ReportHistoryItem` 等。

> `TaskResultVO.sourceInfo` 在后端是 JSON 字符串，前端用 `parseSourceInfo()` 解析为联网记录列表。

---

## 10. 状态管理（Pinia）

- `src/store/task.ts`：`taskList`、`currentTask`，跨路由共享（列表 → 详情 → 盲区分析之间传递选中任务），提供 `fetchTaskList` / `fetchCurrentTask` / `setCurrentTask`；
- `src/store/app.ts`：应用级 UI 状态（侧栏折叠等，预留）；
- `src/store/analysis.ts`：分析页状态（预留，报告数据以组件局部 `ref` 为主）。

> 报告数据本身字段多且一次性加载，放在页面组件 `ref` 内，不进入全局 store。

---

## 11. 路由设计

`src/router/index.ts`：

| 路径 | 名称 | 页面 | 分组 |
| --- | --- | --- | --- |
| `/monitor/tasks` | TaskList | 监测任务列表 | monitor |
| `/monitor/tasks/:taskNo` | TaskDetail | 观测详情 | monitor |
| `/monitor/analysis` | AnalysisReport | 盲区分析 | monitor |
| `/monitor/intent` | IntentLibrary | 意图词库 | monitor |
| `/monitor/config` | MonitorConfig | 监测配置 | monitor |
| `/plan` | Plan | 计划 | plan |

- 根路径 `/` 重定向到 `/monitor/tasks`；兜底 `/:pathMatch(.*)*` 重定向 `/`；
- 每个路由 `meta.title` 用于 `document.title` 与顶部导航高亮。

---

## 12. 布局与导航

- `src/layout/AppLayout.vue`：flex 布局，左侧 `Sidebar` + 右侧（`TopNav` + `<router-view>`）；
- `src/layout/Sidebar.vue`：Logo 区 + 一级菜单（「监测」「计划」），teal 高亮当前项；
- `src/layout/TopNav.vue`：当前一级菜单下的二级导航（监测任务 / 盲区分析 / 意图词库 / 监测配置），默认「监测任务」高亮；
- `src/layout/menu.ts`：`MENUS` 配置（一级 + 二级）+ `getActiveMenu()` 定位当前一级菜单。

> UI 还原要点：左侧固定约 232px 白底、顶部 52px 白底、内容区浅灰 `#f5f6f8`、青绿 `#0ca694` 高亮；已去除截图中的红色箭头、「一级菜单 / 二级菜单」标注文字与水印。

---

## 13. 主题与样式

- `src/styles/variables.scss`：`$geo-primary: #0ca694`、`$sidebar-width: 232px`、`$topbar-height: 52px`、`$content-bg: #f5f6f8` 等；
- `src/styles/index.scss`：覆盖 Element Plus `--el-color-primary` 等 CSS 变量、全局 reset、滚动条、`.page-card` / `.page-header` / `.empty-hint` 公共类；
- 各组件 `<style scoped lang="scss">` 使用上述 token，保持统一观感。

---

## 14. 通用组件

- `src/components/StatusTag.vue`：`status` + `kind`（task / result）→ 中文标签 + 语义色标签；
- `src/components/BaseChart.vue`：ECharts 封装，`option` prop + `height`，内置 `ResizeObserver` 自适应、`watch` 深监听重渲染、卸载 `dispose`。

---

## 15. 图表规范（dataviz）

图表颜色**不是手挑的**，遵循数据可视化规范：

- `src/charts/palette.ts`：品牌调色板。分类色固定顺序不循环，已通过 CVD / 正常视觉 Delta E 校验（品牌 teal 位于槽位 3）；墨色（文字）与数据色严格分离；
- `src/charts/options.ts`：配置工厂 `buildBarOption`（横向条形图，单一序列，数值标于条端）、`buildDonutOption`（环形图，≤6 段，超出折叠「其他」）、`buildTrendOption`（趋势折线，单序列无图例 / 多序列固定顺序着色 + 图例）；
- 规范要点：细标记、2px 面间隙、4px 圆角数据端、无双轴、无彩虹渐变、文字永不使用数据色、多序列必有图例、每个图表有表格视图兜底。

> 校验命令（可选，针对自定义调色板）：
> `node scripts/validate_palette.js "<hex,...>" --mode light`。

---

## 16. 监测任务列表页（TaskList）

`src/views/monitor/tasks/TaskList.vue`：

- 卡片网格展示任务：标题、全局标签、状态、进度条、品牌 / 意图 / 询问 / 频次 / 创建时间；
- 顶部搜索（客户端过滤 `title`）+ 客户端分页（`pagedTasks`）；
- 新建弹窗两页签：**手动输入**（`POST /api/task/create`）与 **Excel 上传**（`POST /api/task/create/excel`，multipart）；
- AI 平台多选、品牌名 / 单品 / 竞品品牌（动态行）、白名单（上传即 `parse-whitelist` 预览）、执行频次（单次 / 每天 / 每周）、失败重试开关；
- 模板下载：`downloadExcelTemplate` / `downloadWhitelistTemplate`（blob 下载）；
- 卡片操作按任务状态动态渲染：提交 / 暂停 / 恢复 / 终止 / 重新执行 / 删除。

---

## 17. 任务详情 / 结果页（TaskDetail）

`src/views/monitor/tasks/TaskDetail.vue`：

- 顶部：返回、标题、全局标签、状态、`数据报告`（跳转盲区分析）、`重新执行`；
- 进度卡：`getProgress`，进行中 2s 轮询；结果表 `getResults` 进行中 3s 轮询；
- 结果表筛选：询问句关键词 / 平台 / 舆情 / 展现 / 查询状态（客户端过滤）；
- 行操作：
  - **问答**：`renderMarkdown` 渲染思考过程与回答（防注入）；
  - **排名**：`getRankings` 映射到该结果的品牌出现顺序；
  - **截图**：`screenshotUrls` 走 `el-image` 预览；
  - **联网**：`parseSourceInfo(sourceInfo)` 展示引用来源表；
  - **重试** `retryResult` / **删除** `deleteResult`；
- 批量删除 `batchDeleteResults`；导出 CSV（详情 / 联网记录两种，带 BOM 防中文乱码）。

---

## 18. 盲区分析报告页（AnalysisReport）

`src/views/monitor/analysis/AnalysisReport.vue`：

- 顶部任务选择器（`listTasks`）+ `重新生成` / `历史报告` / `生成全局报告`（仅全局任务）；
- 报告头：标题、元信息（品牌 / 问题数 / 平台数 / 结果数 / 区间）+ **综合评分 Hero 数字**（评分等级 + 环比变化）；
- **曝光指标 KPI 瓦片**：覆盖率 / 首位率 / 前三率 / 前五率 / 提及率 / 正面情感率；
- **AI 总结**：总述（Markdown）+ 核心亮点 / 优化建议 / 风险预警 / 趋势观察；
- **排名图表**：竞争排名（`rankings` 或 `competitionRanking`）、引用平台排名（横向条形图）；
- **引用来源分布**：环形图 + 来源明细表；
- **关键词云**：正面 / 负面词（CSS 标签云，按频次缩放字号）；
- **全局趋势**：品牌声量 / 引用热度 / 正面情感 / 定位契合（小倍图，单轴折线）；
- **品牌对比**：表格；
- **历史报告抽屉**：列表 + 点选按 `getReportById` 加载历史报告。

---

## 19. 意图词库页（IntentLibrary）

`src/views/monitor/intent/IntentLibrary.vue`：

- 无独立后端词库接口，按 Rule 2/4 用**真实数据聚合**承载：`listTasks()` + 每个任务 `getResults()` 收集 `questionText`；
- 去重后统计：查询次数、关联任务数、覆盖平台（`Promise.allSettled` 并行拉取，容错单任务失败）；
- 统计瓦片（意图数 / 总查询 / 覆盖任务 / 覆盖平台）+ 搜索 + 客户端分页表。

---

## 20. 监测配置页（MonitorConfig）

`src/views/monitor/config/MonitorConfig.vue`，按原型 `监测配置.html` 还原：

- 两个标签页「意图定义」/「词库资料」，当前标签写进地址 `?tab=lexicon`（默认 `intent` 不写 query），刷新 / 前进后退都能还原；
- **意图定义**表：名称 / 定义 / 心智占领 / 客户心理阶段 / 标题 / 询问提示词 / 操作，表头吸顶，名称列蓝色高亮居中；
- **词库资料**表：意图 / 核心场景 / 标签；只有该标签下右上角才出现「导入表格」（`.xlsx` / `.xls` / `.csv`，≤10MB，前端先校验再提交）；
- 编辑弹窗复用 `components/AppModal.vue`，两列 `form-grid`：名称是下拉（`INTENT_NAME_OPTIONS`），客户心理阶段与询问提示词占满整行，保存走 `updateIntentDefinition()` 并即时刷新表格；
- 数据来自 `src/mock/config.ts`（`USE_MOCK` 总开关）。接口就绪后只改 `src/api/monitorConfig.ts` 的 mock 分支，页面不动。

---

## 21. 计划页（PlanView）

`src/views/plan/PlanView.vue`：

- `listTasks()` 按 `executionFrequency ∈ { daily, weekly }` 过滤展示定时任务；
- 统计瓦片（单次 / 每天 / 每周 / 待执行计划）+ 计划表（频次标签、下次执行时间、状态、跳转详情）。

---

## 22. 报告同步 / 异步轮询处理

`src/utils/report.ts`：

- `isStatusPayload()`：识别异步状态 payload（`status ∈ IDLE/RUNNING/FAILED`）；
- `hasReportData()`：识别报告数据（含评分 / 指标 / 对比等字段）；
- `normalizeReport()`：为可空字段补安全默认值，避免图表报错（指标归零、AI 总结数组兜底、全局趋势 series 兜底等）；
- `fetchReport(taskNo, regenerate?)`：统一入口——同步返回报告；`202` 则 `getReportStatus` 2s 轮询（最长 20 分钟），完成取报告、失败抛错。

---

## 23. 客户端分页（无分页后端）

后端列表接口返回全量，前端统一用「computed 切片」分页：

```ts
const pagedTasks = computed(() => {
  const start = (page.value - 1) * pageSize
  return filtered.value.slice(start, start + pageSize)
})
```

搜索 / 筛选均为客户端过滤，`el-pagination` 的 `total` 用过滤后数组长度。

---

## 24. 文件下载与 Excel 模板

`src/utils/download.ts`：

- `downloadBlob(blob, filename)`：创建临时 `<a>` 触发下载；
- `parseFilenameFromDisposition()`：从 `Content-Disposition` 解析文件名（兜底）；
- Excel / 白名单模板接口返回 blob，经 `http<Blob>`（`responseType: 'blob'`）直通下载。

---

## 25. Markdown 渲染（防注入）

`src/utils/markdown.ts`：

- `renderMarkdown(src)`：**先转义后格式化**（`escapeHtml` → 行级块解析 → 行内加粗 / 斜体 / 行内代码 / 链接），链接只放行 `http(s)://`，其余置 `#`；无依赖、防 XSS；
- 用于渲染 AI 回答 `answerText`、思考内容 `thinkingContent`、AI 总结 `content`。

---

## 26. 错误处理与用户提示

- 统一在 axios 拦截器 `ElMessage.error`；页面内对可预期失败做 `try/catch` 兜底（空态 / 重试）；
- 破坏性操作（删除 / 终止 / 批量删除）前 `ElMessageBox.confirm` 二次确认；
- 表单校验（项目名 / 平台 / 品牌 / 询问句 / 文件）在提交前用 `ElMessage.warning` 拦截。

---

## 27. 性能与打包

- Element Plus、ECharts 采用**全量引入**（简单可靠）；`echarts` 完整包 + `element-plus` 使主包约 1.2MB（gzip 约 386KB）；
- `vite.config.ts` 设 `chunkSizeWarningLimit: 1500`，构建通过但存在体积优化空间；
- **后续可优化**（非当前阻断）：
  - ECharts 改为 `echarts/core` 按需引入（bar/line/pie 等）+ `unplugin-auto-import` 按需引入 Element Plus；
  - `manualChunks` 拆分包 / 路由懒加载已启用（各页面已 `import()` 动态加载）。

---

## 28. 代码规范（ESLint / Prettier）

- ESLint（`@typescript-eslint` + `eslint-plugin-vue`）：`npm run lint`（含 `--fix`）；
- Prettier：`npm run format`（`src/**/*.{ts,vue,scss}`）；
- TypeScript `strict: true` + `noUnusedLocals/Parameters`，`npm run build` 先 `vue-tsc --noEmit` 再构建，确保类型与未用变量零告警。

---

## 29. 待确认事项与前端适配方案

| 项 | 状态 | 前端适配方案 |
| --- | --- | --- |
| 意图词库权威数据源 | 后端无词库表/接口 | 聚合 `getResults().questionText` 只读展示 |
| 监测配置范围 | 后端无「配置」接口 | 按原型还原本地交互，数据暂由 `src/mock/config.ts` 承载 |
| 计划 CRUD | 后端无独立计划接口 | 复用 `listTasks()` 按频次过滤 |
| 报告平台维度字段 key | 可能随版本漂移 | `normalizeReport()` + 宽松类型兼容多 key |

---

## 30. 后端现有问题与前端适配 / 无法解决项

依据 [`后端API分析报告.md`](./后端API分析报告.md)，已发现但**按 Rule 1 不改后端**，前端据此适配：

1. **无鉴权体系**：后端无登录 / Token，任何请求直接放行。前端不实现登录，直接进入；如需上生产须后端补充鉴权（**前端无法自行解决**）。
2. **无分页**：列表返回全量，大数据量下前端一次性拉取存在性能风险；当前以客户端分页适配，根治需后端分页参数（**无法解决**）。
3. **报告同步 / 异步双模式**：前端用 `fetchReport` 统一处理 `200` 直返与 `202` 轮询，已适配。
4. **硬编码 API Key**：`geo-analysis-service/application.yml` 中存在明文 `sk-...`（未修改），属后端安全风险，需后端以环境变量 / 配置中心管理（**无法解决**）。
5. **`sourceInfo` 为 JSON 字符串**：前端 `parseSourceInfo` 解析，已适配。
6. **查询接口缓存**：前端 GET 已加 no-cache 头 + `_t`，已适配。

> 结论：前端全部通过「适配层」规避后端问题，未修改后端任何代码；上述「无法解决」项需后端 / 运维在后续迭代处理，已在报告与本文档中记录在案。
