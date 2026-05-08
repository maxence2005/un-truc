<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<template>
  <main class="page-view">
    <div class="window-box page-window">
      <header class="window-header">
        <span class="window-title">C:\SYSTEM\CONTACT.TXT</span>
        <div class="window-controls">
          <div class="control-box"></div>
          <div class="control-box"></div>
          <RouterLink to="/" class="control-box close-btn" title="Fermer"></RouterLink>
        </div>
      </header>
      <div class="page-content">
        <h1 class="glitch-text-permanent">Contact</h1>
        
        <section>
          <p>Vous avez une question, un bug à signaler ou vous voulez simplement nous saluer ?</p>
          <p>Écrivez-nous directement à l'adresse suivante :</p>
          <div class="contact-box">
            <a href="mailto:contact@un-truc.fr" class="contact-email">contact@un-truc.fr</a>
          </div>
        </section>

        <div class="back-link">
          <RouterLink to="/" class="btn-launch">
            <span class="material-symbols-outlined">arrow_back</span> RETOUR
          </RouterLink>
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped lang="scss">
@use "@/assets/styles/variables" as *;
@use "@/assets/styles/mixins" as *;

.page-view {
  padding: 32px;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 100vh;
}

.window-box {
  @include window-box;
  width: 100%;
  max-width: 800px;
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
  
  &.close-btn {
    cursor: pointer;
    &:hover {
      background-color: $glitch-red;
    }
  }
}

.page-content {
  padding: 32px;
  text-align: center;

  h1 {
    font-size: 2.5rem;
    margin-bottom: 32px;
    text-transform: uppercase;
    border-bottom: 2px dashed $black;
    padding-bottom: 16px;
    @include glitch-effect;
  }

  p {
    margin-bottom: 16px;
    line-height: 1.6;
    font-size: 1.125rem;
  }

  .contact-box {
    margin: 32px 0;
    padding: 24px;
    border: 2px solid $black;
    background-color: $white;
    display: inline-block;
    box-shadow: 4px 4px 0px $black;
  }

  .contact-email {
    font-size: 1.5rem;
    font-weight: bold;
    color: $header-blue;
    text-decoration: underline;

    &:hover {
      color: $glitch-red;
      @include glitch-effect;
    }
  }
}

.back-link {
  margin-top: 48px;
  border-top: 2px dashed $black;
  padding-top: 24px;
  display: flex;
  justify-content: center;
}

.btn-launch {
  border: $border-width solid $black;
  padding: 8px 16px;
  background-color: $white;
  font-weight: bold;
  font-size: 0.875rem;
  box-shadow: 3px 3px 0px 0px $black;
  transition: background-color 0.1s, color 0.1s;
  @include inset-shadow-active;
  display: flex;
  align-items: center;
  gap: 8px;

  &:hover {
    background-color: $black;
    color: $white;
    @include glitch-effect;
    text-shadow: -1px 0px 0px $glitch-cyan, 1px 0px 0px $glitch-red;
  }
}
</style>
