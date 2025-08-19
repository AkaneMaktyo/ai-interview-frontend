<template>
  <el-dialog
    v-model="visible"
    title="面试设置"
    width="500px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <el-form :model="settings" label-width="100px" label-position="left">
      <el-form-item label="面试类型">
        <el-select v-model="settings.interviewType" placeholder="选择面试类型" style="width: 100%">
          <el-option label="技术面试" value="technical" />
          <el-option label="行为面试" value="behavioral" />
          <el-option label="系统设计" value="system_design" />
          <el-option label="编程面试" value="coding" />
        </el-select>
      </el-form-item>

      <el-form-item label="难度等级">
        <el-radio-group v-model="settings.difficulty">
          <el-radio-button label="easy">简单</el-radio-button>
          <el-radio-button label="medium">中等</el-radio-button>
          <el-radio-button label="hard">困难</el-radio-button>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="职位方向">
        <el-select v-model="settings.position" placeholder="选择职位方向" style="width: 100%">
          <el-option label="前端开发" value="frontend" />
          <el-option label="后端开发" value="backend" />
          <el-option label="全栈开发" value="fullstack" />
          <el-option label="移动开发" value="mobile" />
          <el-option label="DevOps" value="devops" />
        </el-select>
      </el-form-item>

      <el-form-item label="工作经验">
        <el-radio-group v-model="settings.experience">
          <el-radio-button label="junior">初级 (0-2年)</el-radio-button>
          <el-radio-button label="intermediate">中级 (2-5年)</el-radio-button>
          <el-radio-button label="senior">高级 (5年以上)</el-radio-button>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="题目数量">
        <el-input-number
          v-model="settings.questionCount"
          :min="3"
          :max="20"
          :step="1"
          style="width: 100%"
        />
        <div class="form-tip">建议3-10道题，完整面试体验</div>
      </el-form-item>

      <el-form-item label="预估时长">
        <el-tag type="info">{{ estimatedTime }}分钟</el-tag>
        <div class="form-tip">根据题目数量和类型估算的面试时长</div>
      </el-form-item>
    </el-form>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" @click="handleConfirm">开始面试</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'confirm'])

const visible = ref(props.modelValue)
const settings = ref({
  interviewType: 'technical',
  difficulty: 'medium',
  position: 'frontend',
  experience: 'intermediate',
  questionCount: 5
})

// 预估面试时长计算
const estimatedTime = computed(() => {
  const baseTime = settings.value.questionCount * 3 // 基础时间：每题3分钟
  const typeMultiplier = {
    technical: 1.0,
    behavioral: 1.2,
    system_design: 1.5,
    coding: 2.0
  }
  const difficultyMultiplier = {
    easy: 0.8,
    medium: 1.0,
    hard: 1.3
  }
  
  const multiplier = typeMultiplier[settings.value.interviewType] * difficultyMultiplier[settings.value.difficulty]
  return Math.round(baseTime * multiplier)
})

// 监听外部prop变化
watch(() => props.modelValue, (val) => {
  visible.value = val
})

// 监听内部visible变化
watch(visible, (val) => {
  emit('update:modelValue', val)
})

const handleClose = () => {
  visible.value = false
}

const handleConfirm = () => {
  emit('confirm', { ...settings.value })
  visible.value = false
}
</script>

<style scoped>
.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
  line-height: 1.4;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.el-form-item {
  margin-bottom: 24px;
}
</style>