<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { initGame } from './game/main'

const gameContainer = ref<HTMLElement | null>(null)
let gameInstance: any = null

onMounted(() => {
  if (gameContainer.value) {
    // On lance Phaser en lui passant la div conteneur
    gameInstance = initGame(gameContainer.value)
  }
})

onUnmounted(() => {
  if (gameInstance) {
    // Très important pour nettoyer le cache WebGL/Canvas quand on change de route
    gameInstance.destroy(true)
  }
})
</script>

<template>
  <div class="rogue-tool">
    <div class="back-nav">
      <RouterLink to="/" class="btn-back">
        <span class="material-symbols-outlined">arrow_back</span> RETOUR
      </RouterLink>
    </div>

    <div class="window-box game-window">
      <header class="window-header">
        <span class="window-title">C:\GAMES\DUEL.EXE</span>
        <div class="window-controls">
          <div class="control-box"></div>
          <div class="control-box"></div>
          <div class="control-box"></div>
        </div>
      </header>
      
      <div class="game-content">
        <!-- Phaser va injecter le canvas du jeu directement ici -->
        <div ref="gameContainer" class="phaser-container"></div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use "@/assets/styles/variables" as *;
@use "@/assets/styles/mixins" as *;

.rogue-tool {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  gap: 20px;
  min-height: 100vh;
}

.back-nav {
  width: 100%;
  max-width: 800px;
}

.btn-back {
  border: $border-width solid $black;
  padding: 8px 16px;
  background-color: $white;
  font-weight: bold;
  font-size: 0.875rem;
  box-shadow: 3px 3px 0px 0px $black;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  @include inset-shadow-active;
  &:hover {
    background-color: $black;
    color: $white;
    @include glitch-effect;
  }
}

.game-window {
  @include window-box;
  width: 100%;
  max-width: 800px;
  display: flex;
  flex-direction: column;
  background-color: $workspace-off-white;

  .window-header {
    background-color: $header-blue;
    border-bottom: $border-width solid $black;
    padding: 4px 16px;
    display: flex;
    justify-content: space-between;
    
    .window-title { color: $white; font-size: 0.875rem; font-weight: bold; }
    .window-controls { display: flex; gap: 4px; }
    .control-box { width: 12px; height: 12px; border: 1px solid $black; background-color: $surface-pc-beige; }
  }
}

.game-content {
  padding: 16px; 
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: $black; /* Fond noir style arcade */
  flex-grow: 1; 
}

.phaser-container {
  width: 100%;
  max-width: 900px; /* Augmenté pour mieux remplir l'écran */
  aspect-ratio: 4 / 3; /* Résout le bug d'agrandissement infini */
  border: 4px solid $black;
  box-shadow: 8px 8px 0 rgba(0, 0, 0, 0.15);
  overflow: hidden;
  /* Optionnel : force le rendu pixelisé propre au pixel art */
  image-rendering: pixelated;
}
</style>
