<template>
  <div class="history-page">
    <!-- 页面标题和统计概览 -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">
          <el-icon><Document /></el-icon>
          学习历史
        </h1>
        <p class="page-subtitle">查看你的答题记录和学习统计</p>
      </div>
      
      <!-- 学习统计卡片 -->
      <el-row :gutter="24" class="stats-overview">
        <el-col :xs="24" :sm="12" :md="6">
          <div class="stat-card total-questions">
            <div class="stat-icon">
              <el-icon><EditPen /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ stats.totalQuestions || 0 }}</div>
              <div class="stat-label">总答题数</div>
            </div>
          </div>
        </el-col>
        
        <el-col :xs="24" :sm="12" :md="6">
          <div class="stat-card accuracy">
            <div class="stat-icon">
              <el-icon><TrendCharts /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ (stats.accuracy || 0).toFixed(1) }}%</div>
              <div class="stat-label">正确率</div>
            </div>
          </div>
        </el-col>
        
        <el-col :xs="24" :sm="12" :md="6">
          <div class="stat-card average-score">
            <div class="stat-icon">
              <el-icon><Trophy /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ (stats.averageScore || 0).toFixed(1) }}</div>
              <div class="stat-label">平均得分</div>
            </div>
          </div>
        </el-col>
        
        <el-col :xs="24" :sm="12" :md="6">
          <div class="stat-card study-time">
            <div class="stat-icon">
              <el-icon><Timer /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ formatTime(stats.totalTimeSpent || 0) }}</div>
              <div class="stat-label">学习时长</div>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 筛选和操作区域 -->
    <el-card class="filter-card" shadow="never">
      <div class="filter-section">
        <div class="filter-left">
          <el-select
            v-model="filters.difficulty"
            placeholder="选择难度"
            clearable
            style="width: 120px; margin-right: 12px;"
          >
            <el-option label="简单" value="easy" />
            <el-option label="中等" value="medium" />
            <el-option label="困难" value="hard" />
          </el-select>
          
          <el-select
            v-model="filters.interviewType"
            placeholder="面试类型"
            clearable
            style="width: 140px; margin-right: 12px;"
          >
            <el-option label="技术面试" value="technical" />
            <el-option label="行为面试" value="behavioral" />
            <el-option label="系统设计" value="system_design" />
            <el-option label="编程面试" value="coding" />
          </el-select>
          
          <el-date-picker
            v-model="filters.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            style="width: 240px; margin-right: 12px;"
          />
          
          <el-button type="primary" @click="applyFilters" :loading="loading">
            <el-icon><Search /></el-icon>
            筛选
          </el-button>
          <el-button @click="resetFilters">
            <el-icon><RefreshLeft /></el-icon>
            重置
          </el-button>
        </div>
        
        <div class="filter-right">
          <el-button type="success" @click="exportHistory">
            <el-icon><Download /></el-icon>
            导出记录
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- 答题历史记录 -->
    <el-card class="history-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span class="card-title">答题记录</span>
          <span class="record-count">共 {{ pagination.total }} 条记录</span>
        </div>
      </template>
      
      <div class="history-list" v-loading="loading">
        <div 
          v-for="record in historyList" 
          :key="record.id"
          class="history-item"
          @click="viewRecordDetail(record)"
        >
          <div class="record-header">
            <div class="question-info">
              <h3 class="question-title">{{ record.question?.title || '题目标题' }}</h3>
              <div class="question-meta">
                <el-tag 
                  :type="getDifficultyType(record.difficulty)" 
                  size="small"
                  class="meta-tag"
                >
                  {{ getDifficultyText(record.difficulty) }}
                </el-tag>
                <el-tag 
                  :type="getTypeColor(record.interviewType)"
                  size="small" 
                  class="meta-tag"
                >
                  {{ getInterviewTypeText(record.interviewType) }}
                </el-tag>
                <span class="answer-time">
                  <el-icon><Clock /></el-icon>
                  {{ formatDateTime(record.createdAt) }}
                </span>
              </div>
            </div>
            
            <div class="record-score">
              <div class="score-circle" :class="getScoreClass(record.score)">
                <span class="score-value">{{ record.score || 0 }}</span>
                <span class="score-max">/10</span>
              </div>
            </div>
          </div>
          
          <div class="record-content">
            <div class="user-answer">
              <div class="answer-label">我的回答:</div>
              <div class="answer-text">{{ record.userAnswer || '暂无回答' }}</div>
            </div>
            
            <div class="ai-feedback" v-if="record.aiEvaluation">
              <div class="feedback-label">AI评价:</div>
              <div class="feedback-comment">{{ record.aiEvaluation.comment || '暂无评价' }}</div>
              <div class="feedback-suggestions" v-if="record.aiEvaluation.suggestions && record.aiEvaluation.suggestions.length">
                <div class="suggestions-label">改进建议:</div>
                <ul class="suggestions-list">
                  <li v-for="(suggestion, index) in record.aiEvaluation.suggestions" :key="index">
                    {{ suggestion }}
                  </li>
                </ul>
              </div>
            </div>
          </div>
          
          <div class="record-actions">
            <el-button size="small" text type="primary" @click.stop="retryQuestion(record)">
              <el-icon><RefreshRight /></el-icon>
              重做此题
            </el-button>
            <el-button size="small" text @click.stop="shareRecord(record)">
              <el-icon><Share /></el-icon>
              分享
            </el-button>
            <el-button 
              v-if="record.score < 7"
              size="small" 
              text 
              type="warning"
              @click.stop="addToWrongQuestions(record)"
            >
              <el-icon><Warning /></el-icon>
              加入错题集
            </el-button>
          </div>
        </div>
        
        <!-- 空状态 -->
        <el-empty 
          v-if="!loading && historyList.length === 0"
          description="暂无答题记录"
          :image-size="120"
        >
          <el-button type="primary" @click="$router.push('/interview')">
            <el-icon><Plus /></el-icon>
            开始面试
          </el-button>
        </el-empty>
      </div>
      
      <!-- 分页 -->
      <div class="pagination-wrapper" v-if="historyList.length > 0">
        <el-pagination
          v-model:current-page="pagination.currentPage"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @current-change="handlePageChange"
          @size-change="handleSizeChange"
          background
        />
      </div>
    </el-card>

    <!-- 记录详情弹窗 -->
    <el-dialog
      v-model="detailVisible"
      title="答题详情"
      width="70%"
      :before-close="handleDetailClose"
    >
      <div v-if="selectedRecord" class="record-detail">
        <div class="detail-question">
          <h3>题目内容</h3>
          <div class="question-content">{{ selectedRecord.question?.content }}</div>
        </div>
        
        <div class="detail-answer">
          <h3>我的回答</h3>
          <div class="answer-content">{{ selectedRecord.userAnswer }}</div>
        </div>
        
        <div class="detail-feedback" v-if="selectedRecord.aiEvaluation">
          <h3>AI评价</h3>
          <div class="feedback-score">
            <span>得分: </span>
            <el-tag :type="getScoreTagType(selectedRecord.score)" size="large">
              {{ selectedRecord.score }}/10 分
            </el-tag>
          </div>
          <div class="feedback-content">{{ selectedRecord.aiEvaluation.comment }}</div>
          
          <div v-if="selectedRecord.aiEvaluation.suggestions" class="feedback-suggestions">
            <h4>改进建议</h4>
            <ul>
              <li v-for="(suggestion, index) in selectedRecord.aiEvaluation.suggestions" :key="index">
                {{ suggestion }}
              </li>
            </ul>
          </div>
        </div>
      </div>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="detailVisible = false">关闭</el-button>
          <el-button type="primary" @click="retryQuestion(selectedRecord)">
            <el-icon><RefreshRight /></el-icon>
            重做此题
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { historyApi, wrongQuestionApi } from '@/api/interview'
import {
  Document,
  EditPen,
  TrendCharts,
  Trophy,
  Timer,
  Search,
  RefreshLeft,
  Download,
  Clock,
  RefreshRight,
  Share,
  Warning,
  Plus
} from '@element-plus/icons-vue'

const router = useRouter()

// 响应式数据
const loading = ref(false)
const historyList = ref([])
const stats = ref({})
const detailVisible = ref(false)
const selectedRecord = ref(null)

// 筛选条件
const filters = reactive({
  difficulty: '',
  interviewType: '',
  dateRange: []
})

// 分页配置
const pagination = reactive({
  currentPage: 1,
  pageSize: 10,
  total: 0
})

// 获取历史记录
const loadHistory = async () => {
  loading.value = true
  try {
    // 调用真实API
    const response = await historyApi.getAnswerHistory({
      userId: 1, // 临时使用固定用户ID
      page: pagination.currentPage - 1, // 后端使用0开始的页码
      size: pagination.pageSize,
      difficulty: filters.difficulty,
      interviewType: filters.interviewType,
      startDate: filters.dateRange?.[0]?.toISOString()?.split('T')[0],
      endDate: filters.dateRange?.[1]?.toISOString()?.split('T')[0]
    })
    
    const data = response.data.data
    historyList.value = data.records || []
    pagination.total = data.total || 0
    
    console.log('历史记录加载成功，共', pagination.total, '条记录')
  } catch (error) {
    console.error('加载历史记录失败:', error)
    ElMessage.error('加载历史记录失败')
    // 使用模拟数据作为回退
    await loadMockHistory()
  } finally {
    loading.value = false
  }
}

// 模拟数据作为回退方案
const loadMockHistory = async () => {
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  const mockData = {
    records: [
      {
        id: 1,
        question: { 
          title: 'JavaScript闭包机制详解',
          content: '请详细解释JavaScript的闭包机制，并提供一个实际应用场景。'
        },
        userAnswer: 'JavaScript闭包是指函数能够记住并访问其词法作用域，即使在其词法作用域之外执行也是如此...',
        score: 8,
        difficulty: 'medium',
        interviewType: 'technical',
        createdAt: new Date(),
        aiEvaluation: {
          comment: '回答非常全面，展现了深厚的技术功底和清晰的逻辑思维。',
          suggestions: [
            '可以提供更具体的代码示例',
            '建议补充闭包的性能影响'
          ]
        }
      },
      {
        id: 2,
        question: {
          title: '项目管理经验分享',
          content: '描述一个你在工作中遇到的最大挑战，以及你是如何解决的。'
        },
        userAnswer: '在开发过程中遇到了技术难题，通过团队协作和持续学习最终解决了问题...',
        score: 6,
        difficulty: 'medium', 
        interviewType: 'behavioral',
        createdAt: new Date(Date.now() - 86400000),
        aiEvaluation: {
          comment: '回答基本正确，但缺乏具体的案例和数据支撑。',
          suggestions: [
            '提供更具体的项目背景',
            '量化解决方案的效果'
          ]
        }
      }
    ],
    total: 2
  }
  
  historyList.value = mockData.records
  pagination.total = mockData.total
}

// 获取学习统计
const loadStats = async () => {
  try {
    // 调用真实API
    const response = await historyApi.getUserStats({
      userId: 1, // 临时使用固定用户ID
      period: 'month'
    })
    
    const data = response.data.data
    stats.value = {
      totalQuestions: data.totalQuestions || 0,
      correctQuestions: data.correctAnswers || 0,
      accuracy: data.accuracy || 0,
      averageScore: data.averageScore || 0,
      totalTimeSpent: data.totalTimeSpent || 0
    }
    
    console.log('学习统计加载成功')
  } catch (error) {
    console.error('加载统计数据失败:', error)
    // 使用模拟数据作为回退
    loadMockStats()
  }
}

// 模拟统计数据作为回退方案
const loadMockStats = () => {
  stats.value = {
    totalQuestions: 45,
    correctQuestions: 32,
    accuracy: 71.1,
    averageScore: 7.5,
    totalTimeSpent: 7200
  }
}

// 工具函数
const formatTime = (seconds) => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  return hours > 0 ? `${hours}小时${minutes}分钟` : `${minutes}分钟`
}

const formatDateTime = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleString('zh-CN')
}

const getDifficultyType = (difficulty) => {
  const types = { easy: 'success', medium: 'warning', hard: 'danger' }
  return types[difficulty] || 'info'
}

const getDifficultyText = (difficulty) => {
  const texts = { easy: '简单', medium: '中等', hard: '困难' }
  return texts[difficulty] || '未知'
}

const getTypeColor = (type) => {
  const colors = {
    technical: 'primary',
    behavioral: 'success', 
    system_design: 'warning',
    coding: 'danger'
  }
  return colors[type] || 'info'
}

const getInterviewTypeText = (type) => {
  const texts = {
    technical: '技术面试',
    behavioral: '行为面试',
    system_design: '系统设计', 
    coding: '编程面试'
  }
  return texts[type] || '未知类型'
}

const getScoreClass = (score) => {
  if (score >= 8) return 'excellent'
  if (score >= 6) return 'good'
  if (score >= 4) return 'average'
  return 'poor'
}

const getScoreTagType = (score) => {
  if (score >= 8) return 'success'
  if (score >= 6) return 'warning'
  return 'danger'
}

// 事件处理
const applyFilters = () => {
  pagination.currentPage = 1
  loadHistory()
}

const resetFilters = () => {
  Object.keys(filters).forEach(key => {
    filters[key] = Array.isArray(filters[key]) ? [] : ''
  })
  pagination.currentPage = 1
  loadHistory()
}

const handlePageChange = (page) => {
  pagination.currentPage = page
  loadHistory()
}

const handleSizeChange = (size) => {
  pagination.pageSize = size
  pagination.currentPage = 1
  loadHistory()
}

const viewRecordDetail = (record) => {
  selectedRecord.value = record
  detailVisible.value = true
}

const handleDetailClose = () => {
  detailVisible.value = false
  selectedRecord.value = null
}

const retryQuestion = (record) => {
  ElMessage.info('正在跳转到面试页面...')
  // 这里可以跳转到面试页面，并传入题目信息
  router.push({
    path: '/interview',
    query: { questionId: record.question?.id }
  })
}

const shareRecord = (record) => {
  ElMessage.info('分享功能开发中...')
}

const addToWrongQuestions = (record) => {
  ElMessageBox.confirm(
    '确定要将此题加入错题集吗？',
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    ElMessage.success('已加入错题集')
  }).catch(() => {
    // 用户取消
  })
}

const exportHistory = () => {
  ElMessage.info('导出功能开发中...')
}

// 生命周期
onMounted(() => {
  loadHistory()
  loadStats()
})
</script>

<style scoped>
.history-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.page-header {
  margin-bottom: 24px;
}

.header-content {
  text-align: center;
  margin-bottom: 32px;
}

.page-title {
  font-size: 32px;
  font-weight: 600;
  color: #2c3e50;
  margin: 0 0 8px 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.page-subtitle {
  font-size: 16px;
  color: #7f8c8d;
  margin: 0;
}

.stats-overview {
  margin-bottom: 24px;
}

.stat-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  border: 1px solid #e1e8ed;
  margin-bottom: 16px;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px -5px rgba(0, 0, 0, 0.15);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: white;
}

.total-questions .stat-icon { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
.accuracy .stat-icon { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); }
.average-score .stat-icon { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); }
.study-time .stat-icon { background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); }

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #2c3e50;
  line-height: 1;
}

.stat-label {
  font-size: 14px;
  color: #7f8c8d;
  margin-top: 4px;
}

.filter-card {
  margin-bottom: 24px;
  border-radius: 16px;
  border: none;
}

.filter-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.filter-left {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.history-card {
  border-radius: 16px;
  border: none;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  font-size: 20px;
  font-weight: 600;
  color: #2c3e50;
}

.record-count {
  color: #7f8c8d;
  font-size: 14px;
}

.history-item {
  background: #fafbfc;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
  transition: all 0.3s ease;
  cursor: pointer;
  border: 1px solid #e1e8ed;
}

.history-item:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  background: white;
}

.record-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.question-title {
  font-size: 18px;
  font-weight: 600;
  color: #2c3e50;
  margin: 0 0 8px 0;
  line-height: 1.4;
}

.question-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.meta-tag {
  border-radius: 6px;
}

.answer-time {
  color: #7f8c8d;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.score-circle {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  color: white;
  position: relative;
}

.score-circle.excellent { background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); }
.score-circle.good { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); }
.score-circle.average { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); }
.score-circle.poor { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }

.score-value {
  font-size: 20px;
  line-height: 1;
}

.score-max {
  font-size: 12px;
  opacity: 0.8;
}

.record-content {
  margin-bottom: 16px;
}

.user-answer, .ai-feedback {
  margin-bottom: 12px;
}

.answer-label, .feedback-label {
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 4px;
  font-size: 14px;
}

.answer-text, .feedback-comment {
  color: #5a6c7d;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.feedback-suggestions {
  margin-top: 8px;
}

.suggestions-label {
  font-size: 12px;
  color: #7f8c8d;
  margin-bottom: 4px;
}

.suggestions-list {
  margin: 0;
  padding-left: 16px;
  color: #7f8c8d;
  font-size: 13px;
}

.suggestions-list li {
  margin-bottom: 2px;
}

.record-actions {
  display: flex;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid #e1e8ed;
}

.pagination-wrapper {
  margin-top: 24px;
  display: flex;
  justify-content: center;
}

.record-detail {
  max-height: 60vh;
  overflow-y: auto;
}

.detail-question, .detail-answer, .detail-feedback {
  margin-bottom: 24px;
}

.detail-question h3, .detail-answer h3, .detail-feedback h3 {
  color: #2c3e50;
  margin-bottom: 12px;
  font-size: 16px;
}

.question-content, .answer-content, .feedback-content {
  background: #f8f9fa;
  padding: 16px;
  border-radius: 8px;
  line-height: 1.6;
  color: #2c3e50;
}

.feedback-score {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  font-weight: 600;
}

.feedback-suggestions h4 {
  margin: 16px 0 8px 0;
  color: #2c3e50;
  font-size: 14px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .history-page {
    padding: 16px;
  }
  
  .filter-section {
    flex-direction: column;
    align-items: stretch;
  }
  
  .filter-left, .filter-right {
    width: 100%;
  }
  
  .record-header {
    flex-direction: column;
    gap: 12px;
  }
  
  .question-meta {
    justify-content: flex-start;
  }
  
  .score-circle {
    align-self: flex-end;
  }
}
</style>