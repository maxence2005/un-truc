import type { ToolConfig } from '@/types'

const config: ToolConfig = {
  id: 'bagh-chal',
  name: 'Bagh-Chal P2P',
  description: 'Jeu de stratégie asymétrique. Incarnez les Tigres ou les Moutons face à un ami en Peer-to-Peer.',
  icon: 'sports_esports', // Icône Google Material
  component: () => import('./BaghChalTool.vue')
}

export default config