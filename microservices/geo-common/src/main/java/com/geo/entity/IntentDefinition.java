package com.geo.entity;

import com.baomidou.mybatisplus.annotation.*;

import java.time.LocalDateTime;

/**
 * 【意图定义表实体类】
 *
 * 设计思路：
 * 1. 对应数据库表：intent_definition
 *    存储监测配置页面「意图定义」表格的五级意图文案
 *    （认知层 / 种草层 / 甄选层 / 决策层 / 反馈层）
 *
 * 2. 字段含义：
 *    - name          ：意图层级名称
 *    - definition    ：定义（该层级用户搜索行为的核心描述）
 *    - mindshare     ：心智占领（品牌在该层级要抢占的关键词与内容方向）
 *    - psychological ：客户心理阶段（用户在该层级的心理状态与核心疑问）
 *    - title         ：标题（搜索行为特征概括）
 *    - prompt        ：询问提示词（用于生成该层级的搜索 Query）
 *
 * 3. 数据来源：
 *    服务启动时由 IntentDefinitionDataInitializer 把前端 mock/config.ts 的
 *    5 条初始文案写入数据库（仅当表为空时）。后续用户编辑通过 update 接口更新。
 */
@TableName("intent_definition")
public class IntentDefinition {

    // 主键ID，自增
    @TableId(type = IdType.AUTO)
    private Long id;

    // 名称：认知层 / 种草层 / 甄选层 / 决策层 / 反馈层
    private String name;

    // 定义
    private String definition;

    // 心智占领
    private String mindshare;

    // 客户心理阶段
    private String psychological;

    // 标题
    private String title;

    // 询问提示词
    private String prompt;

    // 创建时间：MyBatis-Plus自动填充
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    // 更新时间：MyBatis-Plus自动填充
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;

    // ==================== getter/setter ====================
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDefinition() { return definition; }
    public void setDefinition(String definition) { this.definition = definition; }
    public String getMindshare() { return mindshare; }
    public void setMindshare(String mindshare) { this.mindshare = mindshare; }
    public String getPsychological() { return psychological; }
    public void setPsychological(String psychological) { this.psychological = psychological; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getPrompt() { return prompt; }
    public void setPrompt(String prompt) { this.prompt = prompt; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
