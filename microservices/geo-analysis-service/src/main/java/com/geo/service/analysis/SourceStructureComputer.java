package com.geo.service.analysis;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.geo.dto.AnalysisReportResponse.SourceCategoryItem;
import com.geo.dto.AnalysisReportResponse.SourceStructure;
import com.geo.entity.TaskResult;
import cn.hutool.http.HttpRequest;
import cn.hutool.http.HttpResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.RedisTemplate;

import java.net.URI;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * 品牌信息来源结构计算器
 * <p>
 * 流程：提取所有引用 URL → 主域名归并 → 规则表分类（电商/内容）→ Redis 缓存 → AI 批量分类
 * → 回填计数 → 算占比 → 返回 SourceStructure（5 类）
 */
public class SourceStructureComputer {

    private static final Logger log = LoggerFactory.getLogger(SourceStructureComputer.class);

    /** 5 类分类名（固定顺序，前端直接渲染） */
    public static final List<String> CATEGORIES = Arrays.asList("官网", "行业媒体", "电商平台", "内容平台", "其他来源");

    /** 规则表：电商平台的主域名后缀/子域名关键词（后缀命中即电商） */
    private static final Set<String> ECOMMERCE_RULES = new HashSet<>(Arrays.asList(
            "taobao.com", "tmall.com", "jd.com", "pinduoduo.com", "amazon.cn",
            "dangdang.com", "suning.com", "gome.com.cn", "vip.com", "vancl.com",
            "meituan.com", "dianping.com", "ele.me", "eleme.cn", "koubei.com",
            "携程.com", "ctrip.com", "qunar.com", "mafengwo.cn", "tuniu.com",
            "douban.com/group", "book.douban.com", "xunmeng.com", "union.360buy.com"
    ));

    /** 规则表：内容平台（后缀命中即内容） */
    private static final Set<String> CONTENT_RULES = new HashSet<>(Arrays.asList(
            "zhihu.com", "weibo.com", "weibo.cn", "douyin.com", "iesdouyin.com",
            "bilibili.com", "mp.weixin.qq.com", "weixin.qq.com", "public.weixin.qq.com",
            "baijiahao.baidu.com", "toutiao.com", "headline.com", "xingtu.baidu.com",
            "news.qq.com", "m.qq.com", "guonei.8684.cn",
            "xiaohongshu.com", "xiaohongshu.cn",
            "sohu.com/a/", "zhuanlan.zhihu.com", "zhihu.com/question", "zhihu.com/answer",
            "haokan.baidu.com", "video.baidu.com", "iqiyi.com", "youku.com", "mgtv.com",
            "tieba.baidu.com", "baike.baidu.com"
    ));

    /** Redis 缓存 key 前缀 */
    private static final String CACHE_KEY = "domain_cat:";
    /** 缓存过期时间（秒）：30 天 */
    private static final long CACHE_TTL_SECONDS = 30L * 24 * 3600;

    /** URL 提取正则（兜底：sourceInfo 不是 JSON 时从 answerText 里抽） */
    private static final Pattern URL_PATTERN = Pattern.compile("https?://[a-zA-Z0-9._\\-/?#%=&]+");

    private final RedisTemplate<String, String> redis;
    private final ObjectMapper om;
    private final String aiApiKey;
    private final String aiApiEndpoint;
    private final String aiModel;
    private final boolean aiEnabled;

    public SourceStructureComputer(RedisTemplate<String, String> redis, ObjectMapper om,
                                   String aiApiKey, String aiApiEndpoint, String aiModel, boolean aiEnabled) {
        this.redis = redis;
        this.om = om;
        this.aiApiKey = aiApiKey;
        this.aiApiEndpoint = aiApiEndpoint;
        this.aiModel = aiModel;
        this.aiEnabled = aiEnabled;
    }

    // ========== 主入口 ==========

    public SourceStructure compute(List<TaskResult> validResults, String selfBrand) {
        if (validResults == null || validResults.isEmpty()) return buildEmpty();
        String brand = selfBrand != null ? selfBrand : "";

        // Step 1: 提取所有引用 URL
        List<String> allUrls = extractAllUrls(validResults);
        if (allUrls.isEmpty()) return buildEmpty();

        // Step 2: 主域名提取 + 归并 → 去重
        Map<String, String> domainMap = new LinkedHashMap<>(); // 主域名 → 显示用域名
        for (String url : allUrls) {
            String mainDomain = extractMainDomain(url);
            if (mainDomain != null && !mainDomain.isEmpty()) {
                domainMap.putIfAbsent(mainDomain, extractMainDomain(url));
            }
        }
        if (domainMap.isEmpty()) return buildEmpty();

        log.info("来源结构: 总引用={}, 去重主域名={} 种, brand={}", allUrls.size(), domainMap.size(), brand);

        // Step 3+4: 规则表 + Redis 缓存 → 得到已知分类
        Map<String, String> domainToCategory = new HashMap<>();
        for (Map.Entry<String, String> e : domainMap.entrySet()) {
            String domain = e.getKey();
            String cat = ruleTableClassify(domain, brand);
            if (cat == null) {
                cat = getFromCache(brand, domain);
            }
            if (cat != null) {
                domainToCategory.put(domain, cat);
            }
        }

        // Step 5: AI 批量分类（只剩缓存未命中的）
        List<String> pendingDomains = new ArrayList<>();
        for (String d : domainMap.keySet()) {
            if (!domainToCategory.containsKey(d)) pendingDomains.add(d);
        }
        if (!pendingDomains.isEmpty()) {
            Map<String, String> aiResult = aiBatchClassify(pendingDomains, domainMap, brand);
            domainToCategory.putAll(aiResult);
            // 写缓存
            for (Map.Entry<String, String> e : aiResult.entrySet()) {
                putCache(brand, e.getKey(), e.getValue());
            }
        }

        // 兜底：还没分类的全部归为"其他来源"
        for (String d : domainMap.keySet()) {
            domainToCategory.putIfAbsent(d, "其他来源");
        }

        // Step 6: 回填 + 汇总计数
        Map<String, Integer> categoryCounts = new LinkedHashMap<>();
        for (String c : CATEGORIES) categoryCounts.put(c, 0);
        for (String url : allUrls) {
            String mainDomain = extractMainDomain(url);
            if (mainDomain == null) continue;
            String cat = domainToCategory.getOrDefault(mainDomain, "其他来源");
            categoryCounts.merge(cat, 1, Integer::sum);
        }

        // Step 7: 算占比 + 组装 DTO
        SourceStructure ss = new SourceStructure();
        ss.setTotalCount(allUrls.size());
        List<SourceCategoryItem> cats = new ArrayList<>();
        for (String c : CATEGORIES) {
            int cnt = categoryCounts.getOrDefault(c, 0);
            double rate = allUrls.size() > 0 ? Math.round(cnt * 1000.0 / allUrls.size()) / 10.0 : 0;
            cats.add(new SourceCategoryItem(c, cnt, rate));
        }
        ss.setCategories(cats);
        log.info("来源结构: total={}, 各分类={}", allUrls.size(), categoryCounts);
        return ss;
    }

    // ========== Step 1: 提取所有引用 URL ==========

    private List<String> extractAllUrls(List<TaskResult> results) {
        List<String> urls = new ArrayList<>();
        for (TaskResult r : results) {
            String sourceInfo = r.getSourceInfo();
            if (sourceInfo != null && !sourceInfo.isEmpty()) {
                try {
                    // 兼容两种格式：
                    // 1. [{"title":"...", "url":"..."}, ...]  对象数组
                    // 2. [["标题", "URL"], ...]  二维数组（worker 实际存储格式）
                    List<Object> refs = om.readValue(sourceInfo, new TypeReference<List<Object>>() {});
                    for (Object ref : refs) {
                        String u = null;
                        if (ref instanceof Map) {
                            // 对象数组格式
                            u = (String) ((Map<?, ?>) ref).get("url");
                        } else if (ref instanceof List) {
                            // 二维数组格式：["标题", "URL"]，URL 在第二个位置
                            List<?> arr = (List<?>) ref;
                            if (arr.size() >= 2) u = String.valueOf(arr.get(1));
                        }
                        if (u != null && !u.isEmpty()) urls.add(u);
                    }
                } catch (Exception ex) {
                    log.debug("sourceInfo JSON 解析失败, 正则兜底: resultId={}", r.getId());
                }
            }
            // 兜底：从 answerText 里正则抽 URL
            String ans = r.getAnswerText();
            if (ans != null) {
                Matcher m = URL_PATTERN.matcher(ans);
                while (m.find()) urls.add(m.group());
            }
        }
        return urls;
    }

    // ========== Step 2: 主域名提取 + 归并 ==========

    /** 从完整 URL 提取主域名，归并子域名到同一主域名
     *  k.sina.cn / tech.sina.com.cn → sina.cn（简化处理：取最后 1-2 段） */
    public static String extractMainDomain(String url) {
        if (url == null || url.isEmpty()) return null;
        try {
            URI uri = new URI(url.trim());
            String host = uri.getHost();
            if (host == null || host.isEmpty()) return null;
            host = host.toLowerCase();
            // 去掉 www. 前缀
            if (host.startsWith("www.")) host = host.substring(4);
            return host;
        } catch (Exception ex) {
            // 不是合法 URL，跳过
            return null;
        }
    }

    // ========== Step 3: 规则表分类 ==========

    /** 硬编码规则表：与任务无关，纯域名后缀特征。返回 null 表示规则没命中 */
    private String ruleTableClassify(String mainDomain, String selfBrand) {
        // ========== 品牌自己的官网 ==========
        if (selfBrand != null && !selfBrand.isEmpty()) {
            // 1. 提取品牌名中的纯英文字母作为 key（支持英文品牌名如 vivo、英文品牌字段如 HUAWEI）
            String asciiKey = selfBrand.replaceAll("[^a-zA-Z]", "").toLowerCase();
            if (asciiKey.length() >= 3 && mainDomain.contains(asciiKey)) {
                return "官网";
            }
            // 2. 尝试全小写品牌名直接 contains（品牌名本身就是英文的场景）
            String brandLower = selfBrand.toLowerCase().trim();
            if (brandLower.length() >= 3 && mainDomain.contains(brandLower)) {
                return "官网";
            }
        }

        // 电商平台
        for (String rule : ECOMMERCE_RULES) {
            if (mainDomain.equals(rule) || mainDomain.endsWith("." + rule) || mainDomain.contains(rule)) {
                return "电商平台";
            }
        }

        // 内容平台
        for (String rule : CONTENT_RULES) {
            if (mainDomain.equals(rule) || mainDomain.endsWith("." + rule) || mainDomain.contains(rule)) {
                return "内容平台";
            }
        }

        return null; // 规则没命中 → 待定
    }

    // ========== Step 4: Redis 缓存 ==========

    private String getFromCache(String brand, String domain) {
        try {
            return redis.opsForValue().get(CACHE_KEY + brand + ":" + domain);
        } catch (Exception ex) {
            return null;
        }
    }

    private void putCache(String brand, String domain, String category) {
        try {
            redis.opsForValue().set(CACHE_KEY + brand + ":" + domain, category, CACHE_TTL_SECONDS, java.util.concurrent.TimeUnit.SECONDS);
        } catch (Exception ex) {
            log.debug("Redis 写缓存失败: {}", ex.getMessage());
        }
    }

    // ========== Step 5: AI 批量分类 ==========

    private Map<String, String> aiBatchClassify(List<String> pendingDomains,
                                                 Map<String, String> domainMap,
                                                 String selfBrand) {
        Map<String, String> result = new HashMap<>();
        if (!aiEnabled || aiApiKey == null || aiApiKey.isEmpty() || "your-api-key-here".equals(aiApiKey)) {
            log.warn("AI 未启用，{} 个域名归为其他来源", pendingDomains.size());
            for (String d : pendingDomains) result.put(d, "其他来源");
            return result;
        }
        if (pendingDomains.isEmpty()) return result;

        String url = aiApiEndpoint + (aiApiEndpoint.endsWith("/") ? "" : "/") + "chat/completions";

        // 构造 prompt
        StringBuilder sb = new StringBuilder();
        sb.append("你是一个网站域名分类器。\n\n");
        sb.append("任务品牌/对象：").append(selfBrand).append("\n\n");
        sb.append("请把以下域名分到 5 类之一：\n");
        sb.append("1. 官网：任务品牌的官方网站、官方研究机构、品牌自己的子域名（注意：只识别任务品牌自己的官网，竞品官网归到行业媒体）\n");
        sb.append("   识别技巧：品牌名的英文形式/拼音出现在域名主体里就是官网。例如品牌「华为」→ huawei.com、consumer.huawei.com、developer.huawei.com 都是官网；品牌「小米」→ xiaomi.com、mi.com 都是官网；品牌「苹果」→ apple.com、support.apple.com 都是官网。\n");
        sb.append("2. 行业媒体：新闻媒体、政府监管机构、行业协会、学术网站\n");
        sb.append("3. 电商平台：购物、交易、服务平台\n");
        sb.append("4. 内容平台：资讯、问答、社交、视频、论坛、自媒体\n");
        sb.append("5. 其他来源：以上都不符合\n\n");
        sb.append("域名列表（JSON 数组）：\n[");
        boolean first = true;
        for (String d : pendingDomains) {
            if (!first) sb.append(",");
            sb.append("\n  {\"domain\":\"").append(d).append("\",\"title\":\"\"}");
            first = false;
        }
        sb.append("\n]\n\n");
        sb.append("请返回严格的 JSON 格式：[{\"domain\":\"xxx\",\"category\":\"5类之一\"}]，不要加任何其他文字。");

        try {
            Map<String, Object> body = new LinkedHashMap<>();
            body.put("model", aiModel);
            List<Map<String, String>> messages = new ArrayList<>();
            Map<String, String> sys = new LinkedHashMap<>();
            sys.put("role", "system");
            sys.put("content", "你是网站域名分类器，只返回 JSON。");
            messages.add(sys);
            Map<String, String> user = new LinkedHashMap<>();
            user.put("role", "user");
            user.put("content", sb.toString());
            messages.add(user);
            body.put("messages", messages);
            body.put("temperature", 0);
            body.put("response_format", Map.of("type", "json_object"));
            // deepseek 推理模型需禁用推理，否则 content 为空
            body.put("enable_thinking", false);
            body.put("stream", false);

            String jsonBody = om.writeValueAsString(body);
            HttpResponse resp = HttpRequest.post(url)
                    .header("Authorization", "Bearer " + aiApiKey)
                    .header("Content-Type", "application/json")
                    .body(jsonBody)
                    .timeout(120000)
                    .setConnectionTimeout(30000)
                    .execute();

            if (!resp.isOk()) {
                log.warn("AI 域名分类 HTTP {}: {}", resp.getStatus(), resp.body().substring(0, Math.min(200, resp.body().length())));
                for (String d : pendingDomains) result.put(d, "其他来源");
                return result;
            }

            // 解析 AI 响应
            String respBody = resp.body();
            // 提取 choices[0].message.content
            Map<String, Object> respMap = om.readValue(respBody, new TypeReference<Map<String, Object>>() {});
            List<Map<String, Object>> choices = (List<Map<String, Object>>) respMap.get("choices");
            if (choices == null || choices.isEmpty()) {
                for (String d : pendingDomains) result.put(d, "其他来源");
                return result;
            }
            Map<String, Object> msg = (Map<String, Object>) choices.get(0).get("message");
            String content = (String) msg.get("content");
            if (content == null) {
                for (String d : pendingDomains) result.put(d, "其他来源");
                return result;
            }

            // 解析 AI 返回的 JSON
            List<Map<String, String>> classified = om.readValue(content, new TypeReference<List<Map<String, String>>>() {});
            for (Map<String, String> item : classified) {
                String domain = item.get("domain");
                String category = item.get("category");
                if (domain != null && category != null && CATEGORIES.contains(category)) {
                    result.put(domain, category);
                }
            }
            log.info("AI 域名分类完成: 请求{}个, AI返回{}个", pendingDomains.size(), result.size());
            // 打印分类明细，方便排查
            for (Map.Entry<String, String> e : result.entrySet()) {
                log.debug("  AI分类: {} → {}", e.getKey(), e.getValue());
            }
            // 未被 AI 覆盖的域名
            List<String> uncovered = new ArrayList<>();
            for (String d : pendingDomains) {
                if (!result.containsKey(d)) uncovered.add(d);
            }
            if (!uncovered.isEmpty()) {
                log.warn("AI 未覆盖的域名（将归为其他来源）: {}", uncovered);
            }

        } catch (Exception ex) {
            log.warn("AI 域名分类异常: {}", ex.getMessage());
            for (String d : pendingDomains) result.put(d, "其他来源");
        }

        // 兜底：AI 没返回的归其他来源
        for (String d : pendingDomains) result.putIfAbsent(d, "其他来源");
        return result;
    }

    // ========== 空结果 ==========

    private SourceStructure buildEmpty() {
        SourceStructure ss = new SourceStructure();
        ss.setTotalCount(0);
        List<SourceCategoryItem> cats = new ArrayList<>();
        for (String c : CATEGORIES) cats.add(new SourceCategoryItem(c, 0, 0.0));
        ss.setCategories(cats);
        return ss;
    }
}
