/**
 * Types d'annotations supportés par le module de signature de PDF.
 */
export type AnnotationType = 'signature' | 'date' | 'text'

/**
 * Propriétés communes à toutes les annotations apposées sur un document.
 * Les coordonnées et dimensions sont normalisées sous forme de ratios (de 0.0 à 1.0)
 * relatifs aux dimensions de la page ciblée.
 */
export interface BaseAnnotation {
  id: string
  type: AnnotationType
  pageNumber: number // 1-indexed
  relX: number       // Position relative X (0 = gauche, 1 = droite)
  relY: number       // Position relative Y (0 = haut de page DOM, 1 = bas de page DOM)
  relWidth: number   // Largeur relative normalisée
  relHeight: number  // Hauteur relative normalisée
}

/**
 * Annotation représentant une signature manuscrite (image PNG avec transparence).
 */
export interface SignatureAnnotation extends BaseAnnotation {
  type: 'signature'
  imageDataUrl: string // Image PNG encodée en base64 (data:image/png;base64,...)
}

/**
 * Annotation textuelle (texte libre ou date du jour).
 */
export interface TextAnnotation extends BaseAnnotation {
  type: 'text' | 'date'
  content: string
  fontSizeRatio: number // Ratio de la taille de police relatif à la hauteur de page
  color: string        // Couleur hexadécimale (ex: #000000)
}

/**
 * Union discriminée des types d'annotations possibles.
 */
export type Annotation = SignatureAnnotation | TextAnnotation

/**
 * Dimensions intrinsèques et ratio d'aspect d'une page PDF.
 */
export interface PageDimension {
  pageNumber: number   // 1-indexed
  widthPoints: number  // Largeur PDF en points typographiques
  heightPoints: number // Hauteur PDF en points typographiques
  aspectRatio: number  // Ratio largeur / hauteur
}

/**
 * Mode d'affichage du visualiseur de documents PDF.
 */
export type ViewerMode = 'scroll' | 'paginated'
