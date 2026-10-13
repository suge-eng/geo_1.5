package com.geo.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.geo.entity.IntentQuestion;
import com.geo.mapper.IntentQuestionMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

/**
 * 【意图询问句服务】
 *
 * 设计思路：
 * 1. 管理 intent_question 表，提供按意图词查询、批量新增、删除、更新等能力。
 */
@Service
public class IntentQuestionService {

    private final IntentQuestionMapper intentQuestionMapper;

    public IntentQuestionService(IntentQuestionMapper intentQuestionMapper) {
        this.intentQuestionMapper = intentQuestionMapper;
    }

    /**
     * 按意图词 ID 查询全部询问句（按 ID 倒序，最新的在前）。
     */
    public List<IntentQuestion> listByWordId(Long wordId) {
        if (wordId == null) return List.of();
        return intentQuestionMapper.selectList(
                new QueryWrapper<IntentQuestion>().eq("word_id", wordId).orderByDesc("id")
        );
    }

    /**
     * 批量新增询问句。
     *
     * @param texts     询问句文本列表
     * @param wordId    所属意图词 ID
     * @param projectId 所属项目 ID
     */
    @Transactional(rollbackFor = Exception.class)
    public List<IntentQuestion> batchCreate(List<String> texts, Long wordId, String projectId) {
        List<IntentQuestion> result = new ArrayList<>();
        if (texts == null || texts.isEmpty() || wordId == null) return result;
        for (String text : texts) {
            if (text == null || text.trim().isEmpty()) continue;
            IntentQuestion q = new IntentQuestion();
            q.setWordId(wordId);
            q.setProjectId(projectId);
            q.setText(text.trim());
            q.setStatus(1);
            intentQuestionMapper.insert(q);
            result.add(q);
        }
        return result;
    }

    /**
     * 按 ID 删除询问句。
     */
    public boolean deleteById(Long id) {
        return intentQuestionMapper.deleteById(id) > 0;
    }

    /**
     * 按 ID 更新询问句（文本、状态）。
     */
    public IntentQuestion updateById(IntentQuestion question) {
        intentQuestionMapper.updateById(question);
        return intentQuestionMapper.selectById(question.getId());
    }
}
