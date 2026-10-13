package com.geo.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.geo.entity.LexiconItem;
import com.geo.mapper.LexiconItemMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * 【词库资料服务】
 *
 * 设计思路：
 * 1. 管理 lexicon_item 表，提供按项目查询、覆盖式导入等能力。
 * 2. 与 IntentWordService 完全独立：词库资料 ≠ 意图词库。
 */
@Service
public class LexiconItemService {

    private final LexiconItemMapper lexiconItemMapper;

    public LexiconItemService(LexiconItemMapper lexiconItemMapper) {
        this.lexiconItemMapper = lexiconItemMapper;
    }

    /**
     * 按项目 ID 查询词库资料列表。
     */
    public List<LexiconItem> listByProject(String projectId) {
        if (projectId == null || projectId.isEmpty()) {
            return List.of();
        }
        return lexiconItemMapper.selectList(
                new QueryWrapper<LexiconItem>().eq("project_id", projectId).orderByDesc("id")
        );
    }

    /**
     * 覆盖式导入词库资料：先删除该项目下全部旧数据，再写入新数据。
     * 用于 Excel 导入场景，保证导入后库内内容与 Excel 完全一致。
     */
    @Transactional(rollbackFor = Exception.class)
    public List<LexiconItem> replaceByProject(List<LexiconItem> items, String projectId) {
        lexiconItemMapper.delete(new QueryWrapper<LexiconItem>().eq("project_id", projectId));
        if (items == null || items.isEmpty()) {
            return List.of();
        }
        for (LexiconItem item : items) {
            item.setId(null);
            item.setProjectId(projectId);
            lexiconItemMapper.insert(item);
        }
        return items;
    }

    /**
     * 新增单条词库资料。
     */
    public LexiconItem create(LexiconItem item, String projectId) {
        item.setId(null);
        item.setProjectId(projectId);
        lexiconItemMapper.insert(item);
        return item;
    }

    /**
     * 更新单条词库资料。
     */
    public LexiconItem update(Long id, LexiconItem item) {
        LexiconItem existing = lexiconItemMapper.selectById(id);
        if (existing == null) {
            return null;
        }
        existing.setIntent(item.getIntent());
        existing.setScenario(item.getScenario());
        existing.setTag(item.getTag());
        lexiconItemMapper.updateById(existing);
        return existing;
    }

    /**
     * 删除单条词库资料。
     */
    public boolean delete(Long id) {
        return lexiconItemMapper.deleteById(id) > 0;
    }
}
