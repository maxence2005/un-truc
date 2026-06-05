// src/tools/rogue-like/game/data/StatusRegistry.ts

export type BaseStatusId = 'bleed' | 'burn' | 'flight' | 'moon_prep' | 'freeze';

export type StatPrefix = 'att' | 'def' | 'att_mag' | 'def_mag' | 'speed';
export type StatSuffix = 'up' | 'down';
export type StatTier = '1' | '2' | '3';

export type DynamicStatusId = `${StatPrefix}_${StatSuffix}_${StatTier}`;

export type StatusId = BaseStatusId | DynamicStatusId;

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
        maxStacks: 10
    },
    moon_prep: {
        id: 'moon_prep',
        name: 'Préparation Lunaire',
        desc: 'Séquence d\'allumage lancée. Permet de s\'envoler dans la stratosphère au début du prochain tour.',
        iconKey: 'status_moon_prep'
    },
    freeze: {
        id: 'freeze',
        name: 'Gel',
        desc: 'Cryogénisation. Inflige des dégâts équivalents à 50% de votre Défense Magique par charge à chaque action, et bloque l\'utilisation de capacités Anti-Aériennes. S\'estompe d\'une charge par action (Max 5 charges).',
        iconKey: 'status_freeze',
        maxStacks: 5
    }
} as Record<StatusId, StatusTemplate>;

// Dynamic Stat Statuses Generator
const prefixes: Record<StatPrefix, string> = {
    att: 'Attaque Phys.',
    def: 'Défense Phys.',
    att_mag: 'Attaque Mag.',
    def_mag: 'Défense Mag.',
    speed: 'Vitesse'
};

const suffixes: Record<StatSuffix, { label: string; effect: string }> = {
    up: { label: 'Boost', effect: 'Augmente' },
    down: { label: 'Malus', effect: 'Réduit' }
};

const tiers: Record<StatTier, { percent: number; label: string }> = {
    '1': { percent: 20, label: 'I' },
    '2': { percent: 40, label: 'II' },
    '3': { percent: 60, label: 'III' }
};

Object.entries(prefixes).forEach(([pref, prefName]) => {
    Object.entries(suffixes).forEach(([suff, suffInfo]) => {
        Object.entries(tiers).forEach(([tier, tierInfo]) => {
            const id = `${pref}_${suff}_${tier}` as StatusId;
            const name = `${prefName} ${suffInfo.label} ${tierInfo.label}`;
            const desc = `${suffInfo.effect} la statistique de ${prefName} de ${tierInfo.percent}%. S'estompe d'une charge par action.`;
            
            const iconKey = `status_${pref}_${suff}`;
            
            STATUS_TEMPLATES[id] = {
                id,
                name,
                desc,
                iconKey
            };
        });
    });
});
