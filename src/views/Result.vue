<template>
  <div class="result">
    <el-container>
      <el-header>
        <el-row justify="space-between" align="middle">
          <el-col :span="8">
            <el-button @click="goHome" icon="ArrowLeft">返回首页</el-button>
          </el-col>
          <el-col :span="8" style="text-align: center">
            <h2>面试结果</h2>
          </el-col>
          <el-col :span="8" style="text-align: right">
            <el-button type="primary" @click="restartInterview">重新面试</el-button>
          </el-col>
        </el-row>
      </el-header>

      <el-main>
        <el-row :gutter="20">
          <!-- 整体评分 -->
          <el-col :span="24">
            <el-card class="summary-card">
              <template #header>
                <span>面试总结</span>
              </template>
              
              <el-row :gutter="40">
                <el-col :span="12">
                  <div class="score-display">
                    <el-progress
                      type="circle"
                      :percentage="overallScore"
                      :color="getScoreColor(overallScore)"
                      :width="120"
                    >
                      <span class="score-text">{{ overallScore }}分</span>
                    </el-progress>
                    <p class="score-label">综合评分</p>
                  </div>
                </el-col>
                <el-col :span="12">
                  <div class="stats">
                    <el-statistic title="回答题目数" :value="totalQuestions" />
                    <el-statistic title="平均分数" :value="averageScore" :precision="1" />
                    <el-statistic title="面试时长" :value="interviewDuration" suffix="分钟" />
                  </div>
                </el-col>
              </el-row>
            </el-card>
          </el-col>

          <!-- 详细反馈 -->
          <el-col :span="24">
            <el-card class="feedback-card">
              <template #header>
                <span>详细反馈</span>
              </template>
              
              <el-tabs v-model="activeTab" type="border-card">
                <el-tab-pane label="逐题分析" name="questions">
                  <div class="questions-analysis">
                    <el-collapse v-model="activeCollapse">
                      <el-collapse-item
                        v-for="(item, index) in history"
                        :key="index"
                        :title="`题目 ${index + 1} - 得分: ${item.feedback?.score || 0}/10`"
                        :name="index.toString()"
                      >
                        <div class="question-detail">
                          <div class="question-section">
                            <h4>题目:</h4>
                            <p>{{ item.question }}</p>
                          </div>
                          
                          <div class="answer-section">
                            <h4>您的回答:</h4>
                            <p>{{ item.answer }}</p>
                          </div>
                          
                          <div v-if="item.feedback" class="feedback-section">
                            <h4>AI反馈:</h4>
                            <el-rate
                              v-model="item.feedback.score"
                              disabled
                              :max="10"
                              show-score
                              text-color="#ff9900"
                            />
                            <p>{{ item.feedback.comment }}</p>
                            
                            <div v-if="item.feedback.suggestions" class="suggestions">
                              <h5>改进建议:</h5>
                              <ul>
                                <li v-for="suggestion in item.feedback.suggestions" :key="suggestion">
                                  {{ suggestion }}
                                </li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      </el-collapse-item>
                    </el-collapse>
                  </div>
                </el-tab-pane>

                <el-tab-pane label="能力评估" name="skills">
                  <div class="skills-assessment">
                    <el-row :gutter="20">
                      <el-col :span="12" v-for="skill in skillsAssessment" :key="skill.name">
                        <div class="skill-item">
                          <div class="skill-header">
                            <span>{{ skill.name }}</span>
                            <el-tag :type="getSkillLevelColor(skill.level)">{{ skill.level }}</el-tag>
                          </div>
                          <el-progress :percentage="skill.score" :color="getScoreColor(skill.score)" />
                          <p class="skill-comment">{{ skill.comment }}</p>
                        </div>
                      </el-col>
                    </el-row>
                  </div>
                </el-tab-pane>

                <el-tab-pane label="总体建议" name="suggestions">
                  <div class="overall-suggestions">
                    <el-alert
                      title="面试表现总结"
                      type="info"
                      :description="overallFeedback"
                      show-icon
                      :closable="false"
                    />
                    
                    <div class="suggestions-section">
                      <h3>改进建议</h3>
                      <el-timeline>
                        <el-timeline-item
                          v-for="(suggestion, index) in improvementSuggestions"
                          :key="index"
                          :icon="suggestion.icon"
                          :type="suggestion.type"
                        >
                          <div class="suggestion-content">
                            <h4>{{ suggestion.title }}</h4>
                            <p>{{ suggestion.content }}</p>
                          </div>
                        </el-timeline-item>
                      </el-timeline>
                    </div>
                  </div>
                </el-tab-pane>
              </el-tabs>
            </el-card>
          </el-col>

          <!-- 操作按钮 -->
          <el-col :span="24">
            <el-card class="actions-card">
              <el-row :gutter="20" justify="center">
                <el-col :span="6">
                  <el-button type="primary" size="large" @click="downloadReport" block>
                    <el-icon><Download /></el-icon>
                    下载报告
                  </el-button>
                </el-col>
                <el-col :span="6">
                  <el-button type="success" size="large" @click="shareResult" block>
                    <el-icon><Share /></el-icon>
                    分享结果
                  </el-button>
                </el-col>
                <el-col :span="6">
                  <el-button type="warning" size="large" @click="restartInterview" block>
                    <el-icon><Refresh /></el-icon>
                    重新面试
                  </el-button>
                </el-col>
              </el-row>
            </el-card>
          </el-col>
        </el-row>
      </el-main>
    </el-container>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, Download, Share, Refresh } from '@element-plus/icons-vue'
import { interviewApi, smartApi, mockApi, apiUtils } from '@/api/interview'

const router = useRouter()
const activeTab = ref('questions')
const activeCollapse = ref(['0'])
const loading = ref(false)

// 从路由参数获取面试数据，如果没有则使用模拟数据
const history = ref([])
const totalQuestions = ref(0)
const interviewSettings = ref({})

// AI生成的总结数据
const aiSummary = ref(null)

// 计算综合评分
const overallScore = computed(() => {
  if (aiSummary.value) {
    return aiSummary.value.overallScore * 10 // API返回1-10，显示需要*10
  }
  if (history.value.length === 0) return 0
  const totalScore = history.value.reduce((sum, item) => sum + (item.feedback?.score || 0), 0)
  return Math.round((totalScore / history.value.length) * 10)
})

// 计算平均分
const averageScore = computed(() => {
  if (aiSummary.value) {
    return aiSummary.value.overallScore
  }
  if (history.value.length === 0) return 0
  const totalScore = history.value.reduce((sum, item) => sum + (item.feedback?.score || 0), 0)
  return totalScore / history.value.length
})

// 模拟面试时长
const interviewDuration = computed(() => {
  if (aiSummary.value) {
    return aiSummary.value.totalDuration
  }
  return Math.floor(Math.random() * 30) + 15
})

// 能力评估数据
const skillsAssessment = computed(() => {
  if (aiSummary.value && aiSummary.value.skillScores) {
    return Object.entries(aiSummary.value.skillScores).map(([name, score]) => ({
      name,
      level: score >= 8 ? '优秀' : score >= 6 ? '良好' : score >= 4 ? '一般' : '待提升',
      score: score * 10,
      comment: `在${name}方面表现${score >= 8 ? '优秀' : score >= 6 ? '良好' : score >= 4 ? '一般' : '待提升'}`
    }))
  }
  
  return [
    {
      name: '技术基础',
      level: '良好',
      score: 75,
      comment: '具备扎实的技术基础，理解核心概念'
    },
    {
      name: '问题解决',
      level: '优秀',
      score: 85,
      comment: '能够有效分析和解决复杂问题'
    },
    {
      name: '沟通表达',
      level: '一般',
      score: 65,
      comment: '表达基本清晰，但有提升空间'
    }
  ]
})

// 总结建议
const overallComment = computed(() => {
  if (aiSummary.value) {
    return aiSummary.value.overallComment
  }
  return '候选人在面试中表现总体良好，具备一定的技术能力和解决问题的思路。'
})

// 优势和不足
const strengths = computed(() => {
  if (aiSummary.value) {
    return aiSummary.value.strengths || []
  }
  return ['技术基础扎实', '逻辑思维清晰']
})

const weaknesses = computed(() => {
  if (aiSummary.value) {
    return aiSummary.value.weaknesses || []
  }
  return ['表达可以更加具体', '缺少实际案例支撑']
})

const recommendations = computed(() => {
  if (aiSummary.value) {
    return aiSummary.value.recommendations || []
  }
  return ['多关注实际项目应用', '加强技术深度学习']
})

// 总体反馈
const overallFeedback = computed(() => {
  if (aiSummary.value) {
    return aiSummary.value.overallComment
  }
  return '您在本次面试中表现良好，展现了扎实的技术基础和良好的问题解决能力。在技术深度和系统设计方面有不错的理解，但在某些细节问题的表达上还可以更加精确。建议继续深化技术理解，提升沟通技巧。'
})

// 改进建议
const improvementSuggestions = computed(() => {
  if (aiSummary.value && aiSummary.value.recommendations) {
    return aiSummary.value.recommendations.map((content, index) => ({
      title: `建议 ${index + 1}`,
      content,
      icon: 'el-icon-cpu',
      type: ['primary', 'success', 'warning', 'info'][index % 4]
    }))
  }
  
  return [
    {
      title: '深化技术理解',
      content: '建议深入学习相关技术的底层原理，不仅要知道怎么用，更要理解为什么这样设计。',
      icon: 'el-icon-cpu',
      type: 'primary'
    },
    {
      title: '提升表达能力',
      content: '在回答问题时可以使用结构化的表达方式，先总述再分点阐述，会更加清晰。',
      icon: 'el-icon-chat-line-round',
      type: 'success'
    },
    {
      title: '实践项目经验',
      content: '建议多参与实际项目，将理论知识与实践相结合，积累更多的工程经验。',
      icon: 'el-icon-tools',
      type: 'warning'
    }
  ]
})

// 获取分数颜色
const getScoreColor = (score) => {
  if (score >= 80) return '#67c23a'
  if (score >= 60) return '#e6a23c'
  return '#f56c6c'
}

// 获取技能等级颜色
const getSkillLevelColor = (level) => {
  const colors = {
    '优秀': 'success',
    '良好': 'primary',
    '一般': 'warning',
    '较差': 'danger'
  }
  return colors[level] || 'info'
}

// 返回首页
const goHome = () => {
  router.push('/')
}

// 重新面试
const restartInterview = () => {
  router.push('/interview')
}

// 下载报告
const downloadReport = () => {
  ElMessage.info('报告下载功能开发中...')
}

// 分享结果
const shareResult = () => {
  ElMessage.info('分享功能开发中...')
}

// 初始化数据
onMounted(async () => {
  loading.value = true
  
  // 尝试从路由状态获取数据
  const routeState = history.state
  if (routeState && routeState.history) {
    history.value = routeState.history
    totalQuestions.value = routeState.totalQuestions || routeState.history.length
    interviewSettings.value = routeState.settings || {}
    
    // 获取AI面试总结
    try {
      const response = await smartApi.callWithFallback(
        () => interviewApi.getInterviewSummary({
          history: history.value,
          totalQuestions: totalQuestions.value,
          interviewDuration: routeState.duration || 25,
          interviewType: interviewSettings.value.interviewType || 'technical',
          difficulty: interviewSettings.value.difficulty || 'medium',
          position: interviewSettings.value.position || 'frontend',
          experience: interviewSettings.value.experience || 'intermediate'
        }),
        () => mockApi.getInterviewSummary({
          history: history.value,
          interviewDuration: routeState.duration || 25
        })
      )
      
      aiSummary.value = apiUtils.handleResponse(response)
      console.log('AI面试总结获取成功:', aiSummary.value)
      
    } catch (error) {
      console.error('获取AI面试总结失败:', error)
      ElMessage.warning('无法获取AI总结，使用默认数据')
    }
  } else {
    // 使用模拟数据
    history.value = [
      {
        question: '请介绍一下Vue 3的响应式原理',
        answer: 'Vue 3使用Proxy来实现响应式，相比Vue 2的Object.defineProperty有更好的性能和功能。它可以监听对象的所有属性变化，包括新增和删除属性。',
        feedback: {
          score: 8,
          comment: '回答较为准确，对Proxy和Object.defineProperty的区别有一定理解，但可以更详细地说明实现机制。',
          suggestions: ['可以详细说明Proxy的具体优势', '补充响应式系统的完整流程']
        }
      },
      {
        question: '如何优化前端性能？',
        answer: '可以从多个方面优化：1. 减少HTTP请求 2. 压缩资源文件 3. 使用CDN 4. 懒加载 5. 代码分割等。',
        feedback: {
          score: 7,
          comment: '提到了主要的优化方向，但回答比较泛化，缺少具体的实现细节和实际案例。',
          suggestions: ['提供具体的优化实例', '说明优化效果的衡量标准']
        }
      }
    ]
    totalQuestions.value = history.value.length
    
    // 为模拟数据也获取AI总结
    try {
      const response = await mockApi.getInterviewSummary({
        history: history.value,
        interviewDuration: 25
      })
      aiSummary.value = apiUtils.handleResponse(response)
    } catch (error) {
      console.error('获取模拟AI总结失败:', error)
    }
  }
  
  loading.value = false
})
</script>

<style scoped>
.result {
  min-height: 100vh;
  background-color: #f5f7fa;
}

.el-header {
  background-color: white;
  border-bottom: 1px solid #e4e7ed;
  padding: 0 20px;
}

.el-main {
  padding: 20px;
}

.summary-card,
.feedback-card,
.actions-card {
  margin-bottom: 20px;
}

.score-display {
  text-align: center;
}

.score-text {
  font-size: 16px;
  font-weight: bold;
}

.score-label {
  margin-top: 10px;
  font-size: 14px;
  color: #606266;
}

.stats .el-statistic {
  margin-bottom: 20px;
}

.question-detail {
  padding: 10px 0;
}

.question-section,
.answer-section,
.feedback-section {
  margin-bottom: 20px;
}

.question-section h4,
.answer-section h4,
.feedback-section h4 {
  color: #409eff;
  margin-bottom: 8px;
}

.suggestions {
  margin-top: 15px;
}

.suggestions h5 {
  color: #909399;
  margin-bottom: 8px;
}

.suggestions ul {
  margin: 0;
  padding-left: 20px;
}

.skill-item {
  margin-bottom: 20px;
}

.skill-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.skill-comment {
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
}

.suggestions-section {
  margin-top: 20px;
}

.suggestion-content h4 {
  margin-bottom: 5px;
  color: #303133;
}

.suggestion-content p {
  color: #606266;
  line-height: 1.5;
}

.actions-card {
  text-align: center;
}
</style>