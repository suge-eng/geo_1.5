-- =====================================================================
-- 意图定义表（监测配置 → 意图定义）
-- 对应前端 mock/config.ts 的 IntentDefinition 结构
-- 设计：五级意图（认知/种草/甄选/决策/反馈）的定义、心智占领、客户心理阶段等文案
--       初始数据由 IntentDefinitionDataInitializer 在服务启动时写入（仅当表为空时）
-- =====================================================================
CREATE TABLE IF NOT EXISTS intent_definition (
    id             BIGINT       NOT NULL AUTO_INCREMENT,
    name           VARCHAR(64)  NULL COMMENT '名称：认知层/种草层/甄选层/决策层/反馈层',
    definition     TEXT         NULL COMMENT '定义',
    mindshare      TEXT         NULL COMMENT '心智占领',
    psychological  TEXT         NULL COMMENT '客户心理阶段',
    title          TEXT         NULL COMMENT '标题',
    prompt         TEXT         NULL COMMENT '询问提示词',
    created_at     DATETIME     NULL,
    updated_at     DATETIME     NULL,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='意图定义表';
