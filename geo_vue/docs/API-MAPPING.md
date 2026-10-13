# 前端页面 - API 映射规划

> 依据截图（1726×706）还原 UI 结构，并将每个菜单映射到**真实后端接口**。
> 原则：**后端真实能力 > 截图假设**；没有后端支撑的菜单标 `[待确认]`，不虚构 API（Rule 2/3）。

---

## 1. 整体布局（还原截图）

```
┌──────────────────────────────────────────────────────────────┐
│ Logo 区(白底)  │ 顶部二级导航：监测任务 | 盲区分析 | 意图词库 | 监测配置 │
│ ───────────── │──────────────────────────────────────────────│
│  一级菜单      │                                              │
│  监测 (active) │          RouterView（内容区，浅灰背景）          │
│  计划          │                                              │
└────────────────┴──────────────────────────────────────────────┘
   左侧 Sidebar(~230px 白底)     右侧内容区(浅灰)
```

- 左侧固定 Sidebar：Logo 区 + 一级菜单「监测 / 计划」。
- 顶部固定二级导航：监测任务 / 盲区分析 / 意图词库 / 监测配置（默认「监测任务」高亮）。
- 内容区 `RouterView`。
- 主题：白侧栏/白顶栏、浅灰内容底、青绿(teal)高亮色。
- 去除截图中的红色箭头、「一级菜单」「二级菜单」标注文字、水印。

---

## 2. 菜单 → 路由 → 页面 → 接口 映射

### 一级：监测

| 二级菜单 | 前端路由 | 页面 | 映射到的真实接口 | 状态 |
| --- | --- | --- | --- | --- |
| **监测任务** | `/monitor/tasks` | 任务列表 + 新建 + 详情 + 结果 | 任务服务全部接口（§4.1） | ✅ 完整 |
| **盲区分析** | `/monitor/analysis` | 品牌分析报告（含覆盖率盲区、排名、对比、词云、AI 总结） | 分析服务全部接口（§4.2）+ `GET /api/task/{taskNo}/results`、`/rankings` | ✅ 完整 |
| **意图词库** | `/monitor/intent` | 意图词/询问句管理 | **无直接接口**；承载于任务问题（`task_question` / `Task.intentCount`）。可复用 `GET /api/task/{taskNo}/results` 的 `questionText` 聚合展示 | ⚠️ [待确认] |
| **监测配置** | `/monitor/config` | 意图定义 / 词库资料 | 无对应接口。页面按原型还原为「意图定义表 + 词库资料表（可导入 Excel）」，数据暂由 `src/mock/config.ts` 承载 | ⚠️ [待确认] |

### 一级：计划

| 二级菜单 | 前端路由 | 页面 | 映射到的真实接口 | 状态 |
| --- | --- | --- | --- | --- |
| 计划 | `/plan` | 周期/计划任务（single/daily/weekly） | 复用 `GET /api/task/list` 按 `executionFrequency`/`nextRunTime` 过滤；无独立计划 CRUD 接口 | ⚠️ [待确认] |

> 说明：后端没有「意图词库」「监测配置」「计划」的独立领域接口。按 Rule 4（不降功能）不隐藏菜单，而是用最接近的真实能力承载内容，并在页面内标注数据来源；在 `docs/FRONTEND-DEVELOPMENT.md` 的「待确认事项」中记录，等待后端补充接口。

---

## 3. 页面级接口调用明细

### 3.1 监测任务列表页 `/monitor/tasks`
- 列表：`GET /api/task/list`
- 搜索：客户端过滤 `title`
- 新建（手动）：`POST /api/task/create`
- 新建（Excel）：`POST /api/task/create/excel`（multipart）+ `GET /api/task/excel-template`（下载模板）
- 白名单：`POST /api/task/parse-whitelist`（预览）+ `GET /api/task/whitelist-template`
- 卡片操作：`submit / stop / pause / resume / retry / retry-all / delete` 对应各自接口
- 轮询进度：`GET /api/task/{taskNo}/progress`（进行中任务 2s 轮询）

### 3.2 任务详情 / 结果页（路由 `/monitor/tasks/:taskNo`）
- 详情：`GET /api/task/{taskNo}`
- 进度：`GET /api/task/{taskNo}/progress`
- 结果表：`GET /api/task/{taskNo}/results`
- 排名：`GET /api/task/{taskNo}/rankings`
- 单条重试：`POST /api/task/result/{id}/retry`
- 删除单条/批量：`DELETE /api/task/result/{id}` / `DELETE /api/task/result/batch`
- 截图：直接以 `screenshotUrls` 的 URL 渲染（经 `/api/file/**`）
- 联网记录：前端解析 `sourceInfo`（JSON 字符串）

### 3.3 盲区分析报告页 `/monitor/analysis`
- 报告：`GET /api/analysis/{taskNo}/report`（同步/202 分支）
- 异步状态：`GET /api/analysis/{taskNo}/report/status`（2s 轮询）
- 重新生成：`POST /api/analysis/{taskNo}/regenerate`
- 历史报告列表：`GET /api/analysis/{taskNo}/reports/history`
- 按 ID 取报告：`GET /api/analysis/reports/{reportId}`
- 全局报告：`POST /api/analysis/{taskNo}/reports/global/generate`
- 平台/品牌维度兜底：`GET /api/task/{taskNo}/results`、`GET /api/task/{taskNo}/rankings`

### 3.4 意图词库 `/monitor/intent`
- 复用 `GET /api/task/list` + `GET /api/task/{taskNo}/results` 聚合「询问句/意图词」清单与出现频次。

### 3.5 监测配置 `/monitor/config`
- 页面按原型还原为两个标签页：**意图定义**表（名称 / 定义 / 心智占领 / 客户心理阶段 / 标题 / 询问提示词，可编辑）、
  **词库资料**表（意图 / 核心场景 / 标签，支持导入 `.xlsx` / `.xls` / `.csv`）。
- 后端暂无「配置」域接口，数据先由 `src/mock/config.ts` 承载（`USE_MOCK` 总开关控制）；
  接口就绪后把 `src/api/monitorConfig.ts` 的 `USE_MOCK` 分支去掉即可，页面无需改动。

### 3.6 计划 `/plan`
- `GET /api/task/list` 按 `executionFrequency != single` 过滤展示周期任务。

---

## 4. 前端工程结构（对应路由与状态）

```
geo_vue/
├─ src/
│  ├─ api/            # 每个后端域一个文件：task.ts / analysis.ts / rpa.ts
│  ├─ types/          # common / enums / task / analysis
│  ├─ store/          # Pinia: task.ts / analysis.ts / app.ts
│  ├─ router/         # index.ts（见 §2 路由表）
│  ├─ layout/         # AppLayout（Sidebar + TopNav + RouterView）+ menu.ts
│  ├─ views/
│  │  ├─ monitor/tasks/      # TaskList（列表/新建）+ TaskDetail（进度/结果/排名/截图/联网）
│  │  ├─ monitor/analysis/   # AnalysisReport（报告 + ECharts）
│  │  ├─ monitor/intent/     # IntentLibrary（意图词库聚合）
│  │  ├─ monitor/config/     # MonitorConfig（意图定义 / 词库资料）
│  │  └─ plan/               # PlanView（周期任务计划）
│  ├─ components/     # BaseChart.vue（ECharts 封装）/ StatusTag.vue（状态标签）
│  ├─ charts/         # palette.ts（调色板）/ options.ts（图表配置工厂）
│  ├─ utils/          # request.ts / report.ts（报告轮询归一化）/ markdown.ts / format.ts / download.ts
│  └─ styles/         # variables.scss（主题变量）/ index.scss（全局样式）
└─ docs/              # 后端API分析报告 + 本映射 + 开发文档 + 结构文档
```

---

## 5. Axios 拦截器约定（前端适配层）

```ts
// 响应拦截器：统一处理 { code, message, data }
// 1. code===200 → 返回 data
// 2. code!==200 → ElMessage.error(message) 并 reject（业务失败）
// 3. HTTP 400/404/500 → 按后端约定提示
// 请求拦截器：查询类自动附加 no-cache 头 + _t 时间戳
```

---

## 6. 待确认事项（等待后端/产品确认，暂不虚构）

| 项 | 说明 | 前端临时方案 |
| --- | --- | --- |
| 意图词库的权威数据源 | 后端无「词库」表/接口 | 从任务结果聚合「询问句/意图词」只读展示 |
| 监测配置的范围 | 后端无「配置」接口 | 按原型还原本地交互，数据暂由 `src/mock/config.ts` 承载，等后端补接口 |
| 计划的 CRUD | 后端无独立计划接口 | 复用任务列表按频率过滤 |
| 登录/用户体系 | 后端无鉴权 | 不做登录，直接进入 |
| 报告平台维度字段的确切 key | `AnalysisReportResponse` 字段可能随版本漂移 | 归一化函数兼容多 key（参照旧前端） |
