<template>
  <div class="wrong-questions-page">
    <!-- 页面标题和概览 -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">
          <el-icon><Warning /></el-icon>
          错题集
        </h1>
        <p class="page-subtitle">巩固薄弱知识点，提升答题能力</p>
      </div>
      
      <!-- 错题统计卡片 -->
      <el-row :gutter="24" class="wrong-stats-overview">
        <el-col :xs="24" :sm="12" :md="6">
          <div class="stat-card total-wrong">
            <div class="stat-icon">
              <el-icon><DocumentDelete /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ wrongStats.totalWrongQuestions || 0 }}</div>
              <div class="stat-label">总错题数</div>
            </div>
          </div>
        </el-col>
        
        <el-col :xs="24" :sm="12" :md="6">
          <div class="stat-card unmastered">
            <div class="stat-icon">
              <el-icon><Clock /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ wrongStats.unmasteredCount || 0 }}</div>
              <div class="stat-label">待掌握</div>
            </div>
          </div>
        </el-col>
        
        <el-col :xs="24" :sm="12" :md="6">
          <div class="stat-card mastered">
            <div class="stat-icon">
              <el-icon><CircleCheckFilled /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ wrongStats.masteredCount || 0 }}</div>
              <div class="stat-label">已掌握</div>
            </div>
          </div>
        </el-col>
        
        <el-col :xs="24" :sm="12" :md="6">
          <div class="stat-card mastery-rate">
            <div class="stat-icon">
              <el-icon><TrendCharts /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ (wrongStats.masteryRate || 0).toFixed(1) }}%</div>
              <div class="stat-label">掌握率</div>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 薄弱知识点分析 -->
    <el-card class="weakness-analysis" shadow="never" v-if="tagStats.length > 0">
      <template #header>
        <div class="card-header">
          <span class="card-title">
            <el-icon><DataAnalysis /></el-icon>
            薄弱知识点分析
          </span>
        </div>
      </template>
      
      <div class="tag-clouds">
        <div 
          v-for="(tagStat, index) in tagStats" 
          :key="index"
          class="tag-item"
          :class="getTagSizeClass(tagStat.count)"
          @click="filterByTag(tagStat.tag)"
        >
          <span class="tag-name">{{ tagStat.tag }}</span>
          <span class="tag-count">{{ tagStat.count }}</span>
        </div>
      </div>
    </el-card>

    <!-- 操作区域 -->
    <el-card class="actions-card" shadow="never">
      <div class="actions-section">
        <div class="actions-left">
          <el-button 
            type="primary" 
            size="large"
            @click="startWrongQuestionsPractice"
            :disabled="wrongQuestions.length === 0"
          >
            <el-icon><VideoPlay /></el-icon>
            开始错题练习
          </el-button>
          
          <el-button 
            size="large"
            @click="reviewMostNeeded"
            :disabled="wrongQuestions.length === 0"
          >
            <el-icon><Star /></el-icon>
            重点复习 ({{ needReviewCount }})
          </el-button>
        </div>
        
        <div class="actions-right">
          <el-segmented 
            v-model="viewMode" 
            :options="viewModeOptions"
            @change="handleViewModeChange"
          />
          
          <el-dropdown @command="handleBatchAction">
            <el-button>
              批量操作<el-icon class="el-icon--right"><ArrowDown /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="markAllMastered">标记为已掌握</el-dropdown-item>
                <el-dropdown-item command="removeSelected" divided>移出错题集</el-dropdown-item>
                <el-dropdown-item command="exportSelected">导出选中项</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
    </el-card>

    <!-- 错题列表 -->
    <el-card class="wrong-questions-card" shadow="never">
      <template #header>
        <div class="card-header">
          <div class="card-left">
            <span class="card-title">错题列表</span>
            <span class="question-count">
              共 {{ filteredWrongQuestions.length }} 道错题
              <span v-if="selectedQuestions.length > 0">
                · 已选择 {{ selectedQuestions.length }} 道
              </span>
            </span>
          </div>
          
          <div class="card-right">
            <el-input
              v-model="searchKeyword"
              placeholder="搜索题目..."
              style="width: 200px;"
              clearable
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
          </div>
        </div>
      </template>
      
      <div class="wrong-questions-list" v-loading="loading">
        <div 
          v-for="wrongQuestion in paginatedQuestions" 
          :key="wrongQuestion.id"
          class="wrong-question-item"
          :class="{ 'selected': selectedQuestions.includes(wrongQuestion.id) }"
        >
          <div class="question-header">
            <div class="question-left">
              <el-checkbox 
                :model-value="selectedQuestions.includes(wrongQuestion.id)"
                @change="(checked) => handleQuestionSelect(wrongQuestion.id, checked)"
              />
              
              <div class="question-info">
                <div class="question-title-row">
                  <h3 class="question-title">{{ wrongQuestion.question?.title || '题目标题' }}</h3>
                  <div class="question-badges">
                    <el-tag 
                      :type="getDifficultyType(wrongQuestion.question?.difficulty)" 
                      size="small"
                    >
                      {{ getDifficultyText(wrongQuestion.question?.difficulty) }}
                    </el-tag>
                    <el-tag 
                      :type="getTypeColor(wrongQuestion.question?.questionType)"
                      size="small"
                    >
                      {{ getInterviewTypeText(wrongQuestion.question?.questionType) }}
                    </el-tag>
                  </div>
                </div>
                
                <div class="question-meta">
                  <span class="meta-item">
                    <el-icon><Calendar /></el-icon>
                    首次错误: {{ formatDate(wrongQuestion.createdAt) }}
                  </span>
                  <span class="meta-item" v-if="wrongQuestion.lastRetryAt">
                    <el-icon><RefreshRight /></el-icon>
                    最近练习: {{ formatDate(wrongQuestion.lastRetryAt) }}
                  </span>
                  <span class="meta-item">
                    <el-icon><Refresh /></el-icon>
                    重做 {{ wrongQuestion.retryCount || 0 }} 次
                  </span>
                  <span class="meta-item" v-if="wrongQuestion.firstAttemptRecord">
                    <el-icon><Medal /></el-icon>
                    首次得分: {{ wrongQuestion.firstAttemptRecord.score }}/10
                  </span>
                </div>
                
                <!-- 题目标签 -->
                <div class="question-tags" v-if="wrongQuestion.question?.tags?.length">
                  <el-tag 
                    v-for="tag in wrongQuestion.question.tags.slice(0, 3)"
                    :key="tag"
                    size="small"
                    class="question-tag"
                    effect="plain"
                  >
                    {{ tag }}
                  </el-tag>
                  <span v-if="wrongQuestion.question.tags.length > 3" class="more-tags">
                    +{{ wrongQuestion.question.tags.length - 3 }}
                  </span>
                </div>
              </div>
            </div>
            
            <div class="question-right">
              <div class="mastery-status" v-if="wrongQuestion.mastered">
                <el-icon class="mastered-icon"><CircleCheckFilled /></el-icon>
                <span class="mastered-text">已掌握</span>
              </div>
              
              <div class="priority-indicator" :class="getPriorityClass(wrongQuestion)">
                <span class="priority-text">{{ getPriorityText(wrongQuestion) }}</span>
              </div>
            </div>
          </div>
          
          <!-- 题目内容预览 -->
          <div class="question-content" v-if="expandedQuestions.includes(wrongQuestion.id)">
            <div class="content-section">
              <h4>题目内容</h4>
              <p>{{ wrongQuestion.question?.content || '暂无内容' }}</p>
            </div>
            
            <div class="content-section" v-if="wrongQuestion.firstAttemptRecord">
              <h4>我的错误回答</h4>
              <p>{{ wrongQuestion.firstAttemptRecord.userAnswer }}</p>
            </div>
            
            <div class="content-section" v-if="wrongQuestion.firstAttemptRecord?.aiEvaluation?.comment">
              <h4>AI评价</h4>
              <p>{{ wrongQuestion.firstAttemptRecord.aiEvaluation.comment }}</p>
            </div>
          </div>
          
          <div class="question-actions">
            <el-button 
              size="small" 
              type="primary"
              @click="practiceQuestion(wrongQuestion)"
            >
              <el-icon><VideoPlay /></el-icon>
              立即练习
            </el-button>
            
            <el-button 
              size="small"
              @click="toggleQuestionExpansion(wrongQuestion.id)"
            >
              <el-icon><View /></el-icon>
              {{ expandedQuestions.includes(wrongQuestion.id) ? '收起' : '查看详情' }}
            </el-button>
            
            <el-button 
              size="small"
              type="success"
              @click="markAsMastered(wrongQuestion)"
              v-if="!wrongQuestion.mastered"
            >
              <el-icon><CircleCheckFilled /></el-icon>
              标记掌握
            </el-button>
            
            <el-button 
              size="small"
              type="warning"
              @click="unmarkMastered(wrongQuestion)"
              v-else
            >
              <el-icon><RefreshLeft /></el-icon>
              取消掌握
            </el-button>
            
            <el-dropdown @command="(command) => handleQuestionAction(command, wrongQuestion)">
              <el-button size="small">
                更多<el-icon class="el-icon--right"><ArrowDown /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="addNote">添加笔记</el-dropdown-item>
                  <el-dropdown-item command="share">分享题目</el-dropdown-item>
                  <el-dropdown-item command="remove" divided>移出错题集</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>
        
        <!-- 空状态 -->
        <el-empty 
          v-if="!loading && filteredWrongQuestions.length === 0"
          description="暂无错题"
          :image-size="150"
        >
          <template #image>
            <el-icon style="font-size: 150px; color: #e0e0e0;">
              <CircleCheckFilled />
            </el-icon>
          </template>
          <template #description>
            <p style="color: #909399;">太棒了！当前没有错题需要复习</p>
          </template>
          <el-button type="primary" @click="$router.push('/interview')">
            <el-icon><Plus /></el-icon>
            开始新的面试
          </el-button>
        </el-empty>
      </div>
      
      <!-- 分页 -->
      <div class="pagination-wrapper" v-if="filteredWrongQuestions.length > 0">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[8, 16, 32]"
          :total="filteredWrongQuestions.length"
          layout="total, sizes, prev, pager, next, jumper"
          background
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { wrongQuestionApi, historyApi } from '@/api/interview'
import {
  Warning,
  DocumentDelete,
  Clock,
  CircleCheckFilled,
  TrendCharts,
  DataAnalysis,
  VideoPlay,
  Star,
  ArrowDown,
  Search,
  Calendar,
  RefreshRight,
  Refresh,
  Medal,
  View,
  RefreshLeft,
  Plus
} from '@element-plus/icons-vue'

const router = useRouter()

// 响应式数据
const loading = ref(false)
const wrongQuestions = ref([])
const wrongStats = ref({})
const tagStats = ref([])
const searchKeyword = ref('')
const selectedQuestions = ref([])
const expandedQuestions = ref([])
const viewMode = ref('unmastered')
const currentPage = ref(1)
const pageSize = ref(8)

// 视图模式选项
const viewModeOptions = [
  { label: '待掌握', value: 'unmastered' },
  { label: '全部', value: 'all' },
  { label: '已掌握', value: 'mastered' }
]

// 计算属性
const filteredWrongQuestions = computed(() => {
  let questions = wrongQuestions.value

  // 根据视图模式过滤
  if (viewMode.value === 'unmastered') {
    questions = questions.filter(q => !q.mastered)
  } else if (viewMode.value === 'mastered') {
    questions = questions.filter(q => q.mastered)
  }

  // 根据搜索关键词过滤
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    questions = questions.filter(q =>
      q.question?.title?.toLowerCase().includes(keyword) ||
      q.question?.content?.toLowerCase().includes(keyword) ||
      q.question?.tags?.some(tag => tag.toLowerCase().includes(keyword))
    )
  }

  return questions
})

const paginatedQuestions = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredWrongQuestions.value.slice(start, end)
})

const needReviewCount = computed(() => {
  return wrongQuestions.value.filter(q => 
    !q.mastered && (q.retryCount || 0) < 2
  ).length
})

// 加载错题集数据
const loadWrongQuestions = async () => {
  loading.value = true
  try {
    // 调用真实API
    const response = await wrongQuestionApi.getWrongQuestions({
      userId: 1, // 临时使用固定用户ID
      includeMastered: true
    })
    
    const data = response.data.data
    wrongQuestions.value = data || []
    
    console.log('错题集加载成功，共', wrongQuestions.value.length, '条记录')
  } catch (error) {
    console.error('加载错题集失败:', error)
    ElMessage.error('加载错题集失败')
    // 使用模拟数据作为回退
    await loadMockWrongQuestions()
  } finally {
    loading.value = false
  }
}

// 模拟数据作为回退方案
const loadMockWrongQuestions = async () => {
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  const mockData = [
    {
      id: 1,
      question: {
        title: 'JavaScript闭包机制详解',
        content: '请详细解释JavaScript的闭包机制，并提供一个实际应用场景。',
        difficulty: 'medium',
        questionType: 'technical',
        tags: ['JavaScript', '前端开发', '闭包', '作用域']
      },
      retryCount: 0,
      mastered: false,
      createdAt: new Date(Date.now() - 86400000 * 3),
      lastRetryAt: null,
      firstAttemptRecord: {
        score: 4,
        userAnswer: '闭包就是函数内部可以访问外部变量...',
        aiEvaluation: {
          comment: '回答过于简单，缺乏深入理解'
        }
      }
    },
    {
      id: 2,
      question: {
        title: '分布式系统设计原则',
        content: '请设计一个分布式缓存系统，需要考虑数据分片、一致性哈希和故障恢复。',
        difficulty: 'hard',
        questionType: 'system_design',
        tags: ['分布式系统', '缓存', '系统设计']
      },
      retryCount: 2,
      mastered: true,
      createdAt: new Date(Date.now() - 86400000 * 7),
      lastRetryAt: new Date(Date.now() - 86400000 * 1),
      firstAttemptRecord: {
        score: 3,
        userAnswer: '使用Redis集群...',
        aiEvaluation: {
          comment: '方案基础正确，但缺少故障恢复机制的考虑'
        }
      }
    }
  ]
  
  wrongQuestions.value = mockData
}

// 加载错题统计
const loadWrongStats = async () => {
  try {
    // 调用真实API
    const response = await wrongQuestionApi.getWrongQuestionStats({
      userId: 1 // 临时使用固定用户ID
    })
    
    const data = response.data.data
    wrongStats.value = {
      totalWrongQuestions: data.totalWrongQuestions || 0,
      unmasteredCount: data.unmasteredCount || 0,
      masteredCount: data.masteredCount || 0,
      masteryRate: data.masteryRate || 0
    }
    
    // 获取标签统计
    tagStats.value = data.tagStats || []
    
    console.log('错题统计加载成功')
  } catch (error) {
    console.error('加载错题统计失败:', error)
    // 使用模拟数据作为回退
    loadMockWrongStats()
  }
}

// 模拟统计数据作为回退方案
const loadMockWrongStats = () => {
  wrongStats.value = {
    totalWrongQuestions: 12,
    unmasteredCount: 8,
    masteredCount: 4,
    masteryRate: 33.3
  }
  
  // 模拟标签统计
  tagStats.value = [
    { tag: 'JavaScript', count: 5 },
    { tag: '系统设计', count: 3 },
    { tag: '算法', count: 2 },
    { tag: 'Vue.js', count: 2 }
  ]
}

// 工具函数
const formatDate = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleDateString('zh-CN')
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

const getTagSizeClass = (count) => {
  if (count >= 5) return 'tag-large'
  if (count >= 3) return 'tag-medium'
  return 'tag-small'
}

const getPriorityClass = (wrongQuestion) => {
  const daysSinceCreated = Math.floor((Date.now() - new Date(wrongQuestion.createdAt)) / (1000 * 60 * 60 * 24))
  const retryCount = wrongQuestion.retryCount || 0
  
  if (daysSinceCreated > 7 && retryCount === 0) return 'priority-high'
  if (daysSinceCreated > 3 && retryCount < 2) return 'priority-medium'
  return 'priority-low'
}

const getPriorityText = (wrongQuestion) => {
  const priority = getPriorityClass(wrongQuestion)
  const texts = {
    'priority-high': '急需复习',
    'priority-medium': '建议复习',
    'priority-low': '适时复习'
  }
  return texts[priority] || '适时复习'
}

// 事件处理
const handleViewModeChange = (mode) => {
  viewMode.value = mode
  currentPage.value = 1
}

const handleQuestionSelect = (questionId, checked) => {
  if (checked) {
    selectedQuestions.value.push(questionId)
  } else {
    const index = selectedQuestions.value.indexOf(questionId)
    if (index > -1) {
      selectedQuestions.value.splice(index, 1)
    }
  }
}

const toggleQuestionExpansion = (questionId) => {
  const index = expandedQuestions.value.indexOf(questionId)
  if (index > -1) {
    expandedQuestions.value.splice(index, 1)
  } else {
    expandedQuestions.value.push(questionId)
  }
}

const startWrongQuestionsPractice = () => {
  ElMessage.info('正在启动错题练习模式...')
  router.push({
    path: '/interview',
    query: { mode: 'wrong-questions' }
  })
}

const reviewMostNeeded = () => {
  const needReviewQuestions = wrongQuestions.value
    .filter(q => !q.mastered && (q.retryCount || 0) < 2)
    .slice(0, 5)
  
  if (needReviewQuestions.length === 0) {
    ElMessage.info('当前没有急需复习的错题')
    return
  }
  
  ElMessage.info(`正在准备 ${needReviewQuestions.length} 道重点题目...`)
  router.push({
    path: '/interview',
    query: { 
      mode: 'review',
      questions: needReviewQuestions.map(q => q.id).join(',')
    }
  })
}

const practiceQuestion = (wrongQuestion) => {
  router.push({
    path: '/interview',
    query: { questionId: wrongQuestion.question?.id }
  })
}

const markAsMastered = async (wrongQuestion) => {
  try {
    // 调用真实API
    await wrongQuestionApi.markAsMastered({
      userId: 1, // 临时使用固定用户ID
      questionId: wrongQuestion.question?.id
    })
    
    ElMessage.success('已标记为掌握')
    wrongQuestion.mastered = true
    wrongQuestion.masteredAt = new Date()
    
    // 更新统计
    wrongStats.value.masteredCount++
    wrongStats.value.unmasteredCount--
    wrongStats.value.masteryRate = (wrongStats.value.masteredCount / wrongStats.value.totalWrongQuestions) * 100
  } catch (error) {
    ElMessage.error('标记掌握失败')
    console.error('标记掌握失败:', error)
  }
}

const unmarkMastered = async (wrongQuestion) => {
  try {
    // 这里需要后端提供取消掌握的API，暂时使用客户端逻辑
    ElMessage.success('已取消掌握标记')
    wrongQuestion.mastered = false
    wrongQuestion.masteredAt = null
    
    // 更新统计
    wrongStats.value.masteredCount--
    wrongStats.value.unmasteredCount++
    wrongStats.value.masteryRate = (wrongStats.value.masteredCount / wrongStats.value.totalWrongQuestions) * 100
  } catch (error) {
    ElMessage.error('取消掌握标记失败')
  }
}

const handleBatchAction = (command) => {
  if (selectedQuestions.value.length === 0) {
    ElMessage.warning('请先选择要操作的题目')
    return
  }
  
  switch (command) {
    case 'markAllMastered':
      ElMessageBox.confirm(
        `确定要将选中的 ${selectedQuestions.value.length} 道题目标记为已掌握吗？`,
        '批量标记掌握',
        { type: 'warning' }
      ).then(() => {
        ElMessage.success('批量标记成功')
        selectedQuestions.value = []
      })
      break
    case 'removeSelected':
      ElMessageBox.confirm(
        `确定要将选中的 ${selectedQuestions.value.length} 道题目移出错题集吗？`,
        '批量移除',
        { type: 'warning' }
      ).then(() => {
        ElMessage.success('批量移除成功')
        selectedQuestions.value = []
      })
      break
    case 'exportSelected':
      ElMessage.info('导出功能开发中...')
      break
  }
}

const handleQuestionAction = (command, wrongQuestion) => {
  switch (command) {
    case 'addNote':
      ElMessage.info('笔记功能开发中...')
      break
    case 'share':
      ElMessage.info('分享功能开发中...')
      break
    case 'remove':
      ElMessageBox.confirm(
        '确定要将此题移出错题集吗？',
        '移除错题',
        { type: 'warning' }
      ).then(() => {
        ElMessage.success('已移出错题集')
      })
      break
  }
}

const filterByTag = (tag) => {
  searchKeyword.value = tag
}

// 生命周期
onMounted(() => {
  loadWrongQuestions()
  loadWrongStats()
})
</script>

<style scoped>
.wrong-questions-page {
  max-width: 1400px;
  margin: 0 auto;
  padding: 24px;
  min-height: 100vh;
  background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);
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
  color: #d84315;
  margin: 0 0 8px 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.page-subtitle {
  font-size: 16px;
  color: #bf360c;
  margin: 0;
}

.wrong-stats-overview {
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
  border: 1px solid #ffccbc;
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

.total-wrong .stat-icon { background: linear-gradient(135deg, #ff5722 0%, #d84315 100%); }
.unmastered .stat-icon { background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%); }
.mastered .stat-icon { background: linear-gradient(135deg, #4caf50 0%, #388e3c 100%); }
.mastery-rate .stat-icon { background: linear-gradient(135deg, #2196f3 0%, #1976d2 100%); }

.weakness-analysis {
  margin-bottom: 24px;
  border-radius: 16px;
  border: none;
}

.tag-clouds {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.tag-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: #fff3e0;
  border: 2px solid #ffb74d;
  border-radius: 24px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.tag-item:hover {
  background: #ffb74d;
  color: white;
  transform: translateY(-2px);
}

.tag-item.tag-large {
  font-size: 18px;
  padding: 12px 20px;
  border-color: #ff5722;
  background: #ffebee;
}

.tag-item.tag-medium {
  font-size: 16px;
  padding: 10px 18px;
  border-color: #ff9800;
}

.tag-item.tag-small {
  font-size: 14px;
}

.tag-name {
  font-weight: 500;
}

.tag-count {
  background: rgba(0, 0, 0, 0.1);
  color: inherit;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
}

.actions-card {
  margin-bottom: 24px;
  border-radius: 16px;
  border: none;
}

.actions-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.actions-left {
  display: flex;
  gap: 12px;
}

.actions-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.wrong-questions-card {
  border-radius: 16px;
  border: none;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.card-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.card-title {
  font-size: 20px;
  font-weight: 600;
  color: #2c3e50;
}

.question-count {
  color: #7f8c8d;
  font-size: 14px;
}

.wrong-question-item {
  background: #fafbfc;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
  transition: all 0.3s ease;
  border: 1px solid #e1e8ed;
}

.wrong-question-item:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  background: white;
}

.wrong-question-item.selected {
  border-color: #ff9800;
  background: #fff8e1;
}

.question-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.question-left {
  display: flex;
  gap: 12px;
  flex: 1;
}

.question-info {
  flex: 1;
}

.question-title-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
  flex-wrap: wrap;
  gap: 8px;
}

.question-title {
  font-size: 18px;
  font-weight: 600;
  color: #2c3e50;
  margin: 0;
  line-height: 1.4;
  flex: 1;
  min-width: 0;
}

.question-badges {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
}

.question-meta {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 8px;
}

.meta-item {
  color: #7f8c8d;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.question-tags {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.question-tag {
  border-radius: 4px;
}

.more-tags {
  color: #7f8c8d;
  font-size: 12px;
}

.question-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}

.mastery-status {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #4caf50;
  font-size: 14px;
  font-weight: 500;
}

.mastered-icon {
  font-size: 16px;
}

.priority-indicator {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.priority-high {
  background: #ffebee;
  color: #d32f2f;
}

.priority-medium {
  background: #fff8e1;
  color: #f57c00;
}

.priority-low {
  background: #e8f5e8;
  color: #388e3c;
}

.question-content {
  margin: 16px 0;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #ff9800;
}

.content-section {
  margin-bottom: 16px;
}

.content-section:last-child {
  margin-bottom: 0;
}

.content-section h4 {
  margin: 0 0 8px 0;
  color: #2c3e50;
  font-size: 14px;
  font-weight: 600;
}

.content-section p {
  margin: 0;
  line-height: 1.6;
  color: #5a6c7d;
}

.question-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  padding-top: 12px;
  border-top: 1px solid #e1e8ed;
}

.pagination-wrapper {
  margin-top: 24px;
  display: flex;
  justify-content: center;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .wrong-questions-page {
    padding: 16px;
  }
  
  .actions-section {
    flex-direction: column;
    align-items: stretch;
  }
  
  .actions-left,
  .actions-right {
    width: 100%;
    justify-content: center;
  }
  
  .question-header {
    flex-direction: column;
    gap: 12px;
  }
  
  .question-right {
    align-items: flex-start;
    flex-direction: row;
    justify-content: space-between;
    width: 100%;
  }
  
  .question-actions {
    justify-content: center;
  }
}
</style>