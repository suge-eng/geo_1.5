package com.geo.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.geo.entity.IntentWord;
import com.geo.mapper.IntentWordMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * 【意图词服务】
 *
 * 设计思路：
 * 1. 提供意图词库的查询、批量新增、删除、更新方法。
 * 2. 全部基于 MyBatis-Plus 的 BaseMapper，无需手写 SQL。
 * 3. 所有查询/写入都按 projectId 隔离，每个项目有独立的意图词库。
 */
@Service
public class IntentWordService {

    private final IntentWordMapper intentWordMapper;

    public IntentWordService(IntentWordMapper intentWordMapper) {
        this.intentWordMapper = intentWordMapper;
    }

    /**
     * 按项目查询意图词（按 id 倒序，最新添加的排在前面）。
     *
     * @param projectId 项目 ID
     */
    public List<IntentWord> list(String projectId) {
        QueryWrapper<IntentWord> wrapper = new QueryWrapper<IntentWord>()
                .orderByDesc("id");
        if (projectId != null && !projectId.isEmpty()) {
            wrapper.eq("project_id", projectId);
        }
        return intentWordMapper.selectList(wrapper);
    }

    /**
     * 查询指定项目下"启用"的意图词（status=true）。
     * 给新建任务页面的关键词下拉用，停用的不应该出现在可选列表里。
     */
    public List<IntentWord> listEnabled(String projectId) {
        QueryWrapper<IntentWord> wrapper = new QueryWrapper<IntentWord>()
                .eq("status", true)
                .orderByDesc("id");
        if (projectId != null && !projectId.isEmpty()) {
            wrapper.eq("project_id", projectId);
        }
        return intentWordMapper.selectList(wrapper);
    }

    /**
     * 批量新增意图词（归属到指定项目）。
     *
     * @param words     要新增的意图词列表
     * @param projectId 项目 ID
     * @return 新增后的列表（含数据库自增 id）
     */
    @Transactional(rollbackFor = Exception.class)
    public List<IntentWord> batchSave(List<IntentWord> words, String projectId) {
        for (IntentWord w : words) {
            w.setProjectId(projectId);
            // 兜底默认值
            if (w.getType() == null || w.getType().isEmpty()) w.setType("通用词");
            if (w.getCompetitiveness() == null || w.getCompetitiveness().isEmpty()) w.setCompetitiveness("中");
            if (w.getQuestionCount() == null) w.setQuestionCount(0);
            if (w.getStatus() == null) w.setStatus(true);
            intentWordMapper.insert(w);
        }
        return words;
    }

    /**
     * 按 ID 删除意图词。
     */
    public boolean deleteById(Long id) {
        return intentWordMapper.deleteById(id) > 0;
    }

    /**
     * 覆盖式导入意图词：先删除该项目下全部旧词，再写入新词。
     * 用于「词库资料」Excel 导入场景，保证每次导入后库内内容与 Excel 完全一致。
     *
     * @param words     Excel 解析出的新词列表
     * @param projectId 项目 ID
     * @return 写入后的新词列表
     */
    @Transactional(rollbackFor = Exception.class)
    public List<IntentWord> replaceByProject(List<IntentWord> words, String projectId) {
        // 1. 清空该项目下所有旧词
        intentWordMapper.delete(new QueryWrapper<IntentWord>().eq("project_id", projectId));
        // 2. 写入新词
        return batchSave(words, projectId);
    }

    /**
     * 按 ID 更新意图词（用于编辑属性等）。
     */
    public IntentWord updateById(IntentWord word) {
        intentWordMapper.updateById(word);
        return intentWordMapper.selectById(word.getId());
    }
}
