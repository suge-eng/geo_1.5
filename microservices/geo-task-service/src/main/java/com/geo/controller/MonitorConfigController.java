package com.geo.controller;

import com.geo.common.Result;
import com.geo.entity.IntentDefinition;
import com.geo.entity.IntentQuestion;
import com.geo.entity.IntentWord;
import com.geo.entity.LexiconItem;
import com.geo.service.AiExpandService;
import com.geo.service.ExcelParseService;
import com.geo.service.IntentDefinitionService;
import com.geo.service.IntentQuestionService;
import com.geo.service.IntentWordService;
import com.geo.service.LexiconItemService;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

/**
 * 【监测配置 - 意图定义接口】
 *
 * 设计思路：
 * 1. 路径前缀 /api/monitor/config/intents，对应前端 api/monitorConfig.ts。
 * 2. 提供接口：
 *    - GET    /api/monitor/config/intents              查询全部意图定义
 *    - PUT    /api/monitor/config/intents/{id}         按 ID 更新意图定义
 *    - POST   /api/monitor/config/intents/ai-expand    AI 拓展关键词
 *    - GET    /api/monitor/config/intents/words        查询全部意图词
 *    - POST   /api/monitor/config/intents/words/batch  批量新增意图词
 *    - DELETE /api/monitor/config/intents/words/{id}   按 ID 删除意图词
 *    - PUT    /api/monitor/config/intents/words/{id}   按 ID 更新意图词
 */
@RestController
@RequestMapping("/api/monitor/config/intents")
public class MonitorConfigController {

    private final IntentDefinitionService intentDefinitionService;
    private final AiExpandService aiExpandService;
    private final IntentWordService intentWordService;
    private final ExcelParseService excelParseService;
    private final LexiconItemService lexiconItemService;
    private final IntentQuestionService intentQuestionService;

    public MonitorConfigController(IntentDefinitionService intentDefinitionService,
                                   AiExpandService aiExpandService,
                                   IntentWordService intentWordService,
                                   ExcelParseService excelParseService,
                                   LexiconItemService lexiconItemService,
                                   IntentQuestionService intentQuestionService) {
        this.intentDefinitionService = intentDefinitionService;
        this.aiExpandService = aiExpandService;
        this.intentWordService = intentWordService;
        this.excelParseService = excelParseService;
        this.lexiconItemService = lexiconItemService;
        this.intentQuestionService = intentQuestionService;
    }

    /**
     * 查询全部意图定义列表。
     */
    @GetMapping
    public Result<List<IntentDefinition>> list() {
        return Result.success(intentDefinitionService.list());
    }

    /**
     * 按 ID 更新意图定义。
     */
    @PutMapping("/{id}")
    public Result<IntentDefinition> update(@PathVariable Long id, @RequestBody IntentDefinition definition) {
        definition.setId(id);
        return Result.success(intentDefinitionService.updateById(definition));
    }

    /**
     * AI 拓展关键词。
     */
    @PostMapping("/ai-expand")
    public Result<List<String>> aiExpand(@RequestBody Map<String, String> params) {
        String level = params.get("level");
        String scene = params.get("scene");
        String tag = params.get("tag");
        List<String> keywords = aiExpandService.expandKeywords(level, scene, tag);
        return Result.success(keywords);
    }

    /**
     * 【询问句 AI 拓展】
     * 根据该意图层级的「询问提示词」生成 20 个独立的询问句。
     * 请求体：{ level, scene, tag }
     */
    @PostMapping("/questions/ai-expand")
    public Result<List<String>> aiExpandQuestions(@RequestBody Map<String, String> params) {
        String level = params.get("level");
        String scene = params.get("scene");
        String tag = params.get("tag");
        List<String> questions = aiExpandService.expandQuestions(level, scene, tag);
        return Result.success(questions);
    }

    // ==================== 意图词（intent_word） ====================

    /**
     * 按项目查询全部意图词。
     *
     * @param projectId 项目 ID（必传）
     */
    @GetMapping("/words")
    public Result<List<IntentWord>> listWords(@RequestParam String projectId) {
        return Result.success(intentWordService.list(projectId));
    }

    /**
     * 查询指定项目下"启用"的意图词。
     * 给新建任务页面的关键词下拉用。
     */
    @GetMapping("/words/enabled")
    public Result<List<IntentWord>> listEnabledWords(@RequestParam String projectId) {
        return Result.success(intentWordService.listEnabled(projectId));
    }

    /**
     * 批量新增意图词（归属到指定项目）。
     * 请求体最后一个元素带 projectId，或通过 query 参数传入。
     */
    @PostMapping("/words/batch")
    public Result<List<IntentWord>> batchCreateWords(@RequestBody List<IntentWord> words,
                                                      @RequestParam(required = false) String projectId) {
        // 优先从请求参数取 projectId；若为空则取第一个词上带的 projectId
        String pid = projectId;
        if ((pid == null || pid.isEmpty()) && words != null && !words.isEmpty()) {
            pid = words.get(0).getProjectId();
        }
        return Result.success(intentWordService.batchSave(words, pid));
    }

    /**
     * 【词库资料】查询指定项目的词库资料列表。
     * 词库资料（lexicon_item）与意图词库（intent_word）是两张独立的表。
     */
    @GetMapping("/lexicon")
    public Result<List<LexiconItem>> listLexicon(@RequestParam("projectId") String projectId) {
        return Result.success(lexiconItemService.listByProject(projectId));
    }

    /**
     * 【词库资料】导入 Excel（归属到指定项目，覆盖式）。
     * Excel 格式：第0行表头，3列依次为「意图」「核心场景」「标签」。
     *
     * @param file      上传的 Excel 文件
     * @param projectId 项目 ID（必传）
     * @return 导入后的词库资料列表
     */
    @PostMapping("/lexicon/import")
    public Result<List<LexiconItem>> importLexicon(@RequestParam("file") MultipartFile file,
                                                   @RequestParam("projectId") String projectId) {
        List<LexiconItem> items = excelParseService.parseLexiconFromExcel(file);
        // 覆盖式导入：先清空该项目旧词库资料，再写入 Excel 解析出的新数据
        return Result.success(lexiconItemService.replaceByProject(items, projectId));
    }

    /**
     * 【词库资料】新增单条。
     */
    @PostMapping("/lexicon")
    public Result<LexiconItem> createLexicon(@RequestBody LexiconItem item,
                                             @RequestParam("projectId") String projectId) {
        return Result.success(lexiconItemService.create(item, projectId));
    }

    /**
     * 【词库资料】更新单条。
     */
    @PutMapping("/lexicon/{id}")
    public Result<LexiconItem> updateLexicon(@PathVariable Long id,
                                             @RequestBody LexiconItem item) {
        LexiconItem updated = lexiconItemService.update(id, item);
        if (updated == null) {
            return Result.fail(404, "词库资料不存在");
        }
        return Result.success(updated);
    }

    /**
     * 【词库资料】删除单条。
     */
    @DeleteMapping("/lexicon/{id}")
    public Result<Void> deleteLexicon(@PathVariable Long id) {
        lexiconItemService.delete(id);
        return Result.success();
    }

    /**
     * 按 ID 删除意图词。
     */
    @DeleteMapping("/words/{id}")
    public Result<Void> deleteWord(@PathVariable Long id) {
        intentWordService.deleteById(id);
        return Result.success();
    }

    /**
     * 按 ID 更新意图词。
     */
    @PutMapping("/words/{id}")
    public Result<IntentWord> updateWord(@PathVariable Long id, @RequestBody IntentWord word) {
        word.setId(id);
        return Result.success(intentWordService.updateById(word));
    }

    // ==================== 询问句（intent_question） ====================

    /**
     * 按意图词 ID 查询全部关联询问句。
     */
    @GetMapping("/words/{wordId}/questions")
    public Result<List<IntentQuestion>> listQuestions(@PathVariable Long wordId) {
        return Result.success(intentQuestionService.listByWordId(wordId));
    }

    /**
     * 批量新增询问句（归属到指定意图词）。
     * 请求体：{ "texts": ["句1", "句2"], "projectId": "xxx" }
     */
    @PostMapping("/words/{wordId}/questions/batch")
    public Result<List<IntentQuestion>> batchCreateQuestions(@PathVariable Long wordId,
                                                              @RequestBody Map<String, Object> params) {
        @SuppressWarnings("unchecked")
        List<String> texts = (List<String>) params.get("texts");
        String projectId = (String) params.get("projectId");
        return Result.success(intentQuestionService.batchCreate(texts, wordId, projectId));
    }

    /**
     * 按 ID 删除询问句。
     */
    @DeleteMapping("/questions/{id}")
    public Result<Void> deleteQuestion(@PathVariable Long id) {
        intentQuestionService.deleteById(id);
        return Result.success();
    }

    /**
     * 按 ID 更新询问句（文本、状态）。
     */
    @PutMapping("/questions/{id}")
    public Result<IntentQuestion> updateQuestion(@PathVariable Long id, @RequestBody IntentQuestion question) {
        question.setId(id);
        return Result.success(intentQuestionService.updateById(question));
    }
}
