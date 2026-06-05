// src/tools/rogue-like/game/data/StatusRegistry.ts

export type StatusId = 'bleed' | 'burn' | 'flight' | 'moon_prep';

export interface StatusTemplate {
    id: StatusId;
    name: string;
    desc: string; // Description de l'effet
    iconKey: string; // Fichier SVG dans assets/statuses/ sans extension
    maxStacks?: number;
}

export interface ActiveStatus {
    id: StatusId;
    name: string;
    desc: string;
    iconKey: string;
    stacks: number;
    isInfinite?: boolean; // Flag de statut permanent (ex: Vol du drone faucon)
}

export const STATUS_TEMPLATES: Record<StatusId, StatusTemplate> = {
    bleed: { 
        id: 'bleed', 
        name: 'Saignement', 
        desc: 'Hémorragie. Inflige 1 point de dégât par charge accumulée à chaque fois que ce personnage lance une attaque. Ne se dissipe qu\'avec une capacité de type [Bandage].', 
        iconKey: 'status_bleed' 
    },
    burn: { 
        id: 'burn', 
        name: 'Brûlure', 
        desc: 'Surchauffe thermique. Inflige 5 points de dégâts à chaque attaque et divise par 2 l\'efficacité de tous les soins reçus. Perd 1 charge après chaque action (Max 5 charges).', 
        iconKey: 'status_burn', 
        maxStacks: 5 
    },
    flight: { 
        id: 'flight', 
        name: 'Vol', 
        desc: 'Avantage aérien. Réduit les dégâts reçus de 75% face à toutes les attaques ennemies qui ne possèdent pas la propriété [Anti-Aérien].', 
        iconKey: 'status_flight', 
        maxStacks: 10 // Augmenté pour supporter les 3 tours de "Go to the moon"
    },
    moon_prep: {
        id: 'moon_prep',
        name: 'Préparation Lunaire',
        desc: 'Séquence d\'allumage lancée. Permet de s\'envoler dans la stratosphère au début du prochain tour.',
        iconKey: 'status_moon_prep'
    }
};
