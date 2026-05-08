<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import { tools } from '@/router'
</script>

<template>
  <div class="layout">
    <aside class="sidebar">
      <h2>Un truc</h2>
      <nav>
        <RouterLink to="/">Accueil</RouterLink>
        <hr />
        <RouterLink 
          v-for="tool in tools" 
          :key="tool.id" 
          :to="`/tools/${tool.id}`"
        >
          {{ tool.icon }} {{ tool.name }}
        </RouterLink>
      </nav>
    </aside>

    <main class="content">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.layout {
  display: flex;
  min-height: 100vh;
}

.sidebar {
  width: 250px;
  background-color: #f8f9fa;
  padding: 1rem;
  border-right: 1px solid #ddd;
}

.sidebar nav {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.sidebar a {
  text-decoration: none;
  color: #333;
  padding: 0.5rem;
  border-radius: 4px;
}

.sidebar a.router-link-active {
  background-color: #007bff;
  color: white;
}

.content {
  flex: 1;
  padding: 2rem;
}
</style>