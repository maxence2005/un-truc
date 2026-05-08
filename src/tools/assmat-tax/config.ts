import type { ToolConfig } from '@/types';

const config: ToolConfig = {
    id: 'assmat-tax',
    name: 'Calcul Impôts AssMat',
    description: 'Calculez votre abattement forfaitaire (Art. 80 sexies du CGI) avec les taux SMIC 2024-2026.',
    icon: 'calculate',
    component: () => import('./AssMatTaxTool.vue')
};

export default config;
