# AI 面试应用技术架构文档

## 概述
本文档详细描述了 AI 面试应用的整体技术架构，包括系统架构、技术选型、部署方案等关键设计决策。

## 1. 系统架构

### 1.1 总体架构图
```
┌─────────────────────────────────────────────────────────────────┐
│                        前端层 (Presentation Layer)                 │
├─────────────────────────────────────────────────────────────────┤
│  Vue 3 SPA  │  PWA支持  │  响应式设计  │  多主题  │  离线缓存     │
├─────────────────────────────────────────────────────────────────┤
│                        网关层 (Gateway Layer)                     │
├─────────────────────────────────────────────────────────────────┤
│      Nginx       │    负载均衡    │    SSL终止    │   静态资源    │
├─────────────────────────────────────────────────────────────────┤
│                        应用层 (Application Layer)                  │
├─────────────────────────────────────────────────────────────────┤
│  Spring Boot  │  JWT认证  │  RESTful API  │  WebSocket  │ 定时任务 │
├─────────────────────────────────────────────────────────────────┤
│                        服务层 (Service Layer)                     │
├─────────────────────────────────────────────────────────────────┤
│  AI服务  │  用户服务  │  题目服务  │  分析服务  │  通知服务  │ 同步服务 │
├─────────────────────────────────────────────────────────────────┤
│                        数据层 (Data Layer)                        │
├─────────────────────────────────────────────────────────────────┤
│   PostgreSQL   │    Redis     │   MinIO/S3   │  Elasticsearch    │
│   (主数据库)    │   (缓存)     │  (文件存储)   │   (搜索引擎)       │
├─────────────────────────────────────────────────────────────────┤
│                        外部服务 (External Services)                │
├─────────────────────────────────────────────────────────────────┤
│  通义千问API  │  邮件服务  │  短信服务  │  CDN服务  │  监控服务     │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 架构层次说明

#### 前端层 (Presentation Layer)
- **技术栈**: Vue 3 + Vite + Element Plus + TypeScript
- **职责**: 用户界面展示、交互处理、状态管理
- **特性**: 响应式设计、PWA支持、主题切换、离线功能

#### 网关层 (Gateway Layer)
- **技术栈**: Nginx + SSL + Load Balancer
- **职责**: 请求路由、负载均衡、SSL终止、静态资源服务
- **特性**: 高可用、安全性、性能优化

#### 应用层 (Application Layer)
- **技术栈**: Spring Boot + Spring Security + Spring WebFlux
- **职责**: API网关、认证授权、请求处理、业务协调
- **特性**: 微服务架构、JWT认证、异步处理

#### 服务层 (Service Layer)
- **技术栈**: Spring Boot + Spring Data JPA + Spring Cache
- **职责**: 业务逻辑处理、数据操作、外部服务调用
- **特性**: 服务解耦、缓存策略、事务管理

#### 数据层 (Data Layer)
- **技术栈**: PostgreSQL + Redis + MinIO + Elasticsearch
- **职责**: 数据持久化、缓存管理、文件存储、全文搜索
- **特性**: 数据一致性、高性能、高可用

## 2. 技术选型详解

### 2.1 前端技术栈

#### Vue 3 生态系统
```javascript
// 核心技术栈
{
  "framework": "Vue 3.4+",
  "buildTool": "Vite 5.0+",
  "uiLibrary": "Element Plus 2.4+",
  "language": "TypeScript 5.0+",
  "stateManagement": "Pinia 2.0+",
  "routing": "Vue Router 4.0+",
  "httpClient": "Axios 1.6+",
  "testing": "Vitest + Vue Test Utils"
}
```

#### 选型理由
- **Vue 3**: 组合式API、更好的TypeScript支持、性能提升
- **Vite**: 极快的开发服务器、优秀的构建性能
- **Element Plus**: 企业级组件库、丰富的组件生态
- **TypeScript**: 类型安全、更好的开发体验
- **Pinia**: 轻量级状态管理、Vue 3原生支持

### 2.2 后端技术栈

#### Spring Boot 生态系统
```yaml
# 核心依赖
dependencies:
  - spring-boot-starter-web: "3.2+"
  - spring-boot-starter-security: "3.2+"
  - spring-boot-starter-data-jpa: "3.2+"
  - spring-boot-starter-cache: "3.2+"
  - spring-boot-starter-validation: "3.2+"
  - spring-boot-starter-actuator: "3.2+"
  - postgresql: "42.7+"
  - redis: "lettuce-core 6.3+"
  - jwt: "jjwt 0.12+"
  - flyway: "9.22+"
```

#### 选型理由
- **Spring Boot**: 快速开发、自动配置、生产就绪
- **Spring Security**: 强大的安全框架、JWT集成
- **Spring Data JPA**: ORM简化、Repository模式
- **PostgreSQL**: 强大的关系型数据库、JSON支持
- **Redis**: 高性能缓存、分布式锁支持

### 2.3 数据库设计

#### 主数据库 - PostgreSQL
```sql
-- 数据库配置
CREATE DATABASE ai_interview 
  WITH ENCODING 'UTF8' 
  LC_COLLATE='zh_CN.UTF-8' 
  LC_CTYPE='zh_CN.UTF-8';

-- 核心表结构
CREATE SCHEMA app;
CREATE SCHEMA audit;
CREATE SCHEMA analytics;

-- 启用扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";
```

#### 缓存层 - Redis
```yaml
# Redis 配置
redis:
  cluster:
    nodes:
      - "redis-1:6379"
      - "redis-2:6379" 
      - "redis-3:6379"
  cache:
    type: "redis"
    time-to-live: "PT10M"  # 10分钟
  session:
    store-type: "redis"
    timeout: "PT30M"       # 30分钟
```

### 2.4 微服务架构

#### 服务拆分策略
```
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   用户服务        │  │   题目服务        │  │   AI服务          │
│ User Service    │  │Question Service │  │  AI Service     │
│                 │  │                 │  │                 │
│ • 用户注册登录    │  │ • 题目管理        │  │ • AI API调用     │
│ • 个人资料管理    │  │ • 题目生成        │  │ • Prompt工程     │
│ • 权限控制       │  │ • 题目搜索        │  │ • 结果解析       │
└─────────────────┘  └─────────────────┘  └─────────────────┘

┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   答题服务        │  │   分析服务        │  │   通知服务        │
│ Answer Service  │  │Analytics Service│  │Notification Svc │
│                 │  │                 │  │                 │
│ • 答题记录        │  │ • 学习分析        │  │ • 邮件通知       │
│ • 评分系统        │  │ • 数据统计        │  │ • 推送通知       │
│ • 错题管理        │  │ • 报表生成        │  │ • 短信提醒       │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

## 3. 数据流架构

### 3.1 请求处理流程
```
用户请求 → Nginx → Load Balancer → API Gateway → 
认证中间件 → 业务服务 → 数据访问层 → 数据库 → 响应返回
```

### 3.2 AI 处理流程
```
用户出题请求 → 题目服务 → AI服务 → 外部AI API → 
结果解析 → 数据存储 → 异步处理 → 结果返回
```

### 3.3 数据同步流程
```
本地数据变更 → 同步队列 → 云端API → 数据校验 → 
冲突检测 → 数据合并 → 本地更新 → 同步完成
```

## 4. 安全架构

### 4.1 认证授权体系
```java
// JWT 认证流程
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    
    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                   HttpServletResponse response,
                                   FilterChain filterChain) throws ServletException, IOException {
        
        // 1. 提取Token
        String token = extractTokenFromRequest(request);
        
        // 2. 验证Token
        if (token != null && jwtTokenProvider.validateToken(token)) {
            // 3. 获取用户信息
            Authentication auth = jwtTokenProvider.getAuthentication(token);
            SecurityContextHolder.getContext().setAuthentication(auth);
        }
        
        filterChain.doFilter(request, response);
    }
}
```

### 4.2 数据安全策略
```yaml
# 数据加密配置
security:
  encryption:
    key-management: "AWS KMS"
    data-at-rest: "AES-256"
    data-in-transit: "TLS 1.3"
    
  access-control:
    rbac: true
    row-level-security: true
    audit-logging: true
    
  privacy:
    data-masking: true
    anonymization: true
    gdpr-compliance: true
```

### 4.3 API 安全措施
```java
// 接口限流配置
@Configuration
public class RateLimitConfig {
    
    @Bean
    public RedisRateLimiter rateLimiter() {
        return new RedisRateLimiter(
            10,  // replenishRate: 每秒补充令牌数
            20,  // burstCapacity: 令牌桶容量
            1    // requestedTokens: 每次请求消耗令牌数
        );
    }
}

// 防护措施
@RestController
@RequestMapping("/api")
public class SecurityController {
    
    @PostMapping("/login")
    @RateLimit(value = "5/min") // 每分钟最多5次登录尝试
    public ResponseEntity<?> login(@RequestBody @Valid LoginRequest request) {
        // 登录逻辑
        return ResponseEntity.ok(authService.authenticate(request));
    }
}
```

## 5. 性能架构

### 5.1 缓存策略
```java
// 多级缓存架构
@Configuration
@EnableCaching
public class CacheConfig {
    
    // L1: 本地缓存 (Caffeine)
    @Bean
    public CacheManager localCacheManager() {
        CaffeineCacheManager manager = new CaffeineCacheManager();
        manager.setCaffeine(Caffeine.newBuilder()
            .maximumSize(1000)
            .expireAfterWrite(5, TimeUnit.MINUTES));
        return manager;
    }
    
    // L2: 分布式缓存 (Redis)
    @Bean
    public CacheManager redisCacheManager() {
        RedisCacheConfiguration config = RedisCacheConfiguration.defaultCacheConfig()
            .entryTtl(Duration.ofMinutes(30))
            .serializeKeysWith(RedisSerializationContext.SerializationPair
                .fromSerializer(new StringRedisSerializer()))
            .serializeValuesWith(RedisSerializationContext.SerializationPair
                .fromSerializer(new GenericJackson2JsonRedisSerializer()));
        
        return RedisCacheManager.builder(redisConnectionFactory)
            .cacheDefaults(config)
            .build();
    }
}
```

### 5.2 数据库优化
```sql
-- 索引策略
CREATE INDEX CONCURRENTLY idx_answer_records_user_created 
ON answer_records(user_id, created_at DESC);

CREATE INDEX CONCURRENTLY idx_questions_tags_gin 
ON questions USING GIN(tags);

CREATE INDEX CONCURRENTLY idx_questions_difficulty_type 
ON questions(difficulty, question_type) WHERE is_active = true;

-- 分区策略
CREATE TABLE answer_records_2024 PARTITION OF answer_records
FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');

-- 查询优化
EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM answer_records 
WHERE user_id = ? AND created_at >= ? 
ORDER BY created_at DESC LIMIT 20;
```

### 5.3 异步处理架构
```java
// 异步任务配置
@Configuration
@EnableAsync
public class AsyncConfig implements AsyncConfigurer {
    
    @Override
    @Bean(name = "taskExecutor")
    public Executor getAsyncExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(10);
        executor.setMaxPoolSize(50);
        executor.setQueueCapacity(200);
        executor.setThreadNamePrefix("AsyncTask-");
        executor.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy());
        executor.initialize();
        return executor;
    }
}

// 异步服务示例
@Service
public class AsyncAnalyticsService {
    
    @Async("taskExecutor")
    public CompletableFuture<AnalyticsReport> generateReport(Long userId) {
        // 耗时的分析计算
        AnalyticsReport report = performComplexAnalysis(userId);
        return CompletableFuture.completedFuture(report);
    }
}
```

## 6. 监控和运维

### 6.1 应用监控
```yaml
# Spring Boot Actuator 配置
management:
  endpoints:
    web:
      exposure:
        include: "health,info,metrics,prometheus"
  endpoint:
    health:
      show-details: always
  metrics:
    export:
      prometheus:
        enabled: true
        
# Micrometer 指标配置
micrometer:
  custom:
    metrics:
      - ai_api_calls_total
      - question_generation_duration
      - user_session_duration
      - answer_evaluation_accuracy
```

### 6.2 日志架构
```xml
<!-- logback-spring.xml -->
<configuration>
    <springProfile name="!prod">
        <appender name="CONSOLE" class="ch.qos.logback.core.ConsoleAppender">
            <encoder class="net.logstash.logback.encoder.LoggingEventCompositeJsonEncoder">
                <providers>
                    <timestamp/>
                    <logLevel/>
                    <loggerName/>
                    <message/>
                    <mdc/>
                    <stackTrace/>
                </providers>
            </encoder>
        </appender>
    </springProfile>
    
    <springProfile name="prod">
        <appender name="FILE" class="ch.qos.logback.core.rolling.RollingFileAppender">
            <file>logs/ai-interview.log</file>
            <rollingPolicy class="ch.qos.logback.core.rolling.TimeBasedRollingPolicy">
                <fileNamePattern>logs/ai-interview.%d{yyyy-MM-dd}.%i.gz</fileNamePattern>
                <maxFileSize>100MB</maxFileSize>
                <maxHistory>30</maxHistory>
            </rollingPolicy>
        </appender>
    </springProfile>
</configuration>
```

### 6.3 健康检查
```java
// 自定义健康检查
@Component
public class AIServiceHealthIndicator implements HealthIndicator {
    
    private final AIService aiService;
    
    @Override
    public Health health() {
        try {
            // 检查AI服务连通性
            boolean isHealthy = aiService.healthCheck();
            
            if (isHealthy) {
                return Health.up()
                    .withDetail("ai-service", "Available")
                    .withDetail("last-check", Instant.now())
                    .build();
            } else {
                return Health.down()
                    .withDetail("ai-service", "Unavailable")
                    .withDetail("error", "Health check failed")
                    .build();
            }
        } catch (Exception e) {
            return Health.down(e)
                .withDetail("ai-service", "Error")
                .build();
        }
    }
}
```

## 7. 部署架构

### 7.1 容器化部署
```dockerfile
# 多阶段构建
FROM node:18-alpine AS frontend-builder
WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci --production
COPY frontend/ .
RUN npm run build

FROM maven:3.9-openjdk-17 AS backend-builder
WORKDIR /app
COPY backend/pom.xml .
RUN mvn dependency:go-offline
COPY backend/src ./src
RUN mvn clean package -DskipTests

FROM openjdk:17-jre-slim AS runtime
WORKDIR /app
COPY --from=backend-builder /app/target/*.jar app.jar
COPY --from=frontend-builder /app/dist ./static

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:8080/actuator/health || exit 1

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

### 7.2 K8s 部署配置
```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ai-interview-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: ai-interview
  template:
    metadata:
      labels:
        app: ai-interview
    spec:
      containers:
      - name: app
        image: ai-interview:latest
        ports:
        - containerPort: 8080
        env:
        - name: SPRING_PROFILES_ACTIVE
          value: "production"
        - name: DB_HOST
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: host
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /actuator/health
            port: 8080
          initialDelaySeconds: 60
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /actuator/health/readiness
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 5
```

### 7.3 服务网格配置
```yaml
# istio-gateway.yaml
apiVersion: networking.istio.io/v1alpha3
kind: Gateway
metadata:
  name: ai-interview-gateway
spec:
  selector:
    istio: ingressgateway
  servers:
  - port:
      number: 443
      name: https
      protocol: HTTPS
    tls:
      mode: SIMPLE
      credentialName: ai-interview-tls
    hosts:
    - ai-interview.example.com

---
apiVersion: networking.istio.io/v1alpha3
kind: VirtualService
metadata:
  name: ai-interview-vs
spec:
  hosts:
  - ai-interview.example.com
  gateways:
  - ai-interview-gateway
  http:
  - match:
    - uri:
        prefix: /api/
    route:
    - destination:
        host: ai-interview-service
        port:
          number: 8080
    fault:
      delay:
        percentage:
          value: 0.1
        fixedDelay: 5s
    retries:
      attempts: 3
      perTryTimeout: 10s
```

## 8. 扩展性设计

### 8.1 水平扩展策略
```yaml
# HPA 配置
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: ai-interview-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: ai-interview-app
  minReplicas: 2
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 60
      policies:
      - type: Percent
        value: 100
        periodSeconds: 60
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 10
        periodSeconds: 60
```

### 8.2 数据库扩展
```sql
-- 读写分离配置
-- 主库配置
CREATE PUBLICATION ai_interview_pub FOR ALL TABLES;

-- 从库配置  
CREATE SUBSCRIPTION ai_interview_sub 
CONNECTION 'host=master-db port=5432 user=replica_user password=xxx dbname=ai_interview'
PUBLICATION ai_interview_pub;

-- 分片策略
CREATE TABLE answer_records (
    id BIGSERIAL,
    user_id BIGINT,
    shard_key TEXT GENERATED ALWAYS AS (
        CASE 
            WHEN user_id % 4 = 0 THEN 'shard_0'
            WHEN user_id % 4 = 1 THEN 'shard_1' 
            WHEN user_id % 4 = 2 THEN 'shard_2'
            ELSE 'shard_3'
        END
    ) STORED,
    -- 其他字段...
    PRIMARY KEY (id, shard_key)
) PARTITION BY LIST (shard_key);
```

本技术架构文档为 AI 面试应用提供了完整的技术实现蓝图，涵盖了从前端到后端、从开发到部署的全方位技术方案，确保系统的可扩展性、可维护性和高性能。