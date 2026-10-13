package com.geo.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.geo.entity.Project;
import com.geo.mapper.ProjectMapper;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * 【项目服务】
 *
 * 设计思路：
 * 1. 提供项目列表的查询、新建、按 ID 查询、删除方法。
 * 2. 项目 ID 采用 14 位时间戳 YYYYMMDDHHmmss，与前端 mock 生成规则一致。
 * 3. serviceTime 由开始日期 + 结束日期拼接，格式 2026.09.09-2027.09.09。
 */
@Service
public class ProjectService {

    private final ProjectMapper projectMapper;

    private static final DateTimeFormatter ID_FORMATTER = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy.MM.dd");

    public ProjectService(ProjectMapper projectMapper) {
        this.projectMapper = projectMapper;
    }

    /**
     * 查询全部项目（按创建时间倒序，最新创建的排在前面）。
     */
    public List<Project> list() {
        return projectMapper.selectList(
                new QueryWrapper<Project>().orderByDesc("created_at")
        );
    }

    /**
     * 按 ID 查询项目。
     */
    public Project getById(String id) {
        return projectMapper.selectById(id);
    }

    /**
     * 新建项目。
     *
     * @param name        项目名称
     * @param packageType 套餐类型
     * @param startDate   开始日期 yyyy-MM-dd
     * @param endDate     结束日期 yyyy-MM-dd
     * @return 新建的项目
     */
    public Project create(String name, String packageType, String startDate, String endDate) {
        Project project = new Project();
        project.setId(generateId());
        project.setName(name);
        project.setPackageType(packageType);
        project.setServiceTime(formatServiceTime(startDate, endDate));
        projectMapper.insert(project);
        return project;
    }

    /**
     * 按 ID 删除项目。
     */
    public boolean deleteById(String id) {
        return projectMapper.deleteById(id) > 0;
    }

    /**
     * 生成项目 ID：14 位时间戳 YYYYMMDDHHmmss。
     * 若同一秒内已存在，则顺延一秒直到不重复。
     */
    private String generateId() {
        LocalDateTime now = LocalDateTime.now();
        String id = now.format(ID_FORMATTER);
        while (projectMapper.selectById(id) != null) {
            now = now.plusSeconds(1);
            id = now.format(ID_FORMATTER);
        }
        return id;
    }

    /**
     * 将开始/结束日期拼接为服务时间字符串，格式 2026.09.09-2027.09.09。
     */
    private String formatServiceTime(String startDate, String endDate) {
        if (startDate == null || endDate == null) return "";
        String start = startDate.replace("-", ".");
        String end = endDate.replace("-", ".");
        return start + "-" + end;
    }
}
