import type { ToolConfig } from '@/types'

const config: ToolConfig = {
  id: 'rogue-like',
  name: 'Duel',
  description: 'Affronte des monstres en boucle au tour par tour',
  icon: 'swords', 
  component: () => import('./RogueLikeTool.vue')
}

export default config
