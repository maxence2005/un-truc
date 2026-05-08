# Un Truc - La Boîte à Outils Rétro-Uncanny

Bienvenue dans **Un Truc**, une boîte à outils web minimaliste au design system unique : le **"90s Cartoon Glitch"**. 

Ce projet mélange l'esthétique utilitaire des systèmes d'exploitation des années 90 (type Windows 95) avec un univers cartoonesque et des effets de "glitch" visuels.

## Fonctionnalités

- **Design System Néobrutaliste** : Bordures épaisses, ombres pleines, coins carrés et palette de couleurs beige/bleu profond.
- **Effets Glitch** : Animations de texte cyan/rouge lors des interactions.
- **Catalogue d'Outils** : Une interface modulaire permettant d'ajouter et de lancer divers utilitaires.
- **Responsive** : Adapté aux écrans modernes tout en gardant son âme rétro.
- **Pages Intégrées** : Mentions légales sérieuses, politique de confidentialité (RGPD) et page de contact.

## Outils Disponibles

- **Encodeur/Décodeur Base64** : Un utilitaire simple pour manipuler vos chaînes de caractères.
- *(D'autres outils à venir...)*

## Installation & Développement

### Prérequis
- Node.js (version 20.19.0 ou supérieure préconisée)
- npm

### Installation des dépendances
```sh
npm install
```

### Lancer le serveur de développement
```sh
npm run dev
```

### Compiler pour la production
```sh
npm run build
```

## 🏗️ Architecture

Le projet suit un pattern de séparation entre la **logique (le cerveau)** et l'**interface (le dessin)** :

- **Façade (`useAppFacade.ts`)** : Centralise l'état global et les méthodes métier (ex: presse-papier, gestion des pop-ups).
- **Composants Visuels** : Restent purement déclaratifs et utilisent la façade pour interagir avec le système.

### Utilisation de la Pop-up Globale

N'importe quel composant ou outil peut afficher une alerte système sans gérer de HTML/CSS localement :

```typescript
import { useAppFacade } from '@/composables/useAppFacade'
const { showPopup } = useAppFacade()

showPopup("Attention !", "Ceci est un message système important.")
```

## Technologies

- [Vue 3](https://vuejs.org/) (Composition API)
- [Vite](https://vite.dev/)
- [Sass (SCSS)](https://sass-lang.com/)
- [TypeScript](https://www.typescriptlang.org/)
- [Vue Router](https://router.vuejs.org/)

## Licence

Ce projet est distribué sous la **Apache License, Version 2.0**. Voir le fichier `LICENSE` pour plus de détails.

---
© 2026 UN TRUC - TOUS DROITS RÉSERVÉS
Contact : [contact@un-truc.fr](mailto:contact@un-truc.fr)
