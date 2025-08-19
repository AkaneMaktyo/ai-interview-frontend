import axios from 'axios'
import { ElMessage } from 'element-plus'

// 创建axios实例
const apiClient = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
apiClient.interceptors.request.use(
  (config) => {
    // 可以在这里添加token等认证信息
    console.log('发送请求:', config.method?.toUpperCase(), config.url)
    return config
  },
  (error) => {
    console.error('请求错误:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
apiClient.interceptors.response.use(
  (response) => {
    console.log('收到响应:', response.config.url, response.status)
    return response
  },
  (error) => {
    console.error('响应错误:', error)
    
    // 统一错误处理
    let errorMessage = '网络请求失败'
    
    if (error.response) {
      // 服务器返回错误状态码
      const { status, data } = error.response
      switch (status) {
        case 400:
          errorMessage = data.message || '请求参数错误'
          break
        case 401:
          errorMessage = '未授权，请重新登录'
          break
        case 403:
          errorMessage = '访问被拒绝'
          break
        case 404:
          errorMessage = '接口不存在'
          break
        case 500:
          errorMessage = '服务器内部错误'
          break
        default:
          errorMessage = data.message || `请求失败 (${status})`
      }
    } else if (error.request) {
      // 请求已发送但无响应
      errorMessage = '网络连接失败，请检查后端服务是否启动'
    } else {
      // 其他错误
      errorMessage = error.message || '未知错误'
    }
    
    // 显示错误消息
    ElMessage.error(errorMessage)
    
    return Promise.reject(error)
  }
)

// AI面试相关API
export const interviewApi = {
  // 测试后端连接
  testConnection: () => {
    return apiClient.get('/hello')
  },

  // 获取面试题目
  getQuestion: (params) => {
    return apiClient.post('/ai/question', {
      questionIndex: params.questionIndex || 0,
      interviewType: params.interviewType || 'technical', // technical, behavioral, system_design, coding
      difficulty: params.difficulty || 'medium', // easy, medium, hard
      position: params.position || 'frontend', // frontend, backend, fullstack
      experience: params.experience || 'intermediate', // junior, intermediate, senior
      history: params.history || []
    })
  },

  // 提交回答并获取反馈
  submitAnswer: (params) => {
    return apiClient.post('/ai/answer', {
      questionId: params.questionId,
      question: params.question,
      answer: params.answer,
      questionIndex: params.questionIndex || 0,
      interviewType: params.interviewType || 'technical',
      difficulty: params.difficulty || 'medium',
      position: params.position || 'frontend'
    })
  },

  // 获取面试总结
  getInterviewSummary: (params) => {
    return apiClient.post('/ai/summary', {
      history: params.history || [],
      totalQuestions: params.totalQuestions || 0,
      interviewDuration: params.interviewDuration || 0,
      interviewType: params.interviewType || 'technical',
      difficulty: params.difficulty || 'medium',
      position: params.position || 'frontend',
      experience: params.experience || 'intermediate'
    })
  },

  // 保存面试记录
  saveInterviewRecord: (params) => {
    return apiClient.post('/ai/save-record', {
      userId: params.userId || 'anonymous',
      history: params.history || [],
      summary: params.summary || {},
      timestamp: new Date().toISOString()
    })
  }
}

// 学习历史相关API
export const historyApi = {
  // 获取用户答题历史（分页）
  getAnswerHistory: (params) => {
    return apiClient.get('/history/records', {
      params: {
        userId: params.userId || 1,
        page: params.page || 0,
        size: params.size || 10,
        difficulty: params.difficulty,
        interviewType: params.interviewType,
        startDate: params.startDate,
        endDate: params.endDate
      }
    })
  },

  // 获取用户学习统计
  getUserStats: (params) => {
    return apiClient.get('/history/stats', {
      params: {
        userId: params.userId || 1,
        period: params.period || 'month' // week, month, year
      }
    })
  },

  // 获取用户错题记录
  getWrongAnswers: (params) => {
    return apiClient.get('/history/wrong-answers', {
      params: {
        userId: params.userId || 1
      }
    })
  },

  // 获取答题记录详情
  getRecordDetail: (recordId) => {
    return apiClient.get(`/history/record/${recordId}`)
  },

  // 获取日常学习统计
  getDailyStats: (params) => {
    return apiClient.get('/history/daily-stats', {
      params: {
        userId: params.userId || 1,
        days: params.days || 30
      }
    })
  }
}

// 错题集相关API
export const wrongQuestionApi = {
  // 获取用户错题集
  getWrongQuestions: (params) => {
    return apiClient.get('/wrong-questions/list', {
      params: {
        userId: params.userId || 1,
        includeMastered: params.includeMastered || false
      }
    })
  },

  // 获取未掌握的错题
  getUnmasteredQuestions: (params) => {
    return apiClient.get('/wrong-questions/unmastered', {
      params: {
        userId: params.userId || 1
      }
    })
  },

  // 获取错题集统计
  getWrongQuestionStats: (params) => {
    return apiClient.get('/wrong-questions/stats', {
      params: {
        userId: params.userId || 1
      }
    })
  },

  // 标记错题为已掌握
  markAsMastered: (params) => {
    return apiClient.post('/wrong-questions/master', null, {
      params: {
        userId: params.userId || 1,
        questionId: params.questionId
      }
    })
  },

  // 错题重做
  retryWrongQuestion: (params) => {
    return apiClient.post('/wrong-questions/retry', null, {
      params: {
        userId: params.userId || 1,
        questionId: params.questionId
      }
    })
  },

  // 获取最需要复习的错题
  getMostNeedReview: (params) => {
    return apiClient.get('/wrong-questions/need-review', {
      params: {
        userId: params.userId || 1,
        limit: params.limit || 10
      }
    })
  },

  // 删除错题记录
  removeFromWrongQuestions: (params) => {
    return apiClient.delete('/wrong-questions/remove', {
      params: {
        userId: params.userId || 1,
        questionId: params.questionId
      }
    })
  },

  // 检查题目是否在错题集中
  checkInWrongQuestions: (params) => {
    return apiClient.get('/wrong-questions/check', {
      params: {
        userId: params.userId || 1,
        questionId: params.questionId
      }
    })
  },

  // 手动添加题目到错题集
  addToWrongQuestions: (params) => {
    return apiClient.post('/wrong-questions/add', null, {
      params: {
        userId: params.userId || 1,
        questionId: params.questionId
      }
    })
  }
}

// 通用工具函数
export const apiUtils = {
  // 处理API响应
  handleResponse: (response) => {
    if (response.data.success) {
      return response.data.data
    } else {
      throw new Error(response.data.message || '请求失败')
    }
  },

  // 创建请求参数
  createRequestParams: (baseParams, additionalParams = {}) => {
    return {
      ...baseParams,
      ...additionalParams,
      timestamp: Date.now()
    }
  }
}

// 模拟API数据，仅作为后端服务不可用时的后备方案
export const mockApi = {
  // 模拟获取面试题目
  getQuestion: (params) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const questions = [
          "请介绍一下JavaScript的闭包机制，并提供一个实际应用场景。",
          "Vue.js和React的虚拟DOM有什么区别？各有什么优缺点？",
          "如何优化前端性能？请从多个角度详细说明。",
          "请设计一个前端微服务架构，并说明如何解决跨应用通信问题。",
          "描述一个你在工作中遇到的最大挑战，以及你是如何解决的。"
        ]
        const questionIndex = params.questionIndex || 0
        const question = questions[questionIndex % questions.length]
        
        resolve({
          data: {
            success: true,
            data: {
              question,
              type: params.interviewType || 'technical',
              questionId: 'mock_' + Date.now()
            }
          }
        })
      }, 1000)
    })
  },

  // 模拟提交答案
  submitAnswer: (params) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const score = Math.floor(Math.random() * 4) + 6 // 6-9分随机评分
        resolve({
          data: {
            success: true,
            data: {
              feedback: {
                score,
                comment: `回答${score >= 8 ? '优秀' : score >= 7 ? '良好' : '一般'}，展现了${score >= 8 ? '深厚' : score >= 7 ? '良好' : '基础'}的技术理解。`,
                suggestions: [
                  "可以提供更具体的实际案例来支撑观点",
                  "建议深入了解相关技术的底层原理",
                  "可以从性能、安全、可维护性等多个角度分析"
                ].slice(0, Math.floor(Math.random() * 2) + 1)
              }
            }
          }
        })
      }, 1500)
    })
  },

  // 模拟获取面试总结
  getInterviewSummary: (params) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const avgScore = 7
        resolve({
          data: {
            success: true,
            data: {
              overallScore: avgScore,
              overallComment: "候选人在技术面试中表现良好，具备扎实的技术基础和清晰的逻辑思维。",
              skillScores: {
                "技术能力": avgScore,
                "逻辑思维": avgScore + 1,
                "表达能力": avgScore - 1,
                "问题分析": avgScore,
                "解决方案": avgScore + 1
              },
              strengths: [
                "回答逻辑清晰，思路条理分明",
                "技术基础扎实，概念理解准确",
                "能够结合实际场景分析问题"
              ],
              weaknesses: [
                "部分回答缺乏技术深度",
                "实际案例分享较少"
              ],
              recommendations: [
                "继续深入学习技术细节和底层原理",
                "多参与开源项目或技术社区交流",
                "提高技术方案的设计和架构能力",
                "加强沟通表达能力，提升面试技巧"
              ],
              totalDuration: params.interviewDuration || 25,
              answeredQuestions: (params.history || []).length
            }
          }
        })
      }, 2000)
    })
  },

  // 模拟测试连接
  testConnection: () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          data: {
            success: true,
            data: "AI面试后端服务正在运行（模拟模式）"
          }
        })
      }, 500)
    })
  }
}

// 智能API调用，优先使用真实API，失败时降级到模拟API
export const smartApi = {
  async callWithFallback(realApiCall, mockApiCall) {
    try {
      console.log('尝试调用真实API...')
      const response = await realApiCall()
      console.log('真实API调用成功')
      return response
    } catch (error) {
      console.error('真实API调用失败:', error)
      
      // 检查是否是网络连接问题或服务器完全不可用
      if (error.code === 'NETWORK_ERROR' || error.message?.includes('Network Error') || 
          error.response?.status === 500 || error.response?.status === 502 || 
          error.response?.status === 503 || error.response?.status === 504) {
        console.warn('后端服务不可用，使用模拟数据')
        ElMessage.warning('后端服务暂不可用，使用演示数据')
        return await mockApiCall()
      } else {
        // 其他错误（如400错误等）不使用降级，直接抛出
        console.error('API调用出现错误，不使用降级机制:', error)
        ElMessage.error('请求处理失败: ' + (error.response?.data?.message || error.message))
        throw error
      }
    }
  }
}

export default apiClient