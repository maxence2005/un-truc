<!-- src/tools/base64/Base64Tool.vue -->
<script setup lang="ts">
import { ref, computed } from 'vue';
import { useAppFacade } from '@/composables/useAppFacade';

// 1. Notre Façade
const { copyToClipboard } = useAppFacade();

// 2. État réactif
const input = ref('');
const mode = ref<'encode' | 'decode'>('encode');

// 3. Logique (qui pourrait utiliser le Pattern Stratégie si c'était plus complexe)
const output = computed(() => {
  if (!input.value) return '';
  try {
    return mode.value === 'encode' ? btoa(input.value) : atob(input.value);
  } catch (e) {
    return 'Erreur de décodage';
  }
});

const handleCopy = () => {
  copyToClipboard(output.value);
};
</script>

<template>
  <div class="tool-container">
    <h2>Encodeur / Décodeur Base64</h2>
    
    <textarea v-model="input" placeholder="Tapez votre texte ici..."></textarea>
    
    <div class="controls">
      <button @click="mode = 'encode'">Encoder</button>
      <button @click="mode = 'decode'">Décoder</button>
    </div>

    <div class="result" v-if="output">
      <p>{{ output }}</p>
      <button @click="handleCopy">Copier le résultat</button>
    </div>
  </div>
</template>

<style scoped>
.tool-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
</style>