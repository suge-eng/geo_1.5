# 后端 API 分析报告（geo_1.3-main）

> 本报告由只读侦察后端源码得出，**未修改任何后端代码**。作为前端开发的唯一接口依据。

---

## 1. 架构与网关

| 服务 | 端口 | 模块 | 职责 |
| --- | --- | --- | --- |
| geo-gateway | 8080 | 自研 HTTP 代理网关 | 静态前端 + 转发 `/api/**` 到各服务 |
| geo-task-service | 8081 | 任务调度 | 任务 CRUD、进度、结果、排名、Excel |
| geo-analysis-service | 8082 | 分析报告 | 品牌分析报告生成、历史、全局报告 |
| geo-file-service | 8083 | 文件代理 | 代理 MinIO 对象流（截图等） |
| geo-rpa-service | 8084 | RPA 执行 | 任务池看板、截图上传、结果回调 |

**网关路由规则**（`ApiProxyController`，非 Spring Cloud Gateway）：

| 前缀 | 转发目标 |
| --- | --- |
| `/api/task/**` | 8081 |
| `/api/analysis/**` | 8082 |
| `/api/file/**` | 8083 |
| `/api/rpa/**` | 8084 |

- 前端统一通过网关 8080 访问，**只调 `/api/...` 前缀**，不直连各服务端口。
- 网关透传 `Authorization` 头；支持 multipart 转发。
- `/internal/**` 接口（任务进度回调、worker 认领/心跳/派发）**不经网关，前端不可调**。

---

## 2. 统一响应与错误约定

**响应体** `Result<T>`：`{ "code": int, "message": string, "data": T }`

- 成功：`code = 200`（`ResultCode.SUCCESS`）
- **业务错误：HTTP 200 + code 非 200**（`BusinessException` → `GlobalExceptionHandler` 返回 HTTP 200 但 `code=1001~1011`）
- 参数校验错误：HTTP 400（`MethodArgumentNotValidException`/`BindException`/`ConstraintViolationException`）
- 资源不存在：HTTP 404（如 `GET /api/task/{taskNo}` 查不到时手动返回 404）
- 兜底异常：HTTP 200 + `code=500`（INTERNAL_ERROR）

**业务错误码**（`ResultCode`）：

| code | 含义 |
| --- | --- |
| 1001 | TASK_NOT_FOUND 任务不存在 |
| 1002 | TASK_STATUS_INVALID 任务状态不合法 |
| 1003 | AI_LIST_EMPTY AI 平台为空 |
| 1004 | QUESTION_EMPTY 问题为空 |
| 1005 | QUESTION_TOO_MANY 问题过多 |
| 1006 | QUESTION_TOO_LONG 问题过长 |
| 1007 | AI_PLATFORM_INVALID 平台非法 |
| 1008 | RATE_LIMIT_EXCEEDED 限流 |
| 1009 | RPA_TASK_FAILED RPA 任务失败 |
| 1010 | ACCOUNT_EXHAUSTED 账号额度耗尽 |
| 1011 | DUPLICATE_SUBMIT 重复提交 |

**前端适配要点**：不能仅凭 HTTP 200 判定成功，必须同时校验 `code === 200`；业务失败时要读 `message` 展示给用户。

---

## 3. 关键全局约定

1. **无鉴权**：后端没有任何登录/JWT/token 机制，所有 `/api/**` 接口裸奔可调。前端**不做假登录页**，直接进入系统（详见第 8 节）。
2. **无分页**：列表接口返回完整 `List`，不分页。前端做**客户端分页/虚拟滚动**。
3. **查询接口禁用缓存**：task/analysis 的查询接口统一加 `Cache-Control: no-store` 等响应头；前端请求应带 `_t=Date.now()` 与 `no-cache` 头（沿用旧前端做法）。
4. **报告同步/异步双模式**：结果数 ≤ `report.async-threshold`(默认 100) 时同步返回 HTTP 200 + 报告；超过则返回 HTTP 202 + 状态 payload，前端需轮询 `/report/status`。
5. **创建与提交分离**：`create` 只落库为 `PENDING`，`submit` 才真正派发 RPA 执行。
6. **字段为 null 时前端需兜底**：`Task` 列表接口已 `enrichTaskFields` 回填默认值；`AnalysisReportResponse` 大量字段可空，前端须归一化（旧前端 `normalizeReportData` 已示范）。

---

## 4. 接口全量清单

### 4.1 任务服务 `/api/task`（8081）

| 方法 | 路径 | 入参 | 返回 data | 说明 |
| --- | --- | --- | --- | --- |
| GET | `/api/task/list` | - | `List<Task>` | 全部任务（按创建时间倒序，已回填 scope/questionCount/intentCount） |
| POST | `/api/task/create` | `TaskSubmitRequest`(JSON) | `Task` | 创建任务（PENDING，不派发） |
| POST | `/api/task/create/excel` | multipart(file,aiPlatforms[],title,brandName,productName?,competitors[]?,executionFrequency,retryOnFailure,scope,whitelistUrls(JSON字符串)) | `Task` | Excel 批量创建 |
| POST | `/api/task/parse-whitelist` | multipart(file) | `List<String>` | 解析白名单 Excel → 域名列表（创建前预览） |
| GET | `/api/task/excel-template` | - | xlsx 字节 | 下载问题模板 |
| GET | `/api/task/whitelist-template` | - | xlsx 字节 | 下载白名单模板 |
| GET | `/api/task/{taskNo}` | - | `Task` | 任务详情（404 表示不存在） |
| POST | `/api/task/{taskNo}/submit` | Map(executionFrequency,retryOnFailure) | `Task` | 提交派发 |
| DELETE | `/api/task/{taskNo}` | - | `Void` | 删除任务（运行中被拒） |
| GET | `/api/task/{taskNo}/progress` | - | `TaskProgressVO` | 进度（轮询） |
| GET | `/api/task/{taskNo}/results` | - | `List<TaskResultVO>` | 结果明细（问题×平台） |
| GET | `/api/task/{taskNo}/rankings` | - | `TaskRankingVO` | 品牌排名统计 |
| POST | `/api/task/{taskNo}/retry` | - | `Task` | 重试失败/超时子任务 |
| POST | `/api/task/{taskNo}/retry/all` | - | `Task` | 重试全部子任务 |
| POST | `/api/task/{taskNo}/retry/success` | - | `Task` | 重试成功子任务（模型升级对比） |
| POST | `/api/task/{taskNo}/stop` | - | `Task` | 终止（CANCELLED） |
| POST | `/api/task/{taskNo}/pause` | - | `Task` | 暂停 |
| POST | `/api/task/{taskNo}/resume` | - | `Task` | 恢复 |
| POST | `/api/task/result/{taskResultId}/retry` | - | `Task` | 单条结果重试 |
| DELETE | `/api/task/result/{taskResultId}` | - | `Task` | 删除单条结果 |
| DELETE | `/api/task/result/batch` | body `List<Long>` | `Task` | 批量删除结果 |

### 4.2 分析服务 `/api/analysis`（8082）

| 方法 | 路径 | 入参 | 返回 data | 说明 |
| --- | --- | --- | --- | --- |
| GET | `/api/analysis/{taskNo}/report` | query `async?` | `AnalysisReportResponse` 或 202 状态 | 获取/生成报告（同步优先、异步兜底） |
| POST | `/api/analysis/{taskNo}/regenerate` | query `async?`，body(可选 options) | 同上 | 强制重新生成 |
| GET | `/api/analysis/{taskNo}/report/status` | - | `{taskNo,status,progressPercent,stage,errorMsg,startedAt,finishedAt,report?}` | 异步轮询状态 |
| GET | `/api/analysis/{taskNo}/reports/history` | - | `List<Map>` | 历史报告列表（快照） |
| GET | `/api/analysis/reports/{reportId}` | - | `AnalysisReportResponse` | 按 ID 取历史报告 |
| POST | `/api/analysis/{taskNo}/reports/global/generate` | - | `AnalysisReportResponse` | 生成全局数据报告 |

> 报告状态机：`IDLE/RUNNING/COMPLETED/FAILED`。只有 `COMPLETED` 才在 status payload 里带 `report`。`RUNNING` 时重复请求 report 返回 202。

### 4.3 文件服务 `/api/file`（8083）

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/api/file/**` | 代理 MinIO 对象流（截图等），直接作为 `<img src>` 使用 |

### 4.4 RPA 服务 `/api/rpa`（8084）

| 方法 | 路径 | 入参 | 返回 data | 说明 |
| --- | --- | --- | --- | --- |
| GET | `/api/rpa/pool` | - | `{statusCount[],platformCount[],workerCount[],runningUnits[]}` | 任务池看板 |
| POST | `/api/rpa/upload` | multipart(file,taskId?) | `String`(URL) | 截图上传（worker 用，前端一般不用） |
| POST | `/api/rpa/callback` | Map | `String` | 结果回调（worker 用，前端不用） |

---

## 5. 核心数据结构

### Task（任务）
`id, taskNo, userId, title, status, totalCount, completedCount, failedCount, totalAiCount, totalQuestionCount, brandName, productName, competitors, reportJson, executionFrequency, nextRunTime, errorMsg, whitelistUrls, createdAt, updatedAt, completedAt` + 回填的 `scope, questionCount, intentCount`

### TaskSubmitRequest（创建入参）
`aiPlatforms[]（必填）, questions[]（必填）, title（必填）, brandName（必填）, productName?, competitors[]（≤5）, executionFrequency=single, retryOnFailure=false, scope=LOCAL, whitelistUrls[]?`

### TaskProgressVO（进度）
`taskNo, status, totalCount, completedCount, failedCount, totalAiCount, totalQuestionCount, currentAi, currentQuestion, percentage, errorMsg, createdAt, completedAt`

### TaskResultVO（结果单元）
`id, aiPlatform, aiDisplayName, questionText, answerText, thinkingContent, sourceInfo, screenshotUrls[], status, errorMsg, durationMs, rpaRetryCount, createdAt, completedAt, showStatus, brand, queryTime, brandRanking, sentiment, sentimentSource`

### TaskRankingVO（品牌排名）
`taskNo, title, brandName, competitorBrands[], questionRankings[], aggregatedRankings[], totalAnswers, validAnswers`

### AnalysisReportResponse（报告，字段多且大量可空）
核心字段：`topMetrics/productMetrics(MetricGroup), overallScore, scoreLevel, scoreChange, sideMetrics, charts(ChartWidget[]), rankings(RankingWidget[]), aiSummary, brandComparison, exposureMetrics(覆盖率/首位率/前三率/前五率/提及率/正向率), resultBrandRankings, aiSentimentMap, keywordCloud, perPlatformBrandComparison, competitionRanking, citationPlatformRanking, citationSourceDistribution, platformScoreCards, globalTrends`

### 枚举
- **AiPlatform**：`doubao / doubao_app / deepseek / deepseek_app / qianwen / qianwen_app / tencent / tencent_app / kimi / kimi_app / wenxin / wenxin_app`（中文显示名：豆包/豆包APP/DeepSeek/DeepSeek APP/通义千问/通义千问 APP/腾讯元宝/腾讯元宝APP/Kimi/Kimi APP/文心一言/文心一言APP）
- **TaskStatus**：`PENDING / PROCESSING / PAUSED / COMPLETED / PARTIAL_FAILED / FAILED / CANCELLED`
- **ResultStatus**：`PENDING / RUNNING / SUCCESS / FAILED / TIMEOUT`
- **AccountStatus**：`ACTIVE / BANNED / MAINTENANCE / EXHAUSTED`

---

## 6. 数据库表（MySQL `geo_backend`，端口 3307）

`task`（任务主表）、`task_question`（问题）、`task_ai`（任务-平台关联）、`task_result`（执行单元/任务池，含 assignee/lease_expires_at 租约）、`task_report`（报告快照）、`ai_account`（AI 账号池）。

---

## 7. 后端现状问题 → 前端适配方案

| # | 后端现状问题 | 前端适配方案 |
| --- | --- | --- |
| 1 | **无鉴权/无登录** | 不做登录页，直接进入系统；可在顶部展示环境标识，不做 token 拦截 |
| 2 | **无分页** | 列表客户端分页（Element Plus `el-pagination` 或虚拟滚动） |
| 3 | **业务错误返回 HTTP 200 + code** | axios 响应拦截器统一判 `code===200`，非 200 抛错并读 `message` |
| 4 | **报告异步 202 需轮询** | 封装报告加载：同步直接渲染；202 则轮询 `/report/status` 直到 COMPLETED/FAILED |
| 5 | **`AnalysisReportResponse` 字段可空** | 写 `normalizeReport` 归一化 + 空态占位（不报错、不白屏） |
| 6 | **`sourceInfo` 是 JSON 字符串** | 前端 `JSON.parse` 后渲染联网记录表 |
| 7 | **`screenshotUrls` 经 `/api/file/**` 代理** | 直接用返回 URL 作为 `<img src>`，补时间戳防缓存 |
| 8 | **意图词库/监测配置 无对应后端接口** | 见映射规划，标 `[待确认]`，用最接近的真实能力承载，不虚构 API |

---

## 8. 无法解决的问题（需后端配合，前端不改）

1. 系统无任何用户/权限体系，多用户隔离依赖后端未来扩展（`task.userId` 字段已预留但未启用）。
2. 任务列表无服务端分页/搜索，数据量大时前端只能全量拉取后本地过滤，性能受限于列表规模。
3. 报告生成的 AI 模型 `qwen3.7-plus` 密钥、`dashscope` endpoint 硬编码在 `geo-analysis-service/application.yml`（含明文 `api-key`），前端无法解决，仅记录。
4. 截图上传 `/api/rpa/upload` 与结果回调 `/api/rpa/callback` 是为 worker 脚本设计的内部协议，前端不应调用。
