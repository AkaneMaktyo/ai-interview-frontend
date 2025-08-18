# 阶段 4：答题体验优化详细设计

## 概述
本阶段聚焦于提升用户交互体验，包括界面美观度、操作流畅性和性能优化，打造专业级的学习平台体验。

## 1. 交互体验优化

### 1.1 Loading 状态管理

#### 全局 Loading 组件
```vue
<!-- components/LoadingOverlay.vue -->
<template>
  <div v-if="visible" class="loading-overlay">
    <div class="loading-content">
      <div class="loading-spinner">
        <el-icon class="is-loading" :size="40">
          <Loading />
        </el-icon>
      </div>
      <div class="loading-text">
        <h3>{{ title }}</h3>
        <p>{{ message }}</p>
        <div v-if="showProgress" class="progress-bar">
          <el-progress 
            :percentage="progress" 
            :show-text="false"
            :stroke-width="4"/>
        </div>
      </div>
      <div v-if="canCancel" class="loading-actions">
        <el-button size="small" @click="handleCancel">取消</el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  visible: Boolean,
  title: { type: String, default: 'AI 正在思考中...' },
  message: { type: String, default: '请稍候，我们正在为您生成优质题目' },
  progress: { type: Number, default: 0 },
  showProgress: { type: Boolean, default: false },
  canCancel: { type: Boolean, default: false }
});

const emit = defineEmits(['cancel']);

const handleCancel = () => {
  emit('cancel');
};
</script>

<style scoped>
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
}

.loading-content {
  background: white;
  padding: 40px;
  border-radius: 12px;
  text-align: center;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  max-width: 400px;
}

.loading-spinner {
  margin-bottom: 20px;
  color: #409eff;
}

.loading-text h3 {
  margin: 0 0 8px 0;
  color: #303133;
  font-size: 18px;
}

.loading-text p {
  margin: 0 0 20px 0;
  color: #606266;
  font-size: 14px;
}

.progress-bar {
  margin: 20px 0;
}
</style>
```

#### 智能 Loading 状态
```javascript
// composables/useSmartLoading.js
import { ref, computed } from 'vue';

export function useSmartLoading() {
  const loadingStates = ref({
    generating: false,
    evaluating: false,
    saving: false,
    loading: false
  });
  
  const loadingMessages = {
    generating: {
      title: 'AI 正在出题',
      message: '正在基于您的要求生成个性化题目...',
      estimatedTime: 15000
    },
    evaluating: {
      title: 'AI 正在评价',
      message: '正在分析您的答案并给出专业建议...',
      estimatedTime: 10000
    },
    saving: {
      title: '保存中',
      message: '正在保存您的学习记录...',
      estimatedTime: 3000
    },
    loading: {
      title: '加载中',
      message: '正在获取数据...',
      estimatedTime: 5000
    }
  };
  
  const currentLoading = computed(() => {
    const activeState = Object.keys(loadingStates.value)
      .find(key => loadingStates.value[key]);
    return activeState ? loadingMessages[activeState] : null;
  });
  
  const setLoading = (state, value) => {
    loadingStates.value[state] = value;
  };
  
  const withLoading = async (state, asyncFn) => {
    setLoading(state, true);
    try {
      return await asyncFn();
    } finally {
      setLoading(state, false);
    }
  };
  
  return {
    loadingStates,
    currentLoading,
    setLoading,
    withLoading
  };
}
```

### 1.2 答题进度和计时器

#### 答题进度组件
```vue
<!-- components/QuestionProgress.vue -->
<template>
  <div class="question-progress">
    <div class="progress-header">
      <div class="question-counter">
        <span class="current">{{ currentIndex + 1 }}</span>
        <span class="separator">/</span>
        <span class="total">{{ totalQuestions }}</span>
      </div>
      
      <div class="timer" :class="{ 'warning': timeLeft < 60, 'danger': timeLeft < 30 }">
        <el-icon><Timer /></el-icon>
        <span>{{ formatTime(timeLeft) }}</span>
      </div>
    </div>
    
    <el-progress 
      :percentage="progressPercentage" 
      :show-text="false"
      :stroke-width="6"
      :color="progressColor"/>
    
    <div class="difficulty-indicator">
      <el-tag :type="getDifficultyType(currentQuestion.difficulty)">
        {{ getDifficultyText(currentQuestion.difficulty) }}
      </el-tag>
      
      <div class="tags">
        <el-tag 
          v-for="tag in currentQuestion.tags" 
          :key="tag" 
          size="small" 
          effect="plain">
          {{ tag }}
        </el-tag>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue';

const props = defineProps({
  currentIndex: Number,
  totalQuestions: Number,
  currentQuestion: Object,
  maxTime: { type: Number, default: 600 } // 10分钟
});

const emit = defineEmits(['timeUp', 'timeWarning']);

const timeLeft = ref(props.maxTime);
let timer = null;

const progressPercentage = computed(() => {
  if (props.totalQuestions === 0) return 0;
  return ((props.currentIndex + 1) / props.totalQuestions) * 100;
});

const progressColor = computed(() => {
  const percentage = progressPercentage.value;
  if (percentage < 30) return '#f56c6c';
  if (percentage < 70) return '#e6a23c';
  return '#67c23a';
});

const formatTime = (seconds) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const startTimer = () => {
  timer = setInterval(() => {
    if (timeLeft.value > 0) {
      timeLeft.value--;
      
      // 时间警告
      if (timeLeft.value === 60) {
        emit('timeWarning', '还剩1分钟');
      } else if (timeLeft.value === 30) {
        emit('timeWarning', '还剩30秒');
      }
    } else {
      emit('timeUp');
      clearInterval(timer);
    }
  }, 1000);
};

onMounted(() => {
  startTimer();
});

onUnmounted(() => {
  if (timer) {
    clearInterval(timer);
  }
});
</script>

<style scoped>
.question-progress {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 20px;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.question-counter {
  font-size: 18px;
  font-weight: 600;
}

.current {
  color: #409eff;
}

.separator {
  margin: 0 4px;
  color: #909399;
}

.total {
  color: #909399;
}

.timer {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 16px;
  font-weight: 500;
  color: #409eff;
}

.timer.warning {
  color: #e6a23c;
}

.timer.danger {
  color: #f56c6c;
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.difficulty-indicator {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
}

.tags {
  display: flex;
  gap: 8px;
}
</style>
```

### 1.3 键盘快捷键支持

#### 快捷键组合器
```javascript
// composables/useKeyboardShortcuts.js
import { onMounted, onUnmounted } from 'vue';

export function useKeyboardShortcuts(shortcuts) {
  const handleKeydown = (event) => {
    const key = event.key.toLowerCase();
    const ctrl = event.ctrlKey;
    const shift = event.shiftKey;
    const alt = event.altKey;
    
    // 构建快捷键字符串
    let shortcutKey = '';
    if (ctrl) shortcutKey += 'ctrl+';
    if (shift) shortcutKey += 'shift+';
    if (alt) shortcutKey += 'alt+';
    shortcutKey += key;
    
    const handler = shortcuts[shortcutKey];
    if (handler) {
      event.preventDefault();
      handler(event);
    }
  };
  
  onMounted(() => {
    document.addEventListener('keydown', handleKeydown);
  });
  
  onUnmounted(() => {
    document.removeEventListener('keydown', handleKeydown);
  });
  
  return {
    // 可以返回动态添加快捷键的方法
    addShortcut: (key, handler) => {
      shortcuts[key] = handler;
    },
    removeShortcut: (key) => {
      delete shortcuts[key];
    }
  };
}
```

#### 答题页面快捷键
```vue
<script setup>
import { useKeyboardShortcuts } from '@/composables/useKeyboardShortcuts';

// 定义快捷键
const shortcuts = {
  'ctrl+enter': () => submitAnswer(),
  'ctrl+s': () => saveDraft(),
  'esc': () => showExitConfirm(),
  'ctrl+h': () => showHints(),
  'ctrl+r': () => resetAnswer(),
  'f1': () => showHelp()
};

useKeyboardShortcuts(shortcuts);

// 显示快捷键提示
const showShortcutTooltip = ref(false);
</script>

<template>
  <div class="question-page">
    <!-- 快捷键提示 -->
    <div v-if="showShortcutTooltip" class="shortcut-tooltip">
      <div class="shortcut-item">
        <kbd>Ctrl</kbd> + <kbd>Enter</kbd> 提交答案
      </div>
      <div class="shortcut-item">
        <kbd>Ctrl</kbd> + <kbd>S</kbd> 保存草稿
      </div>
      <div class="shortcut-item">
        <kbd>Ctrl</kbd> + <kbd>H</kbd> 显示提示
      </div>
      <div class="shortcut-item">
        <kbd>F1</kbd> 帮助
      </div>
    </div>
    
    <!-- 其他组件 -->
  </div>
</template>

<style scoped>
.shortcut-tooltip {
  position: fixed;
  bottom: 20px;
  right: 20px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 12px;
  border-radius: 8px;
  font-size: 12px;
  z-index: 1000;
}

.shortcut-item {
  margin: 4px 0;
}

kbd {
  background: #333;
  border: 1px solid #555;
  border-radius: 3px;
  padding: 2px 4px;
  font-size: 11px;
}
</style>
```

## 2. 内容展示优化

### 2.1 Markdown 渲染器

#### Markdown 组件安装和配置
```bash
npm install marked highlight.js
```

```vue
<!-- components/MarkdownRenderer.vue -->
<template>
  <div class="markdown-content" v-html="renderedContent"></div>
</template>

<script setup>
import { computed } from 'vue';
import { marked } from 'marked';
import hljs from 'highlight.js';
import 'highlight.js/styles/github.css';

const props = defineProps({
  content: String,
  options: {
    type: Object,
    default: () => ({})
  }
});

// 配置 marked
marked.setOptions({
  highlight: function(code, lang) {
    const language = hljs.getLanguage(lang) ? lang : 'plaintext';
    return hljs.highlight(code, { language }).value;
  },
  langPrefix: 'hljs language-',
  breaks: true,
  gfm: true
});

const renderedContent = computed(() => {
  if (!props.content) return '';
  
  try {
    return marked(props.content);
  } catch (error) {
    console.error('Markdown 渲染错误:', error);
    return props.content;
  }
});
</script>

<style scoped>
.markdown-content {
  line-height: 1.6;
  color: #333;
}

.markdown-content h1,
.markdown-content h2,
.markdown-content h3 {
  margin-top: 24px;
  margin-bottom: 16px;
  font-weight: 600;
  line-height: 1.25;
}

.markdown-content h1 {
  font-size: 2em;
  border-bottom: 1px solid #eaecef;
  padding-bottom: 10px;
}

.markdown-content h2 {
  font-size: 1.5em;
  border-bottom: 1px solid #eaecef;
  padding-bottom: 8px;
}

.markdown-content h3 {
  font-size: 1.25em;
}

.markdown-content p {
  margin-bottom: 16px;
}

.markdown-content code {
  background: #f6f8fa;
  border-radius: 3px;
  font-size: 85%;
  margin: 0;
  padding: 0.2em 0.4em;
}

.markdown-content pre {
  background: #f6f8fa;
  border-radius: 6px;
  font-size: 85%;
  line-height: 1.45;
  overflow: auto;
  padding: 16px;
  margin-bottom: 16px;
}

.markdown-content pre code {
  background: transparent;
  border: 0;
  display: inline;
  line-height: inherit;
  margin: 0;
  max-width: auto;
  overflow: visible;
  padding: 0;
  word-wrap: normal;
}

.markdown-content blockquote {
  border-left: 4px solid #dfe2e5;
  margin: 0 0 16px 0;
  padding: 0 16px;
  color: #6a737d;
}

.markdown-content ul,
.markdown-content ol {
  margin-bottom: 16px;
  padding-left: 2em;
}

.markdown-content li {
  margin-bottom: 4px;
}

.markdown-content table {
  border-collapse: collapse;
  margin-bottom: 16px;
  width: 100%;
}

.markdown-content table th,
.markdown-content table td {
  border: 1px solid #dfe2e5;
  padding: 6px 13px;
}

.markdown-content table th {
  background: #f6f8fa;
  font-weight: 600;
}
</style>
```

### 2.2 代码高亮和复制功能

#### 增强的代码块组件
```vue
<!-- components/CodeBlock.vue -->
<template>
  <div class="code-block">
    <div class="code-header">
      <span class="language-label">{{ language }}</span>
      <div class="code-actions">
        <el-button 
          size="small" 
          text 
          @click="copyCode"
          :icon="copied ? Check : CopyDocument">
          {{ copied ? '已复制' : '复制' }}
        </el-button>
        <el-button 
          v-if="runnable"
          size="small" 
          text 
          @click="runCode"
          :icon="CaretRight">
          运行
        </el-button>
      </div>
    </div>
    
    <div class="code-content">
      <pre><code :class="`language-${language}`" v-html="highlightedCode"></code></pre>
    </div>
    
    <!-- 运行结果 -->
    <div v-if="showResult && result" class="code-result">
      <div class="result-header">
        <span>运行结果:</span>
      </div>
      <pre class="result-content">{{ result }}</pre>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { Check, CopyDocument, CaretRight } from '@element-plus/icons-vue';
import hljs from 'highlight.js';

const props = defineProps({
  code: String,
  language: { type: String, default: 'javascript' },
  runnable: { type: Boolean, default: false }
});

const copied = ref(false);
const showResult = ref(false);
const result = ref('');

const highlightedCode = computed(() => {
  try {
    const highlighted = hljs.highlight(props.code, { language: props.language });
    return highlighted.value;
  } catch (error) {
    return props.code;
  }
});

const copyCode = async () => {
  try {
    await navigator.clipboard.writeText(props.code);
    copied.value = true;
    setTimeout(() => {
      copied.value = false;
    }, 2000);
  } catch (error) {
    console.error('复制失败:', error);
  }
};

const runCode = () => {
  // 这里可以集成代码执行服务
  if (props.language === 'javascript') {
    try {
      const func = new Function(props.code);
      result.value = func();
      showResult.value = true;
    } catch (error) {
      result.value = error.message;
      showResult.value = true;
    }
  }
};
</script>

<style scoped>
.code-block {
  border: 1px solid #e1e4e8;
  border-radius: 6px;
  margin: 16px 0;
  overflow: hidden;
}

.code-header {
  background: #f6f8fa;
  border-bottom: 1px solid #e1e4e8;
  padding: 8px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.language-label {
  font-size: 12px;
  color: #586069;
  text-transform: uppercase;
  font-weight: 600;
}

.code-actions {
  display: flex;
  gap: 8px;
}

.code-content {
  overflow-x: auto;
}

.code-content pre {
  margin: 0;
  padding: 16px;
  font-size: 14px;
  line-height: 1.45;
}

.code-result {
  border-top: 1px solid #e1e4e8;
  background: #f8f9fa;
}

.result-header {
  padding: 8px 16px;
  font-size: 12px;
  color: #586069;
  font-weight: 600;
  background: #e1e4e8;
}

.result-content {
  margin: 0;
  padding: 16px;
  font-size: 14px;
  line-height: 1.45;
  color: #24292e;
}
</style>
```

### 2.3 关键信息标注

#### 智能关键词高亮组件
```vue
<!-- components/KeywordHighlight.vue -->
<template>
  <div class="keyword-highlight" v-html="highlightedText"></div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  text: String,
  keywords: Array,
  caseSensitive: { type: Boolean, default: false }
});

const highlightedText = computed(() => {
  if (!props.text || !props.keywords?.length) {
    return props.text;
  }
  
  let result = props.text;
  
  props.keywords.forEach(keyword => {
    const regex = new RegExp(
      `(${escapeRegExp(keyword)})`, 
      props.caseSensitive ? 'g' : 'gi'
    );
    
    result = result.replace(regex, (match) => {
      return `<mark class="keyword-mark">${match}</mark>`;
    });
  });
  
  return result;
});

const escapeRegExp = (string) => {
  return string.replace(/[.*+?^${}()|[\\]\\]/g, '\\\\$&');
};
</script>

<style scoped>
.keyword-highlight :deep(.keyword-mark) {
  background: linear-gradient(120deg, #a8e6cf 0%, #dcedc1 100%);
  padding: 2px 4px;
  border-radius: 3px;
  font-weight: 500;
  border: 1px solid #7fcdcd;
}
</style>
```

## 3. 性能优化

### 3.1 虚拟滚动实现

#### 大数据列表组件
```vue
<!-- components/VirtualList.vue -->
<template>
  <div class="virtual-list" ref="containerRef" @scroll="handleScroll">
    <div class="virtual-list-phantom" :style="{ height: phantomHeight + 'px' }"></div>
    
    <div 
      class="virtual-list-content" 
      :style="{ transform: `translateY(${startOffset}px)` }">
      <div
        v-for="item in visibleItems"
        :key="item.id"
        class="virtual-list-item"
        :style="{ height: itemHeight + 'px' }">
        <slot :item="item" :index="item.index">
          {{ item }}
        </slot>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';

const props = defineProps({
  items: Array,
  itemHeight: { type: Number, default: 60 },
  containerHeight: { type: Number, default: 400 },
  bufferSize: { type: Number, default: 5 }
});

const containerRef = ref(null);
const scrollTop = ref(0);

// 计算可见区域
const visibleCount = computed(() => {
  return Math.ceil(props.containerHeight / props.itemHeight) + props.bufferSize * 2;
});

const startIndex = computed(() => {
  return Math.max(0, Math.floor(scrollTop.value / props.itemHeight) - props.bufferSize);
});

const endIndex = computed(() => {
  return Math.min(props.items.length, startIndex.value + visibleCount.value);
});

const visibleItems = computed(() => {
  return props.items.slice(startIndex.value, endIndex.value).map((item, index) => ({
    ...item,
    index: startIndex.value + index
  }));
});

const phantomHeight = computed(() => {
  return props.items.length * props.itemHeight;
});

const startOffset = computed(() => {
  return startIndex.value * props.itemHeight;
});

const handleScroll = (event) => {
  scrollTop.value = event.target.scrollTop;
};

onMounted(() => {
  if (containerRef.value) {
    containerRef.value.style.height = props.containerHeight + 'px';
  }
});
</script>

<style scoped>
.virtual-list {
  overflow-y: auto;
  position: relative;
}

.virtual-list-phantom {
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  z-index: -1;
}

.virtual-list-content {
  left: 0;
  right: 0;
  top: 0;
  position: absolute;
}

.virtual-list-item {
  display: flex;
  align-items: center;
  border-bottom: 1px solid #f0f0f0;
}
</style>
```

### 3.2 图片懒加载

#### 懒加载指令
```javascript
// directives/lazyLoad.js
const observerOptions = {
  root: null,
  rootMargin: '50px',
  threshold: 0.1
};

const imageObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const img = entry.target;
      const src = img.dataset.src;
      
      if (src) {
        img.src = src;
        img.classList.remove('lazy-loading');
        img.classList.add('lazy-loaded');
        imageObserver.unobserve(img);
      }
    }
  });
}, observerOptions);

export const lazyLoad = {
  mounted(el, binding) {
    el.dataset.src = binding.value;
    el.classList.add('lazy-loading');
    imageObserver.observe(el);
  },
  
  updated(el, binding) {
    if (binding.value !== binding.oldValue) {
      el.dataset.src = binding.value;
    }
  },
  
  unmounted(el) {
    imageObserver.unobserve(el);
  }
};
```

```css
/* 懒加载样式 */
.lazy-loading {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
}

.lazy-loaded {
  transition: opacity 0.3s ease;
}

@keyframes loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

### 3.3 接口缓存策略

#### 智能缓存管理器
```javascript
// utils/cacheManager.js
class CacheManager {
  constructor() {
    this.cache = new Map();
    this.ttl = new Map(); // Time To Live
    this.maxSize = 100;
  }
  
  set(key, value, ttlMs = 300000) { // 默认5分钟
    // 清理过期缓存
    this.cleanup();
    
    // 如果缓存满了，删除最旧的
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
      this.ttl.delete(firstKey);
    }
    
    this.cache.set(key, value);
    this.ttl.set(key, Date.now() + ttlMs);
  }
  
  get(key) {
    const expireTime = this.ttl.get(key);
    
    if (!expireTime || Date.now() > expireTime) {
      this.cache.delete(key);
      this.ttl.delete(key);
      return null;
    }
    
    return this.cache.get(key);
  }
  
  has(key) {
    return this.get(key) !== null;
  }
  
  delete(key) {
    this.cache.delete(key);
    this.ttl.delete(key);
  }
  
  clear() {
    this.cache.clear();
    this.ttl.clear();
  }
  
  cleanup() {
    const now = Date.now();
    for (const [key, expireTime] of this.ttl.entries()) {
      if (now > expireTime) {
        this.cache.delete(key);
        this.ttl.delete(key);
      }
    }
  }
}

export const cacheManager = new CacheManager();
```

#### 带缓存的 API 调用
```javascript
// api/cachedApi.js
import { cacheManager } from '@/utils/cacheManager';
import axios from 'axios';

const cachedRequest = async (config, cacheKey, ttl = 300000) => {
  // 检查缓存
  const cached = cacheManager.get(cacheKey);
  if (cached) {
    return cached;
  }
  
  // 发起请求
  const response = await axios(config);
  
  // 存入缓存
  cacheManager.set(cacheKey, response, ttl);
  
  return response;
};

// 具体API方法
export const getQuestionHistory = (params) => {
  const cacheKey = `history_${JSON.stringify(params)}`;
  return cachedRequest({
    url: '/api/answers/history',
    method: 'get',
    params
  }, cacheKey, 60000); // 1分钟缓存
};

export const getPersonalStats = (params) => {
  const cacheKey = `stats_${JSON.stringify(params)}`;
  return cachedRequest({
    url: '/api/stats/personal',
    method: 'get',
    params
  }, cacheKey, 300000); // 5分钟缓存
};
```

## 4. 响应式设计

### 4.1 移动端适配

#### 响应式布局组件
```vue
<!-- components/ResponsiveContainer.vue -->
<template>
  <div class="responsive-container" :class="deviceClass">
    <slot :device="device" :isMobile="isMobile" :isTablet="isTablet"></slot>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';

const windowWidth = ref(window.innerWidth);

const device = computed(() => {
  if (windowWidth.value < 768) return 'mobile';
  if (windowWidth.value < 1024) return 'tablet';
  return 'desktop';
});

const isMobile = computed(() => device.value === 'mobile');
const isTablet = computed(() => device.value === 'tablet');

const deviceClass = computed(() => `device-${device.value}`);

const handleResize = () => {
  windowWidth.value = window.innerWidth;
};

onMounted(() => {
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
});
</script>

<style scoped>
.responsive-container {
  width: 100%;
  height: 100%;
}

.device-mobile {
  --container-padding: 12px;
  --font-size-base: 14px;
  --button-size: small;
}

.device-tablet {
  --container-padding: 16px;
  --font-size-base: 14px;
  --button-size: default;
}

.device-desktop {
  --container-padding: 20px;
  --font-size-base: 16px;
  --button-size: default;
}
</style>
```

### 4.2 自适应题目展示

#### 移动端优化的题目卡片
```vue
<!-- components/MobileQuestionCard.vue -->
<template>
  <ResponsiveContainer>
    <template #default="{ isMobile, isTablet }">
      <el-card 
        class="question-card"
        :class="{ 'mobile-card': isMobile, 'tablet-card': isTablet }">
        
        <!-- 题目头部 -->
        <template #header>
          <div class="question-header">
            <div class="question-meta">
              <el-tag :type="getDifficultyType(question.difficulty)" size="small">
                {{ getDifficultyText(question.difficulty) }}
              </el-tag>
              <span class="question-type">{{ question.type }}</span>
            </div>
            
            <div v-if="!isMobile" class="question-actions">
              <el-button size="small" text @click="toggleBookmark">
                <el-icon><Star /></el-icon>
              </el-button>
              <el-button size="small" text @click="shareQuestion">
                <el-icon><Share /></el-icon>
              </el-button>
            </div>
          </div>
        </template>
        
        <!-- 题目内容 -->
        <div class="question-content">
          <MarkdownRenderer 
            :content="question.content"
            :class="{ 'mobile-content': isMobile }"/>
        </div>
        
        <!-- 提示按钮 -->
        <div v-if="question.hints?.length" class="hints-section">
          <el-button 
            size="small" 
            text 
            @click="showHints = !showHints"
            :class="{ 'mobile-hint-btn': isMobile }">
            <el-icon><Lightbulb /></el-icon>
            {{ showHints ? '隐藏提示' : '查看提示' }}
          </el-button>
          
          <el-collapse-transition>
            <div v-show="showHints" class="hints-content">
              <el-alert
                v-for="(hint, index) in question.hints"
                :key="index"
                :title="`提示 ${index + 1}: ${hint}`"
                type="info"
                :closable="false"
                show-icon/>
            </div>
          </el-collapse-transition>
        </div>
        
        <!-- 答题区域 -->
        <div class="answer-section">
          <el-input
            v-model="userAnswer"
            type="textarea"
            :rows="isMobile ? 4 : 6"
            placeholder="请输入你的答案..."
            :maxlength="isMobile ? 500 : 2000"
            show-word-limit
            class="answer-input"/>
          
          <!-- 移动端操作栏 -->
          <div class="answer-actions" :class="{ 'mobile-actions': isMobile }">
            <div class="action-left">
              <el-button 
                v-if="isMobile"
                size="small" 
                text 
                @click="toggleBookmark">
                <el-icon><Star /></el-icon>
              </el-button>
              
              <el-button 
                size="small" 
                text 
                @click="saveDraft"
                :loading="savingDraft">
                <el-icon><Document /></el-icon>
                {{ isMobile ? '草稿' : '保存草稿' }}
              </el-button>
            </div>
            
            <div class="action-right">
              <el-button 
                size="small"
                @click="resetAnswer">
                {{ isMobile ? '重置' : '重新作答' }}
              </el-button>
              
              <el-button 
                type="primary"
                :size="isMobile ? 'small' : 'default'"
                @click="submitAnswer"
                :loading="submitting"
                :disabled="!userAnswer.trim()">
                {{ isMobile ? '提交' : '提交答案' }}
              </el-button>
            </div>
          </div>
        </div>
      </el-card>
    </template>
  </ResponsiveContainer>
</template>

<script setup>
import { ref } from 'vue';
import ResponsiveContainer from './ResponsiveContainer.vue';
import MarkdownRenderer from './MarkdownRenderer.vue';

const props = defineProps({
  question: Object
});

const userAnswer = ref('');
const showHints = ref(false);
const submitting = ref(false);
const savingDraft = ref(false);
</script>

<style scoped>
.question-card {
  margin-bottom: 20px;
}

.mobile-card {
  margin: 0 -12px 16px -12px;
  border-radius: 0;
  border-left: none;
  border-right: none;
}

.tablet-card {
  margin-bottom: 16px;
}

.question-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.question-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.question-type {
  font-size: 12px;
  color: #909399;
}

.question-content {
  margin-bottom: 20px;
}

.mobile-content {
  font-size: 14px;
  line-height: 1.5;
}

.hints-section {
  margin-bottom: 20px;
}

.mobile-hint-btn {
  font-size: 12px;
}

.hints-content {
  margin-top: 12px;
}

.answer-section {
  margin-top: 20px;
}

.answer-input {
  margin-bottom: 16px;
}

.answer-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.mobile-actions {
  flex-direction: column;
  gap: 12px;
  align-items: stretch;
}

.mobile-actions .action-left,
.mobile-actions .action-right {
  display: flex;
  justify-content: space-between;
  width: 100%;
}

.action-left {
  display: flex;
  gap: 8px;
  align-items: center;
}

.action-right {
  display: flex;
  gap: 8px;
  align-items: center;
}

/* 移动端特殊样式 */
@media (max-width: 767px) {
  .question-card :deep(.el-card__header) {
    padding: 12px 16px;
  }
  
  .question-card :deep(.el-card__body) {
    padding: 16px;
  }
  
  .answer-input :deep(.el-textarea__inner) {
    font-size: 16px; /* 防止iOS缩放 */
  }
}
</style>
```

## 5. 动画和过渡效果

### 5.1 页面切换动画

#### 路由过渡动画
```vue
<!-- App.vue -->
<template>
  <div id="app">
    <router-view v-slot="{ Component, route }">
      <transition 
        :name="getTransitionName(route)"
        mode="out-in"
        @before-enter="onBeforeEnter"
        @enter="onEnter"
        @leave="onLeave">
        <component :is="Component" :key="route.fullPath"/>
      </transition>
    </router-view>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const transitionName = ref('fade');

const getTransitionName = (route) => {
  // 根据路由元信息决定动画类型
  return route.meta?.transition || 'slide-left';
};

const onBeforeEnter = (el) => {
  el.style.opacity = '0';
  el.style.transform = 'translateX(30px)';
};

const onEnter = (el, done) => {
  el.offsetHeight; // 触发重排
  el.style.transition = 'all 0.3s ease';
  el.style.opacity = '1';
  el.style.transform = 'translateX(0)';
  setTimeout(done, 300);
};

const onLeave = (el, done) => {
  el.style.transition = 'all 0.3s ease';
  el.style.opacity = '0';
  el.style.transform = 'translateX(-30px)';
  setTimeout(done, 300);
};
</script>

<style>
/* 淡入淡出 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 左滑效果 */
.slide-left-enter-active,
.slide-left-leave-active {
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.slide-left-enter-from {
  transform: translateX(100%);
  opacity: 0;
}

.slide-left-leave-to {
  transform: translateX(-100%);
  opacity: 0;
}

/* 右滑效果 */
.slide-right-enter-active,
.slide-right-leave-active {
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.slide-right-enter-from {
  transform: translateX(-100%);
  opacity: 0;
}

.slide-right-leave-to {
  transform: translateX(100%);
  opacity: 0;
}
</style>
```

### 5.2 交互动画

#### 按钮悬停效果
```css
/* styles/animations.css */
.btn-hover-effect {
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
}

.btn-hover-effect::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.2),
    transparent
  );
  transition: left 0.5s ease;
}

.btn-hover-effect:hover::before {
  left: 100%;
}

.btn-hover-effect:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

/* 卡片悬停效果 */
.card-hover-effect {
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  cursor: pointer;
}

.card-hover-effect:hover {
  transform: translateY(-8px);
  box-shadow: 
    0 14px 28px rgba(0, 0, 0, 0.12),
    0 10px 10px rgba(0, 0, 0, 0.08);
}

/* 加载动画 */
.pulse-loading {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.bounce-in {
  animation: bounceIn 0.6s ease;
}

@keyframes bounceIn {
  0% {
    opacity: 0;
    transform: scale(0.3);
  }
  50% {
    opacity: 1;
    transform: scale(1.05);
  }
  70% {
    transform: scale(0.9);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

/* 打字机效果 */
.typewriter {
  overflow: hidden;
  border-right: 2px solid #409eff;
  white-space: nowrap;
  animation: 
    typing 3.5s steps(40, end),
    blink-caret 0.75s step-end infinite;
}

@keyframes typing {
  from { width: 0; }
  to { width: 100%; }
}

@keyframes blink-caret {
  from, to { border-color: transparent; }
  50% { border-color: #409eff; }
}
```

## 6. 主题定制

### 6.1 动态主题切换

#### 主题管理器
```javascript
// composables/useTheme.js
import { ref, computed } from 'vue';

const currentTheme = ref(localStorage.getItem('theme') || 'light');

const themes = {
  light: {
    primary: '#409eff',
    success: '#67c23a',
    warning: '#e6a23c',
    danger: '#f56c6c',
    info: '#909399',
    background: '#ffffff',
    backgroundSecondary: '#f8f9fa',
    text: '#303133',
    textSecondary: '#606266',
    border: '#dcdfe6',
    borderLight: '#e4e7ed'
  },
  dark: {
    primary: '#409eff',
    success: '#67c23a',
    warning: '#e6a23c',
    danger: '#f56c6c',
    info: '#909399',
    background: '#1a1a1a',
    backgroundSecondary: '#2d2d2d',
    text: '#e4e4e4',
    textSecondary: '#b4b4b4',
    border: '#404040',
    borderLight: '#363636'
  },
  blue: {
    primary: '#1890ff',
    success: '#52c41a',
    warning: '#faad14',
    danger: '#ff4d4f',
    info: '#909399',
    background: '#f0f5ff',
    backgroundSecondary: '#e6f7ff',
    text: '#001529',
    textSecondary: '#435266',
    border: '#91d5ff',
    borderLight: '#b7e7ff'
  }
};

export function useTheme() {
  const themeColors = computed(() => themes[currentTheme.value]);
  
  const setTheme = (theme) => {
    if (themes[theme]) {
      currentTheme.value = theme;
      localStorage.setItem('theme', theme);
      updateCSSVariables();
    }
  };
  
  const updateCSSVariables = () => {
    const root = document.documentElement;
    const colors = themeColors.value;
    
    Object.entries(colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value);
    });
  };
  
  const isDark = computed(() => currentTheme.value === 'dark');
  
  // 初始化主题
  updateCSSVariables();
  
  return {
    currentTheme,
    themes: Object.keys(themes),
    themeColors,
    setTheme,
    isDark
  };
}
```

#### 主题切换组件
```vue
<!-- components/ThemeSelector.vue -->
<template>
  <el-dropdown @command="handleThemeChange">
    <el-button text>
      <el-icon><Palette /></el-icon>
      主题
    </el-button>
    
    <template #dropdown>
      <el-dropdown-menu>
        <el-dropdown-item 
          v-for="theme in themes" 
          :key="theme"
          :command="theme"
          :class="{ 'is-active': currentTheme === theme }">
          <div class="theme-option">
            <div 
              class="theme-preview" 
              :style="{ backgroundColor: getThemePreviewColor(theme) }">
            </div>
            <span>{{ getThemeName(theme) }}</span>
            <el-icon v-if="currentTheme === theme" class="theme-check">
              <Check />
            </el-icon>
          </div>
        </el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>

<script setup>
import { useTheme } from '@/composables/useTheme';
import { Palette, Check } from '@element-plus/icons-vue';

const { currentTheme, themes, setTheme, themeColors } = useTheme();

const themeNames = {
  light: '浅色主题',
  dark: '深色主题',
  blue: '蓝色主题'
};

const getThemeName = (theme) => themeNames[theme] || theme;

const getThemePreviewColor = (theme) => {
  const themeConfig = {
    light: '#409eff',
    dark: '#1a1a1a',
    blue: '#1890ff'
  };
  return themeConfig[theme];
};

const handleThemeChange = (theme) => {
  setTheme(theme);
};
</script>

<style scoped>
.theme-option {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 120px;
}

.theme-preview {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid #ddd;
}

.theme-check {
  margin-left: auto;
  color: var(--color-primary);
}

.is-active {
  background-color: var(--color-primary);
  color: white;
}
</style>
```

## 7. 部署优化

### 7.1 构建优化配置
```javascript
// vite.config.js
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';

export default defineConfig({
  plugins: [vue()],
  
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  
  build: {
    target: 'es2015',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },
    
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['vue', 'vue-router'],
          'element-plus': ['element-plus'],
          'utils': ['axios', 'lodash-es']
        }
      }
    },
    
    chunkSizeWarningLimit: 1000
  },
  
  optimizeDeps: {
    include: ['vue', 'vue-router', 'element-plus', 'axios']
  }
});
```

### 7.2 PWA 支持
```javascript
// vite.config.js 添加 PWA 插件
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}']
      },
      manifest: {
        name: 'AI Interview Assistant',
        short_name: 'AI Interview',
        description: 'AI 驱动的面试训练平台',
        theme_color: '#409eff',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ]
});
```

本阶段完成后，应用将具备专业级的用户体验，包括流畅的交互动画、美观的内容展示、优秀的性能表现和良好的移动端适配。