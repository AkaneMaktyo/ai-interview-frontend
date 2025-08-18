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
├── App.vue          # 根组件，包含系统状态检测和后端连接测试
├── main.js          # 应用入口，Vue 应用初始化和 Element Plus 配置  
├── components/      # 可复用组件目录（当前为空）
└── views/           # 页面级组件目录（当前为空）
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

应用目前包含一个简单的后端连接测试功能，位于 `App.vue:58-77`，用于验证前后端通信。
