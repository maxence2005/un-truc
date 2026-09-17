import { ref, watch, onMounted, onUnmounted, getCurrentInstance, type Ref } from 'vue'

/**
 * Palette des couleurs d'encre prédéfinies pour la signature manuscrite.
 */
export const SIGNATURE_COLORS = {
  BLACK: '#000000',
  INK_BLUE: '#0000aa'
} as const

export type SignatureColor = (typeof SIGNATURE_COLORS)[keyof typeof SIGNATURE_COLORS] | string

/**
 * Valeurs par défaut du tracé de signature.
 */
export const DEFAULT_STROKE_COLOR: SignatureColor = SIGNATURE_COLORS.BLACK
export const DEFAULT_LINE_WIDTH = 2.5

/**
 * Représentation 2D d'un point dans le repère logique du canvas.
 */
export interface Point {
  x: number
  y: number
}

/**
 * Interface de retour du composable useSignatureCanvas.
 */
export interface UseSignatureCanvasReturn {
  canvasRef: Ref<HTMLCanvasElement | null>
  isEmpty: Ref<boolean>
  strokeColor: Ref<string>
  lineWidth: Ref<number>
  initCanvas: (canvas: HTMLCanvasElement) => void
  clear: () => void
  exportToPngDataUrl: (cropWhitespace?: boolean) => string | null
  setStrokeColor: (color: string) => void
  setLineWidth: (width: number) => void
  startStroke: (eventOrPoint: PointerEvent | Point) => void
  drawStroke: (eventOrPoint: PointerEvent | Point) => void
  endStroke: (eventOrPoint?: PointerEvent | Point) => void
  resizeCanvas: (preserveContent?: boolean) => void
  cleanup: () => void
}

/**
 * Composable Vue 3 gérant un canvas de signature tactile natif haute fidélité.
 *
 * Fonctionnalités clés :
 * - Gestion unifiée des événements tactiles, souris et stylet via l'API standard PointerEvents.
 * - Support des écrans haute densité (Retina / Hi-DPI) via `window.devicePixelRatio`.
 * - Lissage des courbes en temps réel par interpolation quadratique (`quadraticCurveTo`).
 * - Recadrage automatique des espaces transparents superflus à l'export PNG.
 * - Zéro dépendance tierce (100% Canvas 2D natif).
 *
 * @param targetCanvasRef Référence optionnelle vers un élément HTMLCanvasElement existant.
 */
export function useSignatureCanvas(
  targetCanvasRef?: Ref<HTMLCanvasElement | null>
): UseSignatureCanvasReturn {
  const canvasRef = targetCanvasRef ?? ref<HTMLCanvasElement | null>(null)
  const isEmpty = ref<boolean>(true)
  const strokeColor = ref<string>(DEFAULT_STROKE_COLOR)
  const lineWidth = ref<number>(DEFAULT_LINE_WIDTH)
  const dpr = ref<number>(1)

  // Variables d'état interne pour le tracé
  let currentCanvas: HTMLCanvasElement | null = null
  let activePointerId: number | null = null
  let isDrawing = false
  let points: Point[] = []
  let resizeObserver: ResizeObserver | null = null

  /**
   * Calcule la position d'un événement de pointeur relative à l'espace logique du canvas.
   * Prend en compte les décalages CSS, les bordures et l'éventuel redimensionnement fluide.
   */
  function getPointerPos(canvas: HTMLCanvasElement, event: PointerEvent): Point {
    const rect = canvas.getBoundingClientRect()
    const currentScaleDpr = dpr.value || 1
    const logicalWidth = canvas.width / currentScaleDpr
    const logicalHeight = canvas.height / currentScaleDpr

    const scaleX = rect.width > 0 ? logicalWidth / rect.width : 1
    const scaleY = rect.height > 0 ? logicalHeight / rect.height : 1

    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY
    }
  }

  /**
   * Résout les coordonnées 2D à partir d'un PointerEvent ou d'un Point pré-calculé.
   */
  function resolvePoint(eventOrPoint: PointerEvent | Point): Point {
    if ('clientX' in eventOrPoint && canvasRef.value) {
      return getPointerPos(canvasRef.value, eventOrPoint)
    }
    return eventOrPoint as Point
  }

  /**
   * Adapte la résolution du buffer mémoire du canvas à la densité de pixels de l'écran (Hi-DPI / Retina).
   * L'utilisation de `ctx.scale(dpr, dpr)` garantit que le rendu reste d'une netteté parfaite
   * tout en conservant une géométrie de tracé naturelle en pixels CSS.
   */
  function resizeCanvas(preserveContent: boolean = true): void {
    const canvas = canvasRef.value
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const cssWidth = rect.width > 0 ? rect.width : (canvas.clientWidth || 600)
    const cssHeight = rect.height > 0 ? rect.height : (canvas.clientHeight || 240)

    if (cssWidth === 0 || cssHeight === 0) return

    const currentDpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1
    dpr.value = currentDpr
    const targetWidth = Math.round(cssWidth * currentDpr)
    const targetHeight = Math.round(cssHeight * currentDpr)

    // Si les dimensions n'ont pas changé, aucune réallocation n'est requise
    if (canvas.width === targetWidth && canvas.height === targetHeight) {
      return
    }

    // Sauvegarde temporaire du dessin si préservation demandée et canvas non vide
    let tempCanvas: HTMLCanvasElement | null = null
    if (preserveContent && !isEmpty.value && canvas.width > 0 && canvas.height > 0) {
      tempCanvas = document.createElement('canvas')
      tempCanvas.width = canvas.width
      tempCanvas.height = canvas.height
      const tempCtx = tempCanvas.getContext('2d')
      if (tempCtx) {
        tempCtx.drawImage(canvas, 0, 0)
      }
    }

    canvas.width = targetWidth
    canvas.height = targetHeight

    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.scale(currentDpr, currentDpr)
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.strokeStyle = strokeColor.value
      ctx.fillStyle = strokeColor.value
      ctx.lineWidth = lineWidth.value

      // Restauration du dessin précédent à l'échelle
      if (tempCanvas) {
        ctx.drawImage(tempCanvas, 0, 0, tempCanvas.width / currentDpr, tempCanvas.height / currentDpr)
      }
    }
  }

  /**
   * Démarre un nouveau tracé de signature (doigt, stylet ou souris).
   */
  function startStroke(eventOrPoint: PointerEvent | Point): void {
    const canvas = canvasRef.value
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Capture du pointeur pour continuer de recevoir les événements même hors du canvas
    if ('pointerId' in eventOrPoint && typeof canvas.setPointerCapture === 'function') {
      try {
        canvas.setPointerCapture(eventOrPoint.pointerId)
        activePointerId = eventOrPoint.pointerId
      } catch {
        // Tolérance d'erreur si la plateforme refuse la capture
      }
    }

    const point = resolvePoint(eventOrPoint)
    isDrawing = true
    isEmpty.value = false
    points = [point]

    // Écouteur global de sécurité pour relâcher le tracé n'importe où
    if (typeof window !== 'undefined') {
      window.addEventListener('pointerup', onWindowPointerUp)
    }

    // Configuration du contexte graphique pour ce trait
    ctx.strokeStyle = strokeColor.value
    ctx.fillStyle = strokeColor.value
    ctx.lineWidth = lineWidth.value
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    // Tracé d'un point initial circulaire pour supporter les points isolés (accents, i, etc.)
    ctx.beginPath()
    ctx.arc(point.x, point.y, lineWidth.value / 2, 0, Math.PI * 2)
    ctx.fill()
  }

  /**
   * Ajoute un segment au trait en cours en appliquant une interpolation quadratique lissée.
   * L'algorithme calcule les points médians entre coordonnées successives pour obtenir
   * une courbe de Bézier continue sans angles vifs.
   */
  function drawStroke(eventOrPoint: PointerEvent | Point): void {
    if (!isDrawing) return
    const canvas = canvasRef.value
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const point = resolvePoint(eventOrPoint)
    points.push(point)

    ctx.strokeStyle = strokeColor.value
    ctx.lineWidth = lineWidth.value
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    const count = points.length
    if (count === 2) {
      // Du premier point vers le premier point médian
      const p0 = points[0]
      const p1 = points[1]
      if (!p0 || !p1) return

      const midPoint = {
        x: (p0.x + p1.x) / 2,
        y: (p0.y + p1.y) / 2
      }
      ctx.beginPath()
      ctx.moveTo(p0.x, p0.y)
      ctx.lineTo(midPoint.x, midPoint.y)
      ctx.stroke()
    } else if (count > 2) {
      // Courbe quadratique continue entre deux points médians
      const pPrev2 = points[count - 3]
      const pPrev1 = points[count - 2]
      const pCurr = points[count - 1]
      if (!pPrev2 || !pPrev1 || !pCurr) return

      const prevMid = {
        x: (pPrev2.x + pPrev1.x) / 2,
        y: (pPrev2.y + pPrev1.y) / 2
      }
      const currMid = {
        x: (pPrev1.x + pCurr.x) / 2,
        y: (pPrev1.y + pCurr.y) / 2
      }

      ctx.beginPath()
      ctx.moveTo(prevMid.x, prevMid.y)
      ctx.quadraticCurveTo(pPrev1.x, pPrev1.y, currMid.x, currMid.y)
      ctx.stroke()
    }
  }

  /**
   * Finalise le trait en reliant le dernier point médian au point d'arrivée et libère les ressources.
   */
  function endStroke(eventOrPoint?: PointerEvent | Point): void {
    if (!isDrawing) return
    const canvas = canvasRef.value
    const ctx = canvas?.getContext('2d')

    if (eventOrPoint) {
      drawStroke(eventOrPoint)
    }

    if (canvas && ctx && points.length >= 2) {
      const lastPoint = points[points.length - 1]
      const secondLastPoint = points[points.length - 2]
      if (lastPoint && secondLastPoint) {
        const midPoint = {
          x: (secondLastPoint.x + lastPoint.x) / 2,
          y: (secondLastPoint.y + lastPoint.y) / 2
        }

        ctx.strokeStyle = strokeColor.value
        ctx.lineWidth = lineWidth.value
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'

        ctx.beginPath()
        ctx.moveTo(midPoint.x, midPoint.y)
        ctx.lineTo(lastPoint.x, lastPoint.y)
        ctx.stroke()
      }
    }

    // Libération de la capture du pointeur
    if (activePointerId !== null && canvas && typeof canvas.releasePointerCapture === 'function') {
      try {
        if (canvas.hasPointerCapture(activePointerId)) {
          canvas.releasePointerCapture(activePointerId)
        }
      } catch {
        // Tolérance d'erreur
      }
      activePointerId = null
    }

    if (typeof window !== 'undefined') {
      window.removeEventListener('pointerup', onWindowPointerUp)
    }

    isDrawing = false
    points = []
  }

  /**
   * Sécurité de relâchement global du pointeur.
   */
  function onWindowPointerUp(event: PointerEvent): void {
    if (isDrawing && (activePointerId === null || event.pointerId === activePointerId)) {
      endStroke(event)
    }
  }

  /**
   * Gestionnaire d'événement pointerdown.
   */
  function handlePointerDown(event: PointerEvent): void {
    // Éviter les conflits multi-touch lors d'un appui simultané de plusieurs doigts
    if (isDrawing && activePointerId !== null && event.pointerId !== activePointerId) {
      return
    }
    // Ignorer les clics de souris secondaires (clic droit ou molette)
    if (event.pointerType === 'mouse' && event.button !== 0 && event.buttons !== 1) {
      return
    }
    startStroke(event)
  }

  /**
   * Gestionnaire d'événement pointermove.
   */
  function handlePointerMove(event: PointerEvent): void {
    if (activePointerId !== null && event.pointerId !== activePointerId) {
      return
    }
    drawStroke(event)
  }

  /**
   * Gestionnaire d'événement pointerup.
   */
  function handlePointerUp(event: PointerEvent): void {
    if (activePointerId !== null && event.pointerId !== activePointerId) {
      return
    }
    endStroke(event)
  }

  /**
   * Gestionnaire d'événement pointercancel.
   */
  function handlePointerCancel(event: PointerEvent): void {
    if (activePointerId !== null && event.pointerId !== activePointerId) {
      return
    }
    endStroke(event)
  }

  /**
   * Réinitialise complètement le canvas et efface tous les tracés.
   */
  function clear(): void {
    const canvas = canvasRef.value
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (ctx) {
      // Effacement intégral au niveau du buffer brut sans écraser la transformation d'échelle active
      ctx.save()
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.restore()
    }

    isEmpty.value = true
    points = []
    isDrawing = false
    activePointerId = null
  }

  /**
   * Modifie la couleur d'encre active pour les futurs tracés.
   */
  function setStrokeColor(color: string): void {
    strokeColor.value = color
    const canvas = canvasRef.value
    const ctx = canvas?.getContext('2d')
    if (ctx) {
      ctx.strokeStyle = color
      ctx.fillStyle = color
    }
  }

  /**
   * Modifie l'épaisseur de ligne active pour les futurs tracés.
   */
  function setLineWidth(width: number): void {
    lineWidth.value = width
    const canvas = canvasRef.value
    const ctx = canvas?.getContext('2d')
    if (ctx) {
      ctx.lineWidth = width
    }
  }

  /**
   * Exporte la signature au format PNG transparent (Data URL en base64).
   *
   * @param cropWhitespace Si vrai (valeur par défaut), recadre l'image au plus près des pixels tracés
   *                       avec une marge de sécurité. Si faux, exporte l'intégralité du canvas.
   * @returns La chaîne base64 du PNG ou null si le canvas est vierge.
   */
  function exportToPngDataUrl(cropWhitespace: boolean = true): string | null {
    const canvas = canvasRef.value
    if (!canvas || isEmpty.value) return null

    const ctx = canvas.getContext('2d')
    if (!ctx) return null

    const { width, height } = canvas
    if (width === 0 || height === 0) return null

    // Exportation standard non rognée
    if (!cropWhitespace) {
      return canvas.toDataURL('image/png')
    }

    // Analyse des canaux alpha pour détecter la boîte englobante (bounding box) du tracé
    const imgData = ctx.getImageData(0, 0, width, height)
    const data = imgData.data

    // Détection de la bordure supérieure
    let minY = 0
    scanTop: for (; minY < height; minY++) {
      const offset = minY * width * 4
      for (let x = 0; x < width; x++) {
        const alpha = data[offset + x * 4 + 3]
        if (alpha !== undefined && alpha > 0) break scanTop
      }
    }

    // Si aucune trace opaque n'est détectée, le canvas est effectivement vide
    if (minY >= height) {
      isEmpty.value = true
      return null
    }

    // Détection de la bordure inférieure
    let maxY = height - 1
    scanBottom: for (; maxY >= minY; maxY--) {
      const offset = maxY * width * 4
      for (let x = 0; x < width; x++) {
        const alpha = data[offset + x * 4 + 3]
        if (alpha !== undefined && alpha > 0) break scanBottom
      }
    }

    // Détection de la bordure gauche
    let minX = 0
    scanLeft: for (; minX < width; minX++) {
      for (let y = minY; y <= maxY; y++) {
        const alpha = data[(y * width + minX) * 4 + 3]
        if (alpha !== undefined && alpha > 0) break scanLeft
      }
    }

    // Détection de la bordure droite
    let maxX = width - 1
    scanRight: for (; maxX >= minX; maxX--) {
      for (let y = minY; y <= maxY; y++) {
        const alpha = data[(y * width + maxX) * 4 + 3]
        if (alpha !== undefined && alpha > 0) break scanRight
      }
    }

    // Marge de confort proportionnelle au DPR (ex: 8px)
    const padding = Math.round(8 * (dpr.value || 1))
    const cropX = Math.max(0, minX - padding)
    const cropY = Math.max(0, minY - padding)
    const cropRight = Math.min(width, maxX + 1 + padding)
    const cropBottom = Math.min(height, maxY + 1 + padding)

    const cropWidth = cropRight - cropX
    const cropHeight = cropBottom - cropY

    if (cropWidth <= 0 || cropHeight <= 0) {
      isEmpty.value = true
      return null
    }

    // Création d'un canvas intermédiaire pour découper le rectangle utile
    const croppedCanvas = document.createElement('canvas')
    croppedCanvas.width = cropWidth
    croppedCanvas.height = cropHeight

    const croppedCtx = croppedCanvas.getContext('2d')
    if (!croppedCtx) return null

    croppedCtx.drawImage(canvas, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight)

    return croppedCanvas.toDataURL('image/png')
  }

  /**
   * Détache les écouteurs et libère les observateurs d'un canvas.
   */
  function cleanup(): void {
    if (currentCanvas) {
      currentCanvas.removeEventListener('pointerdown', handlePointerDown)
      currentCanvas.removeEventListener('pointermove', handlePointerMove)
      currentCanvas.removeEventListener('pointerup', handlePointerUp)
      currentCanvas.removeEventListener('pointercancel', handlePointerCancel)
      currentCanvas = null
    }

    if (typeof window !== 'undefined') {
      window.removeEventListener('pointerup', onWindowPointerUp)
    }

    if (resizeObserver) {
      resizeObserver.disconnect()
      resizeObserver = null
    }

    isDrawing = false
    activePointerId = null
    points = []
  }

  /**
   * Initialise un élément canvas avec le support tactile, la gestion Hi-DPI et les écouteurs natifs.
   */
  function initCanvas(canvas: HTMLCanvasElement): void {
    if (currentCanvas === canvas) {
      resizeCanvas(true)
      return
    }

    cleanup()

    canvasRef.value = canvas
    currentCanvas = canvas

    // Bloquer le scroll tactile natif sur le conteneur du canvas
    canvas.style.touchAction = 'none'

    // Initialiser la résolution Retina
    resizeCanvas(false)

    // Attacher les écouteurs unifiés PointerEvents
    canvas.addEventListener('pointerdown', handlePointerDown)
    canvas.addEventListener('pointermove', handlePointerMove)
    canvas.addEventListener('pointerup', handlePointerUp)
    canvas.addEventListener('pointercancel', handlePointerCancel)

    // Surveiller les redimensionnements dynamiques
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        resizeCanvas(true)
      })
      resizeObserver.observe(canvas)
    }
  }

  // Synchronisation réactive des options
  watch(strokeColor, (newColor) => {
    setStrokeColor(newColor)
  })

  watch(lineWidth, (newWidth) => {
    setLineWidth(newWidth)
  })

  // Auto-initialisation si la ref change
  watch(canvasRef, (newCanvas) => {
    if (newCanvas && newCanvas !== currentCanvas) {
      initCanvas(newCanvas)
    }
  })

  // Gestion du cycle de vie du composant parent
  if (getCurrentInstance()) {
    onMounted(() => {
      if (canvasRef.value && !currentCanvas) {
        initCanvas(canvasRef.value)
      }
    })

    onUnmounted(() => {
      cleanup()
    })
  }

  return {
    canvasRef,
    isEmpty,
    strokeColor,
    lineWidth,
    initCanvas,
    clear,
    exportToPngDataUrl,
    setStrokeColor,
    setLineWidth,
    startStroke,
    drawStroke,
    endStroke,
    resizeCanvas,
    cleanup
  }
}
