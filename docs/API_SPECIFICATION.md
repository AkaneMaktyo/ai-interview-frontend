# API 接口设计文档

## 概述
本文档详细描述 AI 面试应用的 RESTful API 接口设计，包括请求格式、响应格式、错误处理等规范。

## 1. API 设计原则

### 1.1 RESTful 设计规范
- 使用标准 HTTP 方法：GET、POST、PUT、DELETE
- 资源导向的 URL 设计
- 统一的响应格式
- 合理的 HTTP 状态码使用
- 版本控制支持

### 1.2 命名规范
```
# URL 命名规范
GET    /api/v1/users/{id}           # 获取用户信息
POST   /api/v1/users               # 创建用户
PUT    /api/v1/users/{id}          # 更新用户
DELETE /api/v1/users/{id}          # 删除用户

# 资源嵌套
GET    /api/v1/users/{id}/questions     # 获取用户的题目
POST   /api/v1/users/{id}/answers       # 提交答案

# 查询参数
GET    /api/v1/questions?page=0&size=10&sort=createdAt,desc
```

### 1.3 统一响应格式
```json
{
  "code": 200,
  "message": "success",
  "data": {
    // 具体数据
  },
  "timestamp": "2024-01-15T10:30:00Z",
  "requestId": "req_123456789"
}
```

## 2. 认证授权接口

### 2.1 用户注册
```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "username": "testuser",
  "email": "test@example.com",
  "password": "Password123!",
  "nickname": "测试用户"
}
```

**响应示例：**
```json
{
  "code": 201,
  "message": "注册成功",
  "data": {
    "user": {
      "id": 1,
      "username": "testuser",
      "email": "test@example.com",
      "nickname": "测试用户",
      "createdAt": "2024-01-15T10:30:00Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 86400
  }
}
```

### 2.2 用户登录
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "Password123!"
}
```

**响应示例：**
```json
{
  "code": 200,
  "message": "登录成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "tokenType": "Bearer",
    "expiresIn": 86400,
    "user": {
      "id": 1,
      "username": "testuser",
      "nickname": "测试用户",
      "email": "test@example.com",
      "avatarUrl": "https://cdn.example.com/avatar/1.jpg",
      "lastLoginAt": "2024-01-15T10:30:00Z"
    }
  }
}
```

### 2.3 刷新令牌
```http
POST /api/v1/auth/refresh
Authorization: Bearer {token}
Content-Type: application/json

{
  "refreshToken": "refresh_token_here"
}
```

### 2.4 用户登出
```http
POST /api/v1/auth/logout
Authorization: Bearer {token}
```

## 3. 用户管理接口

### 3.1 获取个人信息
```http
GET /api/v1/users/profile
Authorization: Bearer {token}
```

**响应示例：**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": 1,
    "username": "testuser",
    "nickname": "测试用户",
    "email": "test@example.com",
    "avatarUrl": "https://cdn.example.com/avatar/1.jpg",
    "preferences": {
      "preferredDifficulty": "Medium",
      "favoriteTopics": ["Java", "Spring Boot", "数据库"],
      "dailyQuestionGoal": 5,
      "studyTimePreference": "evening",
      "enableReminders": true,
      "reminderTime": "20:00"
    },
    "statistics": {
      "totalQuestions": 156,
      "correctAnswers": 112,
      "averageScore": 78.5,
      "totalStudyTime": 28800,
      "currentStreak": 7,
      "longestStreak": 15,
      "lastActiveDate": "2024-01-15T08:30:00Z"
    },
    "createdAt": "2024-01-01T10:00:00Z"
  }
}
```

### 3.2 更新个人信息
```http
PUT /api/v1/users/profile
Authorization: Bearer {token}
Content-Type: application/json

{
  "nickname": "新昵称",
  "avatarUrl": "https://cdn.example.com/avatar/new.jpg"
}
```

### 3.3 更新学习偏好
```http
PUT /api/v1/users/preferences
Authorization: Bearer {token}
Content-Type: application/json

{
  "preferredDifficulty": "Hard",
  "favoriteTopics": ["Java", "Spring Boot", "微服务", "数据库"],
  "dailyQuestionGoal": 8,
  "studyTimePreference": "morning",
  "enableReminders": true,
  "reminderTime": "09:00"
}
```

### 3.4 修改密码
```http
PUT /api/v1/users/password
Authorization: Bearer {token}
Content-Type: application/json

{
  "currentPassword": "OldPassword123!",
  "newPassword": "NewPassword123!"
}
```

## 4. 题目管理接口

### 4.1 生成题目
```http
POST /api/v1/questions/generate
Authorization: Bearer {token}
Content-Type: application/json

{
  "topic": "Spring Boot 自动配置",
  "difficulty": "Medium",
  "questionType": "概念题",
  "count": 1,
  "tags": ["Spring Boot", "自动配置"],
  "customRequirements": "请重点考察注解的使用"
}
```

**响应示例：**
```json
{
  "code": 200,
  "message": "题目生成成功",
  "data": {
    "questionId": "q_123456",
    "title": "Spring Boot 自动配置原理详解",
    "content": "# Spring Boot 自动配置机制\n\n请详细解释 Spring Boot 的自动配置机制是如何工作的？请从以下几个方面来回答：\n\n1. @EnableAutoConfiguration 注解的作用\n2. 条件装配的实现原理\n3. starter 的工作机制\n4. 如何自定义自动配置\n\n请结合具体代码示例进行说明。",
    "type": "概念题",
    "difficulty": "Medium",
    "tags": ["Spring Boot", "自动配置", "注解"],
    "hints": [
      "考虑 @Conditional 注解的作用",
      "思考 spring.factories 文件的作用",
      "分析 AutoConfigurationImportSelector 的工作原理"
    ],
    "expectedAnswer": "Spring Boot 自动配置主要通过以下机制实现...",
    "evaluationCriteria": [
      "是否正确解释了 @EnableAutoConfiguration 的作用",
      "是否理解条件装配的原理",
      "是否能够说明 starter 的工作机制",
      "是否提供了代码示例"
    ],
    "estimatedTime": 15,
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

### 4.2 获取推荐题目
```http
GET /api/v1/questions/recommended?topic=Java&difficulty=Medium&count=5
Authorization: Bearer {token}
```

**查询参数：**
- `topic`: 主题筛选
- `difficulty`: 难度筛选 (Easy/Medium/Hard)
- `count`: 题目数量
- `excludeAnswered`: 是否排除已答题目 (true/false)

### 4.3 获取题目详情
```http
GET /api/v1/questions/{questionId}
Authorization: Bearer {token}
```

### 4.4 搜索题目
```http
GET /api/v1/questions/search?keyword=Spring&page=0&size=10
Authorization: Bearer {token}
```

**查询参数：**
- `keyword`: 搜索关键词
- `tags`: 标签筛选 (多个用逗号分隔)
- `difficulty`: 难度筛选
- `type`: 题目类型筛选
- `page`: 页码 (从0开始)
- `size`: 每页大小
- `sort`: 排序字段,排序方向

## 5. 答题相关接口

### 5.1 提交答案
```http
POST /api/v1/answers/submit
Authorization: Bearer {token}
Content-Type: application/json

{
  "questionId": "q_123456",
  "userAnswer": "Spring Boot 的自动配置机制主要通过 @EnableAutoConfiguration 注解实现。当应用启动时，Spring Boot 会扫描 classpath 下的 META-INF/spring.factories 文件，找到所有的自动配置类...",
  "timeSpent": 900,
  "isSkipped": false
}
```

**响应示例：**
```json
{
  "code": 200,
  "message": "答案提交成功",
  "data": {
    "recordId": "ar_789012",
    "evaluation": {
      "score": 85,
      "level": "良好",
      "strengths": [
        "正确解释了 @EnableAutoConfiguration 的作用",
        "理解了 spring.factories 的作用机制",
        "提供了清晰的代码示例"
      ],
      "weaknesses": [
        "缺少对条件装配的深入分析",
        "没有提到 AutoConfigurationImportSelector 的作用"
      ],
      "suggestions": [
        "建议深入学习 @Conditional 系列注解",
        "可以研究 Spring Boot 源码中的自动配置实现",
        "尝试自己编写一个简单的 starter"
      ],
      "detailedFeedback": "回答整体质量较好，对 Spring Boot 自动配置有基本正确的理解。特别是对 @EnableAutoConfiguration 和 spring.factories 的解释比较准确。但在条件装配和具体实现细节方面还有提升空间。",
      "keywordAnalysis": {
        "mentioned": ["@EnableAutoConfiguration", "spring.factories", "自动配置类"],
        "missing": ["@Conditional", "AutoConfigurationImportSelector", "条件装配"]
      }
    },
    "isCorrect": true,
    "submittedAt": "2024-01-15T10:45:00Z"
  }
}
```

### 5.2 获取答题历史
```http
GET /api/v1/answers/history?page=0&size=10&sort=createdAt,desc
Authorization: Bearer {token}
```

**查询参数：**
- `page`: 页码
- `size`: 每页大小
- `sort`: 排序方式
- `difficulty`: 难度筛选
- `score`: 分数范围筛选 (格式: min,max)
- `startDate`: 开始日期
- `endDate`: 结束日期

**响应示例：**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "content": [
      {
        "id": "ar_789012",
        "question": {
          "id": "q_123456",
          "title": "Spring Boot 自动配置原理详解",
          "difficulty": "Medium",
          "type": "概念题",
          "tags": ["Spring Boot", "自动配置"]
        },
        "userAnswer": "Spring Boot 的自动配置机制主要通过...",
        "evaluation": {
          "score": 85,
          "level": "良好"
        },
        "timeSpent": 900,
        "submittedAt": "2024-01-15T10:45:00Z"
      }
    ],
    "totalElements": 156,
    "totalPages": 16,
    "currentPage": 0,
    "size": 10,
    "hasNext": true,
    "hasPrevious": false
  }
}
```

### 5.3 获取错题集
```http
GET /api/v1/answers/wrong-questions?page=0&size=10
Authorization: Bearer {token}
```

**响应示例：**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "content": [
      {
        "id": "wq_345678",
        "question": {
          "id": "q_789012",
          "title": "MySQL 索引优化策略",
          "difficulty": "Hard",
          "type": "场景题"
        },
        "firstAttempt": {
          "score": 45,
          "submittedAt": "2024-01-10T14:20:00Z",
          "weaknesses": ["索引选择策略不当", "没有考虑复合索引"]
        },
        "retryCount": 2,
        "lastRetryAt": "2024-01-14T16:30:00Z",
        "bestScore": 72,
        "isMastered": false,
        "masteryProgress": 0.6
      }
    ],
    "totalElements": 23,
    "totalPages": 3,
    "summary": {
      "totalWrongQuestions": 23,
      "masteredCount": 8,
      "improvingCount": 12,
      "stagnantCount": 3
    }
  }
}
```

### 5.4 重做错题
```http
POST /api/v1/answers/retry/{wrongQuestionId}
Authorization: Bearer {token}
```

## 6. 学习分析接口

### 6.1 获取学习统计
```http
GET /api/v1/analytics/statistics?period=week
Authorization: Bearer {token}
```

**查询参数：**
- `period`: 统计周期 (day/week/month/year)
- `startDate`: 开始日期
- `endDate`: 结束日期

**响应示例：**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "overview": {
      "totalQuestions": 156,
      "correctAnswers": 112,
      "accuracy": 71.8,
      "averageScore": 78.5,
      "totalStudyTime": 28800,
      "currentStreak": 7,
      "weeklyProgress": 87.5
    },
    "dailyStats": [
      {
        "date": "2024-01-15",
        "questionsCount": 8,
        "averageScore": 82.3,
        "studyTime": 1800,
        "accuracy": 87.5
      }
    ],
    "topicDistribution": [
      {
        "topic": "Java 基础",
        "questionsCount": 45,
        "averageScore": 82.1,
        "accuracy": 80.0,
        "improvementTrend": "UP"
      }
    ],
    "difficultyDistribution": {
      "Easy": { "count": 52, "accuracy": 92.3 },
      "Medium": { "count": 78, "accuracy": 74.4 },
      "Hard": { "count": 26, "accuracy": 53.8 }
    },
    "learningTrend": {
      "direction": "IMPROVING",
      "slope": 0.15,
      "correlation": 0.78
    }
  }
}
```

### 6.2 获取学习报告
```http
GET /api/v1/analytics/report?type=weekly&format=json
Authorization: Bearer {token}
```

**查询参数：**
- `type`: 报告类型 (daily/weekly/monthly)
- `format`: 输出格式 (json/pdf)

### 6.3 获取薄弱点分析
```http
GET /api/v1/analytics/weaknesses
Authorization: Bearer {token}
```

**响应示例：**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "weakTopics": [
      {
        "topic": "数据库优化",
        "weaknessScore": 0.75,
        "specificAreas": ["索引设计", "查询优化", "分区策略"],
        "attemptCount": 12,
        "improvementRate": 0.15,
        "recommendedStudyTime": 480
      }
    ],
    "masteryLevels": {
      "Java 基础": 0.85,
      "Spring Framework": 0.72,
      "数据库": 0.48
    },
    "recommendedStudyPath": [
      "数据库基础概念复习",
      "SQL 优化技巧学习",
      "索引设计原理深入",
      "实际案例练习"
    ],
    "priorityMatrix": {
      "highPriorityHighImpact": ["数据库优化", "算法设计"],
      "highPriorityLowImpact": ["设计模式"],
      "lowPriorityHighImpact": ["微服务架构"],
      "lowPriorityLowImpact": ["工具使用"]
    }
  }
}
```

### 6.4 获取学习建议
```http
GET /api/v1/analytics/recommendations
Authorization: Bearer {token}
```

## 7. 知识点管理接口

### 7.1 获取知识点列表
```http
GET /api/v1/knowledge/tags?category=backend
Authorization: Bearer {token}
```

### 7.2 获取知识点统计
```http
GET /api/v1/knowledge/tags/{tagId}/statistics
Authorization: Bearer {token}
```

## 8. 系统管理接口

### 8.1 获取系统状态
```http
GET /api/v1/system/health
```

**响应示例：**
```json
{
  "code": 200,
  "message": "系统运行正常",
  "data": {
    "status": "UP",
    "components": {
      "database": {
        "status": "UP",
        "details": {
          "connectionPool": "HEALTHY",
          "responseTime": "15ms"
        }
      },
      "redis": {
        "status": "UP",
        "details": {
          "memory": "245MB",
          "connections": 12
        }
      },
      "aiService": {
        "status": "UP",
        "details": {
          "provider": "TongYi",
          "lastCheck": "2024-01-15T10:45:00Z"
        }
      }
    },
    "timestamp": "2024-01-15T10:45:30Z"
  }
}
```

### 8.2 获取系统配置
```http
GET /api/v1/system/config
Authorization: Bearer {admin_token}
```

## 9. 错误处理

### 9.1 错误响应格式
```json
{
  "code": 400,
  "message": "请求参数错误",
  "error": {
    "type": "VALIDATION_ERROR",
    "details": [
      {
        "field": "email",
        "message": "邮箱格式不正确"
      }
    ]
  },
  "timestamp": "2024-01-15T10:30:00Z",
  "requestId": "req_123456789"
}
```

### 9.2 常见错误码
```yaml
# 认证授权相关
401: 未认证或令牌过期
403: 权限不足
404: 资源不存在
409: 资源冲突（如邮箱已存在）

# 请求相关
400: 请求参数错误
422: 业务逻辑错误
429: 请求频率限制

# 服务器相关
500: 内部服务器错误
502: 外部服务不可用（如AI API）
503: 服务暂时不可用
504: 请求超时
```

### 9.3 错误详细说明
```json
{
  "error": {
    "type": "AI_SERVICE_ERROR",
    "code": "AI_API_TIMEOUT",
    "message": "AI 服务调用超时",
    "details": {
      "provider": "TongYi",
      "timeout": "30s",
      "retryCount": 3
    },
    "suggestions": [
      "请稍后重试",
      "如果问题持续，请联系客服"
    ]
  }
}
```

## 10. API 版本控制

### 10.1 版本策略
- URL 路径版本控制：`/api/v1/`, `/api/v2/`
- 向后兼容原则
- 版本生命周期管理

### 10.2 版本信息
```http
GET /api/version
```

**响应示例：**
```json
{
  "currentVersion": "v1",
  "supportedVersions": ["v1"],
  "deprecatedVersions": [],
  "latestVersion": "v1",
  "versionInfo": {
    "v1": {
      "releaseDate": "2024-01-01",
      "features": ["基础功能", "AI出题", "答题评价"],
      "status": "STABLE"
    }
  }
}
```

## 11. API 限流

### 11.1 限流策略
```yaml
rateLimits:
  default: "100/hour"
  authenticated: "1000/hour"
  premium: "5000/hour"
  
  endpoints:
    "/api/v1/questions/generate": "10/hour"
    "/api/v1/answers/submit": "50/hour"
    "/api/v1/auth/login": "5/minute"
```

### 11.2 限流响应
```json
{
  "code": 429,
  "message": "请求频率过高",
  "error": {
    "type": "RATE_LIMIT_EXCEEDED",
    "limit": 100,
    "remaining": 0,
    "resetTime": "2024-01-15T11:00:00Z"
  }
}
```

本 API 接口设计文档为前端开发和第三方集成提供了完整的接口规范，确保系统的可维护性和扩展性。