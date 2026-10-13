package com.geo.entity;

import com.baomidou.mybatisplus.annotation.*;

import java.time.LocalDateTime;

/**
 * 【词库资料表实体类】
 *
 * 设计思路：
 * 1. 对应数据库表：lexicon_item
 *    存储用户通过 Excel 导入的「意图层级 + 核心场景 + 标签」组合定义，
 *    作为意图词库页面新建关键词时的可选数据源。
 *
 * 2. 与 intent_word 表的区别：
 *    - lexicon_item：词库资料（Excel 导入的定义），只有 3 列
 *    - intent_word ：意图词库（用户手动创建 + AI 拓展的关键词），字段更丰富
 *
 * 3. 字段含义：
 *    - intent   ：意图层级（认知层/种草层/甄选层/决策层/反馈层）
 *    - scenario ：核心场景
 *    - tag      ：意图标签
 */
@TableName("lexicon_item")
public class LexiconItem {

    @TableId(type = IdType.AUTO)
    private Long id;

    private String projectId;

    private String intent;

    private String scenario;

    private String tag;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;

    // ==================== getter/setter ====================
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getProjectId() { return projectId; }
    public void setProjectId(String projectId) { this.projectId = projectId; }
    public String getIntent() { return intent; }
    public void setIntent(String intent) { this.intent = intent; }
    public String getScenario() { return scenario; }
    public void setScenario(String scenario) { this.scenario = scenario; }
    public String getTag() { return tag; }
    public void setTag(String tag) { this.tag = tag; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
