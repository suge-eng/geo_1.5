package com.geo.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.List;

/**
 * 【舆情数据报告响应 DTO】
 *
 * 设计思路：
 * 1. 舆情类型任务（monitorTarget=sentiment）的数据报告，包含「数据总览 / 媒体来源」两个模块；
 *    与声量报告 AnalysisReportResponse 区分开，互不干扰。
 * 2. 字段结构与前端 src/types/sentimentReport.ts 中的 SentimentReportResponse 完全对齐，
 *    前端拿到响应后可直接渲染，无需额外转换。
 * 3. 所有嵌套对象均为静态内部类，便于 Jackson 序列化与前端类型推导。
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public class SentimentReportResponse {

    private String taskNo;
    private String title;
    private String brandName;
    private String reportDate;
    private Integer totalQuestions;
    private Integer totalPlatforms;
    private Integer totalResults;
    /** 数据总览模块 */
    private Overview overview;
    /** 媒体来源模块 */
    private MediaSource mediaSource;

    // ========== 模块一：数据总览 ==========

    public static class Overview {
        private List<Kpi> kpis;
        private Structure structure;
        private PlatformTendency platformTendency;
        private Topics topics;
        private RiskSignals riskSignals;
        private Opinions positiveOpinions;
        private Opinions negativeOpinions;
        private Matrix matrix;

        public List<Kpi> getKpis() { return kpis; }
        public void setKpis(List<Kpi> kpis) { this.kpis = kpis; }
        public Structure getStructure() { return structure; }
        public void setStructure(Structure structure) { this.structure = structure; }
        public PlatformTendency getPlatformTendency() { return platformTendency; }
        public void setPlatformTendency(PlatformTendency platformTendency) { this.platformTendency = platformTendency; }
        public Topics getTopics() { return topics; }
        public void setTopics(Topics topics) { this.topics = topics; }
        public RiskSignals getRiskSignals() { return riskSignals; }
        public void setRiskSignals(RiskSignals riskSignals) { this.riskSignals = riskSignals; }
        public Opinions getPositiveOpinions() { return positiveOpinions; }
        public void setPositiveOpinions(Opinions positiveOpinions) { this.positiveOpinions = positiveOpinions; }
        public Opinions getNegativeOpinions() { return negativeOpinions; }
        public void setNegativeOpinions(Opinions negativeOpinions) { this.negativeOpinions = negativeOpinions; }
        public Matrix getMatrix() { return matrix; }
        public void setMatrix(Matrix matrix) { this.matrix = matrix; }
    }

    /** 顶部指标卡 */
    public static class Kpi {
        private String label;
        private String value;
        private String sub;
        private Trend trend;
        private String accent; // blue/green/gray/red

        public static class Trend {
            private String text;
            private String dir; // up/down
            public Trend() {}
            public Trend(String text, String dir) { this.text = text; this.dir = dir; }
            public String getText() { return text; }
            public void setText(String text) { this.text = text; }
            public String getDir() { return dir; }
            public void setDir(String dir) { this.dir = dir; }
        }

        public Kpi() {}
        public Kpi(String label, String value, String sub, Trend trend, String accent) {
            this.label = label; this.value = value; this.sub = sub; this.trend = trend; this.accent = accent;
        }
        public String getLabel() { return label; }
        public void setLabel(String label) { this.label = label; }
        public String getValue() { return value; }
        public void setValue(String value) { this.value = value; }
        public String getSub() { return sub; }
        public void setSub(String sub) { this.sub = sub; }
        public Trend getTrend() { return trend; }
        public void setTrend(Trend trend) { this.trend = trend; }
        public String getAccent() { return accent; }
        public void setAccent(String accent) { this.accent = accent; }
    }

    /** 整体舆情结构 */
    public static class Structure {
        private String title;
        private String total;
        private String tip;
        private List<Segment> segments;
        private List<Legend> legend;

        public static class Segment {
            private String name;
            private double value;
            private String color;
            private String label;
            public Segment() {}
            public Segment(String name, double value, String color, String label) {
                this.name = name; this.value = value; this.color = color; this.label = label;
            }
            public String getName() { return name; }
            public void setName(String name) { this.name = name; }
            public double getValue() { return value; }
            public void setValue(double value) { this.value = value; }
            public String getColor() { return color; }
            public void setColor(String color) { this.color = color; }
            public String getLabel() { return label; }
            public void setLabel(String label) { this.label = label; }
        }

        public static class Legend {
            private String text;
            private String color;
            public Legend() {}
            public Legend(String text, String color) { this.text = text; this.color = color; }
            public String getText() { return text; }
            public void setText(String text) { this.text = text; }
            public String getColor() { return color; }
            public void setColor(String color) { this.color = color; }
        }

        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }
        public String getTotal() { return total; }
        public void setTotal(String total) { this.total = total; }
        public String getTip() { return tip; }
        public void setTip(String tip) { this.tip = tip; }
        public List<Segment> getSegments() { return segments; }
        public void setSegments(List<Segment> segments) { this.segments = segments; }
        public List<Legend> getLegend() { return legend; }
        public void setLegend(List<Legend> legend) { this.legend = legend; }
    }

    /** 各 AI 平台倾向差异 */
    public static class PlatformTendency {
        private String title;
        private List<Row> rows;

        public static class Row {
            private String name;
            private int sample;
            private String pos;
            private String neu;
            private String neg;
            private String mix; // 保留字段，前端已不再展示
            private Boolean highlight;

            public Row() {}
            public String getName() { return name; }
            public void setName(String name) { this.name = name; }
            public int getSample() { return sample; }
            public void setSample(int sample) { this.sample = sample; }
            public String getPos() { return pos; }
            public void setPos(String pos) { this.pos = pos; }
            public String getNeu() { return neu; }
            public void setNeu(String neu) { this.neu = neu; }
            public String getNeg() { return neg; }
            public void setNeg(String neg) { this.neg = neg; }
            public String getMix() { return mix; }
            public void setMix(String mix) { this.mix = mix; }
            public Boolean getHighlight() { return highlight; }
            public void setHighlight(Boolean highlight) { this.highlight = highlight; }
        }

        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }
        public List<Row> getRows() { return rows; }
        public void setRows(List<Row> rows) { this.rows = rows; }
    }

    /** 品牌核心议题 */
    public static class Topics {
        private String title;
        private String tip;
        private List<Item> items;

        public static class Item {
            private String name;
            private int value;
            private String color;
            public Item() {}
            public Item(String name, int value, String color) { this.name = name; this.value = value; this.color = color; }
            public String getName() { return name; }
            public void setName(String name) { this.name = name; }
            public int getValue() { return value; }
            public void setValue(int value) { this.value = value; }
            public String getColor() { return color; }
            public void setColor(String color) { this.color = color; }
        }

        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }
        public String getTip() { return tip; }
        public void setTip(String tip) { this.tip = tip; }
        public List<Item> getItems() { return items; }
        public void setItems(List<Item> items) { this.items = items; }
    }

    /** 风险信号 */
    public static class RiskSignals {
        private String title;
        private List<Item> items;

        public static class Item {
            private String title;
            private String value;
            private String sub;
            private String accent; // danger/normal
            public Item() {}
            public Item(String title, String value, String sub, String accent) {
                this.title = title; this.value = value; this.sub = sub; this.accent = accent;
            }
            public String getTitle() { return title; }
            public void setTitle(String title) { this.title = title; }
            public String getValue() { return value; }
            public void setValue(String value) { this.value = value; }
            public String getSub() { return sub; }
            public void setSub(String sub) { this.sub = sub; }
            public String getAccent() { return accent; }
            public void setAccent(String accent) { this.accent = accent; }
        }

        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }
        public List<Item> getItems() { return items; }
        public void setItems(List<Item> items) { this.items = items; }
    }

    /** 高频观点（正向/负向共用） */
    public static class Opinions {
        private String title;
        private String tip;
        private List<Item> items;

        public static class Item {
            private String title;
            private String tag;
            private String tagType; // success/danger/gray
            private String desc;
            private String sub;
            public Item() {}
            public Item(String title, String tag, String tagType, String desc, String sub) {
                this.title = title; this.tag = tag; this.tagType = tagType; this.desc = desc; this.sub = sub;
            }
            public String getTitle() { return title; }
            public void setTitle(String title) { this.title = title; }
            public String getTag() { return tag; }
            public void setTag(String tag) { this.tag = tag; }
            public String getTagType() { return tagType; }
            public void setTagType(String tagType) { this.tagType = tagType; }
            public String getDesc() { return desc; }
            public void setDesc(String desc) { this.desc = desc; }
            public String getSub() { return sub; }
            public void setSub(String sub) { this.sub = sub; }
        }

        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }
        public String getTip() { return tip; }
        public void setTip(String tip) { this.tip = tip; }
        public List<Item> getItems() { return items; }
        public void setItems(List<Item> items) { this.items = items; }
    }

    /** 议题 × 舆情倾向矩阵 */
    public static class Matrix {
        private String title;
        private String tip;
        private List<Row> rows;

        public static class Row {
            private String topic;
            private String cover;
            private String pos;
            private String neu;
            private String neg;
            private String negText;
            public Row() {}
            public String getTopic() { return topic; }
            public void setTopic(String topic) { this.topic = topic; }
            public String getCover() { return cover; }
            public void setCover(String cover) { this.cover = cover; }
            public String getPos() { return pos; }
            public void setPos(String pos) { this.pos = pos; }
            public String getNeu() { return neu; }
            public void setNeu(String neu) { this.neu = neu; }
            public String getNeg() { return neg; }
            public void setNeg(String neg) { this.neg = neg; }
            public String getNegText() { return negText; }
            public void setNegText(String negText) { this.negText = negText; }
        }

        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }
        public String getTip() { return tip; }
        public void setTip(String tip) { this.tip = tip; }
        public List<Row> getRows() { return rows; }
        public void setRows(List<Row> rows) { this.rows = rows; }
    }

    // ========== 模块二：媒体来源 ==========

    public static class MediaSource {
        private Panorama panorama;
        private Authority authority;
        private Rules rules;
        private SourceRatio sourceRatio;
        /** 风险事件监测台：暂不实现，返回空列表 */
        private RiskEvents riskEvents;

        public Panorama getPanorama() { return panorama; }
        public void setPanorama(Panorama panorama) { this.panorama = panorama; }
        public Authority getAuthority() { return authority; }
        public void setAuthority(Authority authority) { this.authority = authority; }
        public Rules getRules() { return rules; }
        public void setRules(Rules rules) { this.rules = rules; }
        public SourceRatio getSourceRatio() { return sourceRatio; }
        public void setSourceRatio(SourceRatio sourceRatio) { this.sourceRatio = sourceRatio; }
        public RiskEvents getRiskEvents() { return riskEvents; }
        public void setRiskEvents(RiskEvents riskEvents) { this.riskEvents = riskEvents; }
    }

    /** 媒体类型全景（固定分类说明） */
    public static class Panorama {
        private String title;
        private String count;
        private String tip;
        private List<Item> items;

        public static class Item {
            private String title;
            private String desc;
            public Item() {}
            public Item(String title, String desc) { this.title = title; this.desc = desc; }
            public String getTitle() { return title; }
            public void setTitle(String title) { this.title = title; }
            public String getDesc() { return desc; }
            public void setDesc(String desc) { this.desc = desc; }
        }

        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }
        public String getCount() { return count; }
        public void setCount(String count) { this.count = count; }
        public String getTip() { return tip; }
        public void setTip(String tip) { this.tip = tip; }
        public List<Item> getItems() { return items; }
        public void setItems(List<Item> items) { this.items = items; }
    }

    /** 权威媒体候选 */
    public static class Authority {
        private String title;
        private String tip;
        private List<Row> rows;

        public static class Row {
            private String source;
            private String sub;
            private String type;
            private int score;
            private String rel;
            private String cite;
            private String fact;
            public Row() {}
            public String getSource() { return source; }
            public void setSource(String source) { this.source = source; }
            public String getSub() { return sub; }
            public void setSub(String sub) { this.sub = sub; }
            public String getType() { return type; }
            public void setType(String type) { this.type = type; }
            public int getScore() { return score; }
            public void setScore(int score) { this.score = score; }
            public String getRel() { return rel; }
            public void setRel(String rel) { this.rel = rel; }
            public String getCite() { return cite; }
            public void setCite(String cite) { this.cite = cite; }
            public String getFact() { return fact; }
            public void setFact(String fact) { this.fact = fact; }
        }

        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }
        public String getTip() { return tip; }
        public void setTip(String tip) { this.tip = tip; }
        public List<Row> getRows() { return rows; }
        public void setRows(List<Row> rows) { this.rows = rows; }
    }

    /** 权威来源识别规则（固定文案） */
    public static class Rules {
        private String title;
        private String tip;
        private List<String> formulas;
        private String note;

        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }
        public String getTip() { return tip; }
        public void setTip(String tip) { this.tip = tip; }
        public List<String> getFormulas() { return formulas; }
        public void setFormulas(List<String> formulas) { this.formulas = formulas; }
        public String getNote() { return note; }
        public void setNote(String note) { this.note = note; }
    }

    /** 来源类型引用占比 */
    public static class SourceRatio {
        private String title;
        private List<Item> items;

        public static class Item {
            private String name;
            private double value;
            private String color;
            public Item() {}
            public Item(String name, double value, String color) { this.name = name; this.value = value; this.color = color; }
            public String getName() { return name; }
            public void setName(String name) { this.name = name; }
            public double getValue() { return value; }
            public void setValue(double value) { this.value = value; }
            public String getColor() { return color; }
            public void setColor(String color) { this.color = color; }
        }

        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }
        public List<Item> getItems() { return items; }
        public void setItems(List<Item> items) { this.items = items; }
    }

    /** 风险事件监测台（暂不实现） */
    public static class RiskEvents {
        private String title;
        private String tip;
        private List<Row> rows;

        public static class Row {
            private String event;
            private String level;
            private String levelType;
            private String platform;
            private String source;
            private String mainSource;
            private String status;
            private String statusType;
            private String suggestion;
            public Row() {}
            public String getEvent() { return event; }
            public void setEvent(String event) { this.event = event; }
            public String getLevel() { return level; }
            public void setLevel(String level) { this.level = level; }
            public String getLevelType() { return levelType; }
            public void setLevelType(String levelType) { this.levelType = levelType; }
            public String getPlatform() { return platform; }
            public void setPlatform(String platform) { this.platform = platform; }
            public String getSource() { return source; }
            public void setSource(String source) { this.source = source; }
            public String getMainSource() { return mainSource; }
            public void setMainSource(String mainSource) { this.mainSource = mainSource; }
            public String getStatus() { return status; }
            public void setStatus(String status) { this.status = status; }
            public String getStatusType() { return statusType; }
            public void setStatusType(String statusType) { this.statusType = statusType; }
            public String getSuggestion() { return suggestion; }
            public void setSuggestion(String suggestion) { this.suggestion = suggestion; }
        }

        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }
        public String getTip() { return tip; }
        public void setTip(String tip) { this.tip = tip; }
        public List<Row> getRows() { return rows; }
        public void setRows(List<Row> rows) { this.rows = rows; }
    }

    // ========== 顶层 getter/setter ==========
    public String getTaskNo() { return taskNo; }
    public void setTaskNo(String taskNo) { this.taskNo = taskNo; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getBrandName() { return brandName; }
    public void setBrandName(String brandName) { this.brandName = brandName; }
    public String getReportDate() { return reportDate; }
    public void setReportDate(String reportDate) { this.reportDate = reportDate; }
    public Integer getTotalQuestions() { return totalQuestions; }
    public void setTotalQuestions(Integer totalQuestions) { this.totalQuestions = totalQuestions; }
    public Integer getTotalPlatforms() { return totalPlatforms; }
    public void setTotalPlatforms(Integer totalPlatforms) { this.totalPlatforms = totalPlatforms; }
    public Integer getTotalResults() { return totalResults; }
    public void setTotalResults(Integer totalResults) { this.totalResults = totalResults; }
    public Overview getOverview() { return overview; }
    public void setOverview(Overview overview) { this.overview = overview; }
    public MediaSource getMediaSource() { return mediaSource; }
    public void setMediaSource(MediaSource mediaSource) { this.mediaSource = mediaSource; }
}
