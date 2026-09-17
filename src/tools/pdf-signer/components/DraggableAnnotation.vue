<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import type { Annotation, TextAnnotation } from '../types'
import { usePointerDrag } from '../composables/usePointerDrag'

interface Props {
  annotation: Annotation
  containerWidth: number
  containerHeight: number
  isSelected?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isSelected: false
})

const emit = defineEmits<{
  (e: 'update:annotation', annotation: Annotation): void
  (e: 'delete', id: string): void
  (e: 'select', id: string): void
}>()

// État d'édition en ligne pour le texte et la date
const isEditing = ref(false)
const editText = ref('')
const inputRef = ref<HTMLInputElement | null>(null)
let lastTapTime = 0

// Mémorisation de la taille initiale au début du redimensionnement
let initialRelHeight = 0
let initialFontSizeRatio = 0

const { isDragging, isResizing, startDrag, startResize } = usePointerDrag({
  getBounds: () => ({
    relX: props.annotation.relX,
    relY: props.annotation.relY,
    relWidth: props.annotation.relWidth,
    relHeight: props.annotation.relHeight
  }),
  getContainerSize: () => ({
    width: props.containerWidth,
    height: props.containerHeight
  }),
  minWidthRatio: 0.05,
  minHeightRatio: 0.025,
  preserveAspectRatio: () => props.annotation.type === 'signature',
  onStart: () => {
    emit('select', props.annotation.id)
    if (props.annotation.type !== 'signature') {
      initialRelHeight = props.annotation.relHeight
      initialFontSizeRatio =
        props.annotation.fontSizeRatio || (props.annotation.relHeight * 0.6)
    }
  },
  onUpdate: (bounds) => {
    if (props.annotation.type === 'signature') {
      emit('update:annotation', {
        ...props.annotation,
        ...bounds
      })
    } else {
      let nextFontSizeRatio = props.annotation.fontSizeRatio
      if (isResizing.value && initialRelHeight > 0) {
        const heightScale = bounds.relHeight / initialRelHeight
        nextFontSizeRatio = Math.max(
          0.005,
          Math.min(0.15, initialFontSizeRatio * heightScale)
        )
      }
      emit('update:annotation', {
        ...props.annotation,
        ...bounds,
        fontSizeRatio: nextFontSizeRatio
      } as TextAnnotation)
    }
  }
})

/**
 * Calcul dynamique des coordonnées et dimensions en pixels
 */
const pixelStyle = computed(() => {
  const left = Math.round(props.annotation.relX * props.containerWidth)
  const top = Math.round(props.annotation.relY * props.containerHeight)
  const width = Math.round(props.annotation.relWidth * props.containerWidth)
  const height = Math.round(props.annotation.relHeight * props.containerHeight)

  return {
    left: `${left}px`,
    top: `${top}px`,
    width: `${width}px`,
    height: `${height}px`
  }
})

/**
 * Taille de police calculée en pixels relative à la hauteur de la page
 */
const fontSizePx = computed(() => {
  if (props.annotation.type !== 'signature' && props.annotation.fontSizeRatio) {
    return Math.max(10, Math.round(props.annotation.fontSizeRatio * props.containerHeight))
  }
  return Math.max(10, Math.round(props.containerHeight * 0.025))
})

const fontColor = computed(() => {
  if (props.annotation.type !== 'signature') {
    return props.annotation.color || '#000000'
  }
  return undefined
})

function handlePointerDown(e: PointerEvent) {
  if (isEditing.value) return

  emit('select', props.annotation.id)

  // Détection du double-tap sur écran tactile pour entrer en édition
  const now = Date.now()
  if (e.pointerType === 'touch' && props.annotation.type !== 'signature') {
    if (now - lastTapTime < 350) {
      startEditing()
      lastTapTime = 0
      return
    }
    lastTapTime = now
  }

  startDrag(e)
}

function handleDblClick() {
  if (props.annotation.type === 'signature') return
  startEditing()
}

function startEditing() {
  if (props.annotation.type === 'signature') return
  editText.value = props.annotation.content
  isEditing.value = true
  nextTick(() => {
    if (inputRef.value) {
      inputRef.value.focus()
      inputRef.value.select()
    }
  })
}

function finishEditing() {
  if (!isEditing.value) return
  isEditing.value = false

  if (props.annotation.type !== 'signature') {
    const trimmed = editText.value.trim()
    if (trimmed.length > 0 && trimmed !== props.annotation.content) {
      emit('update:annotation', {
        ...props.annotation,
        content: trimmed
      })
    }
  }
}

function cancelEditing() {
  isEditing.value = false
}
</script>

<template>
  <div
    class="draggable-annotation"
    :class="{
      'is-selected': isSelected,
      'is-dragging': isDragging,
      'is-resizing': isResizing,
      'is-editing': isEditing,
      'type-signature': annotation.type === 'signature',
      'type-text': annotation.type !== 'signature'
    }"
    :style="pixelStyle"
    role="region"
    aria-label="Annotation sur la page"
    @pointerdown="handlePointerDown"
    @dblclick="handleDblClick"
    @keydown.escape="cancelEditing"
  >
    <!-- Bouton de suppression ✕ en haut à droite -->
    <button
      type="button"
      class="btn-delete"
      title="Supprimer l'annotation"
      aria-label="Supprimer l'annotation"
      @pointerdown.stop
      @click.stop="emit('delete', annotation.id)"
    >
      ✕
    </button>

    <!-- Conteneur d'affichage principal de l'annotation -->
    <div class="annotation-content">
      <!-- 1. Signature manuscrite (image) -->
      <img
        v-if="annotation.type === 'signature'"
        :src="annotation.imageDataUrl"
        alt="Signature manuscrite"
        class="signature-image"
        draggable="false"
      />

      <!-- 2. Champ de saisie inline pour texte / date -->
      <input
        v-else-if="isEditing"
        ref="inputRef"
        v-model="editText"
        type="text"
        class="inline-text-input"
        :style="{ fontSize: `${fontSizePx}px`, color: fontColor }"
        @pointerdown.stop
        @keydown.enter.prevent="finishEditing"
        @keydown.escape.prevent="cancelEditing"
        @blur="finishEditing"
      />

      <!-- 3. Rendu du texte ou de la date -->
      <div
        v-else
        class="annotation-text"
        :style="{ fontSize: `${fontSizePx}px`, color: fontColor }"
      >
        {{ annotation.content }}
      </div>
    </div>

    <!-- Poignée de redimensionnement tactile au coin bas-droit -->
    <div
      class="resize-handle"
      title="Redimensionner"
      role="button"
      aria-label="Redimensionner l'annotation"
      @pointerdown="startResize"
    >
      <span class="resize-handle-visual" aria-hidden="true"></span>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use "@/assets/styles/variables" as *;
@use "@/assets/styles/mixins" as *;

.draggable-annotation {
  position: absolute;
  box-sizing: border-box;
  touch-action: none;
  cursor: move;
  user-select: none;
  border: 1px dashed transparent;
  z-index: 5;
  outline: none;

  &:hover {
    border-color: rgba(0, 0, 170, 0.4);
  }

  &.is-selected {
    border: 2px dashed $header-blue;
    background-color: rgba(0, 0, 170, 0.04);
    z-index: 10;
  }

  &.is-dragging {
    opacity: 0.85;
    cursor: grabbing;
  }

  &.is-resizing {
    opacity: 0.9;
  }

  &.is-editing {
    cursor: text;
    border-style: solid;
    border-color: $header-blue;
    background-color: $white;
  }
}

.annotation-content {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  position: relative;
}

.signature-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  pointer-events: none;
  display: block;
}

.annotation-text {
  font-family: $font-family-main;
  font-weight: bold;
  line-height: 1.2;
  white-space: pre-wrap;
  word-break: break-word;
  pointer-events: none;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding: 2px 4px;
  box-sizing: border-box;
}

.inline-text-input {
  width: 100%;
  height: 100%;
  font-family: $font-family-main;
  font-weight: bold;
  border: 1px solid $header-blue;
  background-color: $white;
  box-sizing: border-box;
  outline: none;
  padding: 2px 4px;
}

.btn-delete {
  position: absolute;
  top: -12px;
  right: -12px;
  width: 24px;
  height: 24px;
  background-color: $white;
  border: 1px solid $black;
  box-shadow: 1px 1px 0px $black;
  color: $black;
  font-size: 11px;
  font-weight: bold;
  cursor: pointer;
  display: none;
  align-items: center;
  justify-content: center;
  z-index: 15;
  padding: 0;
  line-height: 1;

  // Extension de la surface tactile mobile (cible >= 44x44px)
  &::before {
    content: '';
    position: absolute;
    top: -10px;
    left: -10px;
    right: -10px;
    bottom: -10px;
  }

  &:hover {
    background-color: $black;
    color: $white;
  }

  &:active {
    box-shadow: none;
    transform: translate(1px, 1px);
  }
}

.resize-handle {
  position: absolute;
  bottom: -6px;
  right: -6px;
  width: 16px;
  height: 16px;
  cursor: nwse-resize;
  touch-action: none;
  z-index: 15;
  display: none;
  align-items: center;
  justify-content: center;

  // Extension de la surface tactile mobile (cible >= 44x44px)
  &::before {
    content: '';
    position: absolute;
    top: -14px;
    left: -14px;
    right: -14px;
    bottom: -14px;
  }
}

.resize-handle-visual {
  width: 8px;
  height: 8px;
  background-color: $header-blue;
  border: 1px solid $black;
  display: block;
  box-shadow: 1px 1px 0px $black;
}

// Affichage des contrôles lors de la sélection ou du survol
.draggable-annotation.is-selected,
.draggable-annotation:hover {
  .btn-delete,
  .resize-handle {
    display: flex;
  }
}
</style>
