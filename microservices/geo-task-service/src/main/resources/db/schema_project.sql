-- =====================================================================
-- 项目表（项目列表页）
-- 对应前端 types/project.ts 的 Project 结构
-- 设计：存储用户在「项目列表」页新建的项目，登录后展示
--       页面挂载时从本表加载，新建时插入，按创建时间倒序排列
-- =====================================================================
CREATE TABLE IF NOT EXISTS project (
    id              VARCHAR(32)  NOT NULL COMMENT '项目ID：14位时间戳 YYYYMMDDHHmmss',
    name            VARCHAR(255) NOT NULL COMMENT '项目名称',
    package_type    VARCHAR(64)  NULL COMMENT '套餐类型：年服务/季度服务/月服务',
    service_time    VARCHAR(64)  NULL COMMENT '服务时间，形如 2026.09.09-2027.09.09',
    created_at      DATETIME     NULL,
    updated_at      DATETIME     NULL,
    PRIMARY KEY (id),
    KEY idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='项目表';
