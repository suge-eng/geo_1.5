package com.geo.service;

import cn.hutool.http.HttpRequest;
import cn.hutool.http.HttpResponse;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.geo.entity.IntentDefinition;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.*;

/**
 * 【AI 关键词拓展服务】
 *
 * 设计思路：
 * 1. 读取 application.yml 中 geo.ai.* 配置（api-key / endpoint / model / prompt 模板）。
 * 2. 把用户填写的意图层级 / 核心场景 / 意图标签填入提示词模板。
 * 3. 调用阿里云百炼 DashScope 的 OpenAI 兼容接口（chat/completions）。
 * 4. 解析 AI 返回的 JSON，提取 keywords 数组返回给前端。
 *
 * 提示词模板中的占位符：{level} {scene} {tag}
 */
@Service
public class AiExpandService {

    private static final Logger log = LoggerFactory.getLogger(AiExpandService.class);

    private final ObjectMapper objectMapper;
    private final IntentDefinitionService intentDefinitionService;

    public AiExpandService(ObjectMapper objectMapper, IntentDefinitionService intentDefinitionService) {
        this.objectMapper = objectMapper;
        this.intentDefinitionService = intentDefinitionService;
    }

    @Value("${geo.ai.enabled:true}")
    private boolean aiEnabled;

    @Value("${geo.ai.api-key:}")
    private String aiApiKey;

    @Value("${geo.ai.api-endpoint:https://dashscope.aliyuncs.com/compatible-mode/v1}")
    private String aiApiEndpoint;

    @Value("${geo.ai.model:qwen3.7-plus-2026-05-26}")
    private String aiModel;

    @Value("${geo.ai.timeout-seconds:120}")
    private int aiTimeoutSeconds;

    @Value("${geo.ai.expand-prompt:}")
    private String expandPrompt;

    /**
     * 根据意图层级 / 核心场景 / 意图标签调用 AI 生成关键词列表。
     *
     * @param level 意图层级，如 认知层
     * @param scene 核心场景，如 毛囊炎
     * @param tag   意图标签，如 降低营销成本
     * @return AI 生成的关键词列表
     */
    public List<String> expandKeywords(String level, String scene, String tag) {
        if (!aiEnabled || aiApiKey == null || aiApiKey.isEmpty() || "your-api-key-here".equals(aiApiKey)) {
            log.warn("AI 未启用或 api-key 未配置，无法生成关键词");
            return Collections.emptyList();
        }

        String prompt = buildPrompt(level, scene, tag);
        String url = aiApiEndpoint + (aiApiEndpoint.endsWith("/") ? "" : "/") + "chat/completions";

        try {
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", aiModel);

            List<Map<String, String>> messages = new ArrayList<>();
            Map<String, String> systemMsg = new HashMap<>();
            systemMsg.put("role", "system");
            systemMsg.put("content", "你是一个严谨的JSON输出助手，只输出合法JSON，不输出任何解释文字。");
            messages.add(systemMsg);

            Map<String, String> userMsg = new HashMap<>();
            userMsg.put("role", "user");
            userMsg.put("content", prompt);
            messages.add(userMsg);

            requestBody.put("messages", messages);
            requestBody.put("max_tokens", 2000);
            requestBody.put("temperature", 0.7);
            requestBody.put("response_format", Map.of("type", "json_object"));

            String body = objectMapper.writeValueAsString(requestBody);

            log.info("调用 AI 拓展关键词: level={}, scene={}, tag={}", level, scene, tag);

            HttpResponse response = HttpRequest.post(url)
                    .header("Authorization", "Bearer " + aiApiKey)
                    .header("Content-Type", "application/json")
                    .body(body)
                    .timeout(aiTimeoutSeconds * 1000)
                    .setConnectionTimeout(60 * 1000)
                    .execute();

            if (!response.isOk()) {
                log.warn("AI 拓展调用失败: status={}, body={}", response.getStatus(), response.body());
                return Collections.emptyList();
            }

            Map<String, Object> responseMap = objectMapper.readValue(response.body(), Map.class);
            List<Map<String, Object>> choices = (List<Map<String, Object>>) responseMap.get("choices");
            if (choices == null || choices.isEmpty()) {
                return Collections.emptyList();
            }

            Map<String, Object> message = (Map<String, Object>) choices.get(0).get("message");
            String content = (String) message.get("content");
            if (content == null || content.isEmpty()) {
                return Collections.emptyList();
            }

            return parseKeywords(content);

        } catch (Exception e) {
            log.error("AI 拓展关键词异常: {}", e.getMessage(), e);
            return Collections.emptyList();
        }
    }

    /**
     * 根据意图层级对应的「意图定义.询问提示词」生成询问句列表。
     *
     * 设计思路：
     * 1. 根据 level 查出该层级的意图定义，取出「询问提示词」(prompt 字段)。
     * 2. 把核心场景、意图标签填入提示词，要求 AI 生成 20 个独立的询问句。
     * 3. 返回的列表每条就是一个完整的询问句，前端按行展示。
     *
     * @param level 意图层级，如 认知层
     * @param scene 核心场景，如 毛囊炎
     * @param tag   意图标签，如 用户认知
     * @return AI 生成的询问句列表（20 条左右）
     */
    public List<String> expandQuestions(String level, String scene, String tag) {
        if (!aiEnabled || aiApiKey == null || aiApiKey.isEmpty() || "your-api-key-here".equals(aiApiKey)) {
            log.warn("AI 未启用或 api-key 未配置，无法生成询问句");
            return Collections.emptyList();
        }

        // 1. 查出该层级的询问提示词
        String levelPrompt = "";
        IntentDefinition definition = intentDefinitionService.getByName(level);
        if (definition != null && definition.getPrompt() != null) {
            levelPrompt = definition.getPrompt();
        }

        // 2. 组装最终提示词
        String prompt = buildQuestionPrompt(level, scene, tag, levelPrompt);
        String url = aiApiEndpoint + (aiApiEndpoint.endsWith("/") ? "" : "/") + "chat/completions";

        try {
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", aiModel);

            List<Map<String, String>> messages = new ArrayList<>();
            Map<String, String> systemMsg = new HashMap<>();
            systemMsg.put("role", "system");
            systemMsg.put("content", "你是一个严谨的JSON输出助手，只输出合法JSON，不输出任何解释文字。");
            messages.add(systemMsg);

            Map<String, String> userMsg = new HashMap<>();
            userMsg.put("role", "user");
            userMsg.put("content", prompt);
            messages.add(userMsg);

            requestBody.put("messages", messages);
            requestBody.put("max_tokens", 2500);
            requestBody.put("temperature", 0.8);
            requestBody.put("response_format", Map.of("type", "json_object"));

            String body = objectMapper.writeValueAsString(requestBody);

            log.info("调用 AI 生成询问句: level={}, scene={}, tag={}", level, scene, tag);

            HttpResponse response = HttpRequest.post(url)
                    .header("Authorization", "Bearer " + aiApiKey)
                    .header("Content-Type", "application/json")
                    .body(body)
                    .timeout(aiTimeoutSeconds * 1000)
                    .setConnectionTimeout(60 * 1000)
                    .execute();

            if (!response.isOk()) {
                log.warn("AI 生成询问句调用失败: status={}, body={}", response.getStatus(), response.body());
                return Collections.emptyList();
            }

            Map<String, Object> responseMap = objectMapper.readValue(response.body(), Map.class);
            List<Map<String, Object>> choices = (List<Map<String, Object>>) responseMap.get("choices");
            if (choices == null || choices.isEmpty()) {
                return Collections.emptyList();
            }

            Map<String, Object> message = (Map<String, Object>) choices.get(0).get("message");
            String content = (String) message.get("content");
            if (content == null || content.isEmpty()) {
                return Collections.emptyList();
            }

            return parseKeywords(content);

        } catch (Exception e) {
            log.error("AI 生成询问句异常: {}", e.getMessage(), e);
            return Collections.emptyList();
        }
    }

    /**
     * 组装生成询问句的提示词：以该层级「询问提示词」为核心，结合场景/标签，
     * 要求 AI 输出 20 个独立的、可直接作为搜索 Query 的询问句。
     */
    private String buildQuestionPrompt(String level, String scene, String tag, String levelPrompt) {
        StringBuilder sb = new StringBuilder();
        sb.append("你是一个搜索用户行为分析专家。请根据以下信息生成 20 个真实用户会在搜索引擎中输入的询问句。\n\n");
        sb.append("- 意图层级：").append(safe(level)).append("\n");
        sb.append("- 核心场景：").append(safe(scene)).append("\n");
        sb.append("- 意图标签：").append(safe(tag)).append("\n");
        if (levelPrompt != null && !levelPrompt.isEmpty()) {
            sb.append("- 该层级询问提示词：").append(levelPrompt).append("\n");
        }
        sb.append("\n生成要求（必须严格遵守）：\n");
        sb.append("1. 每个输出项必须是一个完整的、用户会直接输入搜索框的询问句，例如「毛囊炎怎么治疗」「毛囊炎用什么药膏」\n");
        sb.append("2. 必须严格遵循该层级的询问提示词方向，不要偏离用户心理阶段\n");
        sb.append("3. 20 个询问句要拆分开来，每条独立，不要合并或混在一起\n");
        sb.append("4. 长度以 6-20 个字为主，是自然的搜索问句，不要加序号\n");
        sb.append("5. 不要重复，不要包含特殊符号\n");
        sb.append("6. 只输出 JSON 格式，不要任何解释文字\n\n");
        sb.append("输出格式：\n");
        sb.append("{\"keywords\": [\"询问句1\", \"询问句2\", \"询问句3\"]}");
        return sb.toString();
    }

    /**
     * 把用户填写的内容填入提示词模板中的 {level} {scene} {tag} 占位符。
     */
    private String buildPrompt(String level, String scene, String tag) {
        return expandPrompt
                .replace("{level}", safe(level))
                .replace("{scene}", safe(scene))
                .replace("{tag}", safe(tag));
    }

    private String safe(String s) {
        return s == null ? "" : s.trim();
    }

    /**
     * 解析 AI 返回的 JSON 内容，提取 keywords 数组。
     * 兼容两种格式：{"keywords": [...]} 或 直接是数组 [...]
     */
    @SuppressWarnings("unchecked")
    private List<String> parseKeywords(String content) {
        try {
            // 尝试解析为对象 {keywords: [...]}
            Map<String, Object> parsed = objectMapper.readValue(content, new TypeReference<Map<String, Object>>() {});
            Object kwObj = parsed.get("keywords");
            if (kwObj instanceof List) {
                List<String> result = new ArrayList<>();
                for (Object o : (List<Object>) kwObj) {
                    if (o != null) {
                        String s = String.valueOf(o).trim();
                        if (!s.isEmpty()) result.add(s);
                    }
                }
                return result;
            }
        } catch (Exception ignore) {
            // 不是对象格式，尝试直接解析为数组
        }

        try {
            List<String> list = objectMapper.readValue(content, new TypeReference<List<String>>() {});
            List<String> result = new ArrayList<>();
            for (String s : list) {
                if (s != null && !s.trim().isEmpty()) result.add(s.trim());
            }
            return result;
        } catch (Exception e) {
            log.warn("AI 返回内容无法解析为关键词列表: {}", content);
            return Collections.emptyList();
        }
    }
}
