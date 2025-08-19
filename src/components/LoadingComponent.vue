<template>
  <div class="loading-container" :class="{ 'full-screen': fullScreen }">
    <div class="loading-content">
      <el-icon class="loading-icon" :size="iconSize">
        <Loading />
      </el-icon>
      <p class="loading-text">{{ text }}</p>
      <div v-if="showProgress" class="progress-container">
        <el-progress :percentage="progress" :color="progressColor" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Loading } from '@element-plus/icons-vue'

const props = defineProps({
  text: {
    type: String,
    default: '加载中...'
  },
  fullScreen: {
    type: Boolean,
    default: false
  },
  iconSize: {
    type: Number,
    default: 40
  },
  showProgress: {
    type: Boolean,
    default: false
  },
  progress: {
    type: Number,
    default: 0
  }
})

const progressColor = computed(() => {
  if (props.progress < 30) return '#f56c6c'
  if (props.progress < 70) return '#e6a23c'
  return '#67c23a'
})
</script>

<style scoped>
.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px 20px;
}

.loading-container.full-screen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.9);
  z-index: 9999;
}

.loading-content {
  text-align: center;
}

.loading-icon {
  animation: rotate 2s linear infinite;
  color: #409eff;
  margin-bottom: 16px;
}

.loading-text {
  color: #606266;
  font-size: 14px;
  margin: 0;
  margin-bottom: 16px;
}

.progress-container {
  min-width: 200px;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>