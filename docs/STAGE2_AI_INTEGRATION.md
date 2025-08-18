# 阶段 2：AI API 接入详细设计

## 概述
本阶段将实现与真实 AI 模型的集成，包括题目生成、答案评价等核心功能。

## 1. AI API 选型对比

### 1.1 候选方案

| API 服务 | 优势 | 劣势 | 定价 | 推荐度 |
|---------|------|------|------|--------|
| 通义千问 | 中文优化好，价格便宜 | 国际化支持差 | ¥0.008/1K tokens | ⭐⭐⭐⭐⭐ |
| OpenAI GPT-4 | 质量最高，生态成熟 | 价格较贵，需翻墙 | $0.03/1K tokens | ⭐⭐⭐⭐ |
| 文心一言 | 百度生态，审核宽松 | 响应速度一般 | ¥0.012/1K tokens | ⭐⭐⭐ |

### 1.2 推荐选择
**主选**：通义千问（性价比最高）  
**备选**：OpenAI GPT-4（质量保障）

## 2. 后端架构设计

### 2.1 目录结构
```
backend/
├── src/
│   ├── main/
│   │   ├── java/com/ai/interview/
│   │   │   ├── controller/
│   │   │   │   └── QuestionController.java
│   │   │   ├── service/
│   │   │   │   ├── AIService.java
│   │   │   │   └── QuestionService.java
│   │   │   ├── config/
│   │   │   │   └── AIConfig.java
│   │   │   ├── dto/
│   │   │   │   ├── GenerateQuestionRequest.java
│   │   │   │   ├── GenerateQuestionResponse.java
│   │   │   │   └── EvaluateAnswerRequest.java
│   │   │   └── util/
│   │   │       └── PromptTemplates.java
│   │   └── resources/
│   │       ├── application.yml
│   │       └── prompts/
│   │           ├── generate-question.txt
│   │           └── evaluate-answer.txt
```

### 2.2 核心服务类设计

#### AIService.java
```java
@Service
public class AIService {
    @Value("${ai.api.key}")
    private String apiKey;
    
    @Value("${ai.api.url}")
    private String apiUrl;
    
    private final RestTemplate restTemplate;
    
    // 生成题目
    public String generateQuestion(String topic, String difficulty);
    
    // 评价答案
    public String evaluateAnswer(String question, String answer);
    
    // 通用AI调用方法
    private String callAI(String prompt);
}
```

#### QuestionService.java
```java
@Service
public class QuestionService {
    private final AIService aiService;
    
    // 业务逻辑封装
    public GenerateQuestionResponse generateQuestion(GenerateQuestionRequest request);
    public EvaluateAnswerResponse evaluateAnswer(EvaluateAnswerRequest request);
}
```

## 3. Prompt 工程设计

### 3.1 生成题目 Prompt 模板
```
你是一位资深的面试官，请根据以下要求生成一道面试题：

知识点：{topic}
难度等级：{difficulty} (Easy/Medium/Hard)
题目类型：{questionType} (概念题/场景题/代码题)

请按以下JSON格式返回：
{
  "question": "题目内容",
  "type": "题目类型",
  "difficulty": "难度等级",
  "tags": ["标签1", "标签2"],
  "expectedAnswer": "参考答案",
  "evaluationCriteria": [
    "评分标准1",
    "评分标准2"
  ],
  "hints": ["提示1", "提示2"]
}

要求：
1. 题目要有实际意义，贴近真实面试场景
2. 难度要符合指定等级
3. 提供清晰的评分标准
4. 答案要准确且完整
```

### 3.2 评价答案 Prompt 模板
```
请你作为面试官，对候选人的回答进行专业评价。

题目：{question}
参考答案：{expectedAnswer}
候选人回答：{userAnswer}
评分标准：{evaluationCriteria}

请按以下JSON格式返回评价结果：
{
  "score": 85,
  "level": "良好",
  "strengths": [
    "回答要点1的优势",
    "回答要点2的优势"
  ],
  "weaknesses": [
    "不足之处1",
    "不足之处2"
  ],
  "suggestions": [
    "改进建议1",
    "改进建议2"
  ],
  "detailedFeedback": "详细的评价反馈",
  "keywordAnalysis": {
    "mentioned": ["提到的关键词"],
    "missing": ["遗漏的关键词"]
  }
}

评分说明：
- 90-100分：优秀 - 回答完整准确，逻辑清晰
- 80-89分：良好 - 回答基本正确，有小幅改进空间
- 70-79分：中等 - 回答部分正确，存在明显不足
- 60-69分：及格 - 回答有基本认识，但缺乏深度
- 60分以下：不及格 - 回答错误或严重不完整
```

## 4. API 接口设计

### 4.1 生成题目接口
```http
POST /api/questions/generate
Content-Type: application/json

{
  "topic": "Spring Boot",
  "difficulty": "Medium",
  "questionType": "概念题",
  "count": 1
}
```

**响应示例：**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "questionId": "q_001",
    "question": "请解释Spring Boot的自动配置原理",
    "type": "概念题",
    "difficulty": "Medium",
    "tags": ["Spring Boot", "自动配置", "注解"],
    "hints": ["考虑@EnableAutoConfiguration注解", "思考条件装配"]
  }
}
```

### 4.2 评价答案接口
```http
POST /api/questions/evaluate
Content-Type: application/json

{
  "questionId": "q_001",
  "userAnswer": "Spring Boot通过@EnableAutoConfiguration注解..."
}
```

**响应示例：**
```json
{
  "code": 200,
  "message": "success", 
  "data": {
    "score": 85,
    "level": "良好",
    "strengths": ["正确提到了@EnableAutoConfiguration", "理解了基本原理"],
    "weaknesses": ["缺少具体的实现细节", "没有提到条件装配"],
    "suggestions": ["可以深入了解@Conditional注解", "学习starter的工作机制"],
    "detailedFeedback": "回答基本正确..."
  }
}
```

## 5. 错误处理策略

### 5.1 AI API 调用错误处理
```java
@Component
public class AIServiceErrorHandler {
    
    // 超时重试策略
    @Retryable(value = {TimeoutException.class}, maxAttempts = 3)
    public String callAIWithRetry(String prompt);
    
    // 降级处理
    @Recover
    public String fallbackResponse(Exception ex, String prompt);
    
    // Token 限制检查
    public boolean checkTokenLimit(String prompt);
    
    // 成本预警
    public void checkCostAlert(String userId);
}
```

### 5.2 前端错误状态处理
```javascript
// API 调用状态管理
const questionStore = {
  loading: false,
  error: null,
  retryCount: 0,
  
  async generateQuestion(params) {
    try {
      this.loading = true;
      this.error = null;
      const response = await api.generateQuestion(params);
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    } finally {
      this.loading = false;
    }
  },
  
  handleError(error) {
    if (error.code === 'TIMEOUT') {
      this.error = 'AI服务响应超时，请稍后重试';
    } else if (error.code === 'RATE_LIMIT') {
      this.error = 'API调用频率过高，请稍后再试';
    } else {
      this.error = '服务暂时不可用，请稍后重试';
    }
  }
};
```

## 6. 前端界面设计

### 6.1 题目生成页面
```vue
<template>
  <el-card class="question-generator">
    <template #header>
      <h3>AI 智能出题</h3>
    </template>
    
    <el-form :model="form" :rules="rules">
      <el-form-item label="知识点" prop="topic">
        <el-input v-model="form.topic" placeholder="请输入要练习的知识点"/>
      </el-form-item>
      
      <el-form-item label="难度等级" prop="difficulty">
        <el-radio-group v-model="form.difficulty">
          <el-radio label="Easy">简单</el-radio>
          <el-radio label="Medium">中等</el-radio>
          <el-radio label="Hard">困难</el-radio>
        </el-radio-group>
      </el-form-item>
      
      <el-form-item label="题目类型" prop="questionType">
        <el-select v-model="form.questionType">
          <el-option label="概念题" value="概念题"/>
          <el-option label="场景题" value="场景题"/>
          <el-option label="代码题" value="代码题"/>
        </el-select>
      </el-form-item>
      
      <el-form-item>
        <el-button 
          type="primary" 
          @click="generateQuestion"
          :loading="loading">
          生成题目
        </el-button>
      </el-form-item>
    </el-form>
    
    <!-- 题目展示区域 -->
    <div v-if="currentQuestion" class="question-display">
      <el-divider content-position="left">题目</el-divider>
      <el-card>
        <p class="question-content">{{ currentQuestion.question }}</p>
        <el-tag :type="getDifficultyType(currentQuestion.difficulty)">
          {{ currentQuestion.difficulty }}
        </el-tag>
      </el-card>
      
      <!-- 答题区域 -->
      <el-divider content-position="left">我的回答</el-divider>
      <el-input
        v-model="userAnswer"
        type="textarea"
        :rows="6"
        placeholder="请输入你的答案..."/>
      
      <div class="submit-area">
        <el-button 
          type="success" 
          @click="submitAnswer"
          :loading="evaluating">
          提交答案
        </el-button>
      </div>
    </div>
    
    <!-- 评价结果展示 -->
    <div v-if="evaluation" class="evaluation-result">
      <el-divider content-position="left">AI 点评</el-divider>
      <el-card>
        <div class="score-display">
          <el-progress 
            :percentage="evaluation.score" 
            :color="getScoreColor(evaluation.score)"/>
          <span class="score-text">{{ evaluation.score }}分 ({{ evaluation.level }})</span>
        </div>
        
        <el-descriptions :column="1" border>
          <el-descriptions-item label="优点">
            <ul>
              <li v-for="strength in evaluation.strengths" :key="strength">
                {{ strength }}
              </li>
            </ul>
          </el-descriptions-item>
          
          <el-descriptions-item label="不足">
            <ul>
              <li v-for="weakness in evaluation.weaknesses" :key="weakness">
                {{ weakness }}
              </li>
            </ul>
          </el-descriptions-item>
          
          <el-descriptions-item label="建议">
            <ul>
              <li v-for="suggestion in evaluation.suggestions" :key="suggestion">
                {{ suggestion }}
              </li>
            </ul>
          </el-descriptions-item>
        </el-descriptions>
      </el-card>
    </div>
  </el-card>
</template>
```

## 7. 配置管理

### 7.1 后端配置文件
```yaml
# application.yml
ai:
  api:
    provider: "tongyi"  # tongyi, openai, wenxin
    key: "${AI_API_KEY:}"
    url: "${AI_API_URL:https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation}"
    timeout: 30000
    max-tokens: 2000
    temperature: 0.7
  
  retry:
    max-attempts: 3
    delay: 1000
    
  cost:
    daily-limit: 100.0  # 每日最大费用（人民币）
    warning-threshold: 0.8  # 告警阈值
```

### 7.2 前端环境配置
```javascript
// config/api.js
const config = {
  development: {
    baseURL: 'http://localhost:8080/api',
    timeout: 30000
  },
  production: {
    baseURL: '/api',
    timeout: 30000
  }
};

export default config[process.env.NODE_ENV];
```

## 8. 测试计划

### 8.1 单元测试
- AI API 调用方法测试
- Prompt 模板解析测试
- 错误处理逻辑测试

### 8.2 集成测试
- 完整的出题-答题-评价流程测试
- 不同 AI 服务商的兼容性测试
- 并发请求的处理能力测试

### 8.3 用户测试
- 生成题目的质量评估
- 评价结果的准确性验证
- 用户界面的易用性测试

## 9. 性能优化

### 9.1 缓存策略
- 相同 topic + difficulty 的题目缓存 1 小时
- 热门知识点题目预生成
- AI 评价结果缓存以避免重复调用

### 9.2 异步处理
- 题目生成异步处理，前端轮询获取结果
- 长文本评价采用流式响应
- 批量题目生成的队列处理

## 10. 部署清单

### 10.1 环境变量
```bash
# AI API 配置
AI_API_KEY=your_api_key_here
AI_API_URL=https://api.provider.com
AI_PROVIDER=tongyi

# 数据库配置（为下阶段准备）
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ai_interview
DB_USER=postgres
DB_PASSWORD=password
```

### 10.2 部署验证
- [ ] AI API 连接测试
- [ ] 题目生成功能测试
- [ ] 答案评价功能测试
- [ ] 错误处理验证
- [ ] 性能压力测试

本阶段完成后，应用将具备完整的 AI 出题和评价能力，为后续的数据存储和用户体验优化奠定基础。