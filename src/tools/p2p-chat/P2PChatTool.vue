<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { RouterLink } from 'vue-router'
import { usePeerFacade } from '@/composables/usePeerFacade'
import { useAppFacade } from '@/composables/useAppFacade'

const { copyToClipboard } = useAppFacade()


interface Message {
  id: number
  text: string
  sender: 'me' | 'friend'
  time: string
}

const messages = ref<Message[]>([])
const messageInput = ref('')
const chatBoxRef = ref<HTMLElement | null>(null)


const scrollToBottom = async () => {
  await nextTick()
  if (chatBoxRef.value) {
    chatBoxRef.value.scrollTop = chatBoxRef.value.scrollHeight
  }
}


const {
  initPeer, sendData, isConnected, shareableLink, myPeerId
} = usePeerFacade((data) => {
  if (data.type === 'chat') {
    messages.value.push({
      id: Date.now(),
      text: data.text,
      sender: 'friend',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    })
    scrollToBottom()
  }
})

onMounted(() => {
  initPeer()
})


const sendMessage = () => {
  if (!messageInput.value.trim() || !isConnected.value) return

  const textToSend = messageInput.value.trim()

  
  messages.value.push({
    id: Date.now(),
    text: textToSend,
    sender: 'me',
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  })

  
  sendData({ type: 'chat', text: textToSend })

  
  messageInput.value = ''
  scrollToBottom()
}

const copyLink = () => copyToClipboard(shareableLink.value)
</script>

<template>
  <div class="chat-tool">
    <div class="back-nav">
      <RouterLink to="/" class="btn-back">
        <span class="material-symbols-outlined">arrow_back</span> RETOUR
      </RouterLink>
    </div>

    <div class="window-box chat-window">
      <header class="window-header">
        <span class="window-title">C:\SYSTEM\P2P_CHAT.EXE</span>
        <div class="window-controls">
          <div class="control-box" :class="{ 'connected-led': isConnected }"></div>
          <div class="control-box"></div>
          <div class="control-box"></div>
        </div>
      </header>

      <div class="chat-content">
        <div class="status-bar">
          <div class="status-info">
            <span class="label">ID:</span>
            <span class="value">{{ myPeerId || 'Génération...' }}</span>
          </div>
          <div class="status-info">
            <span class="label">STATUS:</span>
            <span class="value" :class="{ 'text-glitch-red': !isConnected }">
              {{ isConnected ? 'CONNECTÉ' : 'EN ATTENTE...' }}
            </span>
          </div>
        </div>

        <div v-if="!isConnected" class="share-box">
          <p>Partagez ce lien pour inviter quelqu'un :</p>
          <div class="copy-field">
            <input type="text" :value="shareableLink" readonly class="share-input" />
            <button @click="copyLink" class="btn-copy">COPIER</button>
          </div>
        </div>

        <div class="messages-area" ref="chatBoxRef">
          <div v-if="messages.length === 0" class="empty-state">
            En attente de messages...
          </div>
          
          <div 
            v-for="msg in messages" 
            :key="msg.id" 
            class="message-wrapper" 
            :class="msg.sender"
          >
            <div class="message-bubble">
              <span class="text">{{ msg.text }}</span>
              <span class="time">{{ msg.time }}</span>
            </div>
          </div>
        </div>
        
        <form class="input-area" @submit.prevent="sendMessage">
          <input 
            v-model="messageInput" 
            type="text" 
            placeholder="Tapez votre message ici..." 
            class="chat-input"
            :disabled="!isConnected"
          />
          <button type="submit" class="btn-send" :disabled="!isConnected || !messageInput.trim()">
            <span class="material-symbols-outlined">send</span>
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use "@/assets/styles/variables" as *;
@use "@/assets/styles/mixins" as *;

.chat-tool {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  gap: 20px;
  height: calc(100vh - 40px);
}

.back-nav {
  width: 100%;
  max-width: 800px;
}

.btn-back {
  border: $border-width solid $black;
  padding: 8px 16px;
  background-color: $white;
  font-weight: bold;
  font-size: 0.875rem;
  box-shadow: 3px 3px 0px 0px $black;
  display: flex;
  align-items: center;
  gap: 8px;
  @include inset-shadow-active;

  &:hover {
    background-color: $black;
    color: $white;
    @include glitch-effect;
  }
}

.chat-window {
  @include window-box;
  width: 100%;
  max-width: 800px;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
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

  &.connected-led {
    background-color: #00ff00;
    box-shadow: 0 0 5px #00ff00;
  }
}

.chat-content {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  flex-grow: 1;
  overflow: hidden;
}

.status-bar {
  display: flex;
  justify-content: space-between;
  background-color: #eee;
  padding: 8px 12px;
  border: 1px solid $black;
  font-family: inherit;
  font-size: 0.75rem;
  font-weight: bold;

  .label { color: #666; margin-right: 4px; }
}

.share-box {
  background-color: $surface-pc-beige;
  border: $border-width solid $black;
  padding: 12px;
  text-align: center;
  
  p { font-size: 0.875rem; font-weight: bold; margin-bottom: 8px; }
}

.copy-field {
  display: flex;
  gap: 8px;

  .share-input {
    flex-grow: 1;
    border: 1px solid $black;
    padding: 4px 8px;
    font-size: 0.75rem;
    background-color: $white;
    outline: none;
  }

  .btn-copy {
    background-color: $white;
    border: 1px solid $black;
    padding: 4px;
    cursor: pointer;
    &:hover { background-color: $black; color: $white; }
  }
}

.messages-area {
  flex-grow: 1;
  background-color: $white;
  border: $border-width solid $black;
  padding: 16px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
  box-shadow: inset 4px 4px 0px rgba(0,0,0,0.05);

  .empty-state {
    margin: auto;
    text-align: center;
    color: #999;
    font-style: italic;
  }
}

.message-wrapper {
  display: flex;
  width: 100%;

  &.me { justify-content: flex-end; }
  &.friend { justify-content: flex-start; }
}

.message-bubble {
  max-width: 70%;
  padding: 8px 12px;
  border: 2px solid $black;
  position: relative;
  
  .text { font-size: 1rem; line-height: 1.4; word-break: break-word; }
  .time { font-size: 0.65rem; font-weight: bold; margin-top: 4px; display: block; text-align: right; }
}

.me .message-bubble {
  background-color: $black;
  color: $white;
  box-shadow: -4px 4px 0px rgba(0,0,0,0.2);
}

.friend .message-bubble {
  background-color: $surface-pc-beige;
  color: $black;
  box-shadow: 4px 4px 0px rgba(0,0,0,0.2);
}

.input-area {
  display: flex;
  gap: 12px;

  .chat-input {
    flex-grow: 1;
    border: $border-width solid $black;
    padding: 12px;
    font-family: inherit;
    font-size: 1rem;
    box-shadow: 3px 3px 0px $black;
    outline: none;
    
    &:focus { transform: translate(-1px, -1px); box-shadow: 4px 4px 0px $black; }
    &:disabled { background-color: #eee; cursor: not-allowed; }
  }

  .btn-send {
    background-color: $white;
    border: $border-width solid $black;
    width: 50px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 3px 3px 0px $black;
    cursor: pointer;
    @include inset-shadow-active;

    &:hover:not(:disabled) { background-color: $black; color: $white; }
    &:disabled { opacity: 0.5; cursor: not-allowed; }
  }
}

.text-glitch-red { color: $glitch-red; font-weight: 900; }
</style>
