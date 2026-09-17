import type { ToolConfig } from '@/types'

const config: ToolConfig = {
  id: 'pdf-signer',
  name: 'Signeur de PDF',
  description: 'Importez un document PDF, apposez votre signature et vos mentions, puis téléchargez le fichier signé instantanément.',
  icon: 'draw',
  component: () => import('./PdfSignerTool.vue')
}

export default config
