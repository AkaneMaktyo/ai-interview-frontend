# 阶段 5：进阶功能详细设计

## 概述
本阶段将实现智能化、个性化的训练系统，包括自适应出题、数据分析、用户系统等高级功能，打造完整的AI学习平台。

## 1. 智能出题系统

### 1.1 连环追问机制

#### 对话式出题引擎
```java
// service/ConversationalQuestionService.java
@Service
public class ConversationalQuestionService {
    
    private final AIService aiService;
    private final ConversationRepository conversationRepository;
    
    @Data
    public static class ConversationContext {
        private String topic;
        private List<QuestionAnswerPair> history;
        private UserProfile userProfile;
        private String currentFocus; // 当前关注点
        private Integer depth; // 对话深度
    }
    
    @Data
    public static class QuestionAnswerPair {
        private Question question;
        private String userAnswer;
        private AIEvaluation evaluation;
        private List<String> extractedKeywords;
        private Integer score;
    }
    
    public Question generateFollowUpQuestion(ConversationContext context) {
        // 1. 分析前面的问答历史
        AnswerAnalysis analysis = analyzeAnswerHistory(context.getHistory());
        
        // 2. 识别薄弱点和深入点
        List<String> weakPoints = analysis.getWeakPoints();
        List<String> strengthPoints = analysis.getStrengthPoints();
        
        // 3. 决定追问策略
        FollowUpStrategy strategy = determineFollowUpStrategy(analysis, context);
        
        // 4. 生成针对性问题
        return generateTargetedQuestion(strategy, context);
    }
    
    private FollowUpStrategy determineFollowUpStrategy(AnswerAnalysis analysis, 
                                                       ConversationContext context) {
        // 策略决策逻辑
        if (analysis.hasKnowledgeGaps()) {
            return FollowUpStrategy.FILL_GAPS;
        } else if (analysis.needsDeepening()) {
            return FollowUpStrategy.DEEPEN_UNDERSTANDING;
        } else if (analysis.canApplyKnowledge()) {
            return FollowUpStrategy.PRACTICAL_APPLICATION;
        } else {
            return FollowUpStrategy.LATERAL_THINKING;
        }
    }
    
    private Question generateTargetedQuestion(FollowUpStrategy strategy, 
                                              ConversationContext context) {
        String prompt = buildFollowUpPrompt(strategy, context);
        String aiResponse = aiService.generateQuestion(prompt);
        
        Question question = parseQuestionFromAI(aiResponse);
        question.setConversationId(context.getConversationId());
        question.setFollowUpStrategy(strategy.name());
        
        return questionRepository.save(question);
    }
    
    private String buildFollowUpPrompt(FollowUpStrategy strategy, 
                                       ConversationContext context) {
        StringBuilder prompt = new StringBuilder();
        prompt.append(\"你是一位经验丰富的面试官，正在进行深度技术面试。\\n\\n\");
        
        // 添加对话历史
        prompt.append(\"之前的问答历史：\\n\");
        for (QuestionAnswerPair pair : context.getHistory()) {
            prompt.append(\"问题：\").append(pair.getQuestion().getContent()).append(\"\\n\");
            prompt.append(\"回答：\").append(pair.getUserAnswer()).append(\"\\n\");
            prompt.append(\"评分：\").append(pair.getScore()).append(\"分\\n\\n\");
        }
        
        // 根据策略添加特定指令
        switch (strategy) {
            case FILL_GAPS:
                prompt.append(\"请针对候选人回答中暴露的知识盲点，提出一个填补性问题。\");
                break;
            case DEEPEN_UNDERSTANDING:
                prompt.append(\"请基于候选人的正确回答，提出一个更深层次的问题来考察理解深度。\");
                break;
            case PRACTICAL_APPLICATION:
                prompt.append(\"请设计一个实际应用场景，考察候选人将理论知识应用到实践的能力。\");
                break;
            case LATERAL_THINKING:
                prompt.append(\"请从相关但不同的角度提出问题，考察候选人的横向思维能力。\");
                break;
        }
        
        return prompt.toString();
    }
}
```

#### 对话历史管理
```java
// entity/Conversation.java
@Entity
@Table(name = \"conversations\")
public class Conversation {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = \"user_id\")
    private User user;
    
    @Column(name = \"topic\")
    private String topic;
    
    @Type(type = \"jsonb\")
    @Column(name = \"context\", columnDefinition = \"jsonb\")
    private ConversationContext context;
    
    @Column(name = \"current_depth\")
    private Integer currentDepth = 0;
    
    @Column(name = \"max_depth\")
    private Integer maxDepth = 5; // 最大追问深度
    
    @Enumerated(EnumType.STRING)
    private ConversationStatus status;
    
    @CreationTimestamp
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    private LocalDateTime updatedAt;
    
    // getters, setters
}

enum ConversationStatus {
    ACTIVE, COMPLETED, PAUSED
}
```

### 1.2 难度自适应算法

#### 动态难度调节器
```java
// service/AdaptiveDifficultyService.java
@Service
public class AdaptiveDifficultyService {
    
    @Data
    public static class UserAbilityProfile {
        private Map<String, Double> topicScores; // 各主题能力评分
        private Double overallAbility; // 整体能力评分
        private Integer recentPerformanceTrend; // 最近表现趋势 (-1: 下降, 0: 稳定, 1: 上升)
        private Map<String, Double> difficultyComfortZone; // 各难度舒适区
    }
    
    @Data
    public static class DifficultyRecommendation {
        private Difficulty recommendedDifficulty;
        private Double confidence; // 推荐置信度
        private String reasoning; // 推荐理由
        private List<String> fallbackDifficulties; // 备选难度
    }
    
    public DifficultyRecommendation recommendDifficulty(Long userId, String topic) {
        // 1. 获取用户能力画像
        UserAbilityProfile profile = getUserAbilityProfile(userId);
        
        // 2. 分析该主题的历史表现
        TopicPerformance topicPerf = analyzeTopicPerformance(userId, topic);
        
        // 3. 计算推荐难度
        Difficulty recommended = calculateOptimalDifficulty(profile, topicPerf);
        
        // 4. 验证并调整
        DifficultyRecommendation result = validateAndAdjust(recommended, profile, topicPerf);
        
        return result;
    }
    
    private Difficulty calculateOptimalDifficulty(UserAbilityProfile profile, 
                                                  TopicPerformance topicPerf) {
        // 获取主题基础能力分数
        Double topicScore = profile.getTopicScores().getOrDefault(
            topicPerf.getTopic(), profile.getOverallAbility());
        
        // 应用学习区理论：选择略高于当前能力的难度
        Double targetDifficulty = topicScore + 0.1; // 增加10%挑战性
        
        // 考虑最近表现趋势
        if (profile.getRecentPerformanceTrend() > 0) {
            targetDifficulty += 0.05; // 表现上升，增加挑战
        } else if (profile.getRecentPerformanceTrend() < 0) {
            targetDifficulty -= 0.05; // 表现下降，降低难度
        }
        
        // 映射到具体难度级别
        if (targetDifficulty < 0.3) return Difficulty.EASY;
        if (targetDifficulty < 0.7) return Difficulty.MEDIUM;
        return Difficulty.HARD;
    }
    
    public void updateUserAbility(Long userId, AnswerRecord record) {
        UserAbilityProfile profile = getUserAbilityProfile(userId);
        
        // 使用 Elo 评分系统更新能力值
        updateEloRating(profile, record);
        
        // 更新主题专项能力
        updateTopicAbility(profile, record);
        
        // 更新趋势分析
        updatePerformanceTrend(profile, userId);
        
        // 保存更新后的画像
        saveUserAbilityProfile(userId, profile);
    }
    
    private void updateEloRating(UserAbilityProfile profile, AnswerRecord record) {
        double K = 32; // Elo系数
        double userRating = profile.getOverallAbility() * 2000; // 转换为Elo分数
        
        // 根据题目难度估算题目\"评分\"
        double questionRating = getDifficultyRating(record.getQuestion().getDifficulty());
        
        // 计算期望得分
        double expectedScore = 1.0 / (1 + Math.pow(10, (questionRating - userRating) / 400));
        
        // 实际得分 (0-1)
        double actualScore = record.getScore() / 100.0;
        
        // 更新评分
        double newRating = userRating + K * (actualScore - expectedScore);
        profile.setOverallAbility(newRating / 2000.0); // 转换回0-1范围
    }
}
```

### 1.3 薄弱知识点识别

#### 知识图谱分析器
```java
// service/WeaknessAnalysisService.java
@Service
public class WeaknessAnalysisService {
    
    @Data
    public static class WeaknessReport {
        private List<WeaknessTopic> weakTopics;
        private Map<String, Double> masteryLevels; // 掌握程度
        private List<String> recommendedStudyPath; // 推荐学习路径
        private PriorityMatrix priorityMatrix; // 优先级矩阵
    }
    
    @Data
    public static class WeaknessTopic {
        private String topic;
        private Double weaknessScore; // 薄弱程度 0-1
        private List<String> specificAreas; // 具体薄弱点
        private Integer attemptCount; // 尝试次数
        private Double improvementRate; // 改进速度
        private List<String> relatedTopics; // 相关主题
    }
    
    public WeaknessReport analyzeUserWeaknesses(Long userId) {
        // 1. 获取用户所有答题记录
        List<AnswerRecord> records = answerRecordRepository.findByUserIdOrderByCreatedAtDesc(userId);
        
        // 2. 按主题分组分析
        Map<String, List<AnswerRecord>> topicGroups = groupByTopic(records);
        
        // 3. 计算各主题薄弱程度
        List<WeaknessTopic> weakTopics = calculateWeaknesses(topicGroups);
        
        // 4. 构建知识依赖图
        KnowledgeDependencyGraph graph = buildDependencyGraph(weakTopics);
        
        // 5. 生成学习路径推荐
        List<String> studyPath = generateOptimalStudyPath(graph, weakTopics);
        
        // 6. 创建优先级矩阵
        PriorityMatrix matrix = createPriorityMatrix(weakTopics);
        
        return WeaknessReport.builder()
            .weakTopics(weakTopics)
            .masteryLevels(calculateMasteryLevels(topicGroups))
            .recommendedStudyPath(studyPath)
            .priorityMatrix(matrix)
            .build();
    }
    
    private List<WeaknessTopic> calculateWeaknesses(Map<String, List<AnswerRecord>> topicGroups) {
        List<WeaknessTopic> weaknesses = new ArrayList<>();
        
        for (Map.Entry<String, List<AnswerRecord>> entry : topicGroups.entrySet()) {
            String topic = entry.getKey();
            List<AnswerRecord> records = entry.getValue();
            
            // 计算平均分
            double avgScore = records.stream()
                .mapToDouble(AnswerRecord::getScore)
                .average()
                .orElse(0.0);
            
            // 计算薄弱程度 (分数越低，薄弱程度越高)
            double weaknessScore = Math.max(0, (70 - avgScore) / 70.0);
            
            if (weaknessScore > 0.3) { // 只包含明显薄弱的主题
                WeaknessTopic weakness = new WeaknessTopic();
                weakness.setTopic(topic);
                weakness.setWeaknessScore(weaknessScore);
                weakness.setAttemptCount(records.size());
                weakness.setImprovementRate(calculateImprovementRate(records));
                weakness.setSpecificAreas(identifySpecificWeakAreas(records));
                
                weaknesses.add(weakness);
            }
        }
        
        return weaknesses.stream()
            .sorted((a, b) -> Double.compare(b.getWeaknessScore(), a.getWeaknessScore()))
            .collect(Collectors.toList());
    }
    
    private List<String> generateOptimalStudyPath(KnowledgeDependencyGraph graph, 
                                                  List<WeaknessTopic> weakTopics) {
        // 使用拓扑排序生成学习路径
        List<String> path = new ArrayList<>();
        Set<String> visited = new HashSet<>();
        
        // 优先从基础知识开始
        List<String> fundamentals = graph.getFundamentalTopics();
        for (String topic : fundamentals) {
            if (isWeak(topic, weakTopics) && !visited.contains(topic)) {
                addToPath(path, visited, graph, topic);
            }
        }
        
        // 然后添加依赖较少的薄弱主题
        weakTopics.stream()
            .sorted((a, b) -> Integer.compare(
                graph.getDependencyCount(a.getTopic()),
                graph.getDependencyCount(b.getTopic())))
            .forEach(weakness -> {
                if (!visited.contains(weakness.getTopic())) {
                    addToPath(path, visited, graph, weakness.getTopic());
                }
            });
        
        return path;
    }
}
```

## 2. 数据分析功能

### 2.1 学习进度可视化

#### 数据统计服务
```java
// service/LearningAnalyticsService.java
@Service
public class LearningAnalyticsService {
    
    @Data
    public static class LearningDashboard {
        private OverallProgress overallProgress;
        private List<TopicProgress> topicProgresses;
        private LearningTrend learningTrend;
        private PerformanceMetrics performanceMetrics;
        private List<Achievement> achievements;
        private StudyInsights insights;
    }
    
    @Data
    public static class OverallProgress {
        private Integer totalQuestions;
        private Integer correctAnswers;
        private Double averageScore;
        private Integer studyDays;
        private Long totalStudyTime; // 总学习时间（分钟）
        private Double weeklyGoalProgress; // 周目标完成度
    }
    
    @Data
    public static class TopicProgress {
        private String topic;
        private Integer questionsAnswered;
        private Double masteryLevel; // 掌握程度 0-1
        private Double accuracyRate;
        private Integer streakCount; // 连续正确次数
        private LocalDateTime lastPracticed;
        private String progressTrend; // UP, DOWN, STABLE
    }
    
    @Data
    public static class LearningTrend {
        private List<DailyProgress> dailyProgress;
        private List<WeeklyProgress> weeklyProgress;
        private List<MonthlyProgress> monthlyProgress;
        private String trendDirection; // IMPROVING, DECLINING, STABLE
        private Double trendSlope; // 趋势斜率
    }
    
    public LearningDashboard generateDashboard(Long userId, DateRange dateRange) {
        // 1. 获取用户学习数据
        List<AnswerRecord> records = getAnswerRecords(userId, dateRange);
        List<LearningStats> stats = getLearningStats(userId, dateRange);
        
        // 2. 计算整体进度
        OverallProgress overall = calculateOverallProgress(records, stats);
        
        // 3. 分析各主题进度
        List<TopicProgress> topics = analyzeTopicProgress(records);
        
        // 4. 计算学习趋势
        LearningTrend trend = calculateLearningTrend(stats);
        
        // 5. 生成性能指标
        PerformanceMetrics metrics = calculatePerformanceMetrics(records);
        
        // 6. 检查成就
        List<Achievement> achievements = checkAchievements(userId, records);
        
        // 7. 生成学习洞察
        StudyInsights insights = generateInsights(overall, topics, trend);
        
        return LearningDashboard.builder()
            .overallProgress(overall)
            .topicProgresses(topics)
            .learningTrend(trend)
            .performanceMetrics(metrics)
            .achievements(achievements)
            .insights(insights)
            .build();
    }
    
    private LearningTrend calculateLearningTrend(List<LearningStats> stats) {
        // 计算每日进度
        List<DailyProgress> dailyProgress = stats.stream()
            .map(stat -> DailyProgress.builder()
                .date(stat.getStatDate())
                .questionsCount(stat.getQuestionsAttempted())
                .averageScore(stat.getTotalScore() / (double) stat.getQuestionsAttempted())
                .studyTime(stat.getTimeSpent())
                .build())
            .collect(Collectors.toList());
        
        // 使用线性回归计算趋势
        double[] scores = dailyProgress.stream()
            .mapToDouble(DailyProgress::getAverageScore)
            .toArray();
        
        LinearRegression regression = new LinearRegression(scores);
        double slope = regression.getSlope();
        
        String trendDirection = determineTrendDirection(slope);
        
        return LearningTrend.builder()
            .dailyProgress(dailyProgress)
            .trendDirection(trendDirection)
            .trendSlope(slope)
            .build();
    }
}
```

#### 前端可视化组件
```vue
<!-- components/LearningDashboard.vue -->
<template>
  <div class=\"learning-dashboard\">
    <!-- 总览卡片 -->
    <el-row :gutter=\"20\" class=\"overview-cards\">
      <el-col :span=\"6\" v-for=\"metric in overviewMetrics\" :key=\"metric.key\">
        <el-card class=\"metric-card\">
          <div class=\"metric-content\">
            <div class=\"metric-icon\">
              <el-icon :size=\"40\" :color=\"metric.color\">
                <component :is=\"metric.icon\" />
              </el-icon>
            </div>
            <div class=\"metric-info\">
              <h3>{{ metric.value }}</h3>
              <p>{{ metric.label }}</p>
              <span class=\"metric-trend\" :class=\"metric.trendClass\">
                <el-icon><CaretTop v-if=\"metric.trend > 0\" /><CaretBottom v-else /></el-icon>
                {{ Math.abs(metric.trend) }}%
              </span>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
    
    <!-- 学习趋势图表 -->
    <el-row :gutter=\"20\" class=\"charts-row\">
      <el-col :span=\"16\">
        <el-card title=\"学习趋势\">
          <div ref=\"trendChartRef\" class=\"chart-container\"></div>
        </el-card>
      </el-col>
      
      <el-col :span=\"8\">
        <el-card title=\"知识点掌握雷达图\">
          <div ref=\"radarChartRef\" class=\"chart-container\"></div>
        </el-card>
      </el-col>
    </el-row>
    
    <!-- 主题进度热力图 -->
    <el-card title=\"主题学习热力图\">
      <div ref=\"heatmapRef\" class=\"heatmap-container\"></div>
    </el-card>
    
    <!-- 成就系统 -->
    <el-card title=\"学习成就\">
      <div class=\"achievements-grid\">
        <div 
          v-for=\"achievement in achievements\" 
          :key=\"achievement.id\"
          class=\"achievement-item\"
          :class=\"{ unlocked: achievement.unlocked }\">
          <div class=\"achievement-icon\">
            <el-icon :size=\"32\">
              <Trophy v-if=\"achievement.unlocked\" />
              <Lock v-else />
            </el-icon>
          </div>
          <div class=\"achievement-info\">
            <h4>{{ achievement.title }}</h4>
            <p>{{ achievement.description }}</p>
            <el-progress 
              :percentage=\"achievement.progress\" 
              :show-text=\"false\"
              :stroke-width=\"4\"/>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import * as echarts from 'echarts';
import { getLearningDashboard } from '@/api/analytics';

const dashboardData = ref({});
const trendChartRef = ref(null);
const radarChartRef = ref(null);
const heatmapRef = ref(null);

const overviewMetrics = computed(() => [
  {
    key: 'totalQuestions',
    label: '总答题数',
    value: dashboardData.value.overallProgress?.totalQuestions || 0,
    icon: 'DocumentChecked',
    color: '#409eff',
    trend: 12.5,
    trendClass: 'trend-up'
  },
  {
    key: 'averageScore',
    label: '平均分',
    value: dashboardData.value.overallProgress?.averageScore?.toFixed(1) || 0,
    icon: 'TrendCharts',
    color: '#67c23a',
    trend: 8.2,
    trendClass: 'trend-up'
  },
  {
    key: 'studyTime',
    label: '学习时长',
    value: formatStudyTime(dashboardData.value.overallProgress?.totalStudyTime),
    icon: 'Timer',
    color: '#e6a23c',
    trend: -2.1,
    trendClass: 'trend-down'
  },
  {
    key: 'masteryLevel',
    label: '掌握程度',
    value: calculateOverallMastery() + '%',
    icon: 'Medal',
    color: '#f56c6c',
    trend: 15.3,
    trendClass: 'trend-up'
  }
]);

const initTrendChart = () => {
  const chart = echarts.init(trendChartRef.value);
  
  const option = {
    title: {
      text: '学习趋势分析',
      left: 'center'
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross'
      }
    },
    legend: {
      data: ['答题数量', '平均分', '学习时长'],
      top: 30
    },
    grid: {
      left: 50,
      right: 50,
      bottom: 50,
      top: 80
    },
    xAxis: {
      type: 'time',
      boundaryGap: false
    },
    yAxis: [
      {
        type: 'value',
        name: '数量/分数',
        position: 'left'
      },
      {
        type: 'value',
        name: '时长(分钟)',
        position: 'right'
      }
    ],
    series: [
      {
        name: '答题数量',
        type: 'line',
        smooth: true,
        data: generateTrendData('questions'),
        itemStyle: { color: '#409eff' }
      },
      {
        name: '平均分',
        type: 'line',
        smooth: true,
        data: generateTrendData('score'),
        itemStyle: { color: '#67c23a' }
      },
      {
        name: '学习时长',
        type: 'line',
        smooth: true,
        yAxisIndex: 1,
        data: generateTrendData('time'),
        itemStyle: { color: '#e6a23c' }
      }
    ]
  };
  
  chart.setOption(option);
};

const initRadarChart = () => {
  const chart = echarts.init(radarChartRef.value);
  
  const topics = dashboardData.value.topicProgresses || [];
  
  const option = {
    title: {
      text: '知识点掌握度',
      left: 'center'
    },
    radar: {
      indicator: topics.map(topic => ({
        name: topic.topic,
        max: 100
      }))
    },
    series: [{
      type: 'radar',
      data: [{
        value: topics.map(topic => topic.masteryLevel * 100),
        name: '掌握程度',
        itemStyle: { color: '#409eff' },
        areaStyle: { opacity: 0.3 }
      }]
    }]
  };
  
  chart.setOption(option);
};

const initHeatmap = () => {
  const chart = echarts.init(heatmapRef.value);
  
  const heatmapData = generateHeatmapData();
  
  const option = {
    title: {
      text: '学习活跃度热力图',
      left: 'center'
    },
    tooltip: {
      position: 'top',
      formatter: function(params) {
        return `${params.data[0]}日 ${params.data[1]}时: ${params.data[2]}题`;
      }
    },
    grid: {
      height: '50%',
      top: '10%'
    },
    xAxis: {
      type: 'category',
      data: Array.from({length: 24}, (_, i) => i + 'h'),
      splitArea: {
        show: true
      }
    },
    yAxis: {
      type: 'category',
      data: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'],
      splitArea: {
        show: true
      }
    },
    visualMap: {
      min: 0,
      max: 10,
      calculable: true,
      orient: 'horizontal',
      left: 'center',
      bottom: '15%',
      inRange: {
        color: ['#ebedf0', '#c6e48b', '#7bc96f', '#239a3b', '#196127']
      }
    },
    series: [{
      type: 'heatmap',
      data: heatmapData,
      label: {
        show: false
      },
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowColor: 'rgba(0, 0, 0, 0.5)'
        }
      }
    }]
  };
  
  chart.setOption(option);
};

onMounted(async () => {
  const response = await getLearningDashboard();
  dashboardData.value = response.data;
  
  // 初始化图表
  initTrendChart();
  initRadarChart();
  initHeatmap();
});
</script>

<style scoped>
.learning-dashboard {
  padding: 20px;
}

.overview-cards {
  margin-bottom: 20px;
}

.metric-card {
  height: 120px;
}

.metric-content {
  display: flex;
  align-items: center;
  height: 100%;
}

.metric-icon {
  margin-right: 16px;
}

.metric-info h3 {
  margin: 0 0 4px 0;
  font-size: 24px;
  font-weight: 600;
}

.metric-info p {
  margin: 0 0 4px 0;
  color: #666;
  font-size: 14px;
}

.metric-trend {
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 2px;
}

.trend-up {
  color: #67c23a;
}

.trend-down {
  color: #f56c6c;
}

.charts-row {
  margin-bottom: 20px;
}

.chart-container {
  height: 400px;
  width: 100%;
}

.heatmap-container {
  height: 300px;
  width: 100%;
}

.achievements-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.achievement-item {
  display: flex;
  align-items: center;
  padding: 16px;
  border: 2px solid #e4e7ed;
  border-radius: 8px;
  transition: all 0.3s ease;
  opacity: 0.6;
}

.achievement-item.unlocked {
  border-color: #67c23a;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f7fa 100%);
  opacity: 1;
}

.achievement-icon {
  margin-right: 12px;
  color: #909399;
}

.achievement-item.unlocked .achievement-icon {
  color: #67c23a;
}

.achievement-info h4 {
  margin: 0 0 4px 0;
  font-size: 16px;
}

.achievement-info p {
  margin: 0 0 8px 0;
  font-size: 12px;
  color: #666;
}
</style>
```

### 2.2 知识点掌握热力图

#### 热力图数据处理
```javascript
// utils/heatmapProcessor.js
export class HeatmapProcessor {
  constructor(answerRecords) {
    this.records = answerRecords;
  }
  
  generateTopicMasteryHeatmap() {
    // 1. 按主题和时间聚合数据
    const topicTimeMap = this.aggregateByTopicAndTime();
    
    // 2. 计算掌握度矩阵
    const masteryMatrix = this.calculateMasteryMatrix(topicTimeMap);
    
    // 3. 生成热力图数据格式
    return this.formatForHeatmap(masteryMatrix);
  }
  
  aggregateByTopicAndTime() {
    const map = new Map();
    
    this.records.forEach(record => {
      const date = this.formatDate(record.createdAt);
      const topics = record.question.tags || [];
      
      topics.forEach(topic => {
        const key = `${topic}_${date}`;
        if (!map.has(key)) {
          map.set(key, {
            topic,
            date,
            scores: [],
            count: 0
          });
        }
        
        const data = map.get(key);
        data.scores.push(record.score);
        data.count++;
      });
    });
    
    return map;
  }
  
  calculateMasteryMatrix(topicTimeMap) {
    const matrix = [];
    const topics = [...new Set([...topicTimeMap.values()].map(d => d.topic))];
    const dates = [...new Set([...topicTimeMap.values()].map(d => d.date))].sort();
    
    topics.forEach((topic, topicIndex) => {
      dates.forEach((date, dateIndex) => {
        const key = `${topic}_${date}`;
        const data = topicTimeMap.get(key);
        
        let masteryScore = 0;
        if (data) {
          // 计算该主题在该日期的掌握度
          const avgScore = data.scores.reduce((a, b) => a + b, 0) / data.scores.length;
          masteryScore = this.scoresToMastery(avgScore, data.count);
        }
        
        matrix.push([dateIndex, topicIndex, masteryScore]);
      });
    });
    
    return {
      matrix,
      topics,
      dates
    };
  }
  
  scoresToMastery(averageScore, questionCount) {
    // 综合考虑平均分和题目数量
    const scoreWeight = averageScore / 100;
    const countWeight = Math.min(questionCount / 10, 1); // 最多10题为满分
    
    return Math.round((scoreWeight * 0.7 + countWeight * 0.3) * 100);
  }
  
  formatForHeatmap(masteryData) {
    return {
      data: masteryData.matrix,
      xAxis: masteryData.dates,
      yAxis: masteryData.topics,
      visualMap: {
        min: 0,
        max: 100,
        inRange: {
          color: ['#ebedf0', '#c6e48b', '#7bc96f', '#239a3b', '#196127']
        }
      }
    };
  }
  
  generateDifficultyProgressHeatmap() {
    // 生成难度进度热力图
    const difficulties = ['Easy', 'Medium', 'Hard'];
    const weeks = this.generateWeekRange();
    
    const matrix = [];
    
    difficulties.forEach((difficulty, diffIndex) => {
      weeks.forEach((week, weekIndex) => {
        const weekRecords = this.getRecordsInWeek(week, difficulty);
        const successRate = this.calculateSuccessRate(weekRecords);
        
        matrix.push([weekIndex, diffIndex, Math.round(successRate * 100)]);
      });
    });
    
    return {
      data: matrix,
      xAxis: weeks.map(w => `第${w}周`),
      yAxis: difficulties,
      visualMap: {
        min: 0,
        max: 100,
        inRange: {
          color: ['#ff6b6b', '#feca57', '#48dbfb', '#0abde3']
        }
      }
    };
  }
}
```

### 2.3 正确率趋势分析

#### 趋势分析算法
```java
// service/TrendAnalysisService.java
@Service
public class TrendAnalysisService {
    
    @Data
    public static class TrendAnalysis {
        private String trendDirection; // UPWARD, DOWNWARD, STABLE, VOLATILE
        private Double trendSlope; // 趋势斜率
        private Double correlation; // 时间相关性
        private List<TrendPoint> trendPoints;
        private SeasonalPattern seasonalPattern;
        private PredictionModel prediction;
    }
    
    @Data
    public static class TrendPoint {
        private LocalDate date;
        private Double value;
        private Double smoothedValue;
        private String label;
    }
    
    @Data
    public static class SeasonalPattern {
        private Map<String, Double> weeklyPattern; // 周模式
        private Map<String, Double> dailyPattern; // 日模式
        private Double seasonalStrength; // 季节性强度
    }
    
    public TrendAnalysis analyzeAccuracyTrend(Long userId, int dayRange) {
        // 1. 获取时间序列数据
        List<TrendPoint> rawData = generateAccuracyTimeSeries(userId, dayRange);
        
        // 2. 数据平滑处理
        List<TrendPoint> smoothedData = applyMovingAverage(rawData, 7); // 7日移动平均
        
        // 3. 计算趋势斜率
        LinearRegression regression = performLinearRegression(smoothedData);
        
        // 4. 检测季节性模式
        SeasonalPattern pattern = detectSeasonalPattern(rawData);
        
        // 5. 生成预测模型
        PredictionModel prediction = buildPredictionModel(smoothedData);
        
        // 6. 确定趋势方向
        String direction = determineTrendDirection(regression.getSlope(), regression.getRSquared());
        
        return TrendAnalysis.builder()
            .trendDirection(direction)
            .trendSlope(regression.getSlope())
            .correlation(regression.getRSquared())
            .trendPoints(smoothedData)
            .seasonalPattern(pattern)
            .prediction(prediction)
            .build();
    }
    
    private List<TrendPoint> applyMovingAverage(List<TrendPoint> data, int windowSize) {
        List<TrendPoint> smoothed = new ArrayList<>();
        
        for (int i = 0; i < data.size(); i++) {
            int start = Math.max(0, i - windowSize / 2);
            int end = Math.min(data.size(), i + windowSize / 2 + 1);
            
            double sum = 0;
            for (int j = start; j < end; j++) {
                sum += data.get(j).getValue();
            }
            
            TrendPoint point = new TrendPoint();
            point.setDate(data.get(i).getDate());
            point.setValue(data.get(i).getValue());
            point.setSmoothedValue(sum / (end - start));
            
            smoothed.add(point);
        }
        
        return smoothed;
    }
    
    private SeasonalPattern detectSeasonalPattern(List<TrendPoint> data) {
        Map<String, List<Double>> weeklyGroups = new HashMap<>();
        Map<String, List<Double>> dailyGroups = new HashMap<>();
        
        // 按星期分组
        data.forEach(point -> {
            String weekday = point.getDate().getDayOfWeek().toString();
            weeklyGroups.computeIfAbsent(weekday, k -> new ArrayList<>()).add(point.getValue());
        });
        
        // 按小时分组（如果有小时数据）
        data.forEach(point -> {
            String hour = String.valueOf(point.getDate().atStartOfDay().getHour());
            dailyGroups.computeIfAbsent(hour, k -> new ArrayList<>()).add(point.getValue());
        });
        
        // 计算平均值
        Map<String, Double> weeklyPattern = weeklyGroups.entrySet().stream()
            .collect(Collectors.toMap(
                Map.Entry::getKey,
                entry -> entry.getValue().stream().mapToDouble(Double::doubleValue).average().orElse(0.0)
            ));
        
        Map<String, Double> dailyPattern = dailyGroups.entrySet().stream()
            .collect(Collectors.toMap(
                Map.Entry::getKey,
                entry -> entry.getValue().stream().mapToDouble(Double::doubleValue).average().orElse(0.0)
            ));
        
        // 计算季节性强度
        double seasonalStrength = calculateSeasonalStrength(weeklyPattern.values());
        
        return SeasonalPattern.builder()
            .weeklyPattern(weeklyPattern)
            .dailyPattern(dailyPattern)
            .seasonalStrength(seasonalStrength)
            .build();
    }
    
    private String determineTrendDirection(double slope, double rSquared) {
        // 如果相关性太低，认为是波动的
        if (rSquared < 0.3) {
            return \"VOLATILE\";
        }
        
        // 根据斜率判断趋势
        if (Math.abs(slope) < 0.1) {
            return \"STABLE\";
        } else if (slope > 0) {
            return \"UPWARD\";
        } else {
            return \"DOWNWARD\";
        }
    }
}
```

## 3. 用户系统

### 3.1 用户注册登录

#### JWT 认证服务
```java
// security/JwtAuthenticationService.java
@Service
public class JwtAuthenticationService {
    
    @Value(\"${app.jwt.secret}\")
    private String jwtSecret;
    
    @Value(\"${app.jwt.expiration}\")
    private int jwtExpirationMs;
    
    private final UserDetailsService userDetailsService;
    private final PasswordEncoder passwordEncoder;
    
    @Data
    public static class AuthRequest {
        private String email;
        private String password;
    }
    
    @Data
    public static class AuthResponse {
        private String token;
        private String type = \"Bearer\";
        private UserProfile user;
        private Long expiresIn;
    }
    
    @Data
    public static class RegisterRequest {
        private String email;
        private String username;
        private String password;
        private String nickname;
    }
    
    public AuthResponse authenticate(AuthRequest request) {
        // 1. 验证用户凭据
        Authentication authentication = authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(
                request.getEmail(),
                request.getPassword()
            )
        );
        
        // 2. 生成JWT token
        String token = generateToken(authentication);
        
        // 3. 获取用户信息
        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();
        UserProfile userProfile = convertToUserProfile(userPrincipal.getUser());
        
        return AuthResponse.builder()
            .token(token)
            .user(userProfile)
            .expiresIn((long) jwtExpirationMs)
            .build();
    }
    
    public AuthResponse register(RegisterRequest request) {
        // 1. 验证用户信息
        validateRegistrationRequest(request);
        
        // 2. 创建用户
        User user = new User();
        user.setEmail(request.getEmail());
        user.setUsername(request.getUsername());
        user.setNickname(request.getNickname());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setCreatedAt(LocalDateTime.now());
        user.setIsActive(true);
        
        User savedUser = userRepository.save(user);
        
        // 3. 初始化用户画像
        initializeUserProfile(savedUser.getId());
        
        // 4. 自动登录
        return authenticate(AuthRequest.builder()
            .email(request.getEmail())
            .password(request.getPassword())
            .build());
    }
    
    private String generateToken(Authentication authentication) {
        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();
        Date expiryDate = new Date(System.currentTimeMillis() + jwtExpirationMs);
        
        return Jwts.builder()
            .setSubject(Long.toString(userPrincipal.getId()))
            .setIssuedAt(new Date())
            .setExpiration(expiryDate)
            .signWith(SignatureAlgorithm.HS512, jwtSecret)
            .compact();
    }
    
    public Long getUserIdFromToken(String token) {
        Claims claims = Jwts.parser()
            .setSigningKey(jwtSecret)
            .parseClaimsJws(token)
            .getBody();
        
        return Long.parseLong(claims.getSubject());
    }
    
    public boolean validateToken(String token) {
        try {
            Jwts.parser().setSigningKey(jwtSecret).parseClaimsJws(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }
}
```

### 3.2 个人资料管理

#### 用户画像服务
```java
// service/UserProfileService.java
@Service
public class UserProfileService {
    
    @Data
    public static class UserProfile {
        private Long id;
        private String username;
        private String nickname;
        private String email;
        private String avatarUrl;
        private LearningPreferences preferences;
        private StudyStatistics statistics;
        private List<String> interests;
        private SkillLevels skillLevels;
        private StudyGoals goals;
    }
    
    @Data
    public static class LearningPreferences {
        private String preferredDifficulty; // Easy, Medium, Hard, Adaptive
        private List<String> favoriteTopics;
        private Integer dailyQuestionGoal;
        private String studyTimePreference; // morning, afternoon, evening
        private Boolean enableReminders;
        private String reminderTime;
    }
    
    @Data
    public static class StudyStatistics {
        private Integer totalQuestions;
        private Integer correctAnswers;
        private Double averageScore;
        private Long totalStudyTime;
        private Integer currentStreak;
        private Integer longestStreak;
        private LocalDateTime lastActiveDate;
    }
    
    public UserProfile getUserProfile(Long userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new UserNotFoundException(\"用户不存在\"));
        
        // 获取学习偏好
        LearningPreferences preferences = getUserPreferences(userId);
        
        // 计算统计数据
        StudyStatistics statistics = calculateStudyStatistics(userId);
        
        // 获取技能等级
        SkillLevels skillLevels = calculateSkillLevels(userId);
        
        // 获取学习目标
        StudyGoals goals = getUserGoals(userId);
        
        return UserProfile.builder()
            .id(user.getId())
            .username(user.getUsername())
            .nickname(user.getNickname())
            .email(user.getEmail())
            .avatarUrl(user.getAvatarUrl())
            .preferences(preferences)
            .statistics(statistics)
            .skillLevels(skillLevels)
            .goals(goals)
            .build();
    }
    
    public void updateUserPreferences(Long userId, LearningPreferences preferences) {
        // 更新学习偏好
        UserPreferences userPrefs = userPreferencesRepository.findByUserId(userId)
            .orElse(new UserPreferences());
        
        userPrefs.setUserId(userId);
        userPrefs.setPreferredDifficulty(preferences.getPreferredDifficulty());
        userPrefs.setFavoriteTopics(preferences.getFavoriteTopics());
        userPrefs.setDailyQuestionGoal(preferences.getDailyQuestionGoal());
        userPrefs.setStudyTimePreference(preferences.getStudyTimePreference());
        userPrefs.setEnableReminders(preferences.getEnableReminders());
        userPrefs.setReminderTime(preferences.getReminderTime());
        
        userPreferencesRepository.save(userPrefs);
        
        // 更新推荐算法
        updateRecommendationModel(userId, preferences);
    }
    
    private StudyStatistics calculateStudyStatistics(Long userId) {
        List<AnswerRecord> records = answerRecordRepository.findByUserId(userId);
        
        Integer totalQuestions = records.size();
        Integer correctAnswers = (int) records.stream()
            .filter(r -> r.getScore() >= 70)
            .count();
        
        Double averageScore = records.stream()
            .mapToDouble(AnswerRecord::getScore)
            .average()
            .orElse(0.0);
        
        Long totalStudyTime = records.stream()
            .mapToLong(r -> r.getTimeSpent() != null ? r.getTimeSpent() : 0)
            .sum();
        
        Integer currentStreak = calculateCurrentStreak(userId);
        Integer longestStreak = calculateLongestStreak(userId);
        
        LocalDateTime lastActiveDate = records.stream()
            .map(AnswerRecord::getCreatedAt)
            .max(LocalDateTime::compareTo)
            .orElse(null);
        
        return StudyStatistics.builder()
            .totalQuestions(totalQuestions)
            .correctAnswers(correctAnswers)
            .averageScore(averageScore)
            .totalStudyTime(totalStudyTime)
            .currentStreak(currentStreak)
            .longestStreak(longestStreak)
            .lastActiveDate(lastActiveDate)
            .build();
    }
}
```

### 3.3 云端数据同步

#### 数据同步服务
```java
// service/CloudSyncService.java
@Service
public class CloudSyncService {
    
    @Data
    public static class SyncData {
        private Long userId;
        private Long lastSyncTime;
        private UserProfile userProfile;
        private List<AnswerRecord> answerRecords;
        private List<WrongQuestion> wrongQuestions;
        private LearningStats learningStats;
        private String checksum; // 数据校验和
    }
    
    @Data
    public static class SyncResult {
        private boolean success;
        private String message;
        private Long newSyncTime;
        private Integer recordsUploaded;
        private Integer recordsDownloaded;
        private List<SyncConflict> conflicts;
    }
    
    @Data
    public static class SyncConflict {
        private String dataType;
        private String recordId;
        private Object localData;
        private Object cloudData;
        private String conflictReason;
    }
    
    public SyncResult syncToCloud(Long userId) {
        try {
            // 1. 获取本地数据
            SyncData localData = gatherLocalSyncData(userId);
            
            // 2. 获取云端最后同步时间
            Long lastCloudSync = getLastCloudSyncTime(userId);
            
            // 3. 检查是否有冲突
            List<SyncConflict> conflicts = detectConflicts(localData, lastCloudSync);
            
            // 4. 上传增量数据
            Integer uploaded = uploadIncrementalData(localData, lastCloudSync);
            
            // 5. 下载云端更新
            Integer downloaded = downloadCloudUpdates(userId, localData.getLastSyncTime());
            
            // 6. 更新同步时间戳
            Long newSyncTime = updateSyncTimestamp(userId);
            
            return SyncResult.builder()
                .success(true)
                .message(\"同步成功\")
                .newSyncTime(newSyncTime)
                .recordsUploaded(uploaded)
                .recordsDownloaded(downloaded)
                .conflicts(conflicts)
                .build();
                
        } catch (Exception e) {
            log.error(\"数据同步失败\", e);
            return SyncResult.builder()
                .success(false)
                .message(\"同步失败: \" + e.getMessage())
                .build();
        }
    }
    
    private SyncData gatherLocalSyncData(Long userId) {
        UserProfile profile = userProfileService.getUserProfile(userId);
        
        // 获取最后同步时间
        Long lastSyncTime = getLastSyncTime(userId);
        
        // 获取增量数据（只同步上次同步后的数据）
        List<AnswerRecord> incrementalRecords = answerRecordRepository
            .findByUserIdAndCreatedAtAfter(userId, 
                LocalDateTime.ofEpochSecond(lastSyncTime, 0, ZoneOffset.UTC));
        
        List<WrongQuestion> wrongQuestions = wrongQuestionRepository
            .findByUserIdAndCreatedAtAfter(userId,
                LocalDateTime.ofEpochSecond(lastSyncTime, 0, ZoneOffset.UTC));
        
        LearningStats stats = learningStatsRepository.findByUserId(userId);
        
        SyncData syncData = SyncData.builder()
            .userId(userId)
            .lastSyncTime(lastSyncTime)
            .userProfile(profile)
            .answerRecords(incrementalRecords)
            .wrongQuestions(wrongQuestions)
            .learningStats(stats)
            .build();
        
        // 生成数据校验和
        syncData.setChecksum(generateChecksum(syncData));
        
        return syncData;
    }
    
    private List<SyncConflict> detectConflicts(SyncData localData, Long lastCloudSync) {
        List<SyncConflict> conflicts = new ArrayList<>();
        
        // 检查用户资料冲突
        if (hasProfileConflict(localData.getUserProfile(), lastCloudSync)) {
            conflicts.add(createProfileConflict(localData.getUserProfile()));
        }
        
        // 检查答题记录冲突
        for (AnswerRecord record : localData.getAnswerRecords()) {
            if (hasRecordConflict(record, lastCloudSync)) {
                conflicts.add(createRecordConflict(record));
            }
        }
        
        return conflicts;
    }
    
    @Async
    public CompletableFuture<Void> scheduleAutoSync(Long userId) {
        // 定期自动同步
        return CompletableFuture.runAsync(() -> {
            try {
                Thread.sleep(30000); // 30秒后执行同步
                syncToCloud(userId);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        });
    }
    
    public void enableOfflineMode(Long userId) {
        // 启用离线模式
        OfflineConfig config = new OfflineConfig();
        config.setUserId(userId);
        config.setOfflineEnabled(true);
        config.setAutoSyncWhenOnline(true);
        config.setSyncInterval(Duration.ofMinutes(5));
        
        offlineConfigRepository.save(config);
        
        // 缓存常用数据到本地
        cacheEssentialDataLocally(userId);
    }
    
    private void cacheEssentialDataLocally(Long userId) {
        // 缓存用户常练习的主题题目
        List<String> favoriteTopics = getUserFavoriteTopics(userId);
        for (String topic : favoriteTopics) {
            List<Question> questions = questionRepository
                .findByTagsContainingAndIsActiveTrue(topic, PageRequest.of(0, 20));
            localCacheService.cacheQuestions(userId, topic, questions);
        }
        
        // 缓存用户历史记录
        List<AnswerRecord> recentRecords = answerRecordRepository
            .findRecentRecords(userId, 100);
        localCacheService.cacheAnswerRecords(userId, recentRecords);
    }
}
```

## 4. 部署和运维

### 4.1 Docker 容器化部署
```dockerfile
# Dockerfile
FROM node:18-alpine AS frontend-build
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

FROM openjdk:17-jre-slim AS backend-build
WORKDIR /app
COPY target/ai-interview-backend.jar app.jar
EXPOSE 8080

FROM nginx:alpine AS production
COPY --from=frontend-build /app/dist /usr/share/nginx/html
COPY --from=backend-build /app/app.jar /app/
COPY nginx.conf /etc/nginx/nginx.conf

# 启动脚本
COPY start.sh /start.sh
RUN chmod +x /start.sh

CMD [\"/start.sh\"]
```

### 4.2 监控和日志
```yaml
# docker-compose.monitoring.yml
version: '3.8'
services:
  prometheus:
    image: prom/prometheus
    ports:
      - \"9090:9090\"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      
  grafana:
    image: grafana/grafana
    ports:
      - \"3000:3000\"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana-storage:/var/lib/grafana
      
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:7.14.0
    environment:
      - discovery.type=single-node
    ports:
      - \"9200:9200\"
      
  kibana:
    image: docker.elastic.co/kibana/kibana:7.14.0
    ports:
      - \"5601:5601\"
    depends_on:
      - elasticsearch

volumes:
  grafana-storage:
```

本阶段完成后，AI面试应用将具备企业级的功能完整性，包括智能出题、个性化推荐、完善的用户系统和数据分析能力，成为一个功能强大的智能学习平台。