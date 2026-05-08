<script setup lang="ts">
import { tools } from '@/router'
import { RouterLink } from 'vue-router'

const getToolIdLabel = (index: number) => {
  return `TRUC_${(index + 1).toString().padStart(2, '0')}.DAT`
}
</script>

<template>
  <main class="home-view">
    <section class="hero-section">
      <div class="window-box hero-window">
        <header class="window-header">
          <span class="window-title">C:\SYSTEM\UN_TRUC.EXE</span>
          <div class="window-controls">
            <div class="control-box"></div>
            <div class="control-box"></div>
            <div class="control-box"></div>
          </div>
        </header>
        <div class="hero-content">
          <h1 class="glitch-text-permanent">UN TRUC</h1>
          <p class="hero-subtitle">La boîte à outils</p>
        </div>
      </div>
    </section>

    <section class="catalogue-section">
      <div class="catalogue-grid">
        <article v-for="(tool, index) in tools" :key="tool.id" class="window-box tool-card">
          <header class="window-header">
            <h3 class="window-title glitch-hover-italic">{{ getToolIdLabel(index) }}</h3>
            <span class="material-symbols-outlined icon-small">{{ tool.icon }}</span>
          </header>
          <div class="card-body">
            <h4 class="tool-name">{{ tool.name }}</h4>
            <p class="tool-description">{{ tool.description }}</p>
            <div class="card-footer">
              <span class="status-text">STATUS: READY</span>
              <RouterLink :to="`/tools/${tool.id}`" class="btn-launch">
                LANCER
              </RouterLink>
            </div>
          </div>
        </article>
      </div>
    </section>

    <footer class="app-footer">
      <div class="footer-logo">UN TRUC</div>
      <nav class="footer-nav">
        <RouterLink to="/legal" class="footer-link">Mentions Légales</RouterLink>
        <RouterLink to="/privacy" class="footer-link">Confidentialité</RouterLink>
        <RouterLink to="/contact" class="footer-link">Contact</RouterLink>
      </nav>
      <div class="footer-copyright">
        © 2026 UN TRUC - TOUS DROITS RÉSERVÉS
      </div>
    </footer>
  </main>
</template>

<style scoped lang="scss">
@use "@/assets/styles/variables" as *;
@use "@/assets/styles/mixins" as *;

.home-view {
  padding: 32px;
  padding-bottom: 80px; 
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 64px;
}

.hero-section {
  width: 100%;
  max-width: 900px;
}

.window-box {
  @include window-box;
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

.hero-content {
  padding: 48px;
  text-align: center;

  h1 {
    font-size: 4rem;
    font-weight: 900;
    margin-bottom: 16px;
    letter-spacing: -2px;
    @include glitch-effect;
  }

  .hero-subtitle {
    font-weight: bold;
    color: #555;
  }
}

.catalogue-section {
  width: 100%;
  max-width: 1200px;
}

.catalogue-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 32px;
}

.tool-card {
  height: 100%;
  transition: transform 0.1s ease-in-out;

  &:hover {
    transform: translateY(-4px);
    
    .glitch-hover-italic {
      font-style: italic;
      @include glitch-effect;
    }
  }
}

.icon-small {
  color: $white;
  font-size: 1.2rem;
}

.card-body {
  padding: 16px;
  flex-grow: 1;
  display: flex;
  flex-direction: column;

  .tool-name {
    font-size: 1.5rem;
    margin-bottom: 16px;
    text-transform: uppercase;
  }

  .tool-description {
    font-size: 1rem;
    color: #444;
    margin-bottom: 24px;
    flex-grow: 1;
  }
}

.card-footer {
  margin-top: auto;
  border-top: $border-width dashed $black;
  padding-top: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;

  .status-text {
    font-size: 0.75rem;
    font-weight: bold;
  }
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

  &:hover {
    background-color: $black;
    color: $white;
    @include glitch-effect;
    text-shadow: -1px 0px 0px $glitch-cyan, 1px 0px 0px $glitch-red;
  }
}

.app-footer {
  width: 100%;
  background-color: $header-blue;
  border-top: $border-width solid $black;
  padding: 16px 32px;
  color: $white;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  position: absolute;
  bottom: 0;
  left: 0;

  .footer-logo {
    font-size: 1.5rem;
    font-weight: bold;
  }

  .footer-nav {
    display: flex;
    gap: 24px;

    .footer-link:hover {
      color: $glitch-red;
      font-style: italic;
    }
  }

  .footer-copyright {
    font-size: 0.75rem;
  }
}

@media (max-width: 768px) {
  .app-footer {
    position: static;
    flex-direction: column;
    text-align: center;
  }
}
</style>
