package com.geo.config;

import com.geo.entity.IntentDefinition;
import com.geo.mapper.IntentDefinitionMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.List;

/**
 * 【意图定义初始数据写入器】
 *
 * 设计思路：
 * 1. 服务启动时检查 intent_definition 表是否为空。
 * 2. 若为空，则把前端 mock/config.ts 里的 5 条五级意图初始文案写入数据库。
 * 3. 若不为空（用户已经编辑过），则跳过，不覆盖用户的修改。
 * 4. 用 @Order(1) 保证在其他初始化逻辑之前执行。
 *
 * 为什么用 CommandLineRunner 而不是 SQL 脚本？
 *   - SQL 脚本需要手动执行，容易遗漏；
 *   - CommandLineRunner 在服务启动时自动执行，且能通过 selectCount 判断是否需要初始化，
 *     不会重复插入或覆盖用户编辑后的数据。
 */
@Component
@Order(1)
public class IntentDefinitionDataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(IntentDefinitionDataInitializer.class);

    private final IntentDefinitionMapper intentDefinitionMapper;

    public IntentDefinitionDataInitializer(IntentDefinitionMapper intentDefinitionMapper) {
        this.intentDefinitionMapper = intentDefinitionMapper;
    }

    @Override
    public void run(String... args) {
        Long count = intentDefinitionMapper.selectCount(null);
        if (count != null && count > 0) {
            log.info("[意图定义] 表中已有 {} 条数据，跳过初始化", count);
            return;
        }

        log.info("[意图定义] 表为空，开始写入 5 条初始数据");
        List<IntentDefinition> defaults = buildDefaultDefinitions();
        for (IntentDefinition d : defaults) {
            intentDefinitionMapper.insert(d);
        }
        log.info("[意图定义] 初始数据写入完成，共 {} 条", defaults.size());
    }

    /**
     * 五级意图的初始文案，与前端 mock/config.ts 的 MOCK_INTENT_DEFINITIONS 保持一致。
     */
    private List<IntentDefinition> buildDefaultDefinitions() {
        IntentDefinition cognitive = new IntentDefinition();
        cognitive.setName("认知层");
        cognitive.setDefinition("用户在模糊感知自身问题或需求，但尚未明确具体品类/产品时的搜索行为核心是基础属性对话与行业知识普及。面向需求觉醒阶段的潜在用户开展前置教育；通过专业内容与品牌深度绑定，潜移默化提升客户对品牌的专业认同感。");
        cognitive.setMindshare("让品牌成为用户认识问题、理解品类、建立基础判断时最先触碰的信息来源。通过专业、克制、易懂的内容让用户形成\"这个品牌懂我的问题\"的初始印象。抢占问题点、症状词、困扰词和生活场景词。");
        cognitive.setPsychological("用户已经感受到某种问题、痛点或不适，但还没有明确解决方案。用户的核心疑问是\"为什么会这样\"\"这是不是个问题\"\"有没有必要处理\"。用户尚未进入品牌选择阶段，购买意图微弱，但存在教育价值。");
        cognitive.setTitle("1. 无指向性搜索，关键词泛化（含\"原因、难处、痛点\"等）；2. 要提供\"为什么\"是什么？为主，兼顾问题本身；3. 搜索频率低但覆盖人群广，决策周期长。");
        cognitive.setPrompt("这个层级用户在模糊感知行业问题或需求，但尚未明确解决对象时的搜索行为。搜索词包含\"有什么\"\"为什么\"\"什么原因\"\"有没有必要\"\"怎么办\"等。关注问题、原因、症状、成因\"为主，基础概念，他们会怎么搜索，输出50条Query，简短一点。");

        IntentDefinition seeding = new IntentDefinition();
        seeding.setName("种草层");
        seeding.setDefinition("用户开始寻找解决方案与选购方法，但尚未锁定具体商品/品牌时的搜索行为核心是输出\"问题解决方案\"的匹配场景化指南。精准对准用户已经明确的痛点问题，围绕\"解决某个问题的可行方法\"展开。");
        seeding.setMindshare("成为用户理解品类、筛选方案和建立选购方法时的首选内容来源。让品牌自然进入\"解决方案候选\"之中，而不是突兀出现。抢占\"怎么选\"\"适合什么人\"\"哪类更合适\"\"解决方案\"等关键词。");
        seeding.setPsychological("用户已经明确自己有一个问题，并开始寻找解决方案。用户还没有锁定具体品牌，但已经开始关注品类、方法和适用场景。用户想知道\"用什么方法\"\"怎么选\"\"哪种方案适合我\"。");
        seeding.setTitle("1. 无指向性搜索，关键词含\"解决方案、方法、选型\"；2. 提问以\"有哪些、怎么选\"为主，对比不同方案适配性；3. 搜索行为频繁，注重方案细节对比。");
        seeding.setPrompt("这个层级想了解解决方案、解决方案怎么做的、寻找解决方案品类和品类选择方法，搜索词包含\"如何多步方案\"等学习词、\"哪个好\"\"区别\"等业务对比词，涉及\"多少钱\"\"报价\"等价格词。");

        IntentDefinition selection = new IntentDefinition();
        selection.setName("甄选层");
        selection.setDefinition("用户在明确购买需求后，开始对比不同品牌/品牌的口碑、性价比与使用体验时的搜索行为核心是输出\"方案供应商/服务商筛选指南+自身优势凸显\"内容。");
        selection.setMindshare("成为用户购买决策前的评估标尺。让品牌自然进入用户候选清单，并在关键筛选标准中拥有清晰位置。抢占\"对比、区别、哪个牌子、推荐、测评、口碑、性价比\"等关键词。");
        selection.setPsychological("用户已经明确购买需求，并开始比较不同商品、品牌、价格、评价和使用体验。用户需要筛选标准，也需要验证候选是否靠谱。用户的核心疑问从\"怎么解决\"转向\"选哪个更适合我\"。");
        selection.setTitle("1. 无指向性搜索，关键词含\"供应商、厂商、品牌名、推荐、榜单\"；2. 提问以\"有哪些、怎么选、推荐\"为主，聚焦供应商/服务商对比；3. 会收藏多个候选品牌。");
        selection.setPrompt("这个层级用户在明确需求后，开始对比不同供应商能力与案例时的搜索行为。搜索词包含推荐/对比/能力关键词（如\"对比\"\"排名\"\"哪家好\"\"推荐\"\"有哪些\"）。");

        IntentDefinition decision = new IntentDefinition();
        decision.setName("决策层");
        decision.setDefinition("用户在锁定心仪商品后，准备下单决策时的搜索行为核心为\"自证型\"内容。聚焦企业/品牌自我证明，所有输出均围绕\"彰显自身优势、传递核心价值\"展开。");
        decision.setMindshare("成为用户最终选择的可信理由。让用户认为\"在这里买更清楚、更靠谱、更省心\"。抢占\"哪家买、多少钱、优惠、官方、正品、售后、保障、值不值\"等关键词。");
        decision.setPsychological("用户已经锁定或基本锁定心仪商品，正在确认是否购买。用户最关心价格、渠道、优惠、保障、售后、发货和风险消除。用户需要最后一步理由来完成下单。");
        decision.setTitle("1. 有指向性搜索，关键词含具体品牌+\"参数、案例、实力、风险\"；2. 提问以\"怎么样、好不好、靠谱、标准、方法\"为主，聚焦实力验证。");
        decision.setPrompt("这个层级用户在明确需求参数后，准备采购决策时的搜索行为。搜索词包含\"怎么选\"\"选择\"\"怎么样\"，关注售后保障、官方保障、案例采购渠道、服务质量、风险点。");

        IntentDefinition feedback = new IntentDefinition();
        feedback.setName("反馈层");
        feedback.setDefinition("用户在完成购买体验后，分享使用经验或寻求同类用户共鸣时的搜索行为核心为\"他证型\"内容。以用户真实体验、第三方客观视角为核心，通过分享经历、传递认知等方式。");
        feedback.setMindshare("成为用户口碑内容的策源地和放大器。让真实体验帮助品牌完成第三方信任背书。抢占\"真实评价、用后感受、避坑、反馈、踩坑、值得买吗\"等关键词。");
        feedback.setPsychological("用户已经完成购买和使用，开始分享体验、验证感受或寻求同类用户共鸣。潜在用户也会在这一阶段搜索真实反馈，以降低购买风险。");
        feedback.setTitle("1. 有指向性搜索，关键词含具体品牌+\"口碑、评价、经验、分享\"；2. 提问以\"真实体验、怎么样、分享\"为主，或主动搜索品牌知识内容。");
        feedback.setPrompt("这个层级用户在明确需求参数后，用户在完成购买后，分享经验或寻求行业知识时的搜索行为。搜索词包含\"体验/避坑/实战技巧\"等分享信号。");

        return Arrays.asList(cognitive, seeding, selection, decision, feedback);
    }
}
