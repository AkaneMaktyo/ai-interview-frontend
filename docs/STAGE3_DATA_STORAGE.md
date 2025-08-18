# 阶段 3：数据存储和错题集详细设计

## 概述
本阶段将建立完整的数据持久化体系，支持题目存储、用户答题记录、历史查询和错题复习功能。

## 1. 数据库设计

### 1.1 数据库选型
- **推荐**: PostgreSQL（支持 JSON 字段，性能优秀）
- **备选**: MySQL 8.0+（JSON 支持，生态成熟）

### 1.2 数据表设计

#### 用户表 (users)
```sql
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    nickname VARCHAR(50),
    avatar_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- 索引
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
```

#### 知识点标签表 (knowledge_tags)
```sql
CREATE TABLE knowledge_tags (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    category VARCHAR(50) NOT NULL, -- 如：后端、前端、算法、数据库
    description TEXT,
    parent_id BIGINT REFERENCES knowledge_tags(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX idx_tags_category ON knowledge_tags(category);
CREATE INDEX idx_tags_parent ON knowledge_tags(parent_id);
```

#### 题目表 (questions)
```sql
CREATE TABLE questions (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    question_type VARCHAR(20) NOT NULL, -- 概念题、场景题、代码题
    difficulty VARCHAR(10) NOT NULL,    -- Easy、Medium、Hard
    tags JSONB,                         -- ["Spring Boot", "微服务"]
    expected_answer TEXT,
    evaluation_criteria JSONB,          -- 评分标准数组
    hints JSONB,                        -- 提示数组
    ai_generated BOOLEAN DEFAULT true,   -- 是否AI生成
    ai_prompt TEXT,                     -- 生成时使用的prompt
    created_by BIGINT REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- 索引
CREATE INDEX idx_questions_difficulty ON questions(difficulty);
CREATE INDEX idx_questions_type ON questions(question_type);
CREATE INDEX idx_questions_tags ON questions USING GIN(tags);
CREATE INDEX idx_questions_created_at ON questions(created_at);
```

#### 答题记录表 (answer_records)
```sql
CREATE TABLE answer_records (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id),
    question_id BIGINT NOT NULL REFERENCES questions(id),
    user_answer TEXT NOT NULL,
    ai_evaluation JSONB,                -- AI评价结果
    score INTEGER,                      -- 得分 0-100
    time_spent INTEGER,                 -- 答题用时（秒）
    attempt_count INTEGER DEFAULT 1,    -- 第几次作答
    status VARCHAR(20) DEFAULT 'completed', -- completed, skipped, in_progress
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(user_id, question_id, attempt_count) -- 防止重复记录
);

-- 索引
CREATE INDEX idx_answer_records_user ON answer_records(user_id);
CREATE INDEX idx_answer_records_question ON answer_records(question_id);
CREATE INDEX idx_answer_records_score ON answer_records(score);
CREATE INDEX idx_answer_records_created_at ON answer_records(created_at);
CREATE INDEX idx_answer_records_status ON answer_records(status);
```

#### 错题集表 (wrong_questions)
```sql
CREATE TABLE wrong_questions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id),
    question_id BIGINT NOT NULL REFERENCES questions(id),
    first_attempt_record_id BIGINT REFERENCES answer_records(id),
    retry_count INTEGER DEFAULT 0,
    last_retry_at TIMESTAMP,
    mastered BOOLEAN DEFAULT false,     -- 是否已掌握
    mastered_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(user_id, question_id)
);

-- 索引
CREATE INDEX idx_wrong_questions_user ON wrong_questions(user_id);
CREATE INDEX idx_wrong_questions_mastered ON wrong_questions(user_id, mastered);
```

#### 学习统计表 (learning_stats)
```sql
CREATE TABLE learning_stats (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id),
    stat_date DATE NOT NULL,
    questions_attempted INTEGER DEFAULT 0,
    questions_correct INTEGER DEFAULT 0,
    total_score INTEGER DEFAULT 0,
    time_spent INTEGER DEFAULT 0,      -- 总学习时间（秒）
    tags_practiced JSONB,              -- 练习的知识点
    
    UNIQUE(user_id, stat_date)
);

-- 索引
CREATE INDEX idx_learning_stats_user_date ON learning_stats(user_id, stat_date);
```

### 1.3 数据库连接配置
```yaml
# application.yml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/ai_interview
    username: ${DB_USER:postgres}
    password: ${DB_PASSWORD:password}
    driver-class-name: org.postgresql.Driver
    
  jpa:
    hibernate:
      ddl-auto: validate  # 生产环境使用 validate
    show-sql: false
    properties:
      hibernate:
        dialect: org.hibernate.dialect.PostgreSQLDialect
        format_sql: true
        
  flyway:
    enabled: true
    locations: classpath:db/migration
```

## 2. 后端服务设计

### 2.1 实体类设计

#### Question 实体
```java
@Entity
@Table(name = "questions")
public class Question {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, length = 200)
    private String title;
    
    @Column(columnDefinition = "TEXT")
    private String content;
    
    @Enumerated(EnumType.STRING)
    private QuestionType questionType;
    
    @Enumerated(EnumType.STRING)
    private Difficulty difficulty;
    
    @Type(type = "jsonb")
    @Column(columnDefinition = "jsonb")
    private List<String> tags;
    
    @Column(columnDefinition = "TEXT")
    private String expectedAnswer;
    
    @Type(type = "jsonb")
    @Column(columnDefinition = "jsonb")
    private List<String> evaluationCriteria;
    
    @Type(type = "jsonb")
    @Column(columnDefinition = "jsonb")
    private List<String> hints;
    
    @Column(name = "ai_generated")
    private Boolean aiGenerated = true;
    
    @Column(name = "ai_prompt", columnDefinition = "TEXT")
    private String aiPrompt;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;
    
    @CreationTimestamp
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    private LocalDateTime updatedAt;
    
    @Column(name = "is_active")
    private Boolean isActive = true;
    
    // getters, setters, constructors
}
```

#### AnswerRecord 实体
```java
@Entity
@Table(name = "answer_records")
public class AnswerRecord {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", nullable = false)
    private Question question;
    
    @Column(name = "user_answer", columnDefinition = "TEXT")
    private String userAnswer;
    
    @Type(type = "jsonb")
    @Column(name = "ai_evaluation", columnDefinition = "jsonb")
    private AIEvaluation aiEvaluation;
    
    private Integer score;
    
    @Column(name = "time_spent")
    private Integer timeSpent;
    
    @Column(name = "attempt_count")
    private Integer attemptCount = 1;
    
    @Enumerated(EnumType.STRING)
    private AnswerStatus status = AnswerStatus.COMPLETED;
    
    @CreationTimestamp
    private LocalDateTime createdAt;
    
    // getters, setters, constructors
}
```

### 2.2 Repository 层设计

#### QuestionRepository
```java
@Repository
public interface QuestionRepository extends JpaRepository<Question, Long> {
    
    // 根据难度和标签查询
    @Query("SELECT q FROM Question q WHERE q.difficulty = :difficulty " +
           "AND :tag MEMBER OF q.tags AND q.isActive = true")
    List<Question> findByDifficultyAndTag(@Param("difficulty") Difficulty difficulty,
                                          @Param("tag") String tag);
    
    // 分页查询活跃题目
    Page<Question> findByIsActiveTrueOrderByCreatedAtDesc(Pageable pageable);
    
    // 统计各难度题目数量
    @Query("SELECT q.difficulty, COUNT(q) FROM Question q " +
           "WHERE q.isActive = true GROUP BY q.difficulty")
    List<Object[]> countByDifficulty();
    
    // 根据多个标签查询（OR条件）
    @Query("SELECT DISTINCT q FROM Question q " +
           "WHERE q.isActive = true AND EXISTS " +
           "(SELECT 1 FROM jsonb_array_elements_text(q.tags) AS tag " +
           "WHERE tag IN :tags)")
    List<Question> findByTagsIn(@Param("tags") List<String> tags);
}
```

#### AnswerRecordRepository
```java
@Repository
public interface AnswerRecordRepository extends JpaRepository<AnswerRecord, Long> {
    
    // 用户答题历史（分页）
    Page<AnswerRecord> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);
    
    // 用户错题记录
    @Query("SELECT ar FROM AnswerRecord ar WHERE ar.user.id = :userId " +
           "AND ar.score < :passScore ORDER BY ar.createdAt DESC")
    List<AnswerRecord> findWrongAnswersByUserId(@Param("userId") Long userId,
                                                 @Param("passScore") Integer passScore);
    
    // 用户某题目的最新记录
    Optional<AnswerRecord> findTopByUserIdAndQuestionIdOrderByCreatedAtDesc(
        Long userId, Long questionId);
    
    // 用户学习统计
    @Query("SELECT COUNT(ar), AVG(ar.score), SUM(ar.timeSpent) " +
           "FROM AnswerRecord ar WHERE ar.user.id = :userId " +
           "AND ar.createdAt >= :startDate")
    Object[] getUserLearningStats(@Param("userId") Long userId,
                                  @Param("startDate") LocalDateTime startDate);
    
    // 题目平均分
    @Query("SELECT AVG(ar.score) FROM AnswerRecord ar WHERE ar.question.id = :questionId")
    Double getAverageScoreByQuestionId(@Param("questionId") Long questionId);
}
```

### 2.3 Service 层设计

#### QuestionService
```java
@Service
@Transactional
public class QuestionService {
    
    private final QuestionRepository questionRepository;
    private final AIService aiService;
    private final AnswerRecordRepository answerRecordRepository;
    
    // 生成并保存题目
    public Question generateAndSaveQuestion(GenerateQuestionRequest request) {
        // 1. 调用AI生成题目
        String aiResponse = aiService.generateQuestion(
            request.getTopic(), 
            request.getDifficulty()
        );
        
        // 2. 解析AI响应
        QuestionData questionData = parseAIResponse(aiResponse);
        
        // 3. 保存到数据库
        Question question = new Question();
        question.setTitle(questionData.getQuestion().substring(0, 
            Math.min(questionData.getQuestion().length(), 200)));
        question.setContent(questionData.getQuestion());
        question.setQuestionType(QuestionType.valueOf(questionData.getType()));
        question.setDifficulty(Difficulty.valueOf(request.getDifficulty()));
        question.setTags(questionData.getTags());
        question.setExpectedAnswer(questionData.getExpectedAnswer());
        question.setEvaluationCriteria(questionData.getEvaluationCriteria());
        question.setHints(questionData.getHints());
        question.setAiPrompt(buildPrompt(request));
        
        return questionRepository.save(question);
    }
    
    // 获取推荐题目（避免重复）
    public List<Question> getRecommendedQuestions(Long userId, 
                                                  String tag, 
                                                  Difficulty difficulty, 
                                                  int count) {
        // 1. 获取用户已答题目ID
        List<Long> answeredQuestionIds = getAnsweredQuestionIds(userId);
        
        // 2. 查询未答题目
        List<Question> candidates = questionRepository
            .findByDifficultyAndTag(difficulty, tag);
        
        // 3. 过滤已答题目
        return candidates.stream()
            .filter(q -> !answeredQuestionIds.contains(q.getId()))
            .limit(count)
            .collect(Collectors.toList());
    }
    
    // 获取用户历史记录
    public Page<AnswerRecordDTO> getUserHistory(Long userId, Pageable pageable) {
        Page<AnswerRecord> records = answerRecordRepository
            .findByUserIdOrderByCreatedAtDesc(userId, pageable);
        
        return records.map(this::convertToDTO);
    }
    
    // 获取错题集
    public List<WrongQuestionDTO> getWrongQuestions(Long userId) {
        List<AnswerRecord> wrongAnswers = answerRecordRepository
            .findWrongAnswersByUserId(userId, 70); // 70分以下算错题
        
        return wrongAnswers.stream()
            .map(this::convertToWrongQuestionDTO)
            .collect(Collectors.toList());
    }
    
    private List<Long> getAnsweredQuestionIds(Long userId) {
        // 查询用户已答题目ID列表
        return answerRecordRepository.findAnsweredQuestionIdsByUserId(userId);
    }
}
```

#### AnswerEvaluationService
```java
@Service
@Transactional
public class AnswerEvaluationService {
    
    private final AIService aiService;
    private final AnswerRecordRepository answerRecordRepository;
    private final WrongQuestionService wrongQuestionService;
    
    public AnswerEvaluationResult evaluateAnswer(EvaluateAnswerRequest request) {
        // 1. 获取题目信息
        Question question = questionRepository.findById(request.getQuestionId())
            .orElseThrow(() -> new QuestionNotFoundException("题目不存在"));
        
        // 2. 调用AI评价
        String aiResponse = aiService.evaluateAnswer(
            question.getContent(),
            question.getExpectedAnswer(),
            request.getUserAnswer()
        );
        
        // 3. 解析评价结果
        AIEvaluation evaluation = parseEvaluationResponse(aiResponse);
        
        // 4. 保存答题记录
        AnswerRecord record = new AnswerRecord();
        record.setUser(getCurrentUser());
        record.setQuestion(question);
        record.setUserAnswer(request.getUserAnswer());
        record.setAiEvaluation(evaluation);
        record.setScore(evaluation.getScore());
        record.setTimeSpent(request.getTimeSpent());
        
        AnswerRecord savedRecord = answerRecordRepository.save(record);
        
        // 5. 处理错题逻辑
        if (evaluation.getScore() < 70) {
            wrongQuestionService.addToWrongQuestions(
                getCurrentUser().getId(), 
                question.getId(), 
                savedRecord.getId()
            );
        }
        
        // 6. 更新学习统计
        updateLearningStats(getCurrentUser().getId(), evaluation.getScore());
        
        return AnswerEvaluationResult.builder()
            .recordId(savedRecord.getId())
            .evaluation(evaluation)
            .build();
    }
}
```

## 3. API 接口设计

### 3.1 题目相关接口

#### 生成题目
```http
POST /api/questions/generate
Authorization: Bearer {token}
Content-Type: application/json

{
  "topic": "Spring Boot 自动配置",
  "difficulty": "Medium",
  "questionType": "概念题",
  "tags": ["Spring Boot", "自动配置"]
}
```

#### 获取推荐题目
```http
GET /api/questions/recommended?tag=Spring Boot&difficulty=Medium&count=5
Authorization: Bearer {token}
```

#### 题目详情
```http
GET /api/questions/{questionId}
Authorization: Bearer {token}
```

### 3.2 答题相关接口

#### 提交答案
```http
POST /api/answers/submit
Authorization: Bearer {token}
Content-Type: application/json

{
  "questionId": 123,
  "userAnswer": "Spring Boot 通过 @EnableAutoConfiguration 注解...",
  "timeSpent": 180
}
```

#### 获取答题历史
```http
GET /api/answers/history?page=0&size=10&sort=createdAt,desc
Authorization: Bearer {token}
```

#### 获取错题集
```http
GET /api/answers/wrong-questions
Authorization: Bearer {token}
```

### 3.3 统计相关接口

#### 个人学习统计
```http
GET /api/stats/personal?period=week
Authorization: Bearer {token}
```

响应示例：
```json
{
  "code": 200,
  "data": {
    "totalQuestions": 45,
    "correctQuestions": 32,
    "accuracy": 71.1,
    "averageScore": 78.5,
    "totalTimeSpent": 3600,
    "dailyStats": [
      {
        "date": "2024-01-15",
        "questionsCount": 8,
        "averageScore": 82,
        "timeSpent": 480
      }
    ],
    "tagStats": [
      {
        "tag": "Spring Boot",
        "questionsCount": 12,
        "accuracy": 75.0
      }
    ]
  }
}
```

## 4. 前端页面设计

### 4.1 历史记录页面
```vue
<template>
  <div class="history-page">
    <el-card>
      <template #header>
        <div class="header-content">
          <h3>答题历史</h3>
          <div class="filter-controls">
            <el-select v-model="filters.difficulty" placeholder="选择难度">
              <el-option label="全部" value=""/>
              <el-option label="简单" value="Easy"/>
              <el-option label="中等" value="Medium"/>
              <el-option label="困难" value="Hard"/>
            </el-select>
            
            <el-date-picker
              v-model="filters.dateRange"
              type="daterange"
              placeholder="选择日期范围"/>
          </div>
        </div>
      </template>
      
      <!-- 统计卡片 -->
      <el-row :gutter="20" class="stats-cards">
        <el-col :span="6">
          <el-statistic title="总题数" :value="stats.totalQuestions"/>
        </el-col>
        <el-col :span="6">
          <el-statistic title="正确率" :value="stats.accuracy" suffix="%"/>
        </el-col>
        <el-col :span="6">
          <el-statistic title="平均分" :value="stats.averageScore"/>
        </el-col>
        <el-col :span="6">
          <el-statistic title="学习时长" :value="formatTime(stats.totalTime)"/>
        </el-col>
      </el-row>
      
      <!-- 历史记录列表 -->
      <el-table :data="historyList" v-loading="loading">
        <el-table-column prop="question.title" label="题目" min-width="200">
          <template #default="{ row }">
            <el-button 
              type="text" 
              @click="viewQuestionDetail(row)"
              class="question-title">
              {{ row.question.title }}
            </el-button>
          </template>
        </el-table-column>
        
        <el-table-column prop="score" label="得分" width="80">
          <template #default="{ row }">
            <el-tag :type="getScoreType(row.score)">
              {{ row.score }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="question.difficulty" label="难度" width="80">
          <template #default="{ row }">
            <el-tag :type="getDifficultyType(row.question.difficulty)">
              {{ getDifficultyText(row.question.difficulty) }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="timeSpent" label="用时" width="80">
          <template #default="{ row }">
            {{ formatTime(row.timeSpent) }}
          </template>
        </el-table-column>
        
        <el-table-column prop="createdAt" label="答题时间" width="150">
          <template #default="{ row }">
            {{ formatDateTime(row.createdAt) }}
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="120">
          <template #default="{ row }">
            <el-button 
              size="small" 
              @click="viewDetail(row)">
              查看详情
            </el-button>
            <el-button 
              v-if="row.score < 70"
              size="small" 
              type="warning"
              @click="retryQuestion(row.question)">
              重做
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 分页 -->
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.size"
        :total="pagination.total"
        layout="total, sizes, prev, pager, next, jumper"
        @current-change="handlePageChange"
        @size-change="handleSizeChange"/>
    </el-card>
    
    <!-- 详情弹窗 -->
    <AnswerDetailDialog 
      v-model="detailVisible"
      :record="selectedRecord"/>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue';
import { getAnswerHistory, getPersonalStats } from '@/api/answer';

const loading = ref(false);
const historyList = ref([]);
const stats = ref({});
const detailVisible = ref(false);
const selectedRecord = ref(null);

const filters = reactive({
  difficulty: '',
  dateRange: []
});

const pagination = reactive({
  page: 1,
  size: 10,
  total: 0
});

const loadHistory = async () => {
  loading.value = true;
  try {
    const params = {
      page: pagination.page - 1,
      size: pagination.size,
      ...filters
    };
    
    const response = await getAnswerHistory(params);
    historyList.value = response.data.content;
    pagination.total = response.data.totalElements;
  } catch (error) {
    console.error('加载历史记录失败:', error);
  } finally {
    loading.value = false;
  }
};

const loadStats = async () => {
  try {
    const response = await getPersonalStats({ period: 'month' });
    stats.value = response.data;
  } catch (error) {
    console.error('加载统计数据失败:', error);
  }
};

onMounted(() => {
  loadHistory();
  loadStats();
});
</script>
```

### 4.2 错题集页面
```vue
<template>
  <div class="wrong-questions-page">
    <el-card>
      <template #header>
        <div class="header-content">
          <h3>错题集</h3>
          <el-button 
            type="primary" 
            @click="startWrongQuestionsPractice"
            :disabled="wrongQuestions.length === 0">
            开始错题练习
          </el-button>
        </div>
      </template>
      
      <!-- 错题统计 -->
      <el-alert
        :title="`共有 ${wrongQuestions.length} 道错题待复习`"
        type="warning"
        :closable="false"
        show-icon
        class="wrong-stats"/>
      
      <!-- 知识点分布 -->
      <div class="tag-distribution">
        <h4>薄弱知识点</h4>
        <div class="tag-clouds">
          <el-tag
            v-for="(count, tag) in tagStats"
            :key="tag"
            :size="getTagSize(count)"
            :type="getTagType(count)"
            @click="filterByTag(tag)"
            class="tag-item">
            {{ tag }} ({{ count }})
          </el-tag>
        </div>
      </div>
      
      <!-- 错题列表 -->
      <el-table :data="filteredWrongQuestions" v-loading="loading">
        <el-table-column prop="question.title" label="题目" min-width="200"/>
        
        <el-table-column prop="question.difficulty" label="难度" width="80">
          <template #default="{ row }">
            <el-tag :type="getDifficultyType(row.question.difficulty)">
              {{ getDifficultyText(row.question.difficulty) }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="retryCount" label="重做次数" width="100"/>
        
        <el-table-column prop="firstAttemptScore" label="首次得分" width="100">
          <template #default="{ row }">
            <el-tag type="danger">{{ row.firstAttemptScore }}</el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="lastRetryAt" label="最近练习" width="150">
          <template #default="{ row }">
            {{ row.lastRetryAt ? formatDateTime(row.lastRetryAt) : '未重做' }}
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="200">
          <template #default="{ row }">
            <el-button 
              size="small" 
              type="primary"
              @click="retryQuestion(row.question)">
              重新练习
            </el-button>
            <el-button 
              size="small"
              @click="viewWrongAnswerDetail(row)">
              查看详情
            </el-button>
            <el-button 
              size="small"
              type="success"
              @click="markAsMastered(row)">
              标记已掌握
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>
```

## 5. 数据迁移脚本

### 5.1 Flyway 迁移脚本
```sql
-- V1__Create_initial_tables.sql
-- 创建用户表
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    nickname VARCHAR(50),
    avatar_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- 创建知识点标签表
CREATE TABLE knowledge_tags (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    category VARCHAR(50) NOT NULL,
    description TEXT,
    parent_id BIGINT REFERENCES knowledge_tags(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 插入初始知识点数据
INSERT INTO knowledge_tags (name, category) VALUES
('Java基础', '后端开发'),
('Spring Framework', '后端开发'),
('Spring Boot', '后端开发'),
('MyBatis', '后端开发'),
('数据库设计', '数据库'),
('SQL优化', '数据库'),
('Redis', '缓存'),
('消息队列', '中间件'),
('微服务', '架构设计'),
('设计模式', '架构设计');
```

### 5.2 示例数据脚本
```sql
-- V2__Insert_sample_data.sql
-- 插入示例用户
INSERT INTO users (username, email, password_hash, nickname) VALUES
('demo_user', 'demo@example.com', '$2a$10$...', '演示用户');

-- 插入示例题目
INSERT INTO questions (title, content, question_type, difficulty, tags, expected_answer, evaluation_criteria, hints) VALUES
(
    'Spring Boot自动配置原理',
    '请详细解释Spring Boot的自动配置机制是如何工作的？',
    'CONCEPT',
    'MEDIUM',
    '["Spring Boot", "自动配置", "注解"]'::jsonb,
    'Spring Boot通过@EnableAutoConfiguration注解启用自动配置...',
    '["是否提到@EnableAutoConfiguration", "是否解释条件装配", "是否说明配置类加载机制"]'::jsonb,
    '["考虑@Conditional注解", "思考starter的作用"]'::jsonb
);
```

## 6. 缓存策略

### 6.1 Redis 配置
```yaml
spring:
  redis:
    host: ${REDIS_HOST:localhost}
    port: ${REDIS_PORT:6379}
    password: ${REDIS_PASSWORD:}
    database: 0
    timeout: 3000ms
    lettuce:
      pool:
        max-active: 20
        max-idle: 10
        min-idle: 5
```

### 6.2 缓存注解使用
```java
@Service
public class QuestionService {
    
    // 缓存热门题目
    @Cacheable(value = "popular_questions", key = "#difficulty + '_' + #tag")
    public List<Question> getPopularQuestions(Difficulty difficulty, String tag) {
        return questionRepository.findPopularByDifficultyAndTag(difficulty, tag);
    }
    
    // 缓存用户统计数据
    @Cacheable(value = "user_stats", key = "#userId", unless = "#result == null")
    public UserStats getUserStats(Long userId) {
        return calculateUserStats(userId);
    }
    
    // 清除用户缓存
    @CacheEvict(value = "user_stats", key = "#userId")
    public void clearUserStatsCache(Long userId) {
        // 在用户答题后调用
    }
}
```

## 7. 性能优化

### 7.1 数据库查询优化
```java
// 使用批量查询避免N+1问题
@Query("SELECT ar FROM AnswerRecord ar " +
       "JOIN FETCH ar.question q " +
       "JOIN FETCH ar.user u " +
       "WHERE ar.user.id = :userId")
List<AnswerRecord> findByUserIdWithDetails(@Param("userId") Long userId);

// 使用原生SQL进行复杂统计查询
@Query(value = "SELECT " +
       "DATE(created_at) as date, " +
       "COUNT(*) as question_count, " +
       "AVG(score) as avg_score " +
       "FROM answer_records " +
       "WHERE user_id = :userId " +
       "AND created_at >= :startDate " +
       "GROUP BY DATE(created_at) " +
       "ORDER BY date", nativeQuery = true)
List<Object[]> getDailyStats(@Param("userId") Long userId, 
                            @Param("startDate") LocalDateTime startDate);
```

### 7.2 分页优化
```java
// 使用游标分页处理大数据量
public class CursorPageRequest {
    private Long lastId;
    private int size = 20;
    
    // getters, setters
}

@Query("SELECT ar FROM AnswerRecord ar WHERE ar.id > :lastId " +
       "ORDER BY ar.id LIMIT :size")
List<AnswerRecord> findNextPage(@Param("lastId") Long lastId, 
                                @Param("size") int size);
```

## 8. 测试计划

### 8.1 数据层测试
```java
@DataJpaTest
class QuestionRepositoryTest {
    
    @Autowired
    private TestEntityManager entityManager;
    
    @Autowired
    private QuestionRepository questionRepository;
    
    @Test
    void shouldFindQuestionsByDifficultyAndTag() {
        // Given
        Question question = createTestQuestion();
        entityManager.persistAndFlush(question);
        
        // When
        List<Question> results = questionRepository
            .findByDifficultyAndTag(Difficulty.MEDIUM, "Spring Boot");
        
        // Then
        assertThat(results).hasSize(1);
        assertThat(results.get(0).getTitle()).isEqualTo(question.getTitle());
    }
}
```

### 8.2 服务层测试
```java
@ExtendWith(MockitoExtension.class)
class QuestionServiceTest {
    
    @Mock
    private QuestionRepository questionRepository;
    
    @Mock
    private AIService aiService;
    
    @InjectMocks
    private QuestionService questionService;
    
    @Test
    void shouldGenerateAndSaveQuestion() {
        // Given
        GenerateQuestionRequest request = new GenerateQuestionRequest();
        request.setTopic("Spring Boot");
        request.setDifficulty("Medium");
        
        when(aiService.generateQuestion(anyString(), anyString()))
            .thenReturn(mockAIResponse());
        when(questionRepository.save(any(Question.class)))
            .thenReturn(mockQuestion());
        
        // When
        Question result = questionService.generateAndSaveQuestion(request);
        
        // Then
        assertThat(result).isNotNull();
        verify(questionRepository).save(any(Question.class));
    }
}
```

## 9. 部署清单

### 9.1 环境变量
```bash
# 数据库配置
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ai_interview
DB_USER=postgres
DB_PASSWORD=your_password

# Redis 配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# AI API 配置
AI_API_KEY=your_ai_api_key
AI_API_URL=https://api.provider.com

# JWT 配置
JWT_SECRET=your_jwt_secret
JWT_EXPIRATION=86400000
```

### 9.2 Docker Compose
```yaml
version: '3.8'
services:
  postgres:
    image: postgres:13
    environment:
      POSTGRES_DB: ai_interview
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
      
  redis:
    image: redis:6
    ports:
      - "6379:6379"
      
  app:
    build: .
    environment:
      DB_HOST: postgres
      REDIS_HOST: redis
    depends_on:
      - postgres
      - redis
    ports:
      - "8080:8080"

volumes:
  postgres_data:
```

本阶段完成后，应用将具备完整的数据持久化能力，支持历史记录查询、错题管理和学习统计功能。