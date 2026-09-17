<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import type { PageDimension, ViewerMode } from '../types'
import PdfPageItem from './PdfPageItem.vue'

interface Props {
  pageCount: number
  pageDimensions?: PageDimension[]
  renderPage: (pageNumber: number, canvas: HTMLCanvasElement, targetWidth?: number) => Promise<any>
  currentPage?: number
  initialPage?: number
  mode?: ViewerMode
  initialMode?: ViewerMode
}

const props = withDefaults(defineProps<Props>(), {
  pageDimensions: () => [],
  initialPage: 1
})

const emit = defineEmits<{
  (e: 'update:currentPage', page: number): void
  (e: 'update:mode', mode: ViewerMode): void
  (e: 'page-change', page: number): void
  (e: 'mode-change', mode: ViewerMode): void
}>()

// Mode d'affichage adaptatif : props.mode ?? props.initialMode ?? (pageCount <= 5 ? 'scroll' : 'paginated')
const activeMode = ref<ViewerMode>(
  props.mode ?? props.initialMode ?? (props.pageCount <= 5 ? 'scroll' : 'paginated')
)

// Page courante (1-indexée)
const currentPage = ref<number>(
  Math.max(1, Math.min(props.currentPage ?? props.initialPage ?? 1, props.pageCount || 1))
)

// Modèle de saisie directe du numéro de page
const inputPage = ref<number>(currentPage.value)

const scrollContainerRef = ref<HTMLDivElement | null>(null)
let scrollObserver: IntersectionObserver | null = null

// Synchronisation réactive bidirectionnelle avec currentPage et mode passés en props
watch(
  () => props.currentPage,
  (newPage) => {
    if (newPage !== undefined && newPage !== currentPage.value) {
      goToPage(newPage)
    }
  }
)

watch(
  () => props.mode,
  (newMode) => {
    if (newMode !== undefined && newMode !== activeMode.value) {
      setMode(newMode)
    }
  }
)

/**
 * Dimension de la page courante en mode paginé
 */
const currentPageDimension = computed<PageDimension | undefined>(() => {
  if (!props.pageDimensions || props.pageDimensions.length === 0) {
    return undefined
  }
  return props.pageDimensions[currentPage.value - 1]
})

/**
 * Change le mode de visualisation (VUE CONTINUE ou VUE PAGINÉE).
 */
function setMode(mode: ViewerMode) {
  if (activeMode.value === mode) return
  activeMode.value = mode
  emit('update:mode', mode)
  emit('mode-change', mode)

  if (mode === 'scroll') {
    nextTick(() => {
      setupScrollObserver()
      scrollToPage(currentPage.value)
    })
  } else {
    teardownScrollObserver()
  }
}

/**
 * Navigue vers une page donnée avec validation des bornes.
 */
function goToPage(targetPage: number) {
  const boundedPage = Math.max(1, Math.min(targetPage, props.pageCount))
  if (currentPage.value !== boundedPage) {
    currentPage.value = boundedPage
    inputPage.value = boundedPage
    emit('update:currentPage', boundedPage)
    emit('page-change', boundedPage)

    if (activeMode.value === 'scroll') {
      scrollToPage(boundedPage)
    }
  } else {
    inputPage.value = boundedPage
  }
}

function prevPage() {
  if (currentPage.value > 1) {
    goToPage(currentPage.value - 1)
  }
}

function nextPage() {
  if (currentPage.value < props.pageCount) {
    goToPage(currentPage.value + 1)
  }
}

/**
 * Valide la valeur saisie manuellement dans le champ numérique de saut direct.
 * Si le champ est vide ou invalide, revient à la page courante (currentPage.value).
 */
function handleInputCommit() {
  if (
    inputPage.value === null ||
    inputPage.value === undefined ||
    isNaN(Number(inputPage.value)) ||
    String(inputPage.value).trim() === ''
  ) {
    inputPage.value = currentPage.value
    return
  }

  const val = Math.floor(Number(inputPage.value))
  if (val < 1) {
    inputPage.value = 1
    goToPage(1)
  } else if (val > props.pageCount) {
    inputPage.value = props.pageCount
    goToPage(props.pageCount)
  } else {
    goToPage(val)
  }
}

/**
 * Fait défiler jusqu'à la page ciblée en mode scroll continu.
 */
function scrollToPage(pageNumber: number) {
  const pageElement = scrollContainerRef.value?.querySelector(
    `[data-scroll-page="${pageNumber}"]`
  )
  if (pageElement) {
    pageElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

/**
 * Initialise l'IntersectionObserver pour détecter la page active pendant le défilement.
 */
function setupScrollObserver() {
  teardownScrollObserver()

  if (typeof IntersectionObserver === 'undefined' || !scrollContainerRef.value) return

  scrollObserver = new IntersectionObserver(
    (entries) => {
      let maxRatio = 0
      let bestPage = currentPage.value

      for (const entry of entries) {
        if (entry.isIntersecting && entry.intersectionRatio > maxRatio) {
          maxRatio = entry.intersectionRatio
          const pageAttr = entry.target.getAttribute('data-scroll-page')
          if (pageAttr) {
            bestPage = Number(pageAttr)
          }
        }
      }

      if (maxRatio > 0.2 && bestPage !== currentPage.value) {
        currentPage.value = bestPage
        inputPage.value = bestPage
        emit('update:currentPage', bestPage)
        emit('page-change', bestPage)
      }
    },
    {
      root: null,
      threshold: [0.1, 0.3, 0.6]
    }
  )

  const items = scrollContainerRef.value.querySelectorAll('[data-scroll-page]')
  items.forEach((item) => scrollObserver?.observe(item))
}

function teardownScrollObserver() {
  if (scrollObserver) {
    scrollObserver.disconnect()
    scrollObserver = null
  }
}

// Synchronisation lorsque le nombre de pages change (ex: chargement d'un nouveau document)
watch(
  () => props.pageCount,
  (newCount) => {
    if (!props.mode && !props.initialMode) {
      activeMode.value = newCount <= 5 ? 'scroll' : 'paginated'
      emit('update:mode', activeMode.value)
      emit('mode-change', activeMode.value)
    }

    if (currentPage.value > newCount) {
      goToPage(Math.max(1, newCount))
    }

    if (activeMode.value === 'scroll') {
      nextTick(setupScrollObserver)
    }
  }
)

onMounted(() => {
  if (activeMode.value === 'scroll') {
    nextTick(setupScrollObserver)
  }
})

onUnmounted(() => {
  teardownScrollObserver()
})
</script>

<template>
  <div class="pdf-viewer-root">
    <!-- Barre de contrôle supérieure : mode d'affichage et pagination -->
    <header class="viewer-toolbar">
      <div class="mode-toggles" role="group" aria-label="Mode d'affichage">
        <button
          type="button"
          class="btn-retro btn-mode"
          :class="{ active: activeMode === 'scroll' }"
          @click="setMode('scroll')"
        >
          VUE CONTINUE
        </button>
        <button
          type="button"
          class="btn-retro btn-mode"
          :class="{ active: activeMode === 'paginated' }"
          @click="setMode('paginated')"
        >
          VUE PAGINÉE
        </button>
      </div>

      <!-- Contrôles de pagination (visibles en mode paginé ou pour saut direct) -->
      <div class="pagination-bar" role="navigation" aria-label="Navigation dans le document">
        <button
          type="button"
          class="btn-retro btn-nav"
          :disabled="currentPage <= 1"
          title="Page précédente"
          aria-label="Page précédente"
          @click="prevPage"
        >
          &lt;
        </button>

        <div class="page-indicator-box">
          <span class="bracket" aria-hidden="true">[</span>
          <input
            type="number"
            min="1"
            :max="pageCount"
            v-model.number="inputPage"
            class="page-input"
            aria-label="Aller à la page"
            @change="handleInputCommit"
            @keydown.enter.prevent="handleInputCommit"
          />
          <span class="bracket" aria-hidden="true">]</span>
          <span class="page-total">/ {{ pageCount }}</span>
        </div>

        <button
          type="button"
          class="btn-retro btn-nav"
          :disabled="currentPage >= pageCount"
          title="Page suivante"
          aria-label="Page suivante"
          @click="nextPage"
        >
          &gt;
        </button>
      </div>
    </header>

    <!-- Zone principale d'affichage du document PDF -->
    <main class="viewer-viewport">
      <!-- Mode Défilement Continu -->
      <div
        v-if="activeMode === 'scroll'"
        ref="scrollContainerRef"
        class="scroll-layout"
      >
        <div
          v-for="pageNumber in pageCount"
          :key="pageNumber"
          class="scroll-page-entry"
          :data-scroll-page="pageNumber"
        >
          <div class="page-header-tag">
            <span>PAGE {{ pageNumber }} / {{ pageCount }}</span>
          </div>

          <PdfPageItem
            :page-number="pageNumber"
            :dimension="pageDimensions[pageNumber - 1]"
            :render-page="renderPage"
          >
            <template #default="slotProps">
              <slot name="page-overlay" v-bind="slotProps">
                <slot v-bind="slotProps" />
              </slot>
            </template>
          </PdfPageItem>
        </div>
      </div>

      <!-- Mode Paginé -->
      <div v-else class="paginated-layout">
        <div class="paginated-page-entry">
          <PdfPageItem
            :key="currentPage"
            :page-number="currentPage"
            :dimension="currentPageDimension"
            :render-page="renderPage"
          >
            <template #default="slotProps">
              <slot name="page-overlay" v-bind="slotProps">
                <slot v-bind="slotProps" />
              </slot>
            </template>
          </PdfPageItem>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped lang="scss">
@use "@/assets/styles/variables" as *;
@use "@/assets/styles/mixins" as *;

.pdf-viewer-root {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.viewer-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: $surface-pc-beige;
  border: $border-width solid $black;
  padding: 8px 12px;
  box-shadow: 2px 2px 0px 0px $black;
  flex-wrap: wrap;
  gap: 8px;

  @media (max-width: 540px) {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
    padding: 8px;
  }
}

.mode-toggles {
  display: flex;
  gap: 6px;

  @media (max-width: 540px) {
    width: 100%;

    .btn-mode {
      flex: 1;
    }
  }
}

.pagination-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;

  @media (max-width: 540px) {
    width: 100%;
    justify-content: space-between;
  }
}

.page-indicator-box {
  display: flex;
  align-items: center;
  gap: 4px;
  font-family: inherit;
  font-size: 0.8125rem;
  font-weight: bold;
  background-color: $white;
  border: $border-width solid $black;
  padding: 4px 8px;
  box-shadow: inset 1px 1px 0px rgba(0, 0, 0, 0.15);
}

.bracket {
  color: #888;
  user-select: none;
}

.page-input {
  width: 44px;
  border: none;
  background: transparent;
  font-family: inherit;
  font-size: 0.875rem;
  font-weight: bold;
  text-align: center;
  color: $black;
  outline: none;
  padding: 0;

  &::-webkit-inner-spin-button,
  &::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  -moz-appearance: textfield;

  &:focus {
    background-color: #f2efe7;
  }
}

.page-total {
  color: #555;
  user-select: none;
  margin-left: 2px;
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
  box-sizing: border-box;
  @include inset-shadow-active;

  &:hover:not(:disabled) {
    background-color: $black;
    color: $white;
  }

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
    background-color: #e0e0e0;
    color: #888;
    box-shadow: none;
    border-color: #999;
  }

  @media (max-width: 480px) {
    min-height: 44px;
    min-width: 44px;
    padding: 6px 8px;
  }
}

.btn-nav {
  min-width: 36px;
  font-size: 0.875rem;

  @media (max-width: 480px) {
    min-width: 44px;
    min-height: 44px;
  }
}

.btn-mode {
  &.active {
    background-color: $black;
    color: $white;
  }
}

.viewer-viewport {
  width: 100%;
  display: flex;
  justify-content: center;
  overflow-x: auto;
  box-sizing: border-box;
  padding: 8px 0;
}

.scroll-layout {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  width: 100%;
  max-width: 850px;
}

.scroll-page-entry {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  width: 100%;
}

.page-header-tag {
  font-family: inherit;
  font-size: 0.6875rem;
  font-weight: bold;
  color: #666;
  background-color: $surface-pc-beige;
  border: 1px solid #999;
  padding: 2px 8px;
  letter-spacing: 0.5px;
}

.paginated-layout {
  display: flex;
  justify-content: center;
  width: 100%;
  max-width: 850px;
}

.paginated-page-entry {
  display: flex;
  justify-content: center;
  width: 100%;
}
</style>
