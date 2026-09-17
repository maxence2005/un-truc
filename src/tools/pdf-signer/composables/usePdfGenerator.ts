import { ref } from 'vue'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import type { Annotation, SignatureAnnotation, TextAnnotation } from '../types'

/**
 * Convertit une chaîne hexadécimale (ex: #000000 ou #0000aa) en objet Color RGB pour pdf-lib.
 */
function parseHexColor(hex: string) {
  let clean = hex.replace('#', '').trim()
  if (clean.length === 3) {
    clean = clean.split('').map((c) => c + c).join('')
  }
  if (clean.length !== 6) {
    return rgb(0, 0, 0)
  }
  const r = parseInt(clean.substring(0, 2), 16) / 255
  const g = parseInt(clean.substring(2, 4), 16) / 255
  const b = parseInt(clean.substring(4, 6), 16) / 255
  return rgb(isNaN(r) ? 0 : r, isNaN(g) ? 0 : g, isNaN(b) ? 0 : b)
}

/**
 * Décode une chaîne Data URL base64 (image PNG) en un tableau d'octets Uint8Array.
 */
function dataUrlToUint8Array(dataUrl: string): Uint8Array {
  const commaIndex = dataUrl.indexOf(',')
  const base64 = commaIndex !== -1 ? dataUrl.slice(commaIndex + 1) : dataUrl
  const binaryString = atob(base64)
  const len = binaryString.length
  const bytes = new Uint8Array(len)
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  return bytes
}

/**
 * Génère un document PDF binaire contenant les annotations incrustées
 * avec projection mathématique des coordonnées normalisées vers l'espace PDF.
 *
 * @param originalBytes Buffer binaire du PDF d'origine
 * @param annotations Liste des annotations apposées
 * @returns Octets du PDF signé généré (Uint8Array)
 */
export async function generateSignedPdf(
  originalBytes: ArrayBuffer,
  annotations: Annotation[]
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(originalBytes)
  const pages = pdfDoc.getPages()

  let helveticaFont: any = null
  const hasTextOrDate = annotations.some(
    (ann) => ann.type === 'text' || ann.type === 'date'
  )
  if (hasTextOrDate) {
    helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica)
  }

  for (const ann of annotations) {
    if (ann.pageNumber < 1 || ann.pageNumber > pages.length) {
      continue
    }

    const page = pages[ann.pageNumber - 1]
    if (!page) {
      continue
    }
    const pageWidth = page.getWidth()
    const pageHeight = page.getHeight()

    const targetX = ann.relX * pageWidth
    const targetWidth = ann.relWidth * pageWidth
    const targetHeight = ann.relHeight * pageHeight
    // Inversion de l'axe Y : le DOM utilise l'origine en haut à gauche, le PDF en bas à gauche
    const targetY = pageHeight - ann.relY * pageHeight - targetHeight

    if (targetWidth <= 0 || targetHeight <= 0) {
      continue
    }

    if (ann.type === 'signature') {
      try {
        const signatureAnn = ann as SignatureAnnotation
        const imageBytes = dataUrlToUint8Array(signatureAnn.imageDataUrl)
        const embeddedImage = await pdfDoc.embedPng(imageBytes)

        page.drawImage(embeddedImage, {
          x: targetX,
          y: targetY,
          width: targetWidth,
          height: targetHeight
        })
      } catch (err) {
        console.error('Erreur lors de l\'incrustation de la signature :', err)
      }
    } else if (ann.type === 'text' || ann.type === 'date') {
      const textAnn = ann as TextAnnotation
      if (!textAnn.content || textAnn.content.trim() === '') {
        continue
      }

      if (!helveticaFont) {
        helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica)
      }

      let fontSize = textAnn.fontSizeRatio
        ? textAnn.fontSizeRatio * pageHeight
        : targetHeight * 0.6

      fontSize = Math.min(fontSize, targetHeight * 0.85)
      fontSize = Math.max(fontSize, 6)

      const fontHeight = helveticaFont.heightAtSize(fontSize, { descender: true })
      const ascender = helveticaFont.heightAtSize(fontSize, { descender: false })
      const descender = fontHeight - ascender

      // Centrage vertical du texte dans le cadre de l'annotation
      const yText = targetY + targetHeight / 2 - (ascender - descender) / 2
      const xText = targetX + Math.min(targetWidth * 0.05, 4)

      try {
        page.drawText(textAnn.content, {
          x: xText,
          y: yText,
          size: fontSize,
          font: helveticaFont,
          color: parseHexColor(textAnn.color || '#000000'),
          maxWidth: Math.max(targetWidth - Math.min(targetWidth * 0.05, 4) * 2, 10),
          lineHeight: fontSize * 1.2
        })
      } catch (err) {
        console.error('Erreur lors de l\'incrustation du texte :', err)
      }
    }
  }

  return await pdfDoc.save()
}

/**
 * Déclenche le téléchargement local instantané d'un document PDF généré
 * via un objet Blob temporaire et un lien programmatique.
 *
 * @param pdfBytes Octets binaires du document PDF
 * @param filename Nom du fichier sauvegardé (défaut : document-signe.pdf)
 */
export function downloadPdf(
  pdfBytes: Uint8Array,
  filename: string = 'document-signe.pdf'
): void {
  const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  setTimeout(() => {
    URL.revokeObjectURL(url)
  }, 1000)
}

/**
 * Composable réactif facilitant l'intégration de la génération et de l'export PDF.
 */
export function usePdfGenerator() {
  const isGenerating = ref<boolean>(false)
  const error = ref<string | null>(null)

  async function generate(
    originalBytes: ArrayBuffer,
    annotations: Annotation[]
  ): Promise<Uint8Array> {
    isGenerating.value = true
    error.value = null

    try {
      return await generateSignedPdf(originalBytes, annotations)
    } catch (err: any) {
      error.value = err?.message || 'Erreur lors de la génération du document PDF signé.'
      throw err
    } finally {
      isGenerating.value = false
    }
  }

  return {
    isGenerating,
    error,
    generateSignedPdf: generate,
    downloadPdf
  }
}
