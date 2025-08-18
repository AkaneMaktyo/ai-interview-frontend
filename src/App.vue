<template>
  <div id="app">
    <el-container>
      <el-header>
        <h1>AI Interview Application</h1>
      </el-header>
      <el-main>
        <el-card class="demo-card">
          <template #header>
            <div class="card-header">
              <span>系统状态</span>
            </div>
          </template>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-button type="primary" @click="testBackend" :loading="loading">
                <el-icon><Connection /></el-icon>
                测试后端连接
              </el-button>
            </el-col>
            <el-col :span="12">
              <el-tag :type="status.type" size="large">
                {{ status.message }}
              </el-tag>
            </el-col>
          </el-row>
          <el-divider />
          <div v-if="backendResponse" class="response-area">
            <h3>后端响应:</h3>
            <el-alert
              :title="backendResponse"
              type="success"
              :closable="false"
              show-icon>
            </el-alert>
          </div>
        </el-card>
      </el-main>
    </el-container>
  </div>
</template>

<script>
import { ref } from 'vue'
import axios from 'axios'
import { ElMessage } from 'element-plus'

export default {
  name: 'App',
  setup() {
    const loading = ref(false)
    const backendResponse = ref('')
    const status = ref({
      type: 'info',
      message: '未连接'
    })

    const testBackend = async () => {
      loading.value = true
      try {
        const response = await axios.get('/api/hello')
        backendResponse.value = response.data
        status.value = {
          type: 'success',
          message: '连接成功'
        }
        ElMessage.success('后端连接成功!')
      } catch (error) {
        status.value = {
          type: 'danger',
          message: '连接失败'
        }
        ElMessage.error('后端连接失败: ' + error.message)
      } finally {
        loading.value = false
      }
    }

    return {
      loading,
      backendResponse,
      status,
      testBackend
    }
  }
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
}

.el-header {
  background-color: #409eff;
  color: white;
  text-align: center;
  line-height: 60px;
}

.el-main {
  padding: 20px;
}

.demo-card {
  max-width: 600px;
  margin: 0 auto;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.response-area {
  margin-top: 20px;
}
</style>