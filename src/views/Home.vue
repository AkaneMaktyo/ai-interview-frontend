<template>
  <div class="home">
    <el-card class="welcome-card">
      <template #header>
        <div class="card-header">
          <span>欢迎使用AI面试系统</span>
        </div>
      </template>
      
      <div class="content">
        <p class="description">
          AI面试系统可以帮助您进行模拟技术面试，提供个性化的面试题目和反馈。
        </p>
        
        <el-divider />
        
        <el-row :gutter="20" class="action-area">
          <el-col :span="12">
            <el-button type="primary" size="large" @click="showSettings" :loading="loading">
              <el-icon><ChatDotRound /></el-icon>
              开始面试
            </el-button>
          </el-col>
          <el-col :span="12">
            <el-button type="success" size="large" @click="testConnection" :loading="testLoading">
              <el-icon><Connection /></el-icon>
              测试后端连接
            </el-button>
          </el-col>
        </el-row>
        
        <div v-if="connectionStatus" class="status-area">
          <el-divider />
          <el-tag :type="connectionStatus.type" size="large">
            {{ connectionStatus.message }}
          </el-tag>
        </div>
      </div>
    </el-card>
    
    <!-- 面试设置对话框 -->
    <InterviewSettings v-model="showSettingsDialog" @confirm="handleSettingsConfirm" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ChatDotRound, Connection } from '@element-plus/icons-vue'
import { interviewApi, smartApi, mockApi } from '@/api/interview'
import InterviewSettings from '@/components/InterviewSettings.vue'

const router = useRouter()
const loading = ref(false)
const testLoading = ref(false)
const connectionStatus = ref(null)
const showSettingsDialog = ref(false)

const showSettings = () => {
  showSettingsDialog.value = true
}

const handleSettingsConfirm = (settings) => {
  loading.value = true
  // 将设置传递到面试页面
  setTimeout(() => {
    router.push({
      name: 'Interview',
      state: { settings }
    })
    loading.value = false
  }, 500)
}

const testConnection = async () => {
  testLoading.value = true
  try {
    const response = await smartApi.callWithFallback(
      () => interviewApi.testConnection(),
      () => mockApi.testConnection()
    )
    connectionStatus.value = {
      type: 'success',
      message: response.data.success ? response.data.data : '后端连接成功'
    }
    ElMessage.success('连接测试成功!')
  } catch (error) {
    connectionStatus.value = {
      type: 'danger',
      message: '连接测试失败'
    }
    ElMessage.error('连接测试失败: ' + error.message)
  } finally {
    testLoading.value = false
  }
}
</script>

<style scoped>
.home {
  padding: 40px 20px;
  min-height: 60vh;
}

.welcome-card {
  max-width: 800px;
  margin: 0 auto;
}

.content {
  text-align: center;
}

.description {
  font-size: 16px;
  color: #606266;
  line-height: 1.6;
  margin-bottom: 20px;
}

.action-area {
  margin: 30px 0;
}

.action-area .el-button {
  width: 100%;
  height: 50px;
}

.status-area {
  margin-top: 20px;
}

.card-header {
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 18px;
  font-weight: bold;
}
</style>