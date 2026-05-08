<script setup lang="ts">
import { useAppFacade } from '@/composables/useAppFacade'

const { popups, closePopup } = useAppFacade()
</script>

<template>
  <div class="popup-container">
    <TransitionGroup name="toast">
      <div v-for="popup in popups" :key="popup.id" class="popup-toast">
        <div class="window-box toast-window">
          <header class="window-header">
            <span class="window-title">{{ popup.title || 'SYSTEM MESSAGE' }}</span>
            <div class="window-controls">
              <button class="control-box close-btn" @click="closePopup(popup.id)" title="Fermer"></button>
            </div>
          </header>
          <div class="toast-content">
            <h2 class="glitch-text">{{ popup.title }}</h2>
            <p class="toast-message">{{ popup.message }}</p>
            <div class="toast-actions">
              <button class="btn-ok" @click="closePopup(popup.id)">OK</button>
            </div>
          </div>
        </div>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped lang="scss">
@use "@/assets/styles/variables" as *;
@use "@/assets/styles/mixins" as *;

.popup-container {
  position: fixed;
  bottom: 24px;
  right: 24px;
  width: 100%;
  max-width: 350px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 12px;
  pointer-events: none; 
}

.popup-toast {
  pointer-events: auto; 
}

.toast-window {
  @include window-box;
  background-color: $surface-pc-beige;
}

.window-header {
  background-color: $header-blue;
  border-bottom: $border-width solid $black;
  padding: 4px 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.window-title {
  color: $white;
  font-size: 0.75rem;
  font-weight: bold;
}

.window-controls {
  display: flex;
}

.control-box {
  width: 12px;
  height: 12px;
  border: 1px solid $black;
  background-color: $surface-pc-beige;
  padding: 0;

  &.close-btn {
    cursor: pointer;
    &:hover {
      background-color: $glitch-red;
    }
  }
}

.toast-content {
  padding: 16px;

  h2 {
    font-size: 1.125rem;
    margin-bottom: 8px;
    text-transform: uppercase;
    @include glitch-effect;
  }

  .toast-message {
    font-size: 0.875rem;
    line-height: 1.4;
    margin-bottom: 16px;
  }
}

.toast-actions {
  display: flex;
  justify-content: flex-end;
}

.btn-ok {
  border: $border-width solid $black;
  padding: 4px 16px;
  background-color: $white;
  font-weight: bold;
  font-size: 0.75rem;
  box-shadow: 2px 2px 0px 0px $black;
  @include inset-shadow-active;

  &:hover {
    background-color: $black;
    color: $white;
  }
}


.toast-enter-active {
  animation: toast-in 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
.toast-leave-active {
  animation: toast-in 0.2s reverse ease-in;
}
.toast-move {
  transition: transform 0.3s ease;
}

@keyframes toast-in {
  from {
    transform: translateX(100%) scale(0.8);
    opacity: 0;
  }
  to {
    transform: translateX(0) scale(1);
    opacity: 1;
  }
}
</style>
