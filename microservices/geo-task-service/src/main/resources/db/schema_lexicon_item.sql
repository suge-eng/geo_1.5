-- 词库资料表：存储用户通过 Excel 导入的「意图层级 + 核心场景 + 标签」组合定义。
-- 与 intent_word 表（意图词库页面的关键词）相互独立，互不干扰。
CREATE TABLE IF NOT EXISTS `lexicon_item` (
    `id`          BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `project_id`  VARCHAR(32)  NOT NULL COMMENT '所属项目ID',
    `intent`      VARCHAR(50)  DEFAULT NULL COMMENT '意图层级（认知层/种草层/甄选层/决策层/反馈层）',
    `scenario`    VARCHAR(100) NOT NULL COMMENT '核心场景',
    `tag`         VARCHAR(100) DEFAULT NULL COMMENT '意图标签',
    `created_at`  DATETIME     DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at`  DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    KEY `idx_project_id` (`project_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='词库资料表';
