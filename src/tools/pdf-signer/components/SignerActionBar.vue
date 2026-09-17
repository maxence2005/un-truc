<script setup lang="ts">
interface Props {
  disabled?: boolean
  isGenerating?: boolean
  canDownload?: boolean
  annotationCount?: number
}

withDefaults(defineProps<Props>(), {
  disabled: false,
  isGenerating: false,
  canDownload: true,
  annotationCount: 0
})

const emit = defineEmits<{
  (e: 'new-document'): void
  (e: 'add-signature'): void
  (e: 'add-date'): void
  (e: 'add-text'): void
  (e: 'download'): void
}>()
</script>

<template>
  <aside class="signer-action-bar" role="toolbar" aria-label="Barre d'outils de signature PDF">
    <!-- Groupe 1 : Gestion du document (gauche sur desktop) -->
    <div class="action-group group-document">
      <button
        type="button"
        class="btn-retro btn-secondary"
        :disabled="disabled || isGenerating"
        title="Charger un autre document PDF"
        @click="emit('new-document')"
      >
        <span class="material-symbols-outlined" aria-hidden="true">upload_file</span>
        <span class="btn-label">NOUVEAU DOCUMENT</span>
      </button>
    </div>

    <!-- Groupe 2 : Outils d'annotation (centre) -->
    <div class="action-group group-tools" role="group" aria-label="Ajouter des annotations">
      <button
        type="button"
        class="btn-retro btn-tool"
        :disabled="disabled || isGenerating"
        title="Apposer une signature manuscrite"
        @click="emit('add-signature')"
      >
        <span class="material-symbols-outlined" aria-hidden="true">draw</span>
        <span class="btn-label">SIGNER</span>
      </button>

      <button
        type="button"
        class="btn-retro btn-tool"
        :disabled="disabled || isGenerating"
        title="Insérer la date du jour"
        @click="emit('add-date')"
      >
        <span class="material-symbols-outlined" aria-hidden="true">calendar_today</span>
        <span class="btn-label">DATE</span>
      </button>

      <button
        type="button"
        class="btn-retro btn-tool"
        :disabled="disabled || isGenerating"
        title="Ajouter un bloc de texte libre"
        @click="emit('add-text')"
      >
        <span class="material-symbols-outlined" aria-hidden="true">title</span>
        <span class="btn-label">TEXTE</span>
      </button>
    </div>

    <!-- Groupe 3 : Exportation et téléchargement (droite sur desktop) -->
    <div class="action-group group-export">
      <button
        type="button"
        class="btn-retro btn-primary btn-download"
        :disabled="disabled || !canDownload || isGenerating"
        title="Générer et télécharger le document signé"
        @click="emit('download')"
      >
        <span
          class="material-symbols-outlined"
          :class="{ 'icon-spin': isGenerating }"
          aria-hidden="true"
        >
          {{ isGenerating ? 'sync' : 'download' }}
        </span>
        <span class="btn-label">
          {{ isGenerating ? 'GÉNÉRATION...' : 'TÉLÉCHARGER LE PDF SIGNÉ' }}
        </span>
      </button>
    </div>
  </aside>
</template>

<style scoped lang="scss">
@use "@/assets/styles/variables" as *;
@use "@/assets/styles/mixins" as *;

.signer-action-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  background-color: $surface-pc-beige;
  border: $border-width solid $black;
  box-shadow: 3px 3px 0px 0px $black;
  padding: 10px 14px;
  width: 100%;
  box-sizing: border-box;
  z-index: 20;

  @media (max-width: 768px) {
    position: sticky;
    bottom: 0;
    left: 0;
    right: 0;
    flex-direction: column;
    gap: 8px;
    padding: 8px 10px;
    box-shadow: 0px -3px 0px 0px $black;
    border-left: none;
    border-right: none;
    border-bottom: none;
  }
}

.action-group {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;

  &.group-tools {
    justify-content: center;
    flex-grow: 1;
  }

  @media (max-width: 768px) {
    width: 100%;
    justify-content: stretch;
    gap: 6px;

    &.group-tools {
      order: 1;
      display: grid;
      grid-template-columns: repeat(3, 1fr);
    }

    &.group-document {
      order: 3;
    }

    &.group-export {
      order: 2;
    }
  }
}

.btn-retro {
  border: $border-width solid $black;
  background-color: $white;
  color: $black;
  font-family: inherit;
  font-size: 0.75rem;
  font-weight: bold;
  padding: 8px 14px;
  box-shadow: 2px 2px 0px 0px $black;
  text-transform: uppercase;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  box-sizing: border-box;
  white-space: nowrap;
  user-select: none;
  min-height: 40px;
  @include inset-shadow-active;

  .material-symbols-outlined {
    font-size: 1.125rem;
    line-height: 1;
  }

  &:hover:not(:disabled) {
    background-color: $black;
    color: $white;
  }

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
    background-color: #e4e2dc;
    color: #888;
    box-shadow: none;
    border-color: #999;
  }

  @media (max-width: 768px) {
    width: 100%;
    min-height: 44px;
    padding: 8px 10px;
    font-size: 0.6875rem;

    .material-symbols-outlined {
      font-size: 1rem;
    }
  }
}

.btn-tool {
  background-color: $white;

  &:hover:not(:disabled) {
    background-color: $header-blue;
    color: $white;
  }
}

.btn-secondary {
  background-color: #f5f4ef;
}

.btn-primary {
  background-color: $header-blue;
  color: $white;
  box-shadow: 3px 3px 0px 0px $black;

  &:hover:not(:disabled) {
    background-color: $black;
    color: $glitch-cyan;
  }
}

.btn-download {
  font-size: 0.8125rem;
  padding: 10px 18px;

  @media (max-width: 768px) {
    font-size: 0.75rem;
    padding: 10px 12px;
  }
}

.icon-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
