<template>
  <div id="app">
    <el-container>
      <el-header>
        <div class="header-content">
          <h1>AI面试系统</h1>
          <el-menu 
            :default-active="$route.path"
            class="nav-menu"
            mode="horizontal"
            router
            background-color="#409eff"
            text-color="#fff"
            active-text-color="#fff"
            @select="handleSelect"
          >
            <el-menu-item index="/">
              <el-icon><House /></el-icon>
              <span>首页</span>
            </el-menu-item>
            <el-menu-item index="/interview">
              <el-icon><EditPen /></el-icon>
              <span>开始面试</span>
            </el-menu-item>
            <el-menu-item index="/history">
              <el-icon><Document /></el-icon>
              <span>学习历史</span>
            </el-menu-item>
            <el-menu-item index="/wrong-questions">
              <el-icon><Warning /></el-icon>
              <span>错题集</span>
            </el-menu-item>
          </el-menu>
        </div>
      </el-header>
      <el-main>
        <router-view />
      </el-main>
    </el-container>
  </div>
</template>

<script setup>
import { House, EditPen, Document, Warning } from '@element-plus/icons-vue'

// 导航菜单选择处理
const handleSelect = (index) => {
  console.log('导航到:', index)
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  min-height: 100vh;
}

.el-header {
  background-color: #409eff;
  color: white;
  padding: 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.12);
  height: auto;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  height: 60px;
}

.header-content h1 {
  margin: 0;
  font-size: 24px;
  color: white;
}

.nav-menu {
  border: none;
  flex: 1;
  justify-content: flex-end;
}

.nav-menu .el-menu-item {
  border-bottom: none;
}

.nav-menu .el-menu-item:hover {
  background-color: rgba(255, 255, 255, 0.1) !important;
  color: #fff !important;
}

.nav-menu .el-menu-item.is-active {
  background-color: rgba(255, 255, 255, 0.2) !important;
  border-bottom: 2px solid #fff !important;
}

.el-main {
  padding: 0;
  background-color: #f5f7fa;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    height: auto;
    padding: 10px;
  }
  
  .header-content h1 {
    margin-bottom: 10px;
    font-size: 20px;
  }
  
  .nav-menu {
    width: 100%;
    justify-content: center;
  }
  
  .nav-menu .el-menu-item {
    padding: 0 10px;
  }
}
</style>