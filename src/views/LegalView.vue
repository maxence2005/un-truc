<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<template>
  <main class="page-view">
    <div class="window-box page-window">
      <header class="window-header">
        <span class="window-title">C:\SYSTEM\LEGAL.TXT</span>
        <div class="window-controls">
          <div class="control-box"></div>
          <div class="control-box"></div>
          <RouterLink to="/" class="control-box close-btn" title="Fermer"></RouterLink>
        </div>
      </header>
      <div class="page-content">
        <h1 class="glitch-text-permanent">Mentions Légales</h1>
        
        <section>
          <h2>1. Éditeur du site</h2>
          <p>Le site "Un Truc" est édité par le projet Un Truc.<br>
          Contact : <a href="mailto:contact@un-truc.fr">contact@un-truc.fr</a></p>
        </section>

        <section>
          <h2>2. Hébergement</h2>
          <p>Le site est hébergé par la société OVH SAS.<br>
          Siège social : 2 rue Kellermann - 59100 Roubaix - France.<br>
          Site web : <a href="https://www.ovh.com">OVH</a></p>
        </section>

        <section>
          <h2>3. Propriété intellectuelle et Licence</h2>
          <p>L'ensemble du contenu de ce site est protégé par le droit d'auteur. Le code source de l'application est distribué sous la <strong>Apache License, Version 2.0</strong>. Toute utilisation doit se conformer aux termes de cette licence.</p>
        </section>

        <section>
          <h2>4. Limitation de responsabilité</h2>
          <p>L'éditeur ne pourra être tenu responsable des dommages directs et indirects causés au matériel de l'utilisateur, lors de l'accès au site "Un Truc". L'éditeur décline également toute responsabilité quant à l'utilisation qui pourrait être faite des informations et contenus présents sur le site.</p>
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

  h1 {
    font-size: 2.5rem;
    margin-bottom: 32px;
    text-transform: uppercase;
    border-bottom: 2px dashed $black;
    padding-bottom: 16px;
    @include glitch-effect;
  }

  h2 {
    font-size: 1.5rem;
    margin-top: 24px;
    margin-bottom: 16px;
  }

  p {
    margin-bottom: 16px;
    line-height: 1.6;
  }

  section {
    margin-bottom: 32px;
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
