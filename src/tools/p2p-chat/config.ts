import type { ToolConfig } from '@/types'

const config: ToolConfig = {
  id: 'p2p-chat',
  name: 'Chat P2P',
  description: 'Discutez en direct et en toute confidentialité via une connexion Peer-to-Peer sécurisée.',
  icon: 'chat',
  component: () => import('./P2PChatTool.vue')
}

export default config
