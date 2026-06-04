
import { ref, computed, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Peer from 'peerjs'
import { useAppFacade } from '@/composables/useAppFacade'

export function usePeerFacade(onDataReceived: (data: any) => void) {
  const { showPopup } = useAppFacade()
  const route = useRoute()
  const router = useRouter()

  
  const peer = ref<Peer | null>(null)
  const connection = ref<any>(null)

  
  const myPeerId = ref('')
  const isConnected = ref(false)

  
  const shareableLink = computed(() => {
    if (!myPeerId.value) return ''
    return `${window.location.origin}${route.path}?room=${myPeerId.value}`
  })

  

  const setupConnection = (conn: any) => {
    connection.value = conn

    conn.on('open', () => {
      isConnected.value = true
      showPopup('Succès', 'Connecté avec succès en P2P !')
    })

    
    conn.on('data', (data: any) => {
      if (data && data.type === 'PEER_DISCONNECT') {
        isConnected.value = false
        connection.value = null
        showPopup('Info', "L'autre personne s'est déconnectée.")
        conn.close()
        return
      }
      onDataReceived(data)
    })

    conn.on('close', () => {
      isConnected.value = false
      connection.value = null
      showPopup('Info', "L'autre personne s'est déconnectée.")
    })

    conn.on('error', (err: any) => {
      console.error('Peer connection error:', err)
      isConnected.value = false
      connection.value = null
      showPopup('Erreur P2P', 'Une erreur de connexion est survenue.')
    })
  }

  const connectTo = (targetId: string) => {
    if (!peer.value || !targetId) return
    const conn = peer.value.connect(targetId)
    setupConnection(conn)
  }

  const initPeer = () => {
    peer.value = new Peer()

    peer.value.on('open', (id) => {
      myPeerId.value = id

      
      const roomToJoin = route.query.room as string
      if (roomToJoin && roomToJoin !== id) {
        showPopup('Connexion', 'Tentative de connexion à la salle...')
        connectTo(roomToJoin)
        router.replace({ query: { ...route.query, room: undefined } }) 
      }
    })

    peer.value.on('connection', (conn) => {
      setupConnection(conn)
    })

    peer.value.on('error', (err) => {
      console.error('Peer error:', err)
      showPopup('Erreur Système', 'Impossible d\'initialiser le réseau P2P.')
    })
  }

  const sendData = (data: any) => {
    if (isConnected.value && connection.value) {
      connection.value.send(data)
    }
  }

  const handleBeforeUnload = () => {
    if (isConnected.value && connection.value) {
      connection.value.send({ type: 'PEER_DISCONNECT' })
      connection.value.close()
    }
    if (peer.value) {
      peer.value.destroy()
    }
  }

  window.addEventListener('beforeunload', handleBeforeUnload)

  onUnmounted(() => {
    window.removeEventListener('beforeunload', handleBeforeUnload)
    handleBeforeUnload()
  })

  
  return {
    initPeer,
    connectTo,
    sendData,
    myPeerId,
    isConnected,
    shareableLink
  }
}
