import { createRouter, createWebHistory } from 'vue-router'
import Home from '@/views/Home.vue'
import Interview from '@/views/Interview.vue'
import Result from '@/views/Result.vue'
import History from '@/views/History.vue'
import WrongQuestions from '@/views/WrongQuestions.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
    meta: {
      title: 'AI面试系统 - 首页'
    }
  },
  {
    path: '/interview',
    name: 'Interview',
    component: Interview,
    meta: {
      title: 'AI面试系统 - 面试进行中'
    }
  },
  {
    path: '/result',
    name: 'Result',
    component: Result,
    meta: {
      title: 'AI面试系统 - 面试结果'
    }
  },
  {
    path: '/history',
    name: 'History',
    component: History,
    meta: {
      title: 'AI面试系统 - 学习历史'
    }
  },
  {
    path: '/wrong-questions',
    name: 'WrongQuestions',
    component: WrongQuestions,
    meta: {
      title: 'AI面试系统 - 错题集'
    }
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫 - 设置页面标题
router.beforeEach((to, from, next) => {
  if (to.meta.title) {
    document.title = to.meta.title
  }
  next()
})

export default router