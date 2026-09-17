<script setup lang="ts">
import { ref } from 'vue'

interface Props {
  disabled?: boolean
  maxSizeMb?: number
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  maxSizeMb: 50
})

const emit = defineEmits<{
  (e: 'file-selected', file: File): void
}>()

const fileInputRef = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)
const errorMessage = ref<string | null>(null)

/**
 * Déclenche l'ouverture de la boîte de dialogue système pour sélectionner un fichier.
 */
function triggerFileInput() {
  if (props.disabled) return
  errorMessage.value = null
  fileInputRef.value?.click()
}

/**
 * Valide le type de fichier (extension .pdf ou type MIME application/pdf)
 * ainsi que sa taille avant d'émettre l'événement.
 */
function validateAndEmitFile(file: File) {
  errorMessage.value = null

  const isPdfExtension = file.name.toLowerCase().endsWith('.pdf')
  const isPdfMime = file.type === 'application/pdf' || file.type === ''

  if (!isPdfExtension && !isPdfMime) {
    errorMessage.value = 'FORMAT NON RECONNU. VEUILLEZ SÉLECTIONNER UN DOCUMENT PDF (.PDF).'
    return
  }

  const maxBytes = props.maxSizeMb * 1024 * 1024
  if (file.size > maxBytes) {
    errorMessage.value = `FICHIER TROP VOLUMINEUX (MAXIMUM ${props.maxSizeMb} MO).`
    return
  }

  emit('file-selected', file)
}

function onFileInputChange(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    validateAndEmitFile(file)
  }
  target.value = ''
}

function onDragOver() {
  if (props.disabled) return
  isDragging.value = true
}

function onDragLeave() {
  isDragging.value = false
}

function onDrop(event: DragEvent) {
  isDragging.value = false
  if (props.disabled) return

  const file = event.dataTransfer?.files?.[0]
  if (file) {
    validateAndEmitFile(file)
  }
}
</script>

<template>
  <div class="pdf-drop-zone-container">
    <input
      ref="fileInputRef"
      type="file"
      accept="application/pdf,.pdf"
      class="hidden-file-input"
      :disabled="disabled"
      @change="onFileInputChange"
    />

    <div
      class="drop-zone"
      :class="{ dragging: isDragging, disabled: disabled }"
      tabindex="0"
      role="button"
      aria-label="Zone d'importation de document PDF"
      :aria-disabled="disabled"
      @dragover.prevent="onDragOver"
      @dragleave.prevent="onDragLeave"
      @drop.prevent="onDrop"
      @click="triggerFileInput"
      @keydown.enter.prevent="triggerFileInput"
      @keydown.space.prevent="triggerFileInput"
    >
      <div class="drop-zone-icon-box" aria-hidden="true">
        <span class="material-symbols-outlined">description</span>
      </div>

      <p class="drop-zone-primary-text">
        GLISSER-DÉPOSER LE FICHIER PDF ICI
      </p>

      <span class="drop-zone-separator">OU</span>

      <span class="btn-retro btn-browse" aria-hidden="true">
        PARCOURIR LE DISQUE...
      </span>

      <span class="drop-zone-hint">
        DOCUMENT PDF STANDARD (MAX {{ maxSizeMb }} MO)
      </span>
    </div>

    <div v-if="errorMessage" class="error-banner" role="alert">
      <span class="error-icon" aria-hidden="true">!</span>
      <span class="error-text">{{ errorMessage }}</span>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use "@/assets/styles/variables" as *;
@use "@/assets/styles/mixins" as *;

.pdf-drop-zone-container {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.hidden-file-input {
  display: none;
}

.drop-zone {
  border: 2px dashed $black;
  background-color: $workspace-off-white;
  padding: 36px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  cursor: pointer;
  min-height: 240px;
  text-align: center;
  box-sizing: border-box;
  transition: background-color 0.15s ease, border-color 0.15s ease;

  // Empêche le scintillement de dragleave lors du survol des éléments enfants
  & > * {
    pointer-events: none;
  }

  &:hover:not(.disabled),
  &.dragging:not(.disabled) {
    background-color: #f2efe7;
    border-color: $header-blue;
  }

  &:focus-visible {
    outline: 2px solid $header-blue;
  }

  &.disabled {
    cursor: not-allowed;
    opacity: 0.5;
    background-color: #eee;
  }

  @media (max-width: 480px) {
    padding: 24px 12px;
    min-height: 200px;
  }
}

.drop-zone-icon-box {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 4px;

  .material-symbols-outlined {
    font-size: 40px;
    color: $black;
  }
}

.drop-zone-primary-text {
  margin: 0;
  font-family: inherit;
  font-size: 0.9375rem;
  font-weight: bold;
  color: $black;
  letter-spacing: 0.5px;
}

.drop-zone-separator {
  font-family: inherit;
  font-size: 0.75rem;
  font-weight: bold;
  color: #777;
}

.btn-retro {
  border: $border-width solid $black;
  padding: 8px 18px;
  background-color: $white;
  font-family: inherit;
  font-weight: bold;
  font-size: 0.8125rem;
  box-shadow: 2px 2px 0px 0px $black;
  text-transform: uppercase;
  color: $black;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;

  @media (max-width: 480px) {
    padding: 8px 14px;
    font-size: 0.75rem;
    min-height: 44px;
  }
}

.drop-zone:hover:not(.disabled) .btn-browse {
  background-color: $black;
  color: $white;
}

.drop-zone-hint {
  font-family: inherit;
  font-size: 0.6875rem;
  color: #666;
  margin-top: 4px;
}

.error-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background-color: #ffe6e6;
  border: $border-width solid $glitch-red;
  color: $glitch-red;
  font-family: inherit;
  font-size: 0.75rem;
  font-weight: bold;
}

.error-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  background-color: $glitch-red;
  color: $white;
  font-size: 0.75rem;
  font-weight: bold;
  flex-shrink: 0;
}

.error-text {
  flex-grow: 1;
}
</style>
