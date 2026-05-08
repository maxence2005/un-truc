<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<template>
  <main class="page-view">
    <div class="window-box page-window">
      <header class="window-header">
        <span class="window-title">C:\SYSTEM\PRIVACY.TXT</span>
        <div class="window-controls">
          <div class="control-box"></div>
          <div class="control-box"></div>
          <RouterLink to="/" class="control-box close-btn" title="Fermer"></RouterLink>
        </div>
      </header>
      <div class="page-content">
        <h1 class="glitch-text-permanent">Politique de Confidentialité</h1>
        
        <p class="intro"><em>Dernière mise à jour : Mai 2026</em></p>

        <section class="philosophy">
          <p>Bienvenue sur notre Boîte à Outils. Notre philosophie est simple : <strong>ce qui se passe sur votre ordinateur reste sur votre ordinateur.</strong> Nous avons conçu ce site pour qu'il fonctionne de manière autonome dans votre navigateur. Nous ne collectons, ne revendons et ne stockons aucune donnée personnelle.</p>
        </section>

        <hr class="dashed-divider" />

        <section>
          <h2>1. Données personnelles et Base de données</h2>
          <p>Ce site ne possède <strong>aucune base de données centralisée</strong>. Lorsque vous utilisez nos outils, tous les calculs et traitements sont effectués <strong>localement</strong>, directement par la mémoire de votre propre navigateur (Front-end). Aucune de vos saisies n'est envoyée sur nos serveurs.</p>
        </section>

        <section>
          <h2>2. Outils Collaboratifs (Temps Réel & P2P)</h2>
          <p>Nos outils collaboratifs en direct utilisent la technologie <strong>WebRTC (Peer-to-Peer)</strong> via la bibliothèque PeerJS.</p>
          <ul>
            <li><strong>Aucun historique :</strong> Vos messages et dessins transitent directement de votre ordinateur à celui de votre interlocuteur. Ils sont chiffrés de bout en bout et ne sont jamais stockés sur un serveur. Une fois la page fermée, tout disparaît définitivement.</li>
            <li><strong>Serveur d'entremise (Signaling) :</strong> Pour permettre à vos deux ordinateurs de se trouver, nous utilisons le serveur public gratuit de PeerJS. Ce serveur traite uniquement les adresses IP le temps d'établir la connexion, mais n'a techniquement pas accès au contenu de vos communications.</li>
          </ul>
        </section>

        <section>
          <h2>3. Cookies et Stockage Local (Local Storage)</h2>
          <p>Nous n'utilisons <strong>aucun cookie publicitaire ou de suivi (tracking)</strong>. Pour améliorer votre expérience, certains outils peuvent utiliser la fonction <code>localStorage</code> de votre navigateur. Ces données restent sur votre disque dur et nous n'y avons pas accès.</p>
        </section>

        <section>
          <h2>4. Hébergement et Journaux de connexion (Logs)</h2>
          <p>Ce site web est hébergé en France par <strong>OVHcloud</strong>. Conformément à la législation française et européenne, notre hébergeur est tenu de conserver les journaux de connexion (logs) contenant les adresses IP des visiteurs pour une durée légale d'un an, à des fins de sécurité et de maintenance du réseau.</p>
        </section>

        <section>
          <h2>5. Vos droits (RGPD)</h2>
          <p>Puisque nous ne collectons et ne stockons aucune donnée personnelle vous concernant, nous n'avons rien à vous renvoyer ou à supprimer ! Toutefois, pour toute question technique ou légale concernant le fonctionnement du site, vous pouvez nous contacter à l'adresse suivante : <strong>contact@un-truc.fr</strong>.</p>
        </section>
        
        <div class="back-link">
          <RouterLink to="/" class="btn-launch">
            <span class="material-symbols-outlined">arrow_back</span> RETOUR
          </RouterLink>
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped lang="scss">
@use "@/assets/styles/variables" as *;
@use "@/assets/styles/mixins" as *;

.page-view {
  padding: 32px;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 100vh;
}

.window-box {
  @include window-box;
  width: 100%;
  max-width: 800px;
}

.window-header {
  background-color: $header-blue;
  border-bottom: $border-width solid $black;
  padding: 4px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.window-title {
  color: $white;
  font-size: 0.875rem;
  font-weight: bold;
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
  
  &.close-btn {
    cursor: pointer;
    &:hover {
      background-color: $glitch-red;
    }
  }
}

.page-content {
  padding: 32px;

  h1 {
    font-size: 2.5rem;
    margin-bottom: 16px;
    text-transform: uppercase;
    @include glitch-effect;
  }

  .intro {
    font-size: 0.875rem;
    margin-bottom: 24px;
    color: #666;
  }

  .philosophy {
    background-color: rgba(0,0,0,0.05);
    padding: 16px;
    border: 1px dashed $black;
    margin-bottom: 24px;
  }

  h2 {
    font-size: 1.25rem;
    margin-top: 24px;
    margin-bottom: 12px;
    text-transform: uppercase;
  }

  p {
    margin-bottom: 16px;
    line-height: 1.6;
  }

  ul {
    margin-bottom: 16px;
    padding-left: 20px;
    li {
      margin-bottom: 8px;
      line-height: 1.5;
    }
  }

  section {
    margin-bottom: 24px;
  }
}

.dashed-divider {
  border: none;
  border-top: 2px dashed $black;
  margin: 24px 0;
}

.back-link {
  margin-top: 48px;
  border-top: 2px dashed $black;
  padding-top: 24px;
  display: flex;
  justify-content: center;
}

.btn-launch {
  border: $border-width solid $black;
  padding: 8px 16px;
  background-color: $white;
  font-weight: bold;
  font-size: 0.875rem;
  box-shadow: 3px 3px 0px 0px $black;
  transition: background-color 0.1s, color 0.1s;
  @include inset-shadow-active;
  display: flex;
  align-items: center;
  gap: 8px;

  &:hover {
    background-color: $black;
    color: $white;
    @include glitch-effect;
    text-shadow: -1px 0px 0px $glitch-cyan, 1px 0px 0px $glitch-red;
  }
}
</style>
