package com.geo.service;

import com.geo.entity.IntentDefinition;
import com.geo.mapper.IntentDefinitionMapper;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * 【意图定义服务】
 *
 * 设计思路：
 * 1. 提供「查询列表」和「按ID更新」两个方法，对应监测配置页意图定义表格的查看/编辑。
 * 2. 全部基于 MyBatis-Plus 的 BaseMapper，无需手写 SQL。
 * 3. 更新时直接用 updateById，前端传什么字段就更新什么字段（MyBatis-Plus 默认只更新非 null 字段）。
 */
@Service
public class IntentDefinitionService {

    private final IntentDefinitionMapper intentDefinitionMapper;

    public IntentDefinitionService(IntentDefinitionMapper intentDefinitionMapper) {
        this.intentDefinitionMapper = intentDefinitionMapper;
    }

    /**
     * 查询全部意图定义（按 id 升序，保证五级意图的顺序稳定）。
     */
    public List<IntentDefinition> list() {
        return intentDefinitionMapper.selectList(
                new com.baomidou.mybatisplus.core.conditions.query.QueryWrapper<IntentDefinition>()
                        .orderByAsc("id")
        );
    }

    /**
     * 按意图层级名称（认知层/种草层/甄选层/决策层/反馈层）查询意图定义。
     */
    public IntentDefinition getByName(String name) {
        if (name == null || name.isEmpty()) return null;
        return intentDefinitionMapper.selectOne(
                new com.baomidou.mybatisplus.core.conditions.query.QueryWrapper<IntentDefinition>()
                        .eq("name", name)
        );
    }

    /**
     * 按 ID 更新意图定义。
     * 前端编辑某一行后，把整行数据传过来，这里按 id 覆盖更新。
     */
    public IntentDefinition updateById(IntentDefinition definition) {
        intentDefinitionMapper.updateById(definition);
        return intentDefinitionMapper.selectById(definition.getId());
    }
}
