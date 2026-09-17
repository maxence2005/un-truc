import { ref, getCurrentInstance, onUnmounted } from 'vue'

export interface RelativeBounds {
  relX: number
  relY: number
  relWidth: number
  relHeight: number
}

export interface ContainerSize {
  width: number
  height: number
}

export interface UsePointerDragOptions {
  /**
   * Retourne la position et taille relatives actuelles de l'élément (0.0 à 1.0).
   */
  getBounds: () => RelativeBounds
  /**
   * Retourne les dimensions en pixels du conteneur de la page.
   */
  getContainerSize: () => ContainerSize
  /**
   * Ratio de largeur minimale normalisé (défaut : 0.05, soit 5% de la largeur).
   */
  minWidthRatio?: number
  /**
   * Ratio de hauteur minimale normalisé (défaut : 0.03, soit 3% de la hauteur).
   */
  minHeightRatio?: number
  /**
   * Indique si le redimensionnement doit obligatoirement préserver le ratio d'aspect.
   */
  preserveAspectRatio?: boolean | (() => boolean)
  /**
   * Déclenché lors du début d'une manipulation (déplacement ou redimensionnement).
   */
  onStart?: () => void
  /**
   * Déclenché en continu lors de la mise à jour des coordonnées.
   */
  onUpdate?: (bounds: RelativeBounds) => void
  /**
   * Déclenché lors du relâchement du pointeur à la fin d'un déplacement.
   */
  onDragEnd?: (coords: { relX: number; relY: number }) => void
  /**
   * Déclenché lors du relâchement du pointeur à la fin d'un redimensionnement.
   */
  onResizeEnd?: (dimensions: { relWidth: number; relHeight: number }) => void
}

/**
 * Composable gérant la manipulation directe (déplacement et redimensionnement)
 * par PointerEvents unifiés (souris, stylet, tactile) avec contraintes de bordures
 * et conversion en ratios relatifs normalisés (0.0 à 1.0).
 */
export function usePointerDrag(options: UsePointerDragOptions) {
  const isDragging = ref(false)
  const isResizing = ref(false)

  const activeCleanups = new Set<() => void>()

  if (getCurrentInstance()) {
    onUnmounted(() => {
      activeCleanups.forEach((cleanup) => cleanup())
      activeCleanups.clear()
    })
  }

  /**
   * Démarre le déplacement de l'élément sur la page.
   */
  function startDrag(e: PointerEvent) {
    if (e.button !== 0 && e.pointerType === 'mouse') return

    const container = options.getContainerSize()
    if (container.width <= 0 || container.height <= 0) return

    options.onStart?.()

    const startPointerX = e.clientX
    const startPointerY = e.clientY
    const initialBounds = { ...options.getBounds() }
    const containerWidth = container.width
    const containerHeight = container.height

    isDragging.value = true

    const pointerId = e.pointerId
    const target = e.currentTarget as HTMLElement | null
    if (target && typeof target.setPointerCapture === 'function') {
      try {
        target.setPointerCapture(pointerId)
      } catch {
        // Ignorer si la capture échoue
      }
    }

    function onPointerMove(event: PointerEvent) {
      if (event.pointerId !== pointerId) return

      const deltaX = event.clientX - startPointerX
      const deltaY = event.clientY - startPointerY

      const deltaRelX = deltaX / containerWidth
      const deltaRelY = deltaY / containerHeight

      // Contraintes strictes de limites de page [0, 1]
      const maxRelX = Math.max(0, 1 - initialBounds.relWidth)
      const maxRelY = Math.max(0, 1 - initialBounds.relHeight)

      const clampedRelX = Math.max(0, Math.min(maxRelX, initialBounds.relX + deltaRelX))
      const clampedRelY = Math.max(0, Math.min(maxRelY, initialBounds.relY + deltaRelY))

      options.onUpdate?.({
        relX: clampedRelX,
        relY: clampedRelY,
        relWidth: initialBounds.relWidth,
        relHeight: initialBounds.relHeight
      })
    }

    function onPointerUp(event: PointerEvent) {
      if (event.pointerId !== pointerId) return

      cleanup()

      if (target && typeof target.releasePointerCapture === 'function') {
        try {
          const hasCapture =
            typeof target.hasPointerCapture === 'function'
              ? target.hasPointerCapture(pointerId)
              : true
          if (hasCapture) {
            target.releasePointerCapture(pointerId)
          }
        } catch {
          // Ignorer
        }
      }

      isDragging.value = false
      const current = options.getBounds()
      options.onDragEnd?.({ relX: current.relX, relY: current.relY })
    }

    function cleanup() {
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
      window.removeEventListener('pointercancel', onPointerUp)
      activeCleanups.delete(cleanup)
    }

    activeCleanups.add(cleanup)
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
    window.addEventListener('pointercancel', onPointerUp)
  }

  /**
   * Démarre le redimensionnement depuis la poignée inférieure droite.
   */
  function startResize(e: PointerEvent) {
    e.stopPropagation()
    e.preventDefault()

    if (e.button !== 0 && e.pointerType === 'mouse') return

    const container = options.getContainerSize()
    if (container.width <= 0 || container.height <= 0) return

    options.onStart?.()

    const startPointerX = e.clientX
    const startPointerY = e.clientY
    const initialBounds = { ...options.getBounds() }
    const containerWidth = container.width
    const containerHeight = container.height

    const minWidth = options.minWidthRatio ?? 0.05
    const minHeight = options.minHeightRatio ?? 0.03

    const shouldPreserveRatio =
      typeof options.preserveAspectRatio === 'function'
        ? options.preserveAspectRatio()
        : Boolean(options.preserveAspectRatio)

    // Ratio d'aspect relatif (relWidth / relHeight)
    const initialAspect = initialBounds.relWidth / (initialBounds.relHeight || 0.01)

    isResizing.value = true

    const pointerId = e.pointerId
    const target = e.currentTarget as HTMLElement | null
    if (target && typeof target.setPointerCapture === 'function') {
      try {
        target.setPointerCapture(pointerId)
      } catch {
        // Ignorer
      }
    }

    function onPointerMove(event: PointerEvent) {
      if (event.pointerId !== pointerId) return

      const deltaX = event.clientX - startPointerX
      const deltaY = event.clientY - startPointerY

      const deltaRelX = deltaX / containerWidth
      const deltaRelY = deltaY / containerHeight

      // Bornes maximales permises pour ne pas déborder de la page
      const maxRelWidth = Math.max(minWidth, 1 - initialBounds.relX)
      const maxRelHeight = Math.max(minHeight, 1 - initialBounds.relY)

      let nextRelWidth = initialBounds.relWidth + deltaRelX
      let nextRelHeight = initialBounds.relHeight + deltaRelY

      const preserveRatio = shouldPreserveRatio || event.shiftKey

      if (preserveRatio) {
        // Facteur d'échelle basé sur l'axe prédominant de déplacement
        const scaleX = (initialBounds.relWidth + deltaRelX) / initialBounds.relWidth
        const scaleY = (initialBounds.relHeight + deltaRelY) / initialBounds.relHeight
        const scale = Math.abs(deltaRelX) >= Math.abs(deltaRelY) ? scaleX : scaleY

        nextRelWidth = initialBounds.relWidth * Math.max(0.1, scale)
        nextRelHeight = nextRelWidth / initialAspect

        // Respect des dimensions minimales
        if (nextRelWidth < minWidth) {
          nextRelWidth = minWidth
          nextRelHeight = nextRelWidth / initialAspect
        }
        if (nextRelHeight < minHeight) {
          nextRelHeight = minHeight
          nextRelWidth = nextRelHeight * initialAspect
        }

        // Respect des dimensions maximales (limites de page)
        if (nextRelWidth > maxRelWidth) {
          nextRelWidth = maxRelWidth
          nextRelHeight = nextRelWidth / initialAspect
        }
        if (nextRelHeight > maxRelHeight) {
          nextRelHeight = maxRelHeight
          nextRelWidth = nextRelHeight * initialAspect
        }
      } else {
        // Redimensionnement libre borné
        nextRelWidth = Math.max(minWidth, Math.min(maxRelWidth, nextRelWidth))
        nextRelHeight = Math.max(minHeight, Math.min(maxRelHeight, nextRelHeight))
      }

      options.onUpdate?.({
        relX: initialBounds.relX,
        relY: initialBounds.relY,
        relWidth: nextRelWidth,
        relHeight: nextRelHeight
      })
    }

    function onPointerUp(event: PointerEvent) {
      if (event.pointerId !== pointerId) return

      cleanup()

      if (target && typeof target.releasePointerCapture === 'function') {
        try {
          const hasCapture =
            typeof target.hasPointerCapture === 'function'
              ? target.hasPointerCapture(pointerId)
              : true
          if (hasCapture) {
            target.releasePointerCapture(pointerId)
          }
        } catch {
          // Ignorer
        }
      }

      isResizing.value = false
      const current = options.getBounds()
      options.onResizeEnd?.({ relWidth: current.relWidth, relHeight: current.relHeight })
    }

    function cleanup() {
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
      window.removeEventListener('pointercancel', onPointerUp)
      activeCleanups.delete(cleanup)
    }

    activeCleanups.add(cleanup)
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
    window.addEventListener('pointercancel', onPointerUp)
  }

  return {
    isDragging,
    isResizing,
    startDrag,
    startResize
  }
}
