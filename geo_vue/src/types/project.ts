/**
 * 项目实体。
 *
 * 项目是平台最外层的业务单元：一个项目下挂多个监测任务，
 * 登录后先落到「项目列表」页，选定项目后再进入该项目的任务/分析等页面。
 */

export interface Project {
  /** 项目ID：14 位时间戳 YYYYMMDDHHmmss，如 20260909121112 */
  id: string
  /** 项目名称 */
  name: string
  /** 套餐类型：年服务 / 季度服务 / 月服务 */
  packageType: string
  /** 服务时间，形如 2026.09.09-2027.09.09（由开始日期 + 套餐时长推算） */
  serviceTime: string
  /** 创建时间（ISO 字符串），列表按创建时间倒序 */
  createdAt?: string
}

/** 新建项目入参 */
export interface ProjectCreateRequest {
  name: string
  packageType: string
  /** 服务开始日期，yyyy-MM-dd */
  startDate: string
  /** 服务结束日期，yyyy-MM-dd */
  endDate: string
}
