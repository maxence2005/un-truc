import type { ToolConfig } from '@/types';

const config: ToolConfig = {
    id: 'base64',
    name: 'Encodeur Base64',
    description: 'Encodez ou décodez des chaînes en Base64',
    icon: 'code',
    // On pointe vers le fichier .vue !
    component: () => import('./Base64Tool.vue')
};

export default config;