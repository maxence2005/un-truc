import { type CharacterStats } from './Stats';
import { type Skill } from './SkillRegistry';

// Banque de capacités exclusives aux monstres (Modifiables à l'infini ici)
export const MONSTER_SKILLS = {
    MORSURE: { 
        name: 'Morsure Acide', 
        shortDesc: 'Attaque physique de base.',
        longDesc: 'Une attaque de crocs physiques lacérant l\'armure de la cible.',
        damageType: 'physical',
        scaling: { att: 1.0 },
        iconKey: 'fang'
    },
    SOIN_GLUANT: { 
        name: 'Régénération', 
        shortDesc: 'Le monstre colmate ses brèches.',
        longDesc: 'Une régénération gélatineuse réparant les circuits du monstre.',
        damageType: 'pure',
        scaling: {},
        healValue: 18,
        iconKey: 'slime_heal'
    },
    VAMPIRISME: { 
        name: 'Siphon de Code', 
        shortDesc: 'Blesse le joueur et se soigne.',
        longDesc: 'Siphonne la vitalité magique de la cible pour réparer ses circuits.',
        damageType: 'magical',
        scaling: { att_magic: 0.7 },
        healValue: 10,
        iconKey: 'drain'
    },
    CRITIQUE_BUG: { 
        name: 'Surcharge Système', 
        shortDesc: 'Gros dégâts magiques instables.',
        longDesc: 'Provoque un pic de tension magique pour court-circuiter l\'adversaire.',
        damageType: 'magical',
        scaling: { att_magic: 1.4 },
        iconKey: 'surcharge'
    }
} satisfies Record<string, Skill>;

import { type StatusId } from './StatusRegistry';

export interface MonsterTemplate {
    name: string;
    assetKey: string;
    baseMaxHp: number;
    stats: CharacterStats;
    skills: Skill[];
    // Nouveau tableau optionnel pour l'état d'apparition inné
    startStatuses?: { id: StatusId; stacks: number; isInfinite?: boolean }[]; 
}

export const MONSTERS: MonsterTemplate[] = [
    {
        name: 'Faucon Drone',
        assetKey: 'monster_ghost', // Utilisation temporaire du modèle ghost
        baseMaxHp: 40,
        stats: { hp_max: 40, att: 18, att_magic: 12, def_phys: 6, def_magic: 10, speed: 24, crit_rate: 0.12, crit_damage: 1.50, agility: 0.16 },
        skills: [MONSTER_SKILLS.MORSURE],
        startStatuses: [{ id: 'flight', stacks: 1, isInfinite: true }]
    }, 
    {
        name: 'Tigre Pixel', 
        assetKey: 'monster_tiger', 
        baseMaxHp: 50, 
        stats: { hp_max: 50, att: 25, att_magic: 5, def_phys: 10, def_magic: 4, speed: 18, crit_rate: 0.15, crit_damage: 1.60, agility: 0.12 },
        skills: [MONSTER_SKILLS.MORSURE] 
    },
    { 
        name: 'Slime Gluant', 
        assetKey: 'monster_slime', 
        baseMaxHp: 40, 
        stats: { hp_max: 40, att: 12, att_magic: 20, def_phys: 5, def_magic: 15, speed: 8, crit_rate: 0.05, crit_damage: 1.30, agility: 0.02 },
        skills: [MONSTER_SKILLS.MORSURE, MONSTER_SKILLS.SOIN_GLUANT] 
    },
    { 
        name: 'Robot Cyber', 
        assetKey: 'monster_robot', 
        baseMaxHp: 60, 
        stats: { hp_max: 60, att: 20, att_magic: 25, def_phys: 15, def_magic: 10, speed: 14, crit_rate: 0.20, crit_damage: 1.70, agility: 0.05 },
        skills: [MONSTER_SKILLS.CRITIQUE_BUG] 
    },
    { 
        name: 'Fantôme Code', 
        assetKey: 'monster_ghost', 
        baseMaxHp: 45, 
        stats: { hp_max: 45, att: 15, att_magic: 18, def_phys: 8, def_magic: 12, speed: 16, crit_rate: 0.10, crit_damage: 1.50, agility: 0.20 },
        skills: [MONSTER_SKILLS.VAMPIRISME] 
    },
    { 
        name: 'Démon Bug', 
        assetKey: 'monster_demon', 
        baseMaxHp: 70, 
        stats: { hp_max: 70, att: 28, att_magic: 22, def_phys: 12, def_magic: 12, speed: 12, crit_rate: 0.12, crit_damage: 1.50, agility: 0.10 },
        skills: [MONSTER_SKILLS.MORSURE, MONSTER_SKILLS.CRITIQUE_BUG, MONSTER_SKILLS.VAMPIRISME] 
    }
];
