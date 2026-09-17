<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick, computed } from 'vue'
import type { PageDimension } from '../types'

interface Props {
  pageNumber: number
  dimension?: PageDimension
  renderPage: (pageNumber: number, canvas: HTMLCanvasElement, targetWidth?: number) => Promise<any>
  targetWidth?: number
}

const props = defineProps<Props>()

const itemRef = ref<HTMLDivElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
const isRendering = ref<boolean>(false)
const renderedWidth = ref<number>(0)
const renderedHeight = ref<number>(0)

let resizeObserver: ResizeObserver | null = null
let resizeTimeout: ReturnType<typeof setTimeout> | null = null

/**
 * Calcule le ratio d'aspect CSS si les dimensions intrinsèques sont connues.
 */
const aspectRatioStyle = computed(() => {
  if (props.dimension && props.dimension.aspectRatio > 0) {
    return {
      aspectRatio: `${props.dimension.widthPoints} / ${props.dimension.heightPoints}`
    }
  }
  return undefined
})

/**
 * Déclenche le rendu de la page sur le canvas avec la largeur cible adaptée.
 */
async function drawPage(widthOverride?: number) {
  if (!canvasRef.value) return

  await nextTick()

  let width = widthOverride ?? props.targetWidth
  if (!width && itemRef.value) {
    width = itemRef.value.clientWidth
  }

  // Largeur de repli si le composant n'est pas encore visible dans le DOM
  if (!width || width <= 0) {
    width = props.dimension?.widthPoints || 600
  }

  isRendering.value = true

  try {
    await props.renderPage(props.pageNumber, canvasRef.value, width)
    renderedWidth.value = width

    if (props.dimension?.aspectRatio) {
      renderedHeight.value = Math.round(width / props.dimension.aspectRatio)
    } else if (canvasRef.value.clientHeight) {
      renderedHeight.value = canvasRef.value.clientHeight
    }
  } catch (err: any) {
    if (err?.name !== 'RenderingCancelledException') {
      console.error(`Erreur de rendu sur la page ${props.pageNumber} :`, err)
    }
  } finally {
    isRendering.value = false
  }
}

function handleResize(entries: ResizeObserverEntry[]) {
  const entry = entries[0]
  if (!entry) return

  const newWidth = Math.floor(entry.contentRect.width)
  // Ignorer les micro-variations de sous-pixels
  if (newWidth > 0 && Math.abs(newWidth - renderedWidth.value) > 4) {
    if (resizeTimeout) clearTimeout(resizeTimeout)
    resizeTimeout = setTimeout(() => {
      drawPage(newWidth)
    }, 120)
  }
}

onMounted(() => {
  drawPage()

  if (typeof ResizeObserver !== 'undefined' && itemRef.value) {
    resizeObserver = new ResizeObserver(handleResize)
    resizeObserver.observe(itemRef.value)
  }
})

onUnmounted(() => {
  if (resizeTimeout) {
    clearTimeout(resizeTimeout)
  }
  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  }
})

watch(
  () => props.pageNumber,
  () => {
    drawPage()
  }
)

watch(
  () => props.targetWidth,
  (newWidth) => {
    if (newWidth) {
      drawPage(newWidth)
    }
  }
)
</script>

<template>
  <div
    ref="itemRef"
    class="pdf-page-item"
    :style="aspectRatioStyle"
    :data-page-number="pageNumber"
  >
    <div class="canvas-container">
      <canvas ref="canvasRef" class="pdf-canvas"></canvas>

      <div v-if="isRendering" class="page-loading-overlay" aria-live="polite">
        <span class="loading-text">CHARGEMENT PAGE {{ pageNumber }}...</span>
      </div>
    </div>

    <!-- Calque d'annotation superposé (reçoit le calque d'annotations de la tâche 7) -->
    <div class="pdf-overlay-slot">
      <slot
        :page-number="pageNumber"
        :width="renderedWidth"
        :height="renderedHeight"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
@use "@/assets/styles/variables" as *;
@use "@/assets/styles/mixins" as *;

.pdf-page-item {
  position: relative;
  display: flex;
  flex-direction: column;
  background-color: $white;
  box-shadow: 4px 4px 0px 0px $black;
  border: $border-width solid $black;
  box-sizing: border-box;
  margin: 0 auto;
  max-width: 100%;
  user-select: none;
}

.canvas-container {
  position: relative;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  line-height: 0;
}

.pdf-canvas {
  display: block;
  max-width: 100%;
  height: auto;
}

.page-loading-overlay {
  position: absolute;
  inset: 0;
  background-color: rgba(255, 255, 255, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
}

.loading-text {
  font-family: inherit;
  font-size: 0.8125rem;
  font-weight: bold;
  color: $black;
  background-color: $surface-pc-beige;
  border: 1px solid $black;
  padding: 6px 12px;
  box-shadow: 2px 2px 0px 0px $black;
  letter-spacing: 0.5px;
}

.pdf-overlay-slot {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 2;

  & > * {
    pointer-events: auto;
  }
}
</style>
