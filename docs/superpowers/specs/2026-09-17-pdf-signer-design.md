# Spécification Technique & Design : Module de Signature Électronique ("Signeur de PDF")

**Date :** 17 Septembre 2026  
**Auteur :** Antigravity & Maxence  
**Statut :** En attente de relecture (Plannotator)  
**Chemin du module :** `src/tools/pdf-signer/`  

---

## 1. Contexte & Objectifs

### 1.1 Contexte du projet
Le projet **UN TRUC** est une boîte à outils web modulaire, développée en **Vue 3**, **TypeScript** et **Vite**, avec une esthétique rétro-informatique soignée (style console système `C:\SYSTEM\...`). Le site est hébergé de manière statique sur une offre mutualisée OVH (espace maximal alloué de 500 Mo), sans serveur d'application Node.js ni base de données.

### 1.2 Objectif principal
Fournir un module autonome permettant à un utilisateur d'importer un document PDF, d'y apposer directement sa signature manuscrite (tracée au doigt, au stylet ou à la souris) ou une image de signature, ainsi que la date du jour et des mentions textuelles personnalisées, puis de télécharger instantanément le PDF signé sans aucune perte de qualité vectorielle.

### 1.3 Objectif secondaire : Amélioration responsive globale
Améliorer l'ergonomie mobile et tablette de l'ensemble du site web (gestion des hauteurs dynamiques de viewport, adaptation des conteneurs rétro, suppression des débordements horizontaux).

---

## 2. Périmètre (Scope) & Exclusions (Non-Goals)

### Inclus dans le périmètre (In-Scope)
- **Traitement 100 % côté client (Client-side sandbox) :** Aucun transfert de fichier sur un serveur externe. Tout le traitement se déroule dans la mémoire vive du navigateur.
- **Importation de PDF :** Drag-and-drop ou sélecteur de fichier avec validation du type MIME `application/pdf`.
- **Rendu visuel adaptatif :**
  - Mode défilement continu vertical par défaut pour les documents courts (≤ 5 pages).
  - Mode pagination avec champ de saut direct `< [ N ] / Total >` pour les documents longs (> 5 pages).
  - Bascule manuelle possible entre les deux modes.
- **Création de signature :**
  - Tracé manuscrit direct sur canvas HTML5 optimisé avec lissage et support tactile unifié via `PointerEvents`.
  - Importation d'une image de signature (format PNG avec transparence).
  - Choix de couleur d'encre (Noir `#000000` ou Bleu encre `#0000aa`).
- **Champs additionnels :**
  - Date du jour (format automatique configurable).
  - Champ de texte libre personnalisable (ex : "Lu et approuvé", nom, fonction).
- **Manipulation directe :**
  - Déplacement fluide au doigt ou à la souris sur la page avec contrainte aux bordures de la feuille.
  - Poignée de redimensionnement proportionnel sur le coin inférieur droit.
  - Bouton de suppression `✕`.
- **Génération & Export vectoriel :**
  - Incrustation des éléments dans les octets du PDF via `pdf-lib`.
  - Téléchargement immédiat et libération de la mémoire vive.
- **Barre d'action épurée :**
  - Boutons textuels clairs sans émojis (`SIGNER`, `DATE`, `TEXTE`, `TÉLÉCHARGER LE PDF SIGNÉ`).
- **Mise à jour et sécurité npm :**
  - Correction des 8 vulnérabilités signalées par `npm audit`.

### Exclu du périmètre (Non-Goals)
- Signature avec certificat cryptographique X.509 qualifié eIDAS (nécessiterait une infrastructure d'autorité de certification).
- Mode multi-signataires avec envoi par e-mail (incompatible avec l'hébergement statique sans backend).
- Cases à cocher ou formulaires interactifs complexes AcroForms.

---

## 3. Architecture Logicielle & Découpage

Le module s'intègre via la découverte dynamique de Vite dans `src/tools/pdf-signer/` :

```text
src/tools/pdf-signer/
├── config.ts                         # Enregistrement ToolConfig (id, nom, icône, composant)
├── PdfSignerTool.vue                 # Composant racine du module (orchestrateur d'état)
├── types.ts                          # Interfaces TypeScript (Annotation, PageMetrics, ToolMode)
├── components/
│   ├── PdfDropZone.vue               # Zone d'importation rétro (drag & drop / bouton parcourir)
│   ├── PdfViewer.vue                 # Visualiseur de pages PDF avec gestion du mode scroll/paginé
│   ├── PdfPageItem.vue               # Rendu d'une page individuelle (Canvas + Calque d'annotation)
│   ├── PdfOverlayLayer.vue           # Calque transparent contenant les éléments interactifs
│   ├── DraggableAnnotation.vue       # Élément déplaçable/redimensionnable avec poignées tactiles
│   ├── SignatureModal.vue            # Modale rétro de tracé manuscrit ou upload PNG
│   └── SignerActionBar.vue           # Barre d'actions textuelle (desktop en haut, mobile en bas)
└── composables/
    ├── useSignatureCanvas.ts         # Logique du tracé canvas 100% natif (zéro dépendance tierce)
    ├── usePdfRenderer.ts             # Wrapper d'initialisation et de rendu avec pdfjs-dist
    ├── usePdfGenerator.ts            # Calcul de projection 2D et génération du PDF avec pdf-lib
    └── usePointerDrag.ts             # Gestionnaire unifié du glisser/redimensionner au doigt/souris
```

---

## 4. Modèle de Données & Types TypeScript

```typescript
export type AnnotationType = 'signature' | 'date' | 'text'

export interface BaseAnnotation {
  id: string
  type: AnnotationType
  pageNumber: number // 1-indexed
  // Ratios relatifs normalisés (de 0.0 à 1.0) par rapport à la taille de la page
  relX: number
  relY: number
  relWidth: number
  relHeight: number
}

export interface SignatureAnnotation extends BaseAnnotation {
  type: 'signature'
  imageDataUrl: string // Image PNG en base64
}

export interface TextAnnotation extends BaseAnnotation {
  type: 'text' | 'date'
  content: string
  fontSizeRatio: number
  color: string
}

export type Annotation = SignatureAnnotation | TextAnnotation

export interface PageDimension {
  pageNumber: number
  widthPoints: number   // Largeur intrinsèque PDF (ex: 595.28)
  heightPoints: number  // Hauteur intrinsèque PDF (ex: 841.89)
  aspectRatio: number
}
```

---

## 5. Algorithme de Projection & Intégration PDF (`usePdfGenerator.ts`)

### 5.1 Les deux repères
1. **Repère Navigateur (DOM) :**
   - Origine $(0, 0)$ en haut à gauche de la page affichée.
   - $Y$ augmente vers le bas.
2. **Repère PDF (`pdf-lib`) :**
   - Origine $(0, 0)$ en bas à gauche de la page.
   - $Y$ augmente vers le haut.

### 5.2 Formule de conversion géométrique
Pour chaque annotation placée sur la page $P$ ayant pour dimensions intrinsèques $(W_{pdf}, H_{pdf})$ :

$$X_{pdf} = \text{relX} \times W_{pdf}$$
$$\text{Largeur}_{pdf} = \text{relWidth} \times W_{pdf}$$
$$\text{Hauteur}_{pdf} = \text{relHeight} \times H_{pdf}$$
$$Y_{pdf} = H_{pdf} - (\text{relY} \times H_{pdf}) - \text{Hauteur}_{pdf}$$

Cette méthode garantit une fidélité absolue quel que soit le zoom de l'utilisateur, l'orientation de son écran ou la taille de la fenêtre.

---

## 6. Sécurité & Audit des Dépendances

### 6.1 Dépendances externes ajoutées
1. **`pdf-lib`** (version stable) : Manipulation binaire du PDF en TypeScript pur. Zéro dépendance réseau.
2. **`pdfjs-dist`** (version stable Mozilla) : Rendu des pages sous forme de canvas HTML5. Worker isolé.

### 6.2 Aucun paquet tiers pour la signature
Le tracé manuscrit est implémenté nativement dans `useSignatureCanvas.ts` via les API standard HTML5 :
- Utilisation de `PointerEvent` (`pointerdown`, `pointermove`, `pointerup`).
- Propriété CSS `touch-action: none` sur le canvas pour bloquer le défilement tactile natif pendant la signature.
- Traçage lissé par interpolation quadratique des points (`ctx.quadraticCurveTo`).

### 6.3 Nettoyage des vulnérabilités actuelles
- Exécution de `npm audit fix` pour mettre à jour les packages de build vulnérables (`vite`, `postcss`, `nanoid`, etc.).
- Validation systématique via `npm run type-check` et `npm run build`.

---

## 7. Améliorations Responsive du Site Global

1. **Correction du viewport mobile dans `App.vue` :**
   - Remplacement de `min-height: 100vh` par `min-height: 100dvh` afin d'éviter les sursauts d'affichage lorsque la barre d'adresse du navigateur mobile apparaît ou disparaît.
2. **Adaptation des fenêtres rétro (`HomeView.vue`) :**
   - Titre "UN TRUC" et sous-titres adaptés avec `clamp()` pour éviter le débordement sur les écrans étroits (iPhone SE, etc.).
   - Marges et paddings réduits de 32px à 16px sur mobiles.
3. **Cibles tactiles :**
   - Tous les boutons et éléments interactifs respecteront une surface minimale de contact de 44×44 pixels conformément aux recommandations d'accessibilité mobile WCAG.

---

## 8. Stratégie de Test et Validation

1. **Tests manuels et validation utilisateur (réalisés par Maxence) :**
   - **Test tactile & mobile :** Vérification sur appareils et émulateur tactile (fluidité du tracé, absence de sauts de défilement, manipulation directe au doigt).
   - **Validation visuelle & ergonomique :** Vérification de l'alignement, du rendu net des signatures, dates et textes sur les pages du PDF exporté.
2. **Contrôles automatisés :**
   - Validation du type-checking TypeScript sans régression (`npm run type-check`).
   - Validation du build de production Vite (`npm run build`).
