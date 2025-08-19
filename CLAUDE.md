# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

这是一个基于 Vue 3 + Vite + Element Plus 的 AI 面试应用前端项目。应用采用组合式 API 风格，使用 TypeScript 模块规范。
我希望每当我有需求提出或者改动的时候，如果和该文档有冲突，你要及时修改文档。如果是文档中没有记录的，请记录到文档中。

## 开发命令

```bash
# 开发环境启动（端口 5173）
npm run dev

# 生产构建
npm run build

# 预览构建结果
npm run preview
```

## 技术栈与架构

- **前端框架**: Vue 3 (Composition API)
- **构建工具**: Vite 
- **UI 组件库**: Element Plus + Element Plus Icons
- **HTTP 客户端**: Axios
- **开发服务器**: Vite Dev Server (端口 5173)

## 项目结构

```
src/
├── App.vue              # 根组件，路由容器
├── main.js             # 应用入口，Vue 应用初始化和配置  
├── router/
│   └── index.js        # 路由配置
├── api/
│   └── interview.js    # AI面试API封装和调用逻辑
├── components/         # 可复用组件目录
│   ├── LoadingComponent.vue      # 通用加载组件
│   └── InterviewSettings.vue     # 面试设置对话框
└── views/             # 页面级组件目录
    ├── Home.vue       # 首页 - 系统介绍和后端连接测试
    ├── Interview.vue  # 面试页面 - 题目显示、回答输入、历史记录
    └── Result.vue     # 结果页面 - 面试总结、详细反馈、能力评估
```

## 关键配置

### API 代理配置
Vite 开发服务器配置了 API 代理：
- 前端请求 `/api/*` 会被代理到 `http://localhost:8080`
- 后端服务预期运行在 8080 端口

### 依赖关系
- **运行时依赖**: Vue 3.4+, Element Plus 2.4+, Axios 1.6+
- **开发依赖**: Vite 5.0+, Vue 插件

## 开发注意事项

1. **组件开发**: 优先使用 Composition API 和 `<script setup>` 语法
2. **样式约定**: 使用 Element Plus 设计系统，避免覆盖框架样式
3. **API 调用**: 统一使用 Axios，所有后端接口通过 `/api` 前缀访问
4. **错误处理**: 使用 Element Plus 的 ElMessage 组件显示用户反馈

## 当前功能

### 核心功能
1. **面试设置**: 用户可以选择面试类型、难度、职位方向、工作经验和题目数量
2. **AI面试流程**: 动态获取面试题目，提交回答并获取AI反馈
3. **实时进度跟踪**: 显示当前进度条和题目完成情况
4. **面试历史记录**: 保存所有问答历史和反馈信息
5. **结果分析**: 提供综合评分、逐题分析、能力评估和改进建议

### 页面功能
- **首页 (Home.vue)**: 系统介绍、面试设置、后端连接测试
- **面试页面 (Interview.vue)**: 题目显示、答案输入、提交处理、历史记录
- **结果页面 (Result.vue)**: 面试总结、详细反馈、下载分享功能

### API集成
- 封装了完整的AI面试API调用逻辑
- 支持模拟数据作为后备方案
- 统一的错误处理和用户反馈

### 用户体验优化
- 响应式设计适配不同屏幕
- 加载状态和进度提示
- 友好的错误处理和用户提示
- 快捷键支持 (Ctrl+Enter 提交)
