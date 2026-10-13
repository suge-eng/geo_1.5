package com.geo.entity;

import com.baomidou.mybatisplus.annotation.*;

import java.time.LocalDateTime;

/**
 * 【意图询问句表实体类】
 *
 * 设计思路：
 * 1. 对应数据库表：intent_question
 *    存储每个意图词关联的询问句（用户搜索时会输入的问题）。
 * 2. 通过 word_id 关联到 intent_word 表的某条意图词。
 * 3. 字段含义：
 *    - wordId   ：所属意图词 ID
 *    - projectId：所属项目 ID（冗余，便于按项目查询）
 *    - text     ：询问句内容
 *    - status   ：1 启用 / 0 停用
 */
@TableName("intent_question")
public class IntentQuestion {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long wordId;

    private String projectId;

    private String text;

    private Integer status;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;

    // ==================== getter/setter ====================
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getWordId() { return wordId; }
    public void setWordId(Long wordId) { this.wordId = wordId; }
    public String getProjectId() { return projectId; }
    public void setProjectId(String projectId) { this.projectId = projectId; }
    public String getText() { return text; }
    public void setText(String text) { this.text = text; }
    public Integer getStatus() { return status; }
    public void setStatus(Integer status) { this.status = status; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
