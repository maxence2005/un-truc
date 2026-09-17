<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<template>
  <div class="pdf-signer-tool">
    <div class="back-nav">
      <RouterLink to="/" class="btn-back">
        <span class="material-symbols-outlined">arrow_back</span> RETOUR
      </RouterLink>
    </div>

    <div class="window-box signer-window">
      <header class="window-header">
        <span class="window-title">C:\SYSTEM\PDF_SIGN.EXE</span>
        <div class="window-controls">
          <div class="control-box"></div>
          <div class="control-box"></div>
          <div class="control-box"></div>
        </div>
      </header>

      <div class="signer-content">
        <div class="card-body">
          <p class="placeholder-text">
            Module de signature PDF en cours d'initialisation...
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use "@/assets/styles/variables" as *;
@use "@/assets/styles/mixins" as *;

.pdf-signer-tool {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  gap: 20px;
  min-height: calc(100vh - 40px);

  @media (max-width: 600px) {
    padding: 10px;
    min-height: calc(100vh - 20px);
    gap: 10px;
  }
}

.back-nav {
  width: 100%;
  max-width: 900px;
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
  text-decoration: none;
  color: inherit;
  @include inset-shadow-active;

  &:hover {
    background-color: $black;
    color: $white;
    @include glitch-effect;
  }
}

.signer-window {
  @include window-box;
  width: 100%;
  max-width: 900px;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}

.window-header {
  background-color: $header-blue;
  border-bottom: $border-width solid $black;
  padding: 4px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.window-title {
  color: $white;
  font-size: 0.875rem;
  font-weight: bold;
}

.window-controls {
  display: flex;
  gap: 4px;
}

.control-box {
  width: 12px;
  height: 12px;
  border: 1px solid $black;
  background-color: $surface-pc-beige;
}

.signer-content {
  padding: 16px;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
}

.card-body {
  padding: 16px;
  border: 1px dashed $black;
  background-color: $workspace-off-white;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
  flex-grow: 1;
}

.placeholder-text {
  font-family: inherit;
  font-size: 0.9rem;
  color: #666;
}
</style>
