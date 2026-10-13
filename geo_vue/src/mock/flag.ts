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
