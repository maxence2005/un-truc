<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import type {
  Annotation,
  SignatureAnnotation,
  TextAnnotation,
  ViewerMode
} from './types'
import { usePdfRenderer } from './composables/usePdfRenderer'
import { usePdfGenerator } from './composables/usePdfGenerator'
import { useAppFacade } from '@/composables/useAppFacade'
import PdfDropZone from './components/PdfDropZone.vue'
import PdfViewer from './components/PdfViewer.vue'
import PdfOverlayLayer from './components/PdfOverlayLayer.vue'
import SignerActionBar from './components/SignerActionBar.vue'
import SignatureModal from './components/SignatureModal.vue'

// Façade applicative pour les notifications popups
const { showPopup } = useAppFacade()

// Moteur de rendu PDF natif
const {
  pageCount,
  pageDimensions,
  isLoading,
  error: rendererError,
  loadPdf,
  renderPage,
  cleanup: cleanupRenderer
} = usePdfRenderer()

// Moteur de projection mathématique et de génération du PDF signé
const { generateSignedPdf, downloadPdf } = usePdfGenerator()

// États réactifs principaux de l'outil
const file = ref<File | null>(null)
const fileBuffer = ref<ArrayBuffer | null>(null)
const annotations = ref<Annotation[]>([])
const selectedAnnotationId = ref<string | null>(null)
const currentPage = ref<number>(1)
const viewerMode = ref<ViewerMode>('scroll')
const isModalOpen = ref<boolean>(false)
const isGenerating = ref<boolean>(false)

/**
 * Traite la sélection ou le dépôt d'un fichier PDF valide.
 */
async function onFileSelected(selectedFile: File) {
  try {
    file.value = selectedFile
    const buffer = await selectedFile.arrayBuffer()
    fileBuffer.value = buffer
    await loadPdf(buffer)
    currentPage.value = 1
    annotations.value = []
    selectedAnnotationId.value = null
  } catch (err: any) {
    console.error('Erreur lors du chargement du fichier PDF :', err)
    showPopup('Erreur', rendererError.value || 'Impossible de lire ou de charger le document PDF.')
    file.value = null
    fileBuffer.value = null
  }
}

/**
 * Réinitialise complètement l'espace de travail pour ouvrir un nouveau document.
 */
function onNewDocument() {
  file.value = null
  fileBuffer.value = null
  annotations.value = []
  selectedAnnotationId.value = null
  currentPage.value = 1
  cleanupRenderer()
}

/**
 * Ouvre la modale pour tracer ou importer une signature manuscrite.
 */
function onOpenSignatureModal() {
  isModalOpen.value = true
}

/**
 * Valide la signature tracée et l'appose au centre de la page courante.
 */
function onConfirmSignature(dataUrl: string) {
  isModalOpen.value = false

  const id = 'sig_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7)
  const relWidth = 0.28
  const relHeight = 0.12
  const relX = Math.max(0, (1.0 - relWidth) / 2)
  const relY = Math.max(0, (1.0 - relHeight) / 2)

  const newAnnotation: SignatureAnnotation = {
    id,
    type: 'signature',
    pageNumber: currentPage.value,
    relX,
    relY,
    relWidth,
    relHeight,
    imageDataUrl: dataUrl
  }

  annotations.value.push(newAnnotation)
  selectedAnnotationId.value = id
}

/**
 * Ajoute une annotation textuelle avec la date du jour (format JJ/MM/AAAA) au centre de la page courante.
 */
function onAddDate() {
  const now = new Date()
  const day = String(now.getDate()).padStart(2, '0')
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const year = now.getFullYear()
  const dateStr = `${day}/${month}/${year}`

  const id = 'date_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7)
  const relWidth = 0.22
  const relHeight = 0.04
  const relX = Math.max(0, (1.0 - relWidth) / 2)
  const relY = Math.max(0, (1.0 - relHeight) / 2)

  const newAnnotation: TextAnnotation = {
    id,
    type: 'date',
    pageNumber: currentPage.value,
    content: dateStr,
    relX,
    relY,
    relWidth,
    relHeight,
    fontSizeRatio: 0.022,
    color: '#000000'
  }

  annotations.value.push(newAnnotation)
  selectedAnnotationId.value = id
}

/**
 * Ajoute une annotation textuelle standard "Lu et approuvé" (modifiable en ligne) au centre de la page courante.
 */
function onAddText() {
  const id = 'text_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7)
  const relWidth = 0.28
  const relHeight = 0.04
  const relX = Math.max(0, (1.0 - relWidth) / 2)
  const relY = Math.max(0, (1.0 - relHeight) / 2)

  const newAnnotation: TextAnnotation = {
    id,
    type: 'text',
    pageNumber: currentPage.value,
    content: 'Lu et approuvé',
    relX,
    relY,
    relWidth,
    relHeight,
    fontSizeRatio: 0.022,
    color: '#000000'
  }

  annotations.value.push(newAnnotation)
  selectedAnnotationId.value = id
}

/**
 * Met à jour les propriétés ou la géométrie d'une annotation existante.
 */
function onUpdateAnnotation(updated: Annotation) {
  const index = annotations.value.findIndex((ann) => ann.id === updated.id)
  if (index !== -1) {
    annotations.value[index] = updated
  }
}

/**
 * Supprime une annotation de la liste.
 */
function onDeleteAnnotation(id: string) {
  annotations.value = annotations.value.filter((ann) => ann.id !== id)
  if (selectedAnnotationId.value === id) {
    selectedAnnotationId.value = null
  }
}

/**
 * Sélectionne une annotation pour activer son cadre de redimensionnement et suppression.
 */
function onSelectAnnotation(id: string) {
  selectedAnnotationId.value = id
}

/**
 * Lance la génération du PDF avec projection mathématique et déclenche le téléchargement local instantané.
 */
async function onDownload() {
  if (!fileBuffer.value) {
    showPopup('Erreur', 'Aucun document PDF chargé.')
    return
  }

  isGenerating.value = true

  try {
    const signedBytes = await generateSignedPdf(fileBuffer.value, annotations.value)
    const originalName = file.value?.name ?? 'document.pdf'
    const baseName = originalName.replace(/\.pdf$/i, '')
    const downloadFilename = `${baseName}_signe.pdf`

    downloadPdf(signedBytes, downloadFilename)
    showPopup('Succès', 'Document signé exporté et téléchargé avec succès.')
  } catch (err: any) {
    console.error('Erreur lors de l\'exportation du PDF signé :', err)
    showPopup('Erreur', err?.message || 'Échec lors de la génération du document signé.')
  } finally {
    isGenerating.value = false
  }
}
</script>

<template>
  <div class="pdf-signer-tool">
    <div class="back-nav">
      <RouterLink to="/" class="btn-back">
        <span class="material-symbols-outlined" aria-hidden="true">arrow_back</span>
        <span>RETOUR</span>
      </RouterLink>
    </div>

    <div class="window-box signer-window">
      <header class="window-header">
        <span class="window-title">
          C:\SYSTEM\PDF_SIGN.EXE {{ file ? `- [${file.name}]` : '' }}
        </span>
        <div class="window-controls">
          <div class="control-box"></div>
          <div class="control-box"></div>
          <div class="control-box"></div>
        </div>
      </header>

      <div class="signer-content">
        <!-- 1. État initial : Zone d'importation glisser-déposer -->
        <PdfDropZone
          v-if="!file"
          :disabled="isLoading"
          @file-selected="onFileSelected"
        />

        <!-- 2. État actif : Visualiseur PDF avec superposition d'annotations et barre d'actions -->
        <div v-else class="signer-workspace">
          <div class="doc-info-bar">
            <div class="doc-meta">
              <span class="material-symbols-outlined" aria-hidden="true">description</span>
              <span class="doc-filename" :title="file.name">{{ file.name }}</span>
            </div>
            <div class="doc-tags">
              <span class="doc-badge">{{ pageCount }} PAGE{{ pageCount > 1 ? 'S' : '' }}</span>
              <span v-if="annotations.length > 0" class="doc-badge annotations-badge">
                {{ annotations.length }} ANNOTATION{{ annotations.length > 1 ? 'S' : '' }}
              </span>
            </div>
          </div>

          <!-- Zone du visualiseur PDF avec calques d'annotations interactifs -->
          <div
            class="viewer-wrapper"
            @pointerdown.self="selectedAnnotationId = null"
          >
            <PdfViewer
              v-model:current-page="currentPage"
              v-model:mode="viewerMode"
              :page-count="pageCount"
              :page-dimensions="pageDimensions"
              :render-page="renderPage"
            >
              <template #page-overlay="{ pageNumber, width, height }">
                <PdfOverlayLayer
                  :page-number="pageNumber"
                  :width="width"
                  :height="height"
                  :annotations="annotations"
                  :selected-id="selectedAnnotationId"
                  @update:annotation="onUpdateAnnotation"
                  @delete="onDeleteAnnotation"
                  @select="onSelectAnnotation"
                />
              </template>
            </PdfViewer>
          </div>

          <!-- Barre d'actions principale -->
          <SignerActionBar
            :disabled="isLoading || isGenerating"
            :is-generating="isGenerating"
            :can-download="pageCount > 0"
            :annotation-count="annotations.length"
            @new-document="onNewDocument"
            @add-signature="onOpenSignatureModal"
            @add-date="onAddDate"
            @add-text="onAddText"
            @download="onDownload"
          />
        </div>

        <!-- Modale de signature manuscrite (tracé tactile ou image) -->
        <SignatureModal
          v-if="isModalOpen"
          @confirm="onConfirmSignature"
          @close="isModalOpen = false"
        />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use "@/assets/styles/variables" as *;
@use "@/assets/styles/mixins" as *;

.pdf-signer-tool {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  gap: 16px;
  min-height: calc(100vh - 40px);

  @media (max-width: 600px) {
    padding: 10px;
    min-height: calc(100vh - 20px);
    gap: 10px;
  }
}

.back-nav {
  width: 100%;
  max-width: 1000px;
}

.btn-back {
  border: $border-width solid $black;
  padding: 8px 16px;
  background-color: $white;
  font-weight: bold;
  font-size: 0.875rem;
  box-shadow: 3px 3px 0px 0px $black;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
  color: inherit;
  @include inset-shadow-active;

  &:hover {
    background-color: $black;
    color: $white;
    @include glitch-effect;
  }
}

.signer-window {
  @include window-box;
  width: 100%;
  max-width: 1000px;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}

.window-header {
  background-color: $header-blue;
  border-bottom: $border-width solid $black;
  padding: 6px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  user-select: none;
}

.window-title {
  color: $white;
  font-size: 0.875rem;
  font-weight: bold;
  letter-spacing: 0.5px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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

.signer-content {
  padding: 16px;
  display: flex;
  flex-direction: column;
  flex-grow: 1;

  @media (max-width: 600px) {
    padding: 10px;
  }
}

.signer-workspace {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
}

.doc-info-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: $surface-pc-beige;
  border: $border-width solid $black;
  padding: 6px 12px;
  box-shadow: 2px 2px 0px 0px $black;
  font-family: inherit;
  font-size: 0.75rem;
  font-weight: bold;
  gap: 8px;
  flex-wrap: wrap;
}

.doc-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 70%;

  .material-symbols-outlined {
    font-size: 1.125rem;
    flex-shrink: 0;
  }
}

.doc-filename {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.doc-tags {
  display: flex;
  align-items: center;
  gap: 6px;
}

.doc-badge {
  background-color: $white;
  border: 1px solid $black;
  padding: 2px 6px;
  font-size: 0.6875rem;
  box-shadow: 1px 1px 0px 0px $black;
  white-space: nowrap;

  &.annotations-badge {
    background-color: $glitch-cyan;
    color: $black;
  }
}

.viewer-wrapper {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}
</style>
