package com.geo.controller;

import com.geo.common.Result;
import com.geo.common.ResultCode;
import com.geo.entity.Project;
import com.geo.service.ProjectService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 【项目接口】
 *
 * 设计思路：
 * 1. 路径前缀 /api/project，对应前端 api/project.ts。
 * 2. 提供接口：
 *    - GET    /api/project/list     查询全部项目
 *    - GET    /api/project/{id}     按 ID 查询项目
 *    - POST   /api/project          新建项目
 *    - DELETE /api/project/{id}     按 ID 删除项目
 */
@RestController
@RequestMapping("/api/project")
public class ProjectController {

    private final ProjectService projectService;

    public ProjectController(ProjectService projectService) {
        this.projectService = projectService;
    }

    /**
     * 查询全部项目列表。
     */
    @GetMapping("/list")
    public Result<List<Project>> list() {
        return Result.success(projectService.list());
    }

    /**
     * 按 ID 查询项目。
     */
    @GetMapping("/{id}")
    public Result<Project> getById(@PathVariable String id) {
        Project project = projectService.getById(id);
        if (project == null) {
            return Result.fail(ResultCode.NOT_FOUND, "项目不存在");
        }
        return Result.success(project);
    }

    /**
     * 新建项目。
     * 请求体：{ name, packageType, startDate, endDate }
     */
    @PostMapping
    public Result<Project> create(@RequestBody Map<String, String> params) {
        String name = params.get("name");
        String packageType = params.get("packageType");
        String startDate = params.get("startDate");
        String endDate = params.get("endDate");

        if (name == null || name.trim().isEmpty()) {
            return Result.fail(ResultCode.BAD_REQUEST, "项目名称不能为空");
        }
        Project project = projectService.create(name.trim(), packageType, startDate, endDate);
        return Result.success(project);
    }

    /**
     * 按 ID 删除项目。
     */
    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable String id) {
        projectService.deleteById(id);
        return Result.success();
    }
}
