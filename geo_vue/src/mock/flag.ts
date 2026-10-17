/**
 * 前端数据总开关。
 *
 * true  → 前端使用 src/mock/index.ts 中的虚拟数据（脱离后端也能跑通全流程）
 * false → 前端改走真实后端接口
 *
 * 用法：改下面这一行即可全局切换，无需改动任何组件。
 *
 * 注：类型显式标注为 boolean，避免 TS 把常量收窄成字面量 `true`／`false`
 * 而把另一个分支当成死代码跳过类型检查。
 */
export const USE_MOCK: boolean = false

/**
 * 舆情数据报告专用开关（独立于全局 USE_MOCK）。
 *
 * 原因：舆情类型任务的数据报告后端尚未开发完成，若直接跟随全局 USE_MOCK
 * （当前为 false）会走不到接口而空白；同时全局改成 true 又会影响声量任务等既有页面。
 * 所以这里单独放一个开关，只作用于「数据总览 / 媒体来源」两个新模块：
 *
 *   true  → 使用 src/mock/sentimentReport.ts 的虚拟数据（当前默认，便于预览）
 *   false → 改走 src/api/sentimentReport.ts 的真实后端接口
 *
 * 注意：常量显式标注为 boolean，避免 TS 收窄成字面量导致分支被当作死代码。
 */
export const USE_SENTIMENT_MOCK: boolean = false
