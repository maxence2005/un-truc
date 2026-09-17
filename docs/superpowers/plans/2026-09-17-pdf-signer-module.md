# Plan d'Implémentation : Module de Signature Électronique ("Signeur de PDF")

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Créer un module 100% front-end de signature électronique de PDF (style DocuSeal sans backend), permettant l'import de PDF, la signature manuscrite tactile/souris et par image, l'ajout de date et texte, la manipulation par glisser-déposer relatif et l'export PDF vectoriel, tout en améliorant la réactivité mobile du site.

**Architecture:** Architecture modulaire Vue 3 + TypeScript intégrée via `src/tools/pdf-signer/`. Utilise `pdfjs-dist` pour le rendu canvas adaptatif (défilement continu ou paginé avec saut direct), un moteur interne de signature et de drag & drop tactile en `PointerEvents` sans dépendance tierce, et `pdf-lib` pour l'incrustation vectorielle des annotations avec conversion mathématique des coordonnées DOM vers repère PDF.

**Tech Stack:** Vue 3 (Composition API, `<script setup>`), TypeScript, Vite, SCSS (variables & mixins rétro du projet), `pdfjs-dist`, `pdf-lib`, PointerEvents API standard HTML5.

**Spec:** [`docs/superpowers/specs/2026-09-17-pdf-signer-design.md`](file:///home/maxence/un-truc/docs/superpowers/specs/2026-09-17-pdf-signer-design.md)

## Global Constraints
- Aucune requête serveur ni backend : traitement 100% dans la RAM du navigateur.
- Deux seules dépendances externes autorisées : `pdf-lib` et `pdfjs-dist`.
- Zéro bibliothèque externe pour le canvas de signature (composables internes uniquement).
- Aucun émoji dans les boutons d'action (libellés textuels stricts style rétro système).
- Conservation scrupuleuse de la charte graphique rétro PC (`C:\SYSTEM\...`, `window-box`, variables SCSS).
- Validation manuelle tactile et visuelle effectuée directement par l'utilisateur (Maxence).

---

### Task 1: Audit de sécurité et assainissement des dépendances actuelles

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`

**Interfaces:**
- Consumes: Configuration actuelle de `package.json`
- Produces: Base saine de dépendances avec les vulnérabilités de build patchées

- [ ] **Step 1: Exécuter npm audit fix**
Run: `npm audit fix`
Expected: Mise à jour automatique des dépendances vulnérables compatibles (Vite, PostCSS, etc.).

- [ ] **Step 2: Vérifier l'état de l'audit**
Run: `npm audit`
Expected: Réduction significative ou élimination complète des alertes critiques/hautes.

- [ ] **Step 3: Vérifier que le projet compile toujours sans erreur**
Run: `npm run type-check && npm run build-only`
Expected: Sortie réussie sans erreur TypeScript ni erreur de build.

- [ ] **Step 4: Commit**
```bash
git add package.json package-lock.json
git commit -m "fix(security): resolve npm audit vulnerabilities on dev dependencies"
```

---

### Task 2: Installation sécurisée de `pdf-lib` et `pdfjs-dist`

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`

**Interfaces:**
- Consumes: npm registry officiel
- Produces: Bibliothèques `pdf-lib` et `pdfjs-dist` installées

- [ ] **Step 1: Installer les deux dépendances officielles vérifiées**
Run: `npm install pdf-lib pdfjs-dist`
Expected: Installation propre des 2 packages.

- [ ] **Step 2: Contrôle d'audit post-installation**
Run: `npm audit`
Expected: Aucune nouvelle vulnérabilité introduite.

- [ ] **Step 3: Vérifier le build**
Run: `npm run type-check && npm run build-only`
Expected: Build Vite réussi.

- [ ] **Step 4: Commit**
```bash
git add package.json package-lock.json
git commit -m "feat(deps): add pdf-lib and pdfjs-dist dependencies"
```

---

### Task 3: Modèle de types TypeScript & Découverte automatique du Tool

**Files:**
- Create: `src/tools/pdf-signer/types.ts`
- Create: `src/tools/pdf-signer/config.ts`
- Create: `src/tools/pdf-signer/PdfSignerTool.vue`

**Interfaces:**
- Consumes: `ToolConfig` depuis `@/types`
- Produces: Déclaration de l'outil `pdf-signer` avec auto-enregistrement dans le routeur et la page d'accueil

- [ ] **Step 1: Créer le fichier des types `src/tools/pdf-signer/types.ts`**
Définir les interfaces : `AnnotationType`, `BaseAnnotation`, `SignatureAnnotation`, `TextAnnotation`, `Annotation`, `PageDimension`, `ViewerMode`.

- [ ] **Step 2: Créer le fichier `src/tools/pdf-signer/config.ts`**
Configurer `id: 'pdf-signer'`, `name: 'Signeur de PDF'`, `description: 'Importez un document PDF, apposez votre signature et vos mentions, puis téléchargez le fichier signé instantanément.'`, `icon: 'draw'`, et le composant paresseux `PdfSignerTool.vue`.

- [ ] **Step 3: Créer la coquille initiale `src/tools/pdf-signer/PdfSignerTool.vue`**
Composant racine avec conteneur `.window-box` rétro, barre de titre `C:\SYSTEM\PDF_SIGN.EXE`.

- [ ] **Step 4: Vérifier le type-check et le build**
Run: `npm run type-check`
Expected: Aucune erreur TypeScript.

- [ ] **Step 5: Commit**
```bash
git add src/tools/pdf-signer/types.ts src/tools/pdf-signer/config.ts src/tools/pdf-signer/PdfSignerTool.vue
git commit -m "feat(pdf-signer): scaffold tool structure, config, and type definitions"
```

---

### Task 4: Moteur de signature manuscrite tactile natif (`useSignatureCanvas.ts`)

**Files:**
- Create: `src/tools/pdf-signer/composables/useSignatureCanvas.ts`

**Interfaces:**
- Consumes: Canvas HTML5 ref, PointerEvents natifs
- Produces: `initCanvas`, `startStroke`, `drawStroke`, `endStroke`, `clear`, `exportToPngDataUrl`, `isEmpty`, `strokeColor`

- [ ] **Step 1: Implémenter `useSignatureCanvas.ts`**
  - Gérer les événements de pointeur unifiés (`pointerdown`, `pointermove`, `pointerup`, `pointercancel`).
  - Gérer la résolution Retina / haute densité d'écrans (`window.devicePixelRatio`).
  - Lissage de tracé par interpolation (`quadraticCurveTo`).
  - Gestion des couleurs : noir (`#000000`) et bleu encre (`#0000aa`).
  - Fonction `exportToPngDataUrl()` générant un PNG transparent avec cadrage rogné ou dimension standard.
  - Fonction `clear()` pour réinitialiser le canvas.

- [ ] **Step 2: Vérifier le type-check**
Run: `npm run type-check`
Expected: Succès sans erreur.

- [ ] **Step 3: Commit**
```bash
git add src/tools/pdf-signer/composables/useSignatureCanvas.ts
git commit -m "feat(pdf-signer): implement native touch-friendly signature canvas composable"
```

---

### Task 5: Modale de signature (`SignatureModal.vue`)

**Files:**
- Create: `src/tools/pdf-signer/components/SignatureModal.vue`

**Interfaces:**
- Consumes: `useSignatureCanvas.ts`
- Produces: Événements `confirm(imageDataUrl: string)` et `close()`

- [ ] **Step 1: Créer le composant `SignatureModal.vue`**
  - Fenêtre modale avec style rétro (`.window-box`, titre `C:\SIGNATURE\INPUT.SYS`).
  - Onglet 1 "TRACER" : Canvas avec `touch-action: none`, sélecteur de couleur (Noir / Bleu), bouton `EFFACER`.
  - Onglet 2 "IMPORTER UNE IMAGE" : Sélecteur de fichier d'image PNG transparente avec prévisualisation.
  - Boutons d'action textuels : `ANNULER` et `VALIDER LA SIGNATURE`.

- [ ] **Step 2: Vérifier le type-check**
Run: `npm run type-check`
Expected: Succès.

- [ ] **Step 3: Commit**
```bash
git add src/tools/pdf-signer/components/SignatureModal.vue
git commit -m "feat(pdf-signer): add signature modal with drawing pad and image upload"
```

---

### Task 6: Rendu et Navigation PDF (`usePdfRenderer.ts`, `PdfDropZone.vue`, `PdfViewer.vue`, `PdfPageItem.vue`)

**Files:**
- Create: `src/tools/pdf-signer/composables/usePdfRenderer.ts`
- Create: `src/tools/pdf-signer/components/PdfDropZone.vue`
- Create: `src/tools/pdf-signer/components/PdfPageItem.vue`
- Create: `src/tools/pdf-signer/components/PdfViewer.vue`

**Interfaces:**
- Consumes: `pdfjs-dist`
- Produces: `pdfDocument`, `pageCount`, `renderPage(pageNumber, canvasRef)`, `viewerMode` (scroll vs paginated), saut direct de page

- [ ] **Step 1: Configurer `usePdfRenderer.ts`**
  - Configuration du worker `pdfjs-dist` avec import Vite (`pdfjs-dist/build/pdf.worker.min.mjs` ou url dynamique).
  - Chargement du document depuis `ArrayBuffer`.
  - Extraction du nombre de pages et dimensions intrinsèques de chaque page.

- [ ] **Step 2: Créer `PdfDropZone.vue`**
  - Zone glisser-déposer de fichier PDF et bouton `PARCOURIR LE DISQUE...`.
  - Contrôle d'extension et validation MIME.

- [ ] **Step 3: Créer `PdfPageItem.vue`**
  - Rendu d'une page sur son élément `<canvas>`.
  - Conteneur de calque pour accueillir les annotations futures.

- [ ] **Step 4: Créer `PdfViewer.vue`**
  - Logique adaptative : si `pageCount <= 5`, mode défilement par défaut ; si `pageCount > 5`, mode pagination par défaut.
  - Barre de pagination rétro : boutons `<` et `>`, et champ numérique directement éditable `< [ N ] / Total >`.
  - Commutateur manuel "VUE CONTINUE / VUE PAGINÉE".

- [ ] **Step 5: Vérifier le type-check et le build**
Run: `npm run type-check && npm run build-only`
Expected: Build réussi.

- [ ] **Step 6: Commit**
```bash
git add src/tools/pdf-signer/composables/usePdfRenderer.ts src/tools/pdf-signer/components/PdfDropZone.vue src/tools/pdf-signer/components/PdfPageItem.vue src/tools/pdf-signer/components/PdfViewer.vue
git commit -m "feat(pdf-signer): implement PDF rendering engine, dropzone, and adaptive viewer"
```

---

### Task 7: Calque d'annotation et manipulation directe (`usePointerDrag.ts`, `DraggableAnnotation.vue`, `PdfOverlayLayer.vue`)

**Files:**
- Create: `src/tools/pdf-signer/composables/usePointerDrag.ts`
- Create: `src/tools/pdf-signer/components/DraggableAnnotation.vue`
- Create: `src/tools/pdf-signer/components/PdfOverlayLayer.vue`

**Interfaces:**
- Consumes: Positions tactiles/souris, annotations réactives
- Produces: Déplacement fluide, redimensionnement au coin bas-droit, suppression `✕`, ratios relatifs normalisés

- [ ] **Step 1: Créer le composable `usePointerDrag.ts`**
  - Gestion du déplacement avec contraintes de bordures (ne pas sortir de la page).
  - Gestion du redimensionnement proportionnel depuis la poignée inférieure droite.
  - Conversion des coordonnées pixels en ratios relatifs normalisés (`relX`, `relY`, `relWidth`, `relHeight`).

- [ ] **Step 2: Créer le composant `DraggableAnnotation.vue`**
  - Affichage selon le type : image de signature, texte libre, date du jour.
  - Double-clic/tap pour éditer le texte en ligne pour les dates et champs texte.
  - Bouton `✕` de suppression en haut à droite.
  - Poignée de redimensionnement tactile en bas à droite.

- [ ] **Step 3: Créer `PdfOverlayLayer.vue`**
  - Calque transparent positionné en `absolute` exactement au-dessus du canvas de la page.
  - Gestion de la liste des annotations de la page.

- [ ] **Step 4: Vérifier le type-check**
Run: `npm run type-check`
Expected: Succès.

- [ ] **Step 5: Commit**
```bash
git add src/tools/pdf-signer/composables/usePointerDrag.ts src/tools/pdf-signer/components/DraggableAnnotation.vue src/tools/pdf-signer/components/PdfOverlayLayer.vue
git commit -m "feat(pdf-signer): implement touch direct manipulation layer for annotations"
```

---

### Task 8: Projection mathématique & Export PDF (`usePdfGenerator.ts`, `SignerActionBar.vue`, `PdfSignerTool.vue`)

**Files:**
- Create: `src/tools/pdf-signer/composables/usePdfGenerator.ts`
- Create: `src/tools/pdf-signer/components/SignerActionBar.vue`
- Modify: `src/tools/pdf-signer/PdfSignerTool.vue`

**Interfaces:**
- Consumes: Fichier PDF d'origine (`ArrayBuffer`), liste des annotations, `pdf-lib`
- Produces: PDF signé binaire et déclenchement du téléchargement local instantané

- [ ] **Step 1: Implémenter `usePdfGenerator.ts`**
  - Chargement du document avec `PDFDocument.load()`.
  - Pour chaque page et chaque annotation :
    - Calcul de $Y_{pdf} = H_{pdf} - (\text{relY} \times H_{pdf}) - \text{Hauteur}_{pdf}$.
    - Incrustation PNG via `embedPng` et `drawImage`.
    - Incrustation texte via police standard `StandardFonts.Helvetica` et `drawText`.
  - Sauvegarde `pdfDoc.save()` et génération du Blob pour téléchargement.

- [ ] **Step 2: Créer `SignerActionBar.vue`**
  - Boutons épurés sans aucun émoji : `SIGNER`, `DATE`, `TEXTE`, `NOUVEAU DOCUMENT`, et `TÉLÉCHARGER LE PDF SIGNÉ`.
  - Fixation sticky / basse sur mobile pour accès au pouce.

- [ ] **Step 3: Assembler dans `PdfSignerTool.vue`**
  - Orchestration complète des états (DropZone -> Viewer -> Modal -> Export).
  - Gestion des popups de confirmation ou d'erreur via `useAppFacade`.

- [ ] **Step 4: Vérifier le type-check et le build**
Run: `npm run type-check && npm run build-only`
Expected: Succès.

- [ ] **Step 5: Commit**
```bash
git add src/tools/pdf-signer/composables/usePdfGenerator.ts src/tools/pdf-signer/components/SignerActionBar.vue src/tools/pdf-signer/PdfSignerTool.vue
git commit -m "feat(pdf-signer): complete PDF generation, action bar, and root tool orchestration"
```

---

### Task 9: Améliorations responsive globales du site

**Files:**
- Modify: `src/App.vue`
- Modify: `src/views/HomeView.vue`
- Modify: `src/assets/styles/_variables.scss`

**Interfaces:**
- Consumes: Styles existants
- Produces: Affichage responsive parfait sur mobile et tablette

- [ ] **Step 1: Mettre à jour `src/App.vue`**
  - Utiliser `min-height: 100dvh` pour éviter les sauts de barre d'adresse mobile.

- [ ] **Step 2: Mettre à jour `src/views/HomeView.vue`**
  - Adapter le hero avec `clamp()` sur la taille du titre `UN TRUC` pour petits écrans.
  - Ajuster les paddings de grille pour les formats smartphone (< 480px).
  - Assurer des zones tactiles minimales de 44px sur les boutons de lancement.

- [ ] **Step 3: Vérifier le type-check et le build complet**
Run: `npm run type-check && npm run build`
Expected: Build de production réussi avec chunks optimisés.

- [ ] **Step 4: Commit**
```bash
git add src/App.vue src/views/HomeView.vue src/assets/styles/_variables.scss
git commit -m "style(responsive): improve mobile and tablet layout across entire app"
```

---

### Task 10: Vérification et recette finale par Maxence

**Interfaces:**
- Consumes: Application complète compilée
- Produces: Validation fonctionnelle, tactile et visuelle de l'utilisateur

- [ ] **Step 1: Lancer le serveur de développement**
Run: `npm run dev`
Expected: Serveur local Vite actif (généralement sur `http://localhost:5173`).

- [ ] **Step 2: Remettre la main à Maxence pour les tests manuels**
  - Tester l'import d'un PDF.
  - Tester la signature au doigt / à la souris et l'import d'image.
  - Tester le déplacement et le redimensionnement tactile.
  - Tester le saut direct de page.
  - Vérifier le PDF téléchargé.
  - Tester l'affichage mobile/tablette.
