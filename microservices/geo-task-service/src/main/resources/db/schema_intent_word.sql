-- =====================================================================
-- 意图词表（监测配置 → 意图词库）
-- 对应前端 mock/intenLibrary.ts 的 IntentWord 结构
-- 设计：存储用户通过「新建意图词」弹窗添加的关键词及其属性
--       页面挂载时从本表加载，保存/删除时同步更新
-- =====================================================================
CREATE TABLE IF NOT EXISTS intent_word (
    id              BIGINT       NOT NULL AUTO_INCREMENT,
    project_id      VARCHAR(32)  NULL COMMENT '所属项目ID',
    keyword         VARCHAR(255) NOT NULL COMMENT '关键词',
    level           VARCHAR(64)  NULL COMMENT '意图层级：认知层/种草层/甄选层/决策层/反馈层',
    scene           VARCHAR(255) NULL COMMENT '核心场景',
    tag             VARCHAR(255) NULL COMMENT '意图标签',
    type            VARCHAR(64)  NULL DEFAULT '通用词' COMMENT '关键词类型',
    competitiveness VARCHAR(32)  NULL DEFAULT '中' COMMENT '竞争力',
    question_count  INT          NULL DEFAULT 0 COMMENT '关联询问句数量',
    status          TINYINT(1)   NULL DEFAULT 1 COMMENT '状态：1启用 0停用',
    created_at      DATETIME     NULL,
    updated_at      DATETIME     NULL,
    PRIMARY KEY (id),
    KEY idx_project_id (project_id),
    KEY idx_keyword (keyword),
    KEY idx_level (level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='意图词表';
