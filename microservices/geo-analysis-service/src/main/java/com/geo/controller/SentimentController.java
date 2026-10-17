package com.geo.controller;

import com.geo.common.Result;
import com.geo.dto.SentimentReportResponse;
import com.geo.service.SentimentService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 【舆情数据报告 REST API 控制器】
 *
 * 设计思路：
 * 1. 舆情类型任务（monitorTarget=sentiment）的数据报告接口，路径统一挂在 /api/sentiment 下，
 *    与声量报告 /api/analysis 区分开，避免两类报告混用同一套接口。
 * 2. 当前采用同步生成模式：任务结果数通常不大（舆情任务问题数较少），同步返回即可。
 *    后续如需异步，可参考 AnalysisController 的异步模式扩展。
 * 3. 全部响应禁用 HTTP 缓存：报告是实时计算的，浏览器缓存会导致数据陈旧。
 */
@RestController
@RequestMapping("/api/sentiment")
public class SentimentController {

    private static final Logger log = LoggerFactory.getLogger(SentimentController.class);

    private final SentimentService sentimentService;

    public SentimentController(SentimentService sentimentService) {
        this.sentimentService = sentimentService;
    }

    /**
     * 【获取舆情数据报告】
     * 首次访问或无缓存时同步生成并返回；后续可扩展缓存逻辑。
     */
    @GetMapping("/{taskNo}/report")
    public ResponseEntity<Result<SentimentReportResponse>> getReport(@PathVariable String taskNo) {
        log.info("获取舆情数据报告: taskNo={}", taskNo);
        SentimentReportResponse report = sentimentService.generateReport(taskNo);
        return ResponseEntity.ok()
                .header(HttpHeaders.CACHE_CONTROL, "no-store, no-cache, must-revalidate, max-age=0")
                .header(HttpHeaders.PRAGMA, "no-cache")
                .header(HttpHeaders.EXPIRES, "0")
                .body(Result.success(report));
    }

    /**
     * 【强制重新生成舆情报告】
     * 忽略缓存重新计算。
     */
    @PostMapping("/{taskNo}/regenerate")
    public ResponseEntity<Result<SentimentReportResponse>> regenerateReport(@PathVariable String taskNo) {
        log.info("重新生成舆情数据报告: taskNo={}", taskNo);
        SentimentReportResponse report = sentimentService.generateReport(taskNo);
        return ResponseEntity.ok()
                .header(HttpHeaders.CACHE_CONTROL, "no-store, no-cache, must-revalidate, max-age=0")
                .header(HttpHeaders.PRAGMA, "no-cache")
                .header(HttpHeaders.EXPIRES, "0")
                .body(Result.success("报告已重新生成", report));
    }

    /**
     * 【舆情报告生成状态】
     * 当前为同步生成模式，直接返回 COMPLETED 占位（前端轮询时不会触发）。
     */
    @GetMapping("/{taskNo}/report/status")
    public ResponseEntity<Result<Map<String, Object>>> getReportStatus(@PathVariable String taskNo) {
        Map<String, Object> status = new java.util.HashMap<>();
        status.put("status", "COMPLETED");
        return ResponseEntity.ok()
                .header(HttpHeaders.CACHE_CONTROL, "no-store, no-cache, must-revalidate, max-age=0")
                .body(Result.success(status));
    }

    /**
     * 【舆情历史报告列表】
     * 返回该任务所有已生成报告的摘要列表。
     */
    @GetMapping("/{taskNo}/reports/history")
    public ResponseEntity<Result<List<Map<String, Object>>>> getReportHistory(@PathVariable String taskNo) {
        log.info("查询舆情历史报告列表: taskNo={}", taskNo);
        List<Map<String, Object>> history = sentimentService.listReportHistory(taskNo);
        return ResponseEntity.ok()
                .header(HttpHeaders.CACHE_CONTROL, "no-store, no-cache, must-revalidate, max-age=0")
                .body(Result.success(history));
    }

    /**
     * 【按 ID 获取历史舆情报告】
     */
    @GetMapping("/reports/{reportId}")
    public ResponseEntity<Result<SentimentReportResponse>> getReportById(@PathVariable Long reportId) {
        log.info("查询舆情历史报告详情: reportId={}", reportId);
        SentimentReportResponse report = sentimentService.getReportById(reportId);
        return ResponseEntity.ok()
                .header(HttpHeaders.CACHE_CONTROL, "no-store, no-cache, must-revalidate, max-age=0")
                .body(Result.success(report));
    }
}
