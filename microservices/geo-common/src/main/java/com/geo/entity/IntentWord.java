package com.geo.entity;

import com.baomidou.mybatisplus.annotation.*;

import java.time.LocalDateTime;

/**
 * 【意图词表实体类】
 *
 * 设计思路：
 * 1. 对应数据库表：intent_word
 *    存储意图词库页面的关键词及其属性（层级、场景、标签等）
 *
 * 2. 字段含义：
 *    - keyword        ：关键词
 *    - level          ：意图层级（认知层/种草层/甄选层/决策层/反馈层）
 *    - scene          ：核心场景
 *    - tag            ：意图标签
 *    - type           ：关键词类型（通用词/精准词等）
 *    - competitiveness：竞争力（高/中/低）
 *    - questionCount  ：关联询问句数量
 *    - status         ：状态（1启用 0停用）
 */
@TableName("intent_word")
public class IntentWord {

    @TableId(type = IdType.AUTO)
    private Long id;

    private String projectId;

    private String keyword;

    private String level;

    private String scene;

    private String tag;

    private String type;

    private String competitiveness;

    private Integer questionCount;

    private Boolean status;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;

    // ==================== getter/setter ====================
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getProjectId() { return projectId; }
    public void setProjectId(String projectId) { this.projectId = projectId; }
    public String getKeyword() { return keyword; }
    public void setKeyword(String keyword) { this.keyword = keyword; }
    public String getLevel() { return level; }
    public void setLevel(String level) { this.level = level; }
    public String getScene() { return scene; }
    public void setScene(String scene) { this.scene = scene; }
    public String getTag() { return tag; }
    public void setTag(String tag) { this.tag = tag; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getCompetitiveness() { return competitiveness; }
    public void setCompetitiveness(String competitiveness) { this.competitiveness = competitiveness; }
    public Integer getQuestionCount() { return questionCount; }
    public void setQuestionCount(Integer questionCount) { this.questionCount = questionCount; }
    public Boolean getStatus() { return status; }
    public void setStatus(Boolean status) { this.status = status; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
