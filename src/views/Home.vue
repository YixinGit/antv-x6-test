<template>
  <div class="home">
    <h1>流程编辑器</h1>
    <p>基于 AntV X6 的可视化流程编排工具</p>
    <div class="links">
      <router-link to="/editor">进入编辑器</router-link>
      <router-link to="/gantt">甘特图</router-link>
    </div>
  </div>
</template>

<script setup>
</script>

<style scoped>
.home {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  gap: 16px;
}

h1 {
  font-size: 32px;
  color: #333;
}

p {
  font-size: 16px;
  color: #666;
}

.links {
  display: flex;
  gap: 12px;
}

a {
  display: inline-block;
  padding: 10px 24px;
  background: #1a73e8;
  color: #fff;
  text-decoration: none;
  border-radius: 6px;
  font-size: 14px;
}

a:hover {
  background: #1557b0;
}
</style>
