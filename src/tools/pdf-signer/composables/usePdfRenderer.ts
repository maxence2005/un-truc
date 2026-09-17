import { ref, shallowRef } from 'vue'
import * as pdfjsLib from 'pdfjs-dist'
import type { PDFDocumentProxy, RenderTask } from 'pdfjs-dist'
import type { PageDimension } from '../types'

// Configuration du worker pdfjs-dist via Vite
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString()

// Suivi des tâches de rendu actives par canvas pour éviter les collisions et fuites mémoire
const activeRenderTasks = new WeakMap<HTMLCanvasElement, RenderTask>()

/**
 * Composable gérant le cycle de vie, le décodage et le rendu des pages PDF
 * via la bibliothèque standard pdfjs-dist.
 */
export function usePdfRenderer() {
  const pdfDocument = shallowRef<PDFDocumentProxy | null>(null)
  const pageCount = ref<number>(0)
  const pageDimensions = ref<PageDimension[]>([])
  const isLoading = ref<boolean>(false)
  const error = ref<string | null>(null)

  /**
   * Libère les ressources du document PDF courant et réinitialise l'état interne.
   */
  function cleanup(): void {
    if (pdfDocument.value) {
      try {
        pdfDocument.value.cleanup()
      } catch {
        // Ignorer les erreurs potentielles lors du nettoyage
      }
      pdfDocument.value = null
    }
    pageCount.value = 0
    pageDimensions.value = []
    error.value = null
    isLoading.value = false
  }

  /**
   * Charge et décode un fichier PDF à partir d'un objet File ou d'un ArrayBuffer.
   * Extrait le nombre total de pages et leurs dimensions intrinsèques.
   *
   * @param source Fichier PDF source
   */
  async function loadPdf(source: File | ArrayBuffer): Promise<void> {
    isLoading.value = true
    error.value = null

    try {
      cleanup()

      const buffer = source instanceof File ? await source.arrayBuffer() : source

      // Sécurité : duplication du buffer pour éviter tout transfert destructif
      // de propriété par le Web Worker de pdf.js, préservant ainsi le buffer original
      // pour la phase ultérieure d'incrustation et d'exportation avec pdf-lib.
      const data = new Uint8Array(buffer.slice(0))

      const loadingTask = pdfjsLib.getDocument({ data })
      const doc = await loadingTask.promise

      pdfDocument.value = doc
      pageCount.value = doc.numPages

      // Extraction séquentielle des dimensions de chaque page
      const dims: PageDimension[] = []
      for (let i = 1; i <= doc.numPages; i++) {
        const page = await doc.getPage(i)
        const viewport = page.getViewport({ scale: 1.0 })
        dims.push({
          pageNumber: i,
          widthPoints: viewport.width,
          heightPoints: viewport.height,
          aspectRatio: viewport.width / viewport.height
        })
      }
      pageDimensions.value = dims
    } catch (err: any) {
      error.value = err?.message || 'Échec du chargement du document PDF.'
      cleanup()
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Rend une page spécifique du document sur l'élément HTMLCanvas fourni.
   * Ajuste la résolution pour les écrans haute densité (Retina) et gère
   * l'interruption fluide des rendus concurrents.
   *
   * @param pageNumber Numéro de la page (1-indexé)
   * @param canvas Élément canvas cible
   * @param targetWidth Largeur d'affichage souhaitée en pixels CSS
   */
  async function renderPage(
    pageNumber: number,
    canvas: HTMLCanvasElement,
    targetWidth?: number
  ): Promise<void> {
    if (!pdfDocument.value) {
      throw new Error('Aucun document PDF chargé.')
    }
    if (pageNumber < 1 || pageNumber > pageCount.value) {
      throw new Error(`Numéro de page invalide : ${pageNumber}`)
    }

    // Interrompre tout rendu précédent sur ce même canvas
    const existingTask = activeRenderTasks.get(canvas)
    if (existingTask) {
      try {
        existingTask.cancel()
      } catch {
        // Ignorer l'exception d'annulation
      }
      activeRenderTasks.delete(canvas)
    }

    const page = await pdfDocument.value.getPage(pageNumber)
    const baseViewport = page.getViewport({ scale: 1.0 })

    // Calcul de l'échelle d'affichage
    const scale = targetWidth && targetWidth > 0 ? targetWidth / baseViewport.width : 1.0

    // Prise en charge des écrans haute densité (Retina / DPR) plafonnée à 2.5 pour ménager la mémoire vive
    const dpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2.5) : 1
    const viewport = page.getViewport({ scale: scale * dpr })

    // Définition de la résolution réelle du bitmap du canvas
    canvas.width = Math.floor(viewport.width)
    canvas.height = Math.floor(viewport.height)

    // Définition des dimensions CSS d'affichage
    const displayWidth = Math.floor(baseViewport.width * scale)
    const displayHeight = Math.floor(baseViewport.height * scale)
    canvas.style.width = `${displayWidth}px`
    canvas.style.height = `${displayHeight}px`

    const ctx = canvas.getContext('2d')
    if (!ctx) {
      throw new Error("Impossible d'obtenir le contexte 2D du canvas.")
    }

    // Nettoyage de sécurité
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    const renderTask = page.render({
      canvas: canvas,
      canvasContext: ctx,
      viewport: viewport
    })

    activeRenderTasks.set(canvas, renderTask)

    try {
      await renderTask.promise
    } catch (err: any) {
      // Ignorer l'erreur d'annulation normale (RenderingCancelledException)
      if (err?.name === 'RenderingCancelledException') {
        return
      }
      throw err
    } finally {
      if (activeRenderTasks.get(canvas) === renderTask) {
        activeRenderTasks.delete(canvas)
      }
    }
  }

  return {
    pdfDocument,
    pageCount,
    pageDimensions,
    isLoading,
    error,
    loadPdf,
    renderPage,
    cleanup
  }
}
