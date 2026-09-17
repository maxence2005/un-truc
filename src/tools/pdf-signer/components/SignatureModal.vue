<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onUnmounted } from 'vue'
import {
  useSignatureCanvas,
  SIGNATURE_COLORS
} from '../composables/useSignatureCanvas'

interface Props {
  initialTab?: 'draw' | 'upload'
}

const props = withDefaults(defineProps<Props>(), {
  initialTab: 'draw'
})

const emit = defineEmits<{
  (e: 'confirm', dataUrl: string): void
  (e: 'close'): void
}>()

// Gestion des onglets de signature
type Tab = 'draw' | 'upload'
const activeTab = ref<Tab>(props.initialTab)

// Moteur de signature manuscrite tactile natif
const {
  canvasRef,
  isEmpty,
  strokeColor,
  clear,
  exportToPngDataUrl,
  setStrokeColor,
  resizeCanvas
} = useSignatureCanvas()

// Références et état pour l'importation de fichier image
const fileInputRef = ref<HTMLInputElement | null>(null)
const uploadedDataUrl = ref<string | null>(null)
const isDragging = ref(false)
const uploadError = ref<string | null>(null)

/**
 * Alterne l'onglet actif et recalibre la taille logique du canvas si nécessaire.
 */
async function selectTab(tab: Tab) {
  activeTab.value = tab
  if (tab === 'draw') {
    await nextTick()
    resizeCanvas(true)
  }
}

/**
 * Détermine si la validation de signature est autorisée selon l'onglet actif.
 */
const canConfirm = computed<boolean>(() => {
  if (activeTab.value === 'draw') {
    return !isEmpty.value
  }
  return !!uploadedDataUrl.value
})

/**
 * Déclenche l'ouverture du sélecteur natif de fichier du système d'exploitation.
 */
function triggerFileInput() {
  fileInputRef.value?.click()
}

/**
 * Valide et convertit un fichier image sélectionné en Data URL base64.
 */
function processImageFile(file: File) {
  uploadError.value = null
  const validMimeTypes = ['image/png', 'image/jpeg', 'image/webp']

  if (!validMimeTypes.includes(file.type)) {
    uploadError.value = 'FORMAT NON SUPPORTÉ. UTILISEZ PNG, JPEG OU WEBP.'
    return
  }

  // Seuil de sécurité à 10 Mo
  if (file.size > 10 * 1024 * 1024) {
    uploadError.value = 'FICHIER TROP VOLUMINEUX (MAX 10 MO).'
    return
  }

  const reader = new FileReader()
  reader.onload = (event) => {
    const result = event.target?.result
    if (typeof result === 'string') {
      uploadedDataUrl.value = result
    } else {
      uploadError.value = 'ÉCHEC DU CHARGEMENT DE L\'IMAGE.'
    }
  }
  reader.onerror = () => {
    uploadError.value = 'ERREUR LORS DE LA LECTURE DU FICHIER.'
  }
  reader.readAsDataURL(file)
}

function onFileInputChange(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    processImageFile(file)
  }
}

function onDrop(event: DragEvent) {
  isDragging.value = false
  const file = event.dataTransfer?.files?.[0]
  if (file) {
    processImageFile(file)
  }
}

/**
 * Supprime l'image importée et réinitialise le sélecteur de fichier.
 */
function removeImage() {
  uploadedDataUrl.value = null
  uploadError.value = null
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
}

/**
 * Valide la signature active et émet la Data URL correspondante.
 */
function handleConfirm() {
  if (!canConfirm.value) return

  if (activeTab.value === 'draw') {
    const dataUrl = exportToPngDataUrl(true)
    if (dataUrl) {
      emit('confirm', dataUrl)
    }
  } else if (uploadedDataUrl.value) {
    emit('confirm', uploadedDataUrl.value)
  }
}

/**
 * Fermeture rapide par la touche Échap.
 */
function handleKeyDown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    emit('close')
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
  document.body.style.overflow = 'hidden'
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
  document.body.style.overflow = ''
})
</script>

<template>
  <div class="signature-modal-backdrop" @click.self="emit('close')">
    <div
      class="window-box signature-window"
      role="dialog"
      aria-modal="true"
      aria-labelledby="signature-modal-title"
    >
      <header class="window-header">
        <span id="signature-modal-title" class="window-title">C:\SIGNATURE\INPUT.SYS</span>
        <div class="window-controls">
          <div class="control-box"></div>
          <div class="control-box"></div>
          <button
            type="button"
            class="control-box close-btn"
            title="Fermer"
            aria-label="Fermer la fenêtre"
            @click="emit('close')"
          ></button>
        </div>
      </header>

      <nav class="tabs-nav" aria-label="Modes de signature">
        <button
          type="button"
          class="tab-btn"
          :class="{ active: activeTab === 'draw' }"
          @click="selectTab('draw')"
        >
          TRACER
        </button>
        <button
          type="button"
          class="tab-btn"
          :class="{ active: activeTab === 'upload' }"
          @click="selectTab('upload')"
        >
          IMPORTER UNE IMAGE
        </button>
      </nav>

      <div class="modal-body">
        <!-- Onglet 1 : Tracé manuscrit -->
        <div v-show="activeTab === 'draw'" class="tab-panel">
          <div class="canvas-wrapper">
            <canvas ref="canvasRef" class="signature-canvas"></canvas>
            <div class="canvas-guide" aria-hidden="true">
              <span class="guide-cross">X</span>
              <span class="guide-line"></span>
            </div>
            <span v-if="isEmpty" class="canvas-placeholder" aria-hidden="true">
              TRACER VOTRE SIGNATURE ICI
            </span>
          </div>

          <div class="canvas-toolbar">
            <div class="color-options" role="group" aria-label="Couleur d'encre">
              <button
                type="button"
                class="btn-retro btn-color"
                :class="{ active: strokeColor === SIGNATURE_COLORS.BLACK }"
                @click="setStrokeColor(SIGNATURE_COLORS.BLACK)"
              >
                <span class="swatch swatch-black"></span>
                <span>NOIR</span>
              </button>
              <button
                type="button"
                class="btn-retro btn-color"
                :class="{ active: strokeColor === SIGNATURE_COLORS.INK_BLUE }"
                @click="setStrokeColor(SIGNATURE_COLORS.INK_BLUE)"
              >
                <span class="swatch swatch-blue"></span>
                <span>BLEU ENCRE</span>
              </button>
            </div>

            <button
              type="button"
              class="btn-retro btn-clear"
              :disabled="isEmpty"
              @click="clear"
            >
              EFFACER
            </button>
          </div>
        </div>

        <!-- Onglet 2 : Importation d'image -->
        <div v-show="activeTab === 'upload'" class="tab-panel">
          <input
            ref="fileInputRef"
            type="file"
            accept="image/png, image/jpeg, image/webp"
            class="hidden-file-input"
            @change="onFileInputChange"
          />

          <div v-if="!uploadedDataUrl" class="upload-area">
            <div
              class="upload-dropzone"
              :class="{ dragging: isDragging }"
              tabindex="0"
              role="button"
              aria-label="Zone d'importation d'image de signature"
              @dragover.prevent="isDragging = true"
              @dragleave.prevent="isDragging = false"
              @drop.prevent="onDrop"
              @click="triggerFileInput"
              @keydown.enter.prevent="triggerFileInput"
              @keydown.space.prevent="triggerFileInput"
            >
              <span class="dropzone-title">GLISSER-DÉPOSER UNE IMAGE ICI</span>
              <span class="dropzone-sub">OU</span>
              <button
                type="button"
                class="btn-retro btn-browse"
                @click.stop="triggerFileInput"
              >
                CHOISIR UN FICHIER
              </button>
              <span class="dropzone-hint">PNG TRANSPARENT RECOMMANDÉ (MAX 10 MO)</span>
            </div>
          </div>

          <div v-else class="upload-preview-wrapper">
            <div class="preview-box">
              <img
                :src="uploadedDataUrl"
                alt="Aperçu de la signature importée"
                class="preview-image"
              />
            </div>
            <div class="upload-actions">
              <button
                type="button"
                class="btn-retro btn-danger"
                @click="removeImage"
              >
                SUPPRIMER L'IMAGE
              </button>
            </div>
          </div>

          <p v-if="uploadError" class="error-message" role="alert">
            {{ uploadError }}
          </p>
        </div>
      </div>

      <footer class="modal-footer">
        <button
          type="button"
          class="btn-retro btn-cancel"
          @click="emit('close')"
        >
          ANNULER
        </button>
        <button
          type="button"
          class="btn-retro btn-confirm"
          :disabled="!canConfirm"
          @click="handleConfirm"
        >
          VALIDER LA SIGNATURE
        </button>
      </footer>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use "@/assets/styles/variables" as *;
@use "@/assets/styles/mixins" as *;

.signature-modal-backdrop {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.7);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  box-sizing: border-box;

  @media (max-width: 480px) {
    padding: 8px;
  }
}

.signature-window {
  @include window-box;
  width: 100%;
  max-width: 540px;
  display: flex;
  flex-direction: column;
  background-color: $surface-pc-beige;
  box-shadow: 6px 6px 0px 0px $black;
  animation: modal-pop 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

@keyframes modal-pop {
  from {
    transform: scale(0.96);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

.window-header {
  background-color: $header-blue;
  border-bottom: $border-width solid $black;
  padding: 6px 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  user-select: none;
}

.window-title {
  color: $white;
  font-size: 0.8125rem;
  font-weight: bold;
  letter-spacing: 0.5px;
}

.window-controls {
  display: flex;
  gap: 4px;
}

.control-box {
  width: 14px;
  height: 14px;
  border: 1px solid $black;
  background-color: $surface-pc-beige;
  padding: 0;
  box-sizing: border-box;

  &.close-btn {
    cursor: pointer;
    position: relative;

    &::before,
    &::after {
      content: '';
      position: absolute;
      top: 5px;
      left: 2px;
      right: 2px;
      height: 2px;
      background-color: $black;
    }

    &::before {
      transform: rotate(45deg);
    }

    &::after {
      transform: rotate(-45deg);
    }

    &:hover {
      background-color: $glitch-red;
      &::before,
      &::after {
        background-color: $white;
      }
    }
  }
}

.tabs-nav {
  display: flex;
  gap: 4px;
  border-bottom: $border-width solid $black;
  background-color: #dfdbd2;
  padding: 8px 12px 0 12px;

  @media (max-width: 480px) {
    padding: 6px 8px 0 8px;
    gap: 2px;
  }
}

.tab-btn {
  border: $border-width solid $black;
  border-bottom: none;
  background-color: #cbc7bd;
  padding: 8px 14px;
  font-family: inherit;
  font-size: 0.75rem;
  font-weight: bold;
  color: #333;
  cursor: pointer;
  text-transform: uppercase;
  position: relative;
  top: 2px;
  transition: background-color 0.15s ease;

  &:hover:not(.active) {
    background-color: $surface-pc-beige;
    color: $black;
  }

  &.active {
    background-color: $surface-pc-beige;
    color: $black;
    top: 2px;
    padding-bottom: 10px;
    margin-bottom: -2px;
    z-index: 2;
  }

  @media (max-width: 380px) {
    padding: 6px 8px;
    font-size: 0.6875rem;
  }
}

.modal-body {
  padding: 16px;
  background-color: $surface-pc-beige;
  display: flex;
  flex-direction: column;

  @media (max-width: 480px) {
    padding: 10px;
  }
}

.tab-panel {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.canvas-wrapper {
  position: relative;
  width: 100%;
  height: 220px;
  min-height: 180px;
  border: $border-width solid $black;
  background-color: $white;
  box-shadow: inset 2px 2px 0px rgba(0, 0, 0, 0.15);
  overflow: hidden;

  @media (max-width: 480px) {
    height: 190px;
    min-height: 180px;
  }
}

.signature-canvas {
  width: 100%;
  height: 100%;
  display: block;
  touch-action: none;
  cursor: crosshair;
  background-color: transparent;
  position: relative;
  z-index: 1;
}

.canvas-guide {
  position: absolute;
  bottom: 36px;
  left: 16px;
  right: 16px;
  display: flex;
  align-items: flex-end;
  pointer-events: none;
  z-index: 0;

  .guide-cross {
    font-family: inherit;
    font-size: 0.875rem;
    font-weight: bold;
    color: #ccc;
    margin-right: 6px;
    line-height: 1;
  }

  .guide-line {
    flex-grow: 1;
    border-bottom: 1px dashed #d0d0d0;
    height: 1px;
    margin-bottom: 2px;
  }
}

.canvas-placeholder {
  position: absolute;
  top: 14px;
  left: 16px;
  font-family: inherit;
  font-size: 0.6875rem;
  font-weight: bold;
  color: #bbb;
  letter-spacing: 0.5px;
  pointer-events: none;
  z-index: 0;
}

.canvas-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 12px;
  flex-wrap: wrap;

  @media (max-width: 380px) {
    margin-top: 8px;
    gap: 6px;
  }
}

.color-options {
  display: flex;
  gap: 6px;
}

.swatch {
  display: inline-block;
  width: 12px;
  height: 12px;
  border: 1px solid $black;
  box-sizing: border-box;

  &.swatch-black {
    background-color: #000000;
  }

  &.swatch-blue {
    background-color: #0000aa;
  }
}

.btn-retro {
  border: $border-width solid $black;
  padding: 6px 12px;
  background-color: $white;
  font-family: inherit;
  font-weight: bold;
  font-size: 0.75rem;
  box-shadow: 2px 2px 0px 0px $black;
  text-transform: uppercase;
  color: $black;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  box-sizing: border-box;
  @include inset-shadow-active;

  &:hover:not(:disabled) {
    background-color: $black;
    color: $white;
  }

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
    box-shadow: none;
    background-color: #e0e0e0;
    color: #888;
    border-color: #999;
  }

  @media (max-width: 380px) {
    padding: 6px 8px;
    font-size: 0.6875rem;
  }
}

.btn-color {
  &.active {
    background-color: $black;
    color: $white;

    .swatch {
      border-color: $white;
    }
  }
}

.btn-clear {
  &:hover:not(:disabled) {
    background-color: $glitch-red;
    color: $white;
  }
}

.hidden-file-input {
  display: none;
}

.upload-area {
  width: 100%;
}

.upload-dropzone {
  border: 2px dashed $black;
  background-color: $workspace-off-white;
  padding: 24px 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  min-height: 220px;
  text-align: center;
  box-sizing: border-box;
  transition: background-color 0.15s ease, border-color 0.15s ease;

  &:hover,
  &.dragging {
    background-color: #f2efe7;
    border-color: $header-blue;
  }

  &:focus-visible {
    outline: 2px solid $header-blue;
  }

  @media (max-width: 480px) {
    min-height: 190px;
    padding: 16px 8px;
  }
}

.dropzone-title {
  font-family: inherit;
  font-size: 0.8125rem;
  font-weight: bold;
  color: $black;
}

.dropzone-sub {
  font-family: inherit;
  font-size: 0.6875rem;
  color: #777;
  font-weight: bold;
}

.btn-browse {
  margin: 4px 0;
}

.dropzone-hint {
  font-family: inherit;
  font-size: 0.6875rem;
  color: #666;
}

.upload-preview-wrapper {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
}

.preview-box {
  @include checkerboard-bg;
  background-size: 16px 16px;
  background-position: 0 0, 8px 8px;
  border: $border-width solid $black;
  height: 220px;
  min-height: 180px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  padding: 12px;
  box-sizing: border-box;

  @media (max-width: 480px) {
    height: 190px;
  }
}

.preview-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  display: block;
}

.upload-actions {
  display: flex;
  justify-content: flex-end;
}

.btn-danger {
  &:hover:not(:disabled) {
    background-color: $glitch-red;
    color: $white;
  }
}

.error-message {
  margin-top: 10px;
  font-size: 0.75rem;
  color: $glitch-red;
  font-weight: bold;
  text-align: center;
}

.modal-footer {
  padding: 12px 16px;
  border-top: $border-width solid $black;
  background-color: $surface-pc-beige;
  display: flex;
  justify-content: flex-end;
  gap: 10px;

  @media (max-width: 440px) {
    flex-direction: column-reverse;
    padding: 10px;
    gap: 8px;

    .btn-retro {
      width: 100%;
      min-height: 40px;
    }
  }
}

.btn-confirm {
  &:hover:not(:disabled) {
    background-color: $header-blue;
    color: $white;
    @include glitch-effect;
  }
}
</style>
