# 项目结构说明

> `geo_vue` 完整目录树与每个文件的职责说明。层级与 [`FRONTEND-DEVELOPMENT.md`](./FRONTEND-DEVELOPMENT.md)、[`API-MAPPING.md`](./API-MAPPING.md) 对应。

```
geo_vue/
├─ index.html                       # 应用入口 HTML
├─ package.json                     # 依赖与脚本（dev/build/lint/format）
├─ vite.config.ts                   # Vite 配置：@ 别名、/api 代理、构建阈值
├─ tsconfig.json                    # TS 编译配置（strict、@/* paths）
├─ tsconfig.node.json               # Node 侧（vite.config）TS 配置
├─ env.d.ts                         # vite/client 类型 + *.vue 模块声明
├─ .eslintrc.cjs                    # ESLint 配置（ts + vue）
├─ .prettierrc.json                 # Prettier 配置
├─ .gitignore                       # 忽略 node_modules / dist 等
├─ dist/                            # 生产构建产物（npm run build 生成）
│
├─ docs/
│  ├─ 后端API分析报告.md              # 后端架构、接口清单、响应约定、数据结构、后端问题
│  ├─ API-MAPPING.md                # 菜单 → 路由 → 页面 → 接口映射
│  ├─ FRONTEND-DEVELOPMENT.md       # 前端开发文档（30 节）
│  └─ PROJECT-STRUCTURE.md          # 本文档
│
└─ src/
   ├─ main.ts                       # 应用入口：pinia/router/ElementPlus/全局图标/样式
   ├─ App.vue                       # 根组件，仅 <router-view/>
   │
   ├─ api/                          # 后端接口层（按域拆分）
   │  ├─ task.ts                    # 任务服务 24 个接口
   │  ├─ analysis.ts                # 分析服务 6 个接口
   │  ├─ auth.ts                    # 登录（后端鉴权未就绪的对接桩）
   │  ├─ project.ts                 # 项目服务（USE_MOCK 下走 mock/project.ts）
   │  ├─ monitorConfig.ts           # 监测配置服务（USE_MOCK 下走 mock/config.ts）
   │  └─ rpa.ts                     # RPA 任务池看板接口（监测配置改版后暂无调用方）
   │
   ├─ types/                        # 类型定义（与后端 DTO/VO 对齐）
   │  ├─ common.ts                  # Result<T> / PageParams
   │  ├─ enums.ts                   # 平台/状态/舆情/频次枚举 + 常量 + platformLabel
   │  ├─ task.ts                    # Task/Progress/Result/Ranking/TaskPool 类型
   │  ├─ project.ts                 # Project / ProjectCreateRequest 类型
   │  └─ analysis.ts                # 报告/指标/总结/趋势/历史 类型
   │
   ├─ mock/                         # 前端虚拟数据（USE_MOCK 开关见 mock/flag.ts）
   │  ├─ flag.ts                    # USE_MOCK：true 走虚拟数据，false 走真实接口
   │  ├─ index.ts                   # 展示型虚拟数据统一出口 + 登录虚拟账号
   │  ├─ project.ts                 # 项目列表虚拟数据（可变，新建会真实落库）
   │  └─ config.ts                  # 监测配置虚拟数据（意图定义/词库资料，编辑会真实落库）
   │
   ├─ store/                        # Pinia 状态
   │  ├─ task.ts                    # taskList / currentTask（跨路由共享）
   │  ├─ project.ts                 # 当前项目（按路由 projectId 拉取并缓存）
   │  ├─ analysis.ts                # 分析页状态（预留）
   │  └─ app.ts                     # 应用级 UI 状态（预留）
   │
   ├─ router/
   │  └─ index.ts                   # 路由表 + 登录/项目守卫 + afterEach 设置 document.title
   │
   ├─ layout/                       # 布局
   │  ├─ AppLayout.vue              # Sidebar + TopNav + RouterView 骨架
   │  ├─ Sidebar.vue                # Logo + 一级菜单（监测/计划）
   │  ├─ TopNav.vue                 # 二级导航（监测任务/盲区分析/意图词库/监测配置）
   │  └─ menu.ts                    # 菜单配置 + getActiveMenu()
   │
   ├─ views/                        # 业务页面
   │  ├─ login/
   │  │  └─ Login.vue               # 登录页（虚拟账号见 mock/index.ts）
   │  ├─ project/
   │  │  └─ ProjectList.vue         # 项目列表（登录后的首页：查询/新建/分页/进入项目）
   │  ├─ monitor/
   │  │  ├─ tasks/
   │  │  │  ├─ TaskList.vue         # 监测任务列表 + 新建（手动/Excel）+ 卡片操作
   │  │  │  └─ TaskDetail.vue       # 观测详情：进度/结果/排名/截图/联网/导出
   │  │  ├─ analysis/
   │  │  │  └─ AnalysisReport.vue   # 盲区分析报告（ECharts 图表 + AI 总结 + 历史）
   │  │  ├─ intent/
   │  │  │  └─ IntentLibrary.vue    # 意图词库（聚合询问句）
   │  │  └─ config/
   │  │     └─ MonitorConfig.vue    # 监测配置（意图定义 / 词库资料）
   │  └─ plan/
   │     └─ PlanView.vue            # 计划（定时任务）
   │
   ├─ components/                   # 通用组件
   │  ├─ BaseChart.vue              # ECharts 封装（option prop + resize + dispose）
   │  ├─ AppModal.vue               # 通用弹窗
   │  └─ StatusTag.vue              # 任务/结果状态标签
   │
   ├─ charts/                       # 图表层（dataviz 规范）
   │  ├─ palette.ts                 # 品牌调色板（分类色/墨色/chrome/状态色）
   │  └─ options.ts                 # 图表配置工厂（条形/环形/趋势）
   │
   ├─ utils/                        # 工具函数
   │  ├─ request.ts                 # axios 实例 + 拦截器 + http<T>()
   │  ├─ report.ts                  # 报告同步/异步轮询 + 归一化
   │  ├─ markdown.ts                # 安全 Markdown 渲染（防注入）
   │  ├─ format.ts                  # 日期/百分比/数组/联网来源解析
   │  ├─ projectPath.ts             # 项目内路径拼接 / 子路径解析
   │  └─ download.ts                # blob 下载 + 文件名解析
   │
   └─ styles/                       # 全局样式
      ├─ variables.scss             # 主题变量（主色/尺寸/背景）
      └─ index.scss                 # 全局 reset + ElementPlus 变量覆盖 + 公共类
```

## 路由与项目上下文

登录后落到**项目列表**（首页），选定项目再进入该项目的业务页面。项目 ID 走 URL，
同一个页面在不同项目下是不同的地址，刷新/分享链接/多标签页各自独立。

```
/login                                   登录
  ↓ 登录成功
/                                        项目列表（首页，根路径）
  ↓ 点「进入项目」
/project/:projectId                      默认重定向到 monitor/tasks
  ├─ monitor/tasks                       监测任务      ← TaskList.vue
  ├─ monitor/tasks/create                新建任务
  ├─ monitor/tasks/:taskNo               观测详情
  ├─ monitor/analysis                    数据分析（报告页，不在顶部导航露出）
  ├─ monitor/blindspot                   盲区分析
  ├─ monitor/intent                      意图词库
  ├─ monitor/config                      监测配置
  └─ plan                                计划
```

约定：

1. **菜单里存的是子路径**（`monitor/tasks`），不是完整路径；跳转时由
   `utils/projectPath.ts` 的 `projectPath(projectId, sub)` 补上当前项目 ID。
   页面里跳转一律走它，缺 ID 时兜底回 `/`。
2. **旧路径兼容**：`/monitor/**`、`/plan` 会按 localStorage 里的
   `geo_last_project`（最近进入的项目）展开成新的项目内路径；没进过项目就回 `/`。
   上一版的首页地址 `/projects` 也由路由兜底规则重定向到 `/`。
3. **守卫**：未登录 → `/login`（带 `redirect`）；已登录访问 `/login` → `/`；
   URL 里的 `projectId` 不存在 → 提示后退回 `/`。
4. **离开项目**（回到 `/`）会清空 `store/project.ts` 的当前项目，
   顶部导航不会残留上一个项目名。

## 数据流

```
页面 (views/*.vue)
   │ 调用
   ▼
API 层 (api/*.ts)  ──http<T>()──▶  axios 实例 (utils/request.ts)  ──拦截器──▶  后端网关 /api/**
   │                                  │
   │  解包 data                       │  code===200 → data；否则报错
   ▼                                  ▼
组件状态 (ref/reactive / Pinia)     ElMessage / ElMessageBox 用户提示
   │
   ▼
渲染 (Element Plus / BaseChart / StatusTag / renderMarkdown)
```

## 关键约定

1. **接口函数签名与后端路由一一对应**，不猜测路径；新增接口先在 `src/api/` 补函数，再在类型文件补类型。
2. **响应统一解包**：页面拿到的就是后端 `data` 字段，无需处理 `{ code, message }`。
3. **客户端分页**：后端无分页，页面用 computed 切片 + 客户端过滤。
4. **图表只走 `charts/` 工厂**：新增图表复用 `buildBarOption` / `buildDonutOption` / `buildTrendOption`，颜色来自 `palette.ts`，不手写十六进制。
5. **文字永不使用数据色**：标签 / 数值 / 图例用 `INK` 墨色，身份由旁边的色块承载。
6. **虚拟数据集中在 `src/mock/`**：`flag.ts` 的 `USE_MOCK` 一键切换虚拟数据与真实后端；
   展示型数据从 `@/mock` 取，项目这类需要增删的数据经 `api/project.ts` 转发，
   后端补齐接口后只改 api 层的分支，页面不动。
