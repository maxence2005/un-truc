<script setup lang="ts">
import { RouterView } from 'vue-router'
import GlobalPopup from '@/components/GlobalPopup.vue'
</script>

<template>
  <div class="app-container">
    <RouterView />
    <GlobalPopup />
  </div>
</template>

<style scoped lang="scss">
.app-container {
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
}
</style>
