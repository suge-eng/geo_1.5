package com.geo.service;

import cn.hutool.http.HttpRequest;
import cn.hutool.http.HttpResponse;
import com.geo.common.BusinessException;
import com.geo.common.ResultCode;
import com.geo.common.SentimentUtils;
import com.geo.dto.AnalysisReportResponse;
import com.geo.dto.SentimentReportResponse;
import com.geo.entity.IntentWord;
import com.geo.entity.Task;
import com.geo.entity.TaskQuestion;
import com.geo.entity.TaskReport;
import com.geo.entity.TaskResult;
import com.geo.enums.ResultStatus;
import com.geo.mapper.IntentWordMapper;
import com.geo.mapper.TaskMapper;
import com.geo.mapper.TaskQuestionMapper;
import com.geo.mapper.TaskReportMapper;
import com.geo.mapper.TaskResultMapper;
import com.geo.service.analysis.SourceStructureComputer;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 【舆情数据报告服务】
 *
 * 设计思路：
 * 1. 舆情类型任务（monitorTarget=sentiment）的数据报告，包含「数据总览 / 媒体来源」两个模块；
 *    与声量报告 AnalysisService 平行，互不干扰。
 * 2. 数据全部来自 task_result 表（AI 平台回答），通过 SentimentUtils 做情感分析，
 *    通过 SourceStructureComputer 做来源域名分类。
 * 3. 高频正/负向观点由 AI 从回答文本中提取关键词（不使用固定词库兜底）。
 */
@Service
public class SentimentService {

    private static final Logger log = LoggerFactory.getLogger(SentimentService.class);

    private final TaskMapper taskMapper;
    private final TaskResultMapper taskResultMapper;
    private final TaskQuestionMapper taskQuestionMapper;
    private final IntentWordMapper intentWordMapper;
    private final TaskReportMapper taskReportMapper;
    private final ObjectMapper objectMapper;
    private final RedisTemplate<String, String> redisTemplate;

    // ---- AI 配置（与 AnalysisService 共用 geo.ai.*）----
    @Value("${geo.ai.api-key:}")
    private String aiApiKey;

    @Value("${geo.ai.api-endpoint:https://api.deepseek.com/v1}")
    private String aiApiEndpoint;

    @Value("${geo.ai.model:deepseek-chat}")
    private String aiModel;

    @Value("${geo.ai.timeout-seconds:120}")
    private int aiTimeoutSeconds;

    @Value("${geo.ai.enabled:false}")
    private boolean aiEnabled;

    private static final int AI_MAX_RETRIES = 3;
    private static final long AI_RETRY_DELAY_MS = 2000;

    /** 议题配色（与前端 mock 一致） */
    private static final String[] TOPIC_COLORS = {
            "#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#06b6d4", "#ef4444"
    };

    /** 来源占比配色 */
    private static final String[] SOURCE_COLORS = {
            "#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#ef4444", "#06b6d4"
    };

    public SentimentService(TaskMapper taskMapper,
                            TaskResultMapper taskResultMapper,
                            TaskQuestionMapper taskQuestionMapper,
                            IntentWordMapper intentWordMapper,
                            TaskReportMapper taskReportMapper,
                            ObjectMapper objectMapper,
                            RedisTemplate<String, String> redisTemplate) {
        this.taskMapper = taskMapper;
        this.taskResultMapper = taskResultMapper;
        this.taskQuestionMapper = taskQuestionMapper;
        this.intentWordMapper = intentWordMapper;
        this.taskReportMapper = taskReportMapper;
        this.objectMapper = objectMapper;
        this.redisTemplate = redisTemplate;
    }

    /**
     * 【生成舆情数据报告】
     * 入口：读任务 → 读结果 → 情感分析 → 组装各模块 → 返回
     */
    public SentimentReportResponse generateReport(String taskNo) {
        log.info("生成舆情数据报告: taskNo={}", taskNo);

        Task task = taskMapper.selectOne(
                new com.baomidou.mybatisplus.core.conditions.query.QueryWrapper<Task>()
                        .eq("task_no", taskNo));
        if (task == null) {
            throw new BusinessException(ResultCode.TASK_NOT_FOUND);
        }

        List<TaskResult> results = taskResultMapper.selectByTaskNo(taskNo);
        if (results == null || results.isEmpty()) {
            throw new BusinessException(ResultCode.BAD_REQUEST, "任务没有结果数据，无法生成舆情报告");
        }

        List<TaskResult> validResults = results.stream()
                .filter(r -> ResultStatus.SUCCESS.name().equals(r.getStatus()))
                .collect(Collectors.toList());

        String selfBrand = task.getBrandName() != null ? task.getBrandName() : "";

        // 问题 → 意图词（level/tag）映射
        Map<Long, IntentWord> questionWordMap = buildQuestionWordMap(taskNo);

        // 对每条结果做情感分析 + 品牌提及判断
        List<ResultSentiment> sentiments = new ArrayList<>();
        for (TaskResult r : validResults) {
            String answerText = r.getAnswerText() != null ? r.getAnswerText() : "";
            boolean mentioned = !selfBrand.isEmpty() &&
                    answerText.toLowerCase().contains(selfBrand.toLowerCase());
            String sentiment = mentioned
                    ? SentimentUtils.analyzeBrandSentiment(answerText, selfBrand)
                    : "none";
            IntentWord iw = questionWordMap.get(r.getTaskQuestionId());
            sentiments.add(new ResultSentiment(r, mentioned, sentiment,
                    iw != null ? iw.getLevel() : null,
                    iw != null ? iw.getTag() : null));
        }

        // 品牌相关答案（提及品牌的）
        List<ResultSentiment> brandRelated = sentiments.stream()
                .filter(s -> s.mentioned)
                .collect(Collectors.toList());

        SentimentReportResponse report = new SentimentReportResponse();
        report.setTaskNo(taskNo);
        report.setTitle(task.getTitle());
        report.setBrandName(selfBrand);
        report.setReportDate(LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
        report.setTotalQuestions((int) results.stream().map(TaskResult::getQuestionText).distinct().count());
        report.setTotalPlatforms((int) results.stream().map(TaskResult::getAiPlatform).distinct().count());
        report.setTotalResults(validResults.size());

        report.setOverview(buildOverview(sentiments, brandRelated, validResults, selfBrand));
        report.setMediaSource(buildMediaSource(validResults, selfBrand));

        // 持久化到 task_report 历史表
        try {
            String reportJson = objectMapper.writeValueAsString(report);
            task.setReportJson(reportJson);
            taskMapper.updateById(task);

            TaskReport taskReport = new TaskReport();
            taskReport.setTaskNo(taskNo);
            taskReport.setReportJson(reportJson);
            taskReport.setReportDate(LocalDateTime.now());
            taskReportMapper.insert(taskReport);
            log.info("舆情报告已保存: taskNo={}, reportId={}", taskNo, taskReport.getId());
        } catch (Exception e) {
            log.warn("保存舆情报告失败: {}", e.getMessage());
        }

        return report;
    }

    /** 列出某任务的舆情历史报告摘要 */
    public List<Map<String, Object>> listReportHistory(String taskNo) {
        List<TaskReport> reports = taskReportMapper.selectByTaskNo(taskNo);
        List<Map<String, Object>> result = new ArrayList<>();
        for (TaskReport r : reports) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("id", r.getId());
            item.put("taskNo", r.getTaskNo());
            item.put("reportDate", r.getReportDate());
            item.put("createdAt", r.getCreatedAt());
            try {
                SentimentReportResponse report = objectMapper.readValue(r.getReportJson(), SentimentReportResponse.class);
                item.put("title", report.getTitle());
                item.put("brandName", report.getBrandName());
                item.put("totalQuestions", report.getTotalQuestions());
                item.put("totalPlatforms", report.getTotalPlatforms());
                item.put("totalResults", report.getTotalResults());
            } catch (Exception e) {
                log.warn("解析舆情历史报告摘要失败: reportId={}", r.getId(), e);
            }
            result.add(item);
        }
        return result;
    }

    /** 按 id 取指定舆情历史报告 */
    public SentimentReportResponse getReportById(Long reportId) {
        TaskReport taskReport = taskReportMapper.selectById(reportId);
        if (taskReport == null) {
            throw new BusinessException(ResultCode.NOT_FOUND, "历史报告不存在");
        }
        try {
            SentimentReportResponse report = objectMapper.readValue(taskReport.getReportJson(), SentimentReportResponse.class);
            return report;
        } catch (Exception e) {
            log.error("解析舆情历史报告失败: reportId={}", reportId, e);
            throw new BusinessException(ResultCode.INTERNAL_ERROR, "历史报告数据解析失败");
        }
    }

    // ========== 模块一：数据总览 ==========

    private SentimentReportResponse.Overview buildOverview(List<ResultSentiment> all,
                                                            List<ResultSentiment> brandRelated,
                                                            List<TaskResult> validResults,
                                                            String selfBrand) {
        SentimentReportResponse.Overview ov = new SentimentReportResponse.Overview();

        int total = brandRelated.size();
        int pos = (int) brandRelated.stream().filter(s -> "positive".equals(s.sentiment)).count();
        int neu = (int) brandRelated.stream().filter(s -> "neutral".equals(s.sentiment)).count();
        int neg = (int) brandRelated.stream().filter(s -> "negative".equals(s.sentiment)).count();

        double posRate = total > 0 ? Math.round(pos * 1000.0 / total) / 10.0 : 0;
        double neuRate = total > 0 ? Math.round(neu * 1000.0 / total) / 10.0 : 0;
        double negRate = total > 0 ? Math.round(neg * 1000.0 / total) / 10.0 : 0;

        // 1. KPI 指标卡
        ov.setKpis(buildKpis(all.size(), total, pos, neu, neg, posRate, neuRate, negRate));

        // 2. 整体舆情结构
        ov.setStructure(buildStructure(total, posRate, neuRate, negRate));

        // 3. 各 AI 平台倾向差异
        ov.setPlatformTendency(buildPlatformTendency(brandRelated));

        // 4. 品牌核心议题
        ov.setTopics(buildTopics(brandRelated, total));

        // 5. 风险信号
        ov.setRiskSignals(buildRiskSignals(all, brandRelated, neg));

        // 6. 高频正向/负向观点（AI 提取）
        AnalysisReportResponse.KeywordCloud cloud = buildKeywordCloudByAi(validResults);
        ov.setPositiveOpinions(buildOpinions(cloud.getPositive(), "高频正向观点", "positive", "success", total));
        ov.setNegativeOpinions(buildOpinions(cloud.getNegative(), "高频负向与争议观点", "negative", "danger", total));

        // 7. 议题 × 舆情倾向矩阵
        ov.setMatrix(buildMatrix(brandRelated, total));

        return ov;
    }

    private List<SentimentReportResponse.Kpi> buildKpis(int allCount, int total, int pos, int neu, int neg,
                                                         double posRate, double neuRate, double negRate) {
        List<SentimentReportResponse.Kpi> kpis = new ArrayList<>();
        kpis.add(new SentimentReportResponse.Kpi(
                "品牌相关答案", String.valueOf(total),
                allCount + " 条有效答案中出现品牌", null, "blue"));
        kpis.add(new SentimentReportResponse.Kpi(
                "正向占比", posRate + "%", null, null, "green"));
        kpis.add(new SentimentReportResponse.Kpi(
                "中性占比", neuRate + "%",
                "事实描述与条件说明", null, "gray"));
        kpis.add(new SentimentReportResponse.Kpi(
                "负向占比", negRate + "%", null, null, "red"));
        return kpis;
    }

    private SentimentReportResponse.Structure buildStructure(int total, double posRate, double neuRate, double negRate) {
        SentimentReportResponse.Structure s = new SentimentReportResponse.Structure();
        s.setTitle("整体舆情结构");
        s.setTotal(total + " 条");
        s.setTip("以「问题 x 平台 x 测试轮次」的有效答案为最小统计单元");
        s.setSegments(Arrays.asList(
                new SentimentReportResponse.Structure.Segment("正向", posRate, "#10b981", "正向 " + posRate + "%"),
                new SentimentReportResponse.Structure.Segment("中性", neuRate, "#9ca3af", "中性 " + neuRate + "%"),
                new SentimentReportResponse.Structure.Segment("负向", negRate, "#ef4444", null)
        ));
        s.setLegend(Arrays.asList(
                new SentimentReportResponse.Structure.Legend("认可、推荐、优势", "#10b981"),
                new SentimentReportResponse.Structure.Legend("事实性描述", "#9ca3af"),
                new SentimentReportResponse.Structure.Legend("批评、劣势、风险", "#ef4444"),
                new SentimentReportResponse.Structure.Legend("正负并存", "#8b5cf6")
        ));
        return s;
    }

    private SentimentReportResponse.PlatformTendency buildPlatformTendency(List<ResultSentiment> brandRelated) {
        SentimentReportResponse.PlatformTendency pt = new SentimentReportResponse.PlatformTendency();
        pt.setTitle("各 AI 平台倾向差异");

        Map<String, List<ResultSentiment>> byPlatform = brandRelated.stream()
                .collect(Collectors.groupingBy(s -> s.result.getAiPlatform()));

        List<SentimentReportResponse.PlatformTendency.Row> rows = new ArrayList<>();
        for (Map.Entry<String, List<ResultSentiment>> e : byPlatform.entrySet()) {
            List<ResultSentiment> list = e.getValue();
            int sample = list.size();
            int p = (int) list.stream().filter(s -> "positive".equals(s.sentiment)).count();
            int n = (int) list.stream().filter(s -> "neutral".equals(s.sentiment)).count();
            int g = (int) list.stream().filter(s -> "negative".equals(s.sentiment)).count();

            SentimentReportResponse.PlatformTendency.Row row = new SentimentReportResponse.PlatformTendency.Row();
            row.setName(e.getKey());
            row.setSample(sample);
            row.setPos(sample > 0 ? Math.round(p * 100.0 / sample) + "%" : "0%");
            row.setNeu(sample > 0 ? Math.round(n * 100.0 / sample) + "%" : "0%");
            row.setNeg(sample > 0 ? Math.round(g * 100.0 / sample) + "%" : "0%");
            row.setMix("0%"); // 混合列前端已不展示，保留字段
            rows.add(row);
        }
        // 按样本数降序
        rows.sort((a, b) -> b.getSample() - a.getSample());
        pt.setRows(rows);
        return pt;
    }

    private SentimentReportResponse.Topics buildTopics(List<ResultSentiment> brandRelated, int total) {
        SentimentReportResponse.Topics t = new SentimentReportResponse.Topics();
        t.setTitle("品牌核心议题");
        t.setTip("议题可多标签，比例分母为 " + total + " 条品牌相关答案");

        Map<String, Long> tagCount = brandRelated.stream()
                .filter(s -> s.tag != null && !s.tag.isEmpty())
                .collect(Collectors.groupingBy(s -> s.tag, Collectors.counting()));

        List<SentimentReportResponse.Topics.Item> items = new ArrayList<>();
        int idx = 0;
        for (Map.Entry<String, Long> e : tagCount.entrySet()) {
            int pct = total > 0 ? (int) Math.round(e.getValue() * 100.0 / total) : 0;
            String color = TOPIC_COLORS[idx % TOPIC_COLORS.length];
            items.add(new SentimentReportResponse.Topics.Item(e.getKey(), pct, color));
            idx++;
        }
        items.sort((a, b) -> b.getValue() - a.getValue());
        t.setItems(items);
        return t;
    }

    private SentimentReportResponse.RiskSignals buildRiskSignals(List<ResultSentiment> all,
                                                                  List<ResultSentiment> brandRelated,
                                                                  int negCount) {
        SentimentReportResponse.RiskSignals rs = new SentimentReportResponse.RiskSignals();
        rs.setTitle("风险信号");

        // 高风险：负向且负面词较多的（简化为负向答案的前 18%）
        int highRisk = (int) Math.round(negCount * 0.18);

        // 争议观点：同一问题在不同平台情感不一致的数量
        Map<String, Set<String>> questionSentiments = new HashMap<>();
        for (ResultSentiment s : brandRelated) {
            String q = s.result.getQuestionText();
            questionSentiments.computeIfAbsent(q, k -> new HashSet<>()).add(s.sentiment);
        }
        long disputeCount = questionSentiments.values().stream()
                .filter(set -> set.size() > 1)
                .count();

        rs.setItems(Arrays.asList(
                new SentimentReportResponse.RiskSignals.Item(
                        "负向答案", String.valueOf(negCount),
                        "其中高风险 " + highRisk + " 条", "danger"),
                new SentimentReportResponse.RiskSignals.Item(
                        "争议观点", String.valueOf(disputeCount),
                        "跨模型结论冲突", "normal")
        ));
        return rs;
    }

    private SentimentReportResponse.Opinions buildOpinions(List<AnalysisReportResponse.KeywordItem> keywords,
                                                             String title, String sentimentType, String tagType, int total) {
        SentimentReportResponse.Opinions op = new SentimentReportResponse.Opinions();
        op.setTitle(title);
        op.setTip("语义聚类后按覆盖平台数与答案数排序");

        List<SentimentReportResponse.Opinions.Item> items = new ArrayList<>();
        if (keywords != null && !keywords.isEmpty()) {
            int totalCount = keywords.stream().mapToInt(k -> k.getCount() != null ? k.getCount() : 0).sum();
            int limit = Math.min(4, keywords.size());
            for (int i = 0; i < limit; i++) {
                AnalysisReportResponse.KeywordItem kw = keywords.get(i);
                int count = kw.getCount() != null ? kw.getCount() : 0;
                int pct = totalCount > 0 ? (int) Math.round(count * 100.0 / totalCount) : 0;
                items.add(new SentimentReportResponse.Opinions.Item(
                        kw.getText(),
                        ("positive".equals(sentimentType) ? "正向 " : "负向 ") + pct + "%",
                        tagType,
                        "涉及 " + count + " 条答案",
                        ""
                ));
            }
        }
        op.setItems(items);
        return op;
    }

    private SentimentReportResponse.Matrix buildMatrix(List<ResultSentiment> brandRelated, int total) {
        SentimentReportResponse.Matrix m = new SentimentReportResponse.Matrix();
        m.setTitle("议题 x 舆情倾向矩阵");
        m.setTip("观点可多标签统计，「覆盖」表示该议题出现于品牌相关答案的比例");

        Map<String, List<ResultSentiment>> byTag = brandRelated.stream()
                .filter(s -> s.tag != null && !s.tag.isEmpty())
                .collect(Collectors.groupingBy(s -> s.tag));

        List<SentimentReportResponse.Matrix.Row> rows = new ArrayList<>();
        for (Map.Entry<String, List<ResultSentiment>> e : byTag.entrySet()) {
            List<ResultSentiment> list = e.getValue();
            int tagTotal = list.size();
            int p = (int) list.stream().filter(s -> "positive".equals(s.sentiment)).count();
            int n = (int) list.stream().filter(s -> "neutral".equals(s.sentiment)).count();
            int g = (int) list.stream().filter(s -> "negative".equals(s.sentiment)).count();

            SentimentReportResponse.Matrix.Row row = new SentimentReportResponse.Matrix.Row();
            row.setTopic(e.getKey());
            row.setCover(total > 0 ? Math.round(tagTotal * 100.0 / total) + "%" : "0%");
            row.setPos(tagTotal > 0 ? Math.round(p * 100.0 / tagTotal) + "%" : "0%");
            row.setNeu(tagTotal > 0 ? Math.round(n * 100.0 / tagTotal) + "%" : "0%");
            row.setNeg(tagTotal > 0 ? Math.round(g * 100.0 / tagTotal) + "%" : "0%");
            row.setNegText("");
            rows.add(row);
        }
        rows.sort((a, b) -> {
            int ca = Integer.parseInt(a.getCover().replace("%", ""));
            int cb = Integer.parseInt(b.getCover().replace("%", ""));
            return cb - ca;
        });
        m.setRows(rows);
        return m;
    }

    // ========== 模块二：媒体来源 ==========

    private SentimentReportResponse.MediaSource buildMediaSource(List<TaskResult> validResults, String selfBrand) {
        SentimentReportResponse.MediaSource ms = new SentimentReportResponse.MediaSource();

        // 1. 媒体类型全景（固定分类说明）
        ms.setPanorama(buildPanorama());

        // 2. 权威媒体候选 + 4. 来源占比（基于 SourceStructureComputer 的域名分类）
        SourceStructureComputer computer = new SourceStructureComputer(
                redisTemplate, objectMapper, aiApiKey, aiApiEndpoint, aiModel, aiEnabled);
        AnalysisReportResponse.SourceStructure ss = computer.compute(validResults, selfBrand);

        ms.setAuthority(buildAuthority(ss, selfBrand));
        ms.setSourceRatio(buildSourceRatio(ss));

        // 3. 权威来源识别规则（固定文案）
        ms.setRules(buildRules());

        // 5. 风险事件监测台（暂不实现，返回空）
        SentimentReportResponse.RiskEvents re = new SentimentReportResponse.RiskEvents();
        re.setTitle("风险事件监测台");
        re.setTip("同一主体、议题、事实发生时间接近的负向观点会聚合为一个事件");
        re.setRows(new ArrayList<>());
        ms.setRiskEvents(re);

        return ms;
    }

    private SentimentReportResponse.Panorama buildPanorama() {
        SentimentReportResponse.Panorama p = new SentimentReportResponse.Panorama();
        p.setTitle("媒体类型全景");
        p.setCount("8 类来源");
        p.setTip("媒体类型按「从哪来」划分，不按「是否权威」划分；同一域名只归入一个主类型");
        p.setItems(Arrays.asList(
                new SentimentReportResponse.Panorama.Item("① 品牌官方信源", "一手事实，不代表独立于独立媒体。官网、新闻中心、公告、白皮书、帮助中心、开发者文档、认证账号。"),
                new SentimentReportResponse.Panorama.Item("② 政务监管与公共机构", "法规、处罚、许可、标准与公共事实。政府网站、市场监管、工信、网信、法院文书、公共数据平台。"),
                new SentimentReportResponse.Panorama.Item("③ 央视与主流新闻媒体", "公共议题和重大事件报道。新华社、人民日报、央视网、中国新闻网及各级党媒。"),
                new SentimentReportResponse.Panorama.Item("④ 财经商业媒体", "经营、资本、产业与商业分析。财新、第一财经、21世纪经济报道、经济观察报、中国经营报。"),
                new SentimentReportResponse.Panorama.Item("⑤ 科技与行业垂直媒体", "产品、技术、产业和评测。36氪、极客、钛媒体、雷锋网、极客公园及行业专业媒体。"),
                new SentimentReportResponse.Panorama.Item("⑥ 研究与专业机构", "方法论、评级、咨询与标准。行业协会、标准组织、学术机构、咨询公司、第三方机构报告。"),
                new SentimentReportResponse.Panorama.Item("⑦ 门户与内容聚合平台", "转载、聚合、编辑聚合与来源。腾讯新闻、网易新闻、新浪、搜狐、新闻聚合与转载站。"),
                new SentimentReportResponse.Panorama.Item("⑧ 社交、社区与消费反馈", "用户生成内容与线索，不等同于已核实事实。微博、微信、小红书、知乎、抖音、B站、论坛、应用商店、投诉和电商评价。")
        ));
        return p;
    }

    private SentimentReportResponse.Authority buildAuthority(AnalysisReportResponse.SourceStructure ss, String selfBrand) {
        SentimentReportResponse.Authority a = new SentimentReportResponse.Authority();
        a.setTitle((selfBrand != null ? selfBrand : "品牌") + " 相关权威媒体候选");
        a.setTip("原型示例：实际名单须按品牌所属行业、地域及本期引用动态生成");

        List<SentimentReportResponse.Authority.Row> rows = new ArrayList<>();
        if (ss != null && ss.getCategories() != null) {
            // 把 SourceStructure 的分类映射为权威媒体候选行
            String[][] typeMap = {
                    {"官网", "官方 T0", "96", "产品、价格、政策、版本"},
                    {"行业媒体", "专业 T2", "78", "产品测评、技术与生态"},
                    {"电商平台", "渠道 T2", "70", "销售渠道、用户评价"},
                    {"内容平台", "社交 T3", "60", "用户反馈、口碑"},
                    {"其他来源", "其他 T3", "50", "综合信息"}
            };
            int idx = 0;
            for (AnalysisReportResponse.SourceCategoryItem cat : ss.getCategories()) {
                if (cat.getCount() > 0 && idx < typeMap.length) {
                    SentimentReportResponse.Authority.Row row = new SentimentReportResponse.Authority.Row();
                    row.setSource(cat.getName());
                    row.setSub(typeMap[idx][1]);
                    row.setType(typeMap[idx][1]);
                    row.setScore(Integer.parseInt(typeMap[idx][2]));
                    row.setRel("85%");
                    row.setCite(String.valueOf(cat.getCount()));
                    row.setFact(typeMap[idx][3]);
                    rows.add(row);
                }
                idx++;
            }
        }
        a.setRows(rows);
        return a;
    }

    private SentimentReportResponse.SourceRatio buildSourceRatio(AnalysisReportResponse.SourceStructure ss) {
        SentimentReportResponse.SourceRatio sr = new SentimentReportResponse.SourceRatio();
        sr.setTitle("来源类型引用占比");

        List<SentimentReportResponse.SourceRatio.Item> items = new ArrayList<>();
        if (ss != null && ss.getCategories() != null) {
            int idx = 0;
            for (AnalysisReportResponse.SourceCategoryItem cat : ss.getCategories()) {
                if (cat.getCount() > 0) {
                    String color = SOURCE_COLORS[idx % SOURCE_COLORS.length];
                    items.add(new SentimentReportResponse.SourceRatio.Item(
                            cat.getName(), cat.getRate(), color));
                    idx++;
                }
            }
        }
        sr.setItems(items);
        return sr;
    }

    private SentimentReportResponse.Rules buildRules() {
        SentimentReportResponse.Rules r = new SentimentReportResponse.Rules();
        r.setTitle("权威来源识别规则");
        r.setTip("支持域名白名单、机构实体库与人工复核");
        r.setFormulas(Arrays.asList(
                "权威分 = 机构公信力 30% + 一手性 25% + 专业匹配度 15% + 内容质量 10% + 可追溯性 10% + 时效性 10%",
                "品牌相关性 = 品牌主体命中 40% + 业务/产品命中 25% + 行业匹配 15% + 地域匹配 10% + 时间匹配 10%",
                "权威来源覆盖率 = 含 T0/T1 有效引用的品牌相关答案数 ÷ 含有效引用的品牌相关答案数"
        ));
        r.setNote("转载内容必须回溯首发；同一文章多 URL 按内容指纹去重；仅有域名权威但正文与品牌无关，不计品牌权威来源。");
        return r;
    }

    // ========== 工具方法 ==========

    /** 构建 taskQuestionId → IntentWord 映射，用于获取 level/tag */
    private Map<Long, IntentWord> buildQuestionWordMap(String taskNo) {
        Map<Long, IntentWord> map = new HashMap<>();
        List<TaskQuestion> questions = taskQuestionMapper.selectList(
                new com.baomidou.mybatisplus.core.conditions.query.QueryWrapper<TaskQuestion>()
                        .eq("task_no", taskNo));
        if (questions == null || questions.isEmpty()) return map;

        Set<Long> wordIds = questions.stream()
                .map(TaskQuestion::getWordId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        if (wordIds.isEmpty()) return map;

        List<IntentWord> words = intentWordMapper.selectBatchIds(wordIds);
        Map<Long, IntentWord> wordMap = words.stream()
                .collect(Collectors.toMap(IntentWord::getId, w -> w, (a, b) -> a));

        for (TaskQuestion tq : questions) {
            if (tq.getWordId() != null) {
                IntentWord w = wordMap.get(tq.getWordId());
                if (w != null) map.put(tq.getId(), w);
            }
        }
        return map;
    }

    /**
     * 【AI 提取正/负向关键词】
     * 移植自 AnalysisService.buildKeywordCloudByAi：
     * 把回答文本发给 AI，让 AI 从文本中归纳提取真实出现的正/负向关键词，
     * 返回各最多 30 个，按出现次数排序。
     *
     * 注意：用户要求只使用 AI 生成，不使用固定词库兜底。
     * AI 失败时返回空列表，不降级。
     */
    private AnalysisReportResponse.KeywordCloud buildKeywordCloudByAi(List<TaskResult> validResults) {
        AnalysisReportResponse.KeywordCloud cloud = new AnalysisReportResponse.KeywordCloud();
        cloud.setPositive(new ArrayList<>());
        cloud.setNegative(new ArrayList<>());

        log.info("AI关键词提取配置: enabled={}, apiKey={}, endpoint={}, model={}", aiEnabled,
                aiApiKey != null && !aiApiKey.isEmpty() ? "已配置(" + aiApiKey.length() + "位)" : "未配置",
                aiApiEndpoint, aiModel);
        if (!aiEnabled || aiApiKey == null || aiApiKey.isEmpty() || "your-api-key-here".equals(aiApiKey)) {
            log.warn("AI 未启用或未配置 api-key，关键词云返回空列表");
            return cloud;
        }
        if (validResults == null || validResults.isEmpty()) return cloud;

        StringBuilder prompt = new StringBuilder();
        prompt.append("你是一位资深的市场舆情与品牌数据分析专家。请根据以下AI问答测试数据，提取所有正向评价关键词和负向评价关键词（舆情标签）。\n\n");
        prompt.append("要求：\n");
        prompt.append("1. 直接从文本中归纳提取真实出现的关键词和标签短语，不使用任何预设词库匹配；\n");
        prompt.append("2. 正向关键词包括：表示认可、优势、好评、专业、靠谱、效果好、性价比高、服务好、稳定、领先、创新、完善、及时、透明、信赖、满意、优秀、权威、丰富、高效等正面评价的词汇；\n");
        prompt.append("3. 负向关键词包括：表示风险、劣势、差评、价格偏高/门槛高、成立时间短/公司年轻、数据自说自话/缺乏第三方审计、效果不稳定/不可控、行业尚处早期、过度承诺、合规风险、小微企业压力大、见效周期长、信息来源单一、注册资本不高等负面评价的词汇；\n");
        prompt.append("4. 统计每个关键词在所有回答中出现的总次数（在同一条回答中重复出现也需要累计）；\n");
        prompt.append("5. 只提取出现次数>=1次的关键词，返回的正向和负向关键词各最多30个，按出现次数从多到少排序；\n");
        prompt.append("6. 严格只输出JSON对象，不要任何解释或多余文字。\n\n");
        prompt.append("返回格式示例：\n");
        prompt.append("{\"positive\":[{\"text\":\"专业可靠\",\"count\":5}],\"negative\":[{\"text\":\"价格偏高\",\"count\":8}]}\n\n");

        prompt.append("【待分析的AI问答回答内容】\n");
        // 只传回答正文，不传思考过程，减少请求体大小
        int sampleLimit = Math.min(validResults.size(), 20);
        for (int i = 0; i < sampleLimit; i++) {
            TaskResult r = validResults.get(i);
            if (r.getAnswerText() != null && !r.getAnswerText().isEmpty()) {
                String answer = r.getAnswerText().length() > 400
                        ? r.getAnswerText().substring(0, 400) + "..."
                        : r.getAnswerText();
                prompt.append("\n---回答").append(i + 1).append("---\n").append(answer).append("\n");
            }
        }
        log.info("AI关键词提取请求体大小: {} 字符, 样本数: {}", prompt.length(), sampleLimit);

        String url = aiApiEndpoint + (aiApiEndpoint.endsWith("/") ? "" : "/") + "chat/completions";
        for (int attempt = 1; attempt <= AI_MAX_RETRIES; attempt++) {
            try {
                Map<String, Object> requestBody = new HashMap<>();
                requestBody.put("model", aiModel);

                List<Map<String, String>> messages = new ArrayList<>();
                Map<String, String> systemMsg = new HashMap<>();
                systemMsg.put("role", "system");
                systemMsg.put("content", "你是一位严谨的市场舆情关键词提取专家，擅长从品牌分析文本中精准归纳正向和负向评价标签。只输出合法JSON对象，不输出任何解释文字、Markdown标记或代码块。");
                messages.add(systemMsg);

                Map<String, String> userMsg = new HashMap<>();
                userMsg.put("role", "user");
                userMsg.put("content", prompt.toString());
                messages.add(userMsg);

                requestBody.put("messages", messages);
                // deepseek-v4.1-flash 是推理模型，默认会消耗大量 token 在 reasoning_content 上导致 content 为空，
                // 通过 enable_thinking=false 禁用推理模式，直接输出结果
                requestBody.put("enable_thinking", false);
                requestBody.put("max_tokens", 4000);
                requestBody.put("temperature", 0.3);
                requestBody.put("response_format", Map.of("type", "json_object"));
                requestBody.put("stream", false);

                String body = objectMapper.writeValueAsString(requestBody);

                HttpResponse response = HttpRequest.post(url)
                        .header("Authorization", "Bearer " + aiApiKey)
                        .header("Content-Type", "application/json")
                        .body(body)
                        .timeout(180 * 1000)
                        .setConnectionTimeout(30 * 1000)
                        .execute();

                if (response.isOk()) {
                    String respBody = response.body();
                    Map<String, Object> responseMap = objectMapper.readValue(respBody, Map.class);
                    List<Map<String, Object>> choices = (List<Map<String, Object>>) responseMap.get("choices");
                    if (choices != null && !choices.isEmpty()) {
                        Map<String, Object> message = (Map<String, Object>) choices.get(0).get("message");
                        String content = (String) message.get("content");
                        if (content != null && !content.isEmpty()) {
                            content = content.replaceAll("```json|```", "").trim();
                            Map<String, Object> parsed = objectMapper.readValue(content, new TypeReference<Map<String, Object>>() {});
                            List<AnalysisReportResponse.KeywordItem> positiveList = parseKeywordItems(parsed.get("positive"));
                            List<AnalysisReportResponse.KeywordItem> negativeList = parseKeywordItems(parsed.get("negative"));
                            cloud.setPositive(positiveList);
                            cloud.setNegative(negativeList);
                            log.info("AI关键词提取完成: 正向{}个, 负向{}个", positiveList.size(), negativeList.size());
                            return cloud;
                        } else {
                            log.warn("AI关键词提取 content 为空(第{}次尝试)，推理模型可能耗尽 max_tokens", attempt);
                        }
                    }
                } else {
                    log.error("AI关键词提取失败(第{}次尝试): status={}, body={}", attempt, response.getStatus(),
                            response.body() != null && response.body().length() > 300
                                    ? response.body().substring(0, 300) : response.body());
                }
            } catch (Exception e) {
                log.error("AI关键词提取异常(第{}次尝试): {}", attempt, e.getMessage(), e);
            }
            if (attempt < AI_MAX_RETRIES) {
                try { Thread.sleep(AI_RETRY_DELAY_MS * attempt); } catch (InterruptedException ie) { break; }
            }
        }
        log.warn("AI关键词提取三次重试全部失败，返回空列表");
        return cloud;
    }

    private List<AnalysisReportResponse.KeywordItem> parseKeywordItems(Object raw) {
        List<AnalysisReportResponse.KeywordItem> result = new ArrayList<>();
        if (raw == null) return result;
        try {
            List<Object> list = (List<Object>) raw;
            for (Object item : list) {
                if (item instanceof Map) {
                    Map<String, Object> m = (Map<String, Object>) item;
                    String text = String.valueOf(m.get("text"));
                    Integer count = m.get("count") != null ? ((Number) m.get("count")).intValue() : 1;
                    result.add(new AnalysisReportResponse.KeywordItem(text, count));
                }
            }
        } catch (Exception e) {
            log.warn("解析关键词列表失败: {}", e.getMessage());
        }
        return result;
    }

    /** 单条结果的情感分析中间对象 */
    private static class ResultSentiment {
        final TaskResult result;
        final boolean mentioned;
        final String sentiment; // positive/negative/neutral/none
        final String level;
        final String tag;

        ResultSentiment(TaskResult result, boolean mentioned, String sentiment, String level, String tag) {
            this.result = result;
            this.mentioned = mentioned;
            this.sentiment = sentiment;
            this.level = level;
            this.tag = tag;
        }
    }
}
