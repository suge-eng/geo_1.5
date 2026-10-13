/** 后端统一响应结构 Result<T> */
export interface Result<T = unknown> {
  code: number
  message: string
  data: T
}

/** 分页参数（前端客户端分页用，后端无分页） */
export interface PageParams {
  page: number
  pageSize: number
}
