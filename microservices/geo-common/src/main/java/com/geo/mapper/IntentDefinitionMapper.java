package com.geo.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.geo.entity.IntentDefinition;
import org.apache.ibatis.annotations.Mapper;

/**
 * 【意图定义表Mapper】
 *
 * 设计思路：
 * 1. 继承 MyBatis-Plus 的 BaseMapper，自动获得 insert / updateById / selectList 等常用方法。
 * 2. 意图定义只有查询列表和按ID更新两个操作，BaseMapper 已完全覆盖，无需自定义 SQL。
 */
@Mapper
public interface IntentDefinitionMapper extends BaseMapper<IntentDefinition> {
}
