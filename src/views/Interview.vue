<template>
  <div class="interview">
    <el-container>
      <el-header>
        <el-row justify="space-between" align="middle">
          <el-col :span="8">
            <el-button @click="goHome" icon="ArrowLeft">返回首页</el-button>
          </el-col>
          <el-col :span="8" style="text-align: center">
            <div class="interview-info">
              <h2>AI面试进行中</h2>
              <el-progress 
                :percentage="Math.round((currentQuestionIndex / interviewSettings.questionCount) * 100)"
                :show-text="false"
                :stroke-width="4"
              />
              <p class="progress-text">{{ currentQuestionIndex }}/{{ interviewSettings.questionCount }}</p>
            </div>
          </el-col>
          <el-col :span="8" style="text-align: right">
            <el-button type="danger" @click="endInterview">结束面试</el-button>
          </el-col>
        </el-row>
      </el-header>

      <el-main>
        <el-row :gutter="20">
          <!-- 面试题目区域 -->
          <el-col :span="24">
            <el-card class="question-card">
              <template #header>
                <div class="question-header">
                  <span>面试题目 {{ currentQuestionIndex + 1 }}</span>
                  <el-tag v-if="currentQuestion.type" :type="getQuestionTypeColor(currentQuestion.type)">
                    {{ getQuestionTypeText(currentQuestion.type) }}
                  </el-tag>
                </div>
              </template>
              
              <div v-if="loading" class="loading-area">
                <el-skeleton :rows="3" animated />
                <p class="loading-text">AI正在生成面试题目...</p>
              </div>
              
              <div v-else class="question-content">
                <p class="question-text">{{ currentQuestion.question || '准备获取第一道面试题...' }}</p>
              </div>
            </el-card>
          </el-col>

          <!-- 回答输入区域 -->
          <el-col :span="24">
            <el-card class="answer-card">
              <template #header>
                <div class="answer-header">
                  <span>您的回答</span>
                  <el-button 
                    type="primary" 
                    @click="submitAnswer"
                    :disabled="!currentAnswer.trim() || submitting"
                    :loading="submitting"
                  >
                    {{ submitting ? '提交中...' : '提交回答' }}
                  </el-button>
                </div>
              </template>
              
              <el-input
                v-model="currentAnswer"
                type="textarea"
                :rows="8"
                placeholder="请在此输入您的回答..."
                :disabled="submitting"
                @keydown.ctrl.enter="submitAnswer"
              />
              
              <div class="input-tips">
                <el-text size="small" type="info">
                  Ctrl + Enter 快速提交 | 字数: {{ currentAnswer.length }}
                </el-text>
              </div>
            </el-card>
          </el-col>

          <!-- 面试历史 -->
          <el-col :span="24" v-if="interviewHistory.length > 0">
            <el-card class="history-card">
              <template #header>
                <span>面试记录</span>
              </template>
              
              <el-timeline>
                <el-timeline-item
                  v-for="(item, index) in interviewHistory"
                  :key="index"
                  :timestamp="item.timestamp"
                  placement="top"
                >
                  <el-card class="history-item">
                    <div class="history-question">
                      <strong>题目{{ index + 1 }}:</strong> {{ item.question }}
                    </div>
                    <div class="history-answer">
                      <strong>回答:</strong> {{ item.answer }}
                    </div>
                    <div v-if="item.feedback" class="history-feedback">
                      <strong>反馈:</strong> 
                      <el-tag :type="item.feedback.score >= 7 ? 'success' : item.feedback.score >= 5 ? 'warning' : 'danger'">
                        {{ item.feedback.score }}/10
                      </el-tag>
                      {{ item.feedback.comment }}
                    </div>
                  </el-card>
                </el-timeline-item>
              </el-timeline>
            </el-card>
          </el-col>
        </el-row>
      </el-main>
    </el-container>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'
import { interviewApi, apiUtils, smartApi, mockApi } from '@/api/interview'

const router = useRouter()
const loading = ref(false)
const submitting = ref(false)
const currentAnswer = ref('')
const currentQuestionIndex = ref(0)
const currentQuestion = ref({
  question: '',
  type: 'technical'
})
const interviewHistory = ref([])

// 从路由获取面试设置
const interviewSettings = ref({
  interviewType: 'technical',
  difficulty: 'medium',
  position: 'frontend',
  experience: 'intermediate',
  questionCount: 5
})

// 获取面试题目
const getNextQuestion = async () => {
  loading.value = true
  try {
    const response = await smartApi.callWithFallback(
      () => interviewApi.getQuestion({
        questionIndex: currentQuestionIndex.value,
        interviewType: interviewSettings.value.interviewType,
        difficulty: interviewSettings.value.difficulty,
        position: interviewSettings.value.position,
        experience: interviewSettings.value.experience,
        history: interviewHistory.value
      }),
      () => mockApi.getQuestion({
        questionIndex: currentQuestionIndex.value,
        interviewType: interviewSettings.value.interviewType
      })
    )
    
    const questionData = apiUtils.handleResponse(response)
    currentQuestion.value = {
      question: questionData.question,
      type: questionData.type,
      questionId: questionData.questionId
    }
    currentAnswer.value = ''
    
  } catch (error) {
    console.error('获取面试题失败:', error)
    ElMessage.error('获取面试题失败，请重试')
    // 使用备用题目
    currentQuestion.value = {
      question: `第${currentQuestionIndex.value + 1}题：请介绍一下您在${getPositionText()}开发中的经验和技能。`,
      type: 'technical',
      questionId: Date.now()
    }
  } finally {
    loading.value = false
  }
}

// 生成模拟题目
const generateMockQuestion = () => {
  const questions = [
    '请详细介绍一下Vue.js的响应式原理，以及它与React的区别。',
    '如何优化前端应用的性能？请从多个角度进行说明。',
    '描述一下你在项目中是如何进行组件设计和代码复用的。',
    '请解释一下浏览器的事件循环机制。',
    '谈谈你对前端工程化的理解和实践经验。'
  ]
  return questions[currentQuestionIndex.value % questions.length]
}

// 提交回答
const submitAnswer = async () => {
  if (!currentAnswer.value.trim()) {
    ElMessage.warning('请输入回答内容')
    return
  }

  submitting.value = true
  try {
    const response = await smartApi.callWithFallback(
      () => interviewApi.submitAnswer({
        questionId: currentQuestion.value.questionId,
        question: currentQuestion.value.question,
        answer: currentAnswer.value,
        questionIndex: currentQuestionIndex.value,
        interviewType: interviewSettings.value.interviewType,
        difficulty: interviewSettings.value.difficulty,
        position: interviewSettings.value.position
      }),
      () => mockApi.submitAnswer({
        question: currentQuestion.value.question,
        answer: currentAnswer.value
      })
    )

    // 处理API响应
    const data = apiUtils.handleResponse(response)
    
    // 添加到历史记录
    interviewHistory.value.push({
      questionId: currentQuestion.value.questionId,
      question: currentQuestion.value.question,
      answer: currentAnswer.value,
      timestamp: new Date().toLocaleTimeString(),
      feedback: data.feedback
    })

    ElMessage.success('回答提交成功!')
    
    // 检查是否完成所有题目
    if (currentQuestionIndex.value >= interviewSettings.value.questionCount) {
      ElMessage.info('面试已完成！')
      setTimeout(() => {
        router.push('/result', { 
          state: { 
            history: interviewHistory.value,
            totalQuestions: interviewSettings.value.questionCount,
            settings: interviewSettings.value
          } 
        })
      }, 1000)
      return
    }
    
    // 获取下一题
    currentQuestionIndex.value++
    await getNextQuestion()
    
  } catch (error) {
    console.error('提交回答失败:', error)
    // 使用模拟反馈数据作为后备方案
    interviewHistory.value.push({
      questionId: currentQuestion.value.questionId,
      question: currentQuestion.value.question,
      answer: currentAnswer.value,
      timestamp: new Date().toLocaleTimeString(),
      feedback: {
        score: Math.floor(Math.random() * 4) + 6, // 6-10分
        comment: '这是模拟反馈，实际反馈将由AI提供。您的回答展现了一定的技术理解，建议可以更深入一些。',
        suggestions: ['可以提供更具体的示例', '深入解释技术细节']
      }
    })
    
    ElMessage.success('回答已记录（使用模拟反馈）')
    
    // 检查是否完成所有题目
    if (currentQuestionIndex.value >= interviewSettings.value.questionCount) {
      ElMessage.info('面试已完成！')
      setTimeout(() => {
        router.push('/result', { 
          state: { 
            history: interviewHistory.value,
            totalQuestions: interviewSettings.value.questionCount,
            settings: interviewSettings.value
          } 
        })
      }, 1000)
      return
    }
    
    currentQuestionIndex.value++
    await getNextQuestion()
  } finally {
    submitting.value = false
  }
}

// 返回首页
const goHome = () => {
  router.push('/')
}

// 结束面试
const endInterview = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要结束面试吗？面试记录将会保存。',
      '确认结束',
      {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // 可以在这里调用API保存面试结果
    router.push('/result', { 
      state: { 
        history: interviewHistory.value,
        totalQuestions: currentQuestionIndex.value
      } 
    })
  } catch {
    // 用户取消操作
  }
}

// 题目类型颜色
const getQuestionTypeColor = (type) => {
  const colors = {
    technical: 'primary',
    behavioral: 'success',
    system_design: 'warning',
    coding: 'danger'
  }
  return colors[type] || 'info'
}

// 题目类型文本
const getQuestionTypeText = (type) => {
  const texts = {
    technical: '技术题',
    behavioral: '行为题',
    system_design: '系统设计',
    coding: '编程题'
  }
  return texts[type] || '其他'
}

// 组件挂载时获取第一题
onMounted(() => {
  // 从路由状态获取面试设置
  const routeState = history.state
  if (routeState && routeState.settings) {
    interviewSettings.value = routeState.settings
  }
  
  getNextQuestion()
})
</script>

<style scoped>
.interview {
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

.question-card,
.answer-card,
.history-card {
  margin-bottom: 20px;
}

.question-header,
.answer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.question-content {
  min-height: 100px;
}

.question-text {
  font-size: 16px;
  line-height: 1.6;
  margin: 0;
}

.loading-area {
  text-align: center;
  padding: 20px;
}

.loading-text {
  color: #909399;
  margin-top: 15px;
}

.input-tips {
  margin-top: 10px;
  text-align: right;
}

.history-item {
  margin-bottom: 10px;
}

.history-question,
.history-answer,
.history-feedback {
  margin-bottom: 8px;
}

.history-feedback .el-tag {
  margin-right: 8px;
}

.interview-info h2 {
  margin-bottom: 8px;
  color: #303133;
}

.progress-text {
  margin-top: 4px;
  font-size: 12px;
  color: #909399;
}

.interview-info .el-progress {
  margin-bottom: 4px;
}
</style>