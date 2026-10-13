package com.geo.entity;

import com.baomidou.mybatisplus.annotation.*;

import java.time.LocalDateTime;

/**
 * 【项目表实体类】
 *
 * 设计思路：
 * 1. 对应数据库表：project
 *    存储项目列表页的项目信息（名称、套餐类型、服务时间等）
 *
 * 2. 字段含义：
 *    - id           ：项目ID，14 位时间戳 YYYYMMDDHHmmss
 *    - name         ：项目名称
 *    - packageType  ：套餐类型（年服务/季度服务/月服务）
 *    - serviceTime  ：服务时间，形如 2026.09.09-2027.09.09
 */
@TableName("project")
public class Project {

    @TableId(type = IdType.INPUT)
    private String id;

    private String name;

    private String packageType;

    private String serviceTime;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;

    // ==================== getter/setter ====================
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getPackageType() { return packageType; }
    public void setPackageType(String packageType) { this.packageType = packageType; }
    public String getServiceTime() { return serviceTime; }
    public void setServiceTime(String serviceTime) { this.serviceTime = serviceTime; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
