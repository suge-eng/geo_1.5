package com.geo.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.geo.entity.Project;
import org.apache.ibatis.annotations.Mapper;

/**
 * 【项目表Mapper】
 *
 * 设计思路：
 * 1. 继承 MyBatis-Plus 的 BaseMapper，自动获得 insert / updateById / selectList / deleteById 等方法。
 */
@Mapper
public interface ProjectMapper extends BaseMapper<Project> {
}
