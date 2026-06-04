<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { usePeerFacade } from '@/composables/usePeerFacade'
import { useAppFacade } from '@/composables/useAppFacade'
import IconSheep from '@/components/icons/IconSheep.vue'
import IconTiger from '@/components/icons/IconTiger.vue'

const route = useRoute()
const { copyToClipboard, showPopup } = useAppFacade()

// --- LOGIQUE DE LOBBY & RÔLE ---
const isHost = ref(!route.query.room)
const gamePhase = ref<'WAITING_P2P' | 'HOST_CHOOSING' | 'GUEST_WAITING' | 'PLAYING'>('WAITING_P2P')
const myRole = ref<'T' | 'M' | null>(null)

// --- ÉTAT DU JEU ---
const board = ref<(string | null)[][]>([
  ['T', null, null, null, 'T'],
  [null, null, null, null, null],
  [null, null, null, null, null],
  [null, null, null, null, null],
  ['T', null, null, null, 'T']
])

const currentTurn = ref<'T' | 'M'>('M')
const sheepToPlace = ref(20)
const capturedSheep = ref(0)
const selectedCell = ref<{r: number, c: number} | null>(null)
const winner = ref<string | null>(null)

const resetGameState = () => {
  board.value = [
    ['T', null, null, null, 'T'],
    [null, null, null, null, null],
    [null, null, null, null, null],
    [null, null, null, null, null],
    ['T', null, null, null, 'T']
  ]
  currentTurn.value = 'M'
  sheepToPlace.value = 20
  capturedSheep.value = 0
  selectedCell.value = null
  winner.value = null
}

// --- SYNC P2P ---
const {
  initPeer, sendData, isConnected, shareableLink, myPeerId
} = usePeerFacade((data) => {
  if (data.type === 'GAME_STATE') {
    board.value = data.board
    currentTurn.value = data.turn
    sheepToPlace.value = data.sheepToPlace
    capturedSheep.value = data.capturedSheep
    winner.value = data.winner
  } else if (data.type === 'ROLE_ASSIGN') {
    myRole.value = data.role
    gamePhase.value = 'PLAYING'
    showPopup('C\'EST PARTI', `Tu joues les ${data.role === 'T' ? 'TIGRES' : 'MOUTONS'}.`)
  }
})

onMounted(() => {
  initPeer()
})

watch(isConnected, (newVal) => {
  if (newVal) {
    if (gamePhase.value === 'WAITING_P2P') {
      gamePhase.value = isHost.value ? 'HOST_CHOOSING' : 'GUEST_WAITING'
    }
  } else {
    gamePhase.value = 'WAITING_P2P'
    myRole.value = null
    isHost.value = true // Le joueur qui reste devient le nouvel hôte
    resetGameState()    // Nettoyage du plateau
  }
})

const selectRole = (role: 'T' | 'M') => {
  if (gamePhase.value !== 'HOST_CHOOSING') return
  myRole.value = role
  gamePhase.value = 'PLAYING'
  
  // Assigner le rôle opposé à l'invité
  const guestRole = role === 'T' ? 'M' : 'T'
  sendData({ type: 'ROLE_ASSIGN', role: guestRole })
  showPopup('DÉMARRAGE', `Tu joues les ${role === 'T' ? 'TIGRES' : 'MOUTONS'}.`)
}

// --- REGLES DU JEU ---
const reloadGame = () => {
  window.location.reload()
}

// Helper to access board safely for TS
const getPiece = (r: number, c: number) => {
  return board.value[r]?.[c]
}

const setPiece = (r: number, c: number, val: string | null) => {
  const row = board.value[r]
  if (row) row[c] = val
}

const isValidMove = (fr: number, fc: number, tr: number, tc: number) => {
  const dr = Math.abs(fr - tr)
  const dc = Math.abs(fc - tc)
  if (dr > 1 || dc > 1) return false
  if (dr === 1 && dc === 1) return (fr + fc) % 2 === 0
  return true
}

const getJumpedSheep = (fr: number, fc: number, tr: number, tc: number) => {
  const dr = tr - fr
  const dc = tc - fc
  
  if (Math.abs(dr) === 2 && dc === 0) {
    const midR = fr + dr / 2
    if (getPiece(midR, fc) === 'M') return { r: midR, c: fc }
  }
  
  if (Math.abs(dc) === 2 && dr === 0) {
    const midC = fc + dc / 2
    if (getPiece(fr, midC) === 'M') return { r: fr, c: midC }
  }
  
  if (Math.abs(dr) === 2 && Math.abs(dc) === 2 && (fr + fc) % 2 === 0) {
    const midR = fr + dr / 2
    const midC = fc + dc / 2
    if (getPiece(midR, midC) === 'M') return { r: midR, c: midC }
  }
  
  return null
}

const canTigerMove = (r: number, c: number) => {
  for (let dr = -2; dr <= 2; dr++) {
    for (let dc = -2; dc <= 2; dc++) {
      const tr = r + dr, tc = c + dc
      if (tr < 0 || tr > 4 || tc < 0 || tc > 4 || (dr === 0 && dc === 0)) continue
      if (getPiece(tr, tc) !== null) continue
      if (isValidMove(r, c, tr, tc)) return true
      if (getJumpedSheep(r, c, tr, tc)) return true
    }
  }
  return false
}

const checkWin = () => {
  if (capturedSheep.value >= 5) return 'T'
  
  let tigersCanMove = false
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      if (getPiece(r, c) === 'T' && canTigerMove(r, c)) {
        tigersCanMove = true; break
      }
    }
    if (tigersCanMove) break
  }
  if (!tigersCanMove) return 'M'
  
  return null
}

// --- ACTIONS ---
const handleCellClick = (r: number, c: number) => {
  if (gamePhase.value !== 'PLAYING' || winner.value) return
  if (currentTurn.value !== myRole.value) return

  const piece = getPiece(r, c)

  // Placement des moutons
  if (myRole.value === 'M' && sheepToPlace.value > 0) {
    if (piece === null) {
      setPiece(r, c, 'M')
      sheepToPlace.value--
      endTurn()
    }
    return
  }

  // Sélection
  if (piece === myRole.value) {
    selectedCell.value = { r, c }
  } 
  // Déplacement
  else if (piece === null && selectedCell.value) {
    const { r: fr, c: fc } = selectedCell.value
    
    if (isValidMove(fr, fc, r, c)) {
      setPiece(r, c, myRole.value)
      setPiece(fr, fc, null)
      selectedCell.value = null
      endTurn()
    } else if (myRole.value === 'T') {
      const jumped = getJumpedSheep(fr, fc, r, c)
      if (jumped) {
        setPiece(r, c, 'T')
        setPiece(fr, fc, null)
        setPiece(jumped.r, jumped.c, null)
        capturedSheep.value++
        selectedCell.value = null
        endTurn()
      }
    }
  }
}

const endTurn = () => {
  winner.value = checkWin()
  currentTurn.value = currentTurn.value === 'T' ? 'M' : 'T'
  
  sendData({
    type: 'GAME_STATE',
    board: board.value,
    turn: currentTurn.value,
    sheepToPlace: sheepToPlace.value,
    capturedSheep: capturedSheep.value,
    winner: winner.value
  })
}

const copyLink = () => copyToClipboard(shareableLink.value)

watch(winner, (newWinner) => {
  if (newWinner) {
    const msg = newWinner === 'T' ? 'Les Tigres ont gagné !' : 'Les Moutons ont gagné !'
    showPopup('FIN DE PARTIE', msg)
  }
})
</script>

<template>
  <div class="game-tool">
    <div class="back-nav">
      <RouterLink to="/" class="btn-back">
        <span class="material-symbols-outlined">arrow_back</span> RETOUR
      </RouterLink>
    </div>

    <div class="window-box game-window">
      <header class="window-header">
        <span class="window-title">D:\GAMES\BAGH_CHAL.EXE</span>
        <div class="window-controls">
          <div class="control-box" :class="{ 'connected-led': isConnected }"></div>
          <div class="control-box"></div>
          <div class="control-box"></div>
        </div>
      </header>

      <div class="game-content">
        <!-- PHASE 1: ATTENTE ADVERSAIRE -->
        <div v-if="gamePhase === 'WAITING_P2P'" class="share-box window-box">
          <p class="role-announce">EN ATTENTE D'UN ADVERSAIRE</p>
          <p>Partage ce lien pour inviter un ami :</p>
          <div class="copy-field">
            <input type="text" :value="shareableLink" readonly class="share-input" />
            <button @click="copyLink" class="btn-copy">COPIER</button>
          </div>
        </div>

        <!-- PHASE 2: CHOIX DE L'HOTE -->
        <div v-else-if="gamePhase === 'HOST_CHOOSING'" class="lobby-box window-box">
          <h2 class="glitch-text">CHOISIS TON RÔLE</h2>
          <p class="lobby-subtitle">En tant que créateur, tu choisis en premier.</p>
          <div class="role-selector">
            <button class="role-btn btn-tiger" @click="selectRole('T')">
              <IconTiger class="lobby-icon" />
              TIGRES
            </button>
            <button class="role-btn btn-sheep" @click="selectRole('M')">
              <IconSheep class="lobby-icon" />
              MOUTONS
            </button>
          </div>
        </div>

        <!-- PHASE 3: ATTENTE DE L'INVITÉ -->
        <div v-else-if="gamePhase === 'GUEST_WAITING'" class="share-box window-box">
          <p class="role-announce">SALLE REJOINTE</p>
          <div class="waiting-anim">
            <IconSheep class="lobby-icon pulse" />
            <p>En attente que l'hôte choisisse les rôles...</p>
          </div>
        </div>

        <!-- PHASE 4: JEU EN COURS -->
        <div v-else-if="gamePhase === 'PLAYING'" class="game-ui">
          <div class="hud-panel window-box">
            <div class="hud-item" :class="{ 'active-turn': currentTurn === myRole }">
              TOI: <span :class="myRole">{{ myRole === 'T' ? 'TIGRES' : 'MOUTONS' }}</span>
            </div>
            <div class="hud-item stats">
              <div class="stat-line">MOUTONS À PLACER: {{ sheepToPlace }}</div>
              <div class="stat-line">MOUTONS CAPTURÉS: {{ capturedSheep }}/5</div>
            </div>
            <div class="hud-item" :class="{ 'active-turn': currentTurn !== myRole }">
              TOUR: <span :class="currentTurn">{{ currentTurn === 'T' ? 'TIGRES' : 'MOUTONS' }}</span>
            </div>
          </div>

          <div v-if="winner" class="winner-overlay">
            <div class="winner-box">
              <h2>VICTOIRE</h2>
              <p :class="winner">{{ winner === 'T' ? 'LES TIGRES' : 'LES MOUTONS' }} ONT GAGNÉ !</p>
              <button @click="reloadGame" class="btn-restart">REJOUER</button>
            </div>
          </div>

          <div class="board-wrapper">
            <!-- Background lines -->
            <svg class="board-lines" viewBox="0 0 400 400">
              <!-- Grid lines -->
              <line v-for="i in 5" :key="'h'+i" x1="50" :y1="50 + (i-1)*75" x2="350" :y2="50 + (i-1)*75" stroke="black" stroke-width="2" />
              <line v-for="i in 5" :key="'v'+i" :x1="50 + (i-1)*75" y1="50" :x2="50 + (i-1)*75" y2="350" stroke="black" stroke-width="2" />
              <!-- Diagonals -->
              <line x1="50" y1="50" x2="350" y2="350" stroke="black" stroke-width="2" />
              <line x1="50" y1="350" x2="350" y2="50" stroke="black" stroke-width="2" />
              <!-- Diamond diagonals -->
              <line x1="50" y1="200" x2="200" y2="50" stroke="black" stroke-width="2" />
              <line x1="200" y1="50" x2="350" y2="200" stroke="black" stroke-width="2" />
              <line x1="350" y1="200" x2="200" y2="350" stroke="black" stroke-width="2" />
              <line x1="200" y1="350" x2="50" y2="200" stroke="black" stroke-width="2" />
            </svg>

            <div class="grid-5x5">
              <template v-for="(row, rIndex) in board" :key="'row-'+rIndex">
                <div 
                  v-for="(cell, cIndex) in row" 
                  :key="'cell-'+rIndex+'-'+cIndex"
                  class="board-cell"
                  :class="{ 
                    'selected': selectedCell?.r === rIndex && selectedCell?.c === cIndex,
                    'clickable': !winner && ((cell === myRole && currentTurn === myRole) || (cell === null && selectedCell && currentTurn === myRole) || (myRole === 'M' && sheepToPlace > 0 && cell === null && currentTurn === myRole))
                  }"
                  @click="handleCellClick(rIndex, cIndex)"
                >
                  <IconSheep v-if="cell === 'M'" class="piece-icon" />
                  <IconTiger v-if="cell === 'T'" class="piece-icon" />
                </div>
              </template>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use "@/assets/styles/variables" as *;
@use "@/assets/styles/mixins" as *;

.game-tool { display: flex; flex-direction: column; align-items: center; padding: 20px; gap: 20px; min-height: 100vh; }
.back-nav { width: 100%; max-width: 800px; }
.btn-back {
  border: $border-width solid $black; padding: 8px 16px; background-color: $white; font-weight: bold; font-size: 0.875rem; box-shadow: 3px 3px 0px 0px $black; display: inline-flex; align-items: center; gap: 8px;
  @include inset-shadow-active;
  &:hover { background-color: $black; color: $white; @include glitch-effect; }
}

.game-window {
  @include window-box;
  width: 100%; max-width: 800px; display: flex; flex-direction: column; background-color: $workspace-off-white;
}

.window-header {
  background-color: $header-blue; border-bottom: $border-width solid $black; padding: 4px 16px; display: flex; justify-content: space-between;
  .window-title { color: $white; font-size: 0.875rem; font-weight: bold; }
  .window-controls { display: flex; gap: 4px; }
  .control-box { width: 12px; height: 12px; border: 1px solid $black; background-color: $surface-pc-beige; }
  .connected-led { background-color: #00ff00; box-shadow: 0 0 5px #00ff00; }
}

.game-content { padding: 24px; display: flex; flex-direction: column; gap: 24px; align-items: center; position: relative; }

.role-announce { font-size: 1.25rem; font-weight: 900; margin-bottom: 8px; }
.T { color: #ff9900; text-shadow: 1px 1px 0 $black; }
.M { color: $black; }

.share-box, .lobby-box {
  width: 100%; max-width: 450px; padding: 24px; text-align: center; border: 2px solid $black; background-color: $surface-pc-beige;
  box-shadow: 4px 4px 0 $black;
}

.lobby-subtitle {
  font-size: 0.875rem;
  font-weight: bold;
  margin-bottom: 24px;
  color: #666;
}

.waiting-anim {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  margin-top: 16px;
  
  .pulse {
    animation: pulse-anim 1.5s infinite ease-in-out;
  }
}

@keyframes pulse-anim {
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.1); opacity: 0.7; }
  100% { transform: scale(1); opacity: 1; }
}

.copy-field {
  display: flex; gap: 8px; margin-top: 16px;
  .share-input { flex-grow: 1; border: 2px solid $black; padding: 8px; font-family: $font-family-main; font-size: 0.75rem; outline: none; }
  .btn-copy { background-color: $white; border: 2px solid $black; padding: 8px 16px; font-weight: bold; cursor: pointer; &:hover { background-color: $black; color: $white; } }
}

/* LOBBY STYLES */
.lobby-box {
  h2 { font-size: 1.5rem; margin-bottom: 24px; }
}

.role-selector {
  display: flex; justify-content: center; gap: 24px; margin-bottom: 24px;
}

.role-btn {
  display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 16px; width: 120px;
  background-color: $white; border: 4px solid $black; font-family: $font-family-main; font-weight: 900; cursor: pointer;
  transition: transform 0.1s, box-shadow 0.1s;
  box-shadow: 4px 4px 0 $black;

  &:hover { transform: translate(-2px, -2px); box-shadow: 6px 6px 0 $black; }
  &:active { transform: translate(2px, 2px); box-shadow: inset 4px 4px 0 rgba(0,0,0,0.3); }

  @media (max-width: 400px) {
    width: 100px;
    padding: 12px;
    font-size: 0.75rem;
    .lobby-icon { width: 48px; height: 48px; }
  }
}

.lobby-icon { width: 64px; height: 64px; pointer-events: none; }

.game-ui { display: flex; flex-direction: column; gap: 20px; align-items: center; width: 100%; }

.hud-panel {
  width: 100%; max-width: 600px; display: flex; justify-content: space-between; padding: 12px 20px; background-color: $surface-pc-beige;
  border: $border-width solid $black; font-family: $font-family-main; font-weight: bold; font-size: 0.875rem;
  
  .stats { text-align: center; }
  .active-turn { background-color: $white; outline: 2px dashed $header-blue; animation: blink 1s step-end infinite; }
}

@keyframes blink { 50% { opacity: 0.7; } }

.board-wrapper {
  position: relative; width: 350px; height: 350px; background-color: $surface-pc-beige; border: 4px solid $black; box-shadow: 8px 8px 0 rgba(0,0,0,0.15);
  @media (min-width: 600px) { width: 450px; height: 450px; }
}

.board-lines {
  position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none;
}

.grid-5x5 {
  position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: grid; grid-template-columns: repeat(5, 1fr); grid-template-rows: repeat(5, 1fr);
}

.board-cell {
  display: flex; align-items: center; justify-content: center; position: relative; z-index: 1;
  
  &.clickable:hover { cursor: pointer; &::after { content: ''; position: absolute; width: 12px; height: 12px; border: 2px solid $glitch-cyan; border-radius: 50%; } }
  &.selected { &::after { content: ''; position: absolute; width: 40px; height: 40px; border: 3px dashed $header-blue; animation: rotate 4s linear infinite; } }
}

@keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

.piece-icon {
  width: 70%; height: 70%; z-index: 2;
}

.winner-overlay {
  position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 100; display: flex; align-items: center; justify-content: center;
}

.winner-box {
  @include window-box; background-color: $white; padding: 32px; text-align: center;
  h2 { font-size: 2.5rem; margin-bottom: 16px; @include glitch-effect; }
  p { font-size: 1.5rem; font-weight: 900; margin-bottom: 24px; }
}

.btn-restart {
  background-color: $black; color: $white; border: none; padding: 12px 24px; font-weight: 900; font-family: inherit; cursor: pointer;
  &:hover { @include glitch-effect; background-color: $glitch-red; }
}
</style>
