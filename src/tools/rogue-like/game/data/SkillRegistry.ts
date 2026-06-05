// src/tools/rogue-like/game/data/SkillRegistry.ts
import { type StatType } from './Stats';
import { type StatusId } from './StatusRegistry';

export type DamageType = 'physical' | 'magical' | 'pure';

export interface Skill {
    name: string;
    shortDesc: string;
    longDesc: string;
    damageType: DamageType;
    scaling: Partial<Record<StatType, number>>;
    healValue?: number;
    iconKey: string;
    // --- SYSTÈME DE STATUTS ---
    inflictsStatus?: { id: StatusId; stacks: number; target: 'enemy' | 'self' };
    hasBandage?: boolean;  // Nettoie le saignement
    hasAntiAir?: boolean;  // Ignore la réduction du statut Vol
}

export function getScalingFormulaString(skill: Skill): string {
    const formulas: string[] = [];
    Object.entries(skill.scaling).forEach(([stat, coefficient]) => {
        if (coefficient && coefficient > 0) {
            formulas.push(`${coefficient * 100}% ${stat.toUpperCase()}`);
        }
    });
    if (skill.healValue) formulas.push(`+${skill.healValue} PV Fixes`);
    if (skill.inflictsStatus) formulas.push(`Applique ${skill.inflictsStatus.stacks}x ${skill.inflictsStatus.id.toUpperCase()}`);
    if (skill.hasBandage) formulas.push(`[Soigne Saignement]`);
    if (skill.hasAntiAir) formulas.push(`[Anti-Aérien]`);
    return formulas.length > 0 ? ` Formule: (${formulas.join(' + ')})` : ' Effet Fixe';
}

export const ALL_SKILLS: Skill[] = [
    {
        name: 'Morsure Sévère',
        shortDesc: 'Physique. Cause un saignement.',
        longDesc: 'Déchire la chair de la cible, provoquant une hémorragie continue.',
        damageType: 'physical',
        scaling: { att: 0.9 },
        iconKey: 'fang',
        inflictsStatus: { id: 'bleed', stacks: 1, target: 'enemy' }
    },
    {
        name: 'Lame de Feu',
        shortDesc: 'Magique. Brûle la cible.',
        longDesc: 'Une entaille de plasma enflammé infligeant une Brûlure cumulable (Max 5).',
        damageType: 'magical',
        scaling: { att_magic: 1.0 },
        iconKey: 'plasma', // Remplacé par 'plasma' (qui existe)
        inflictsStatus: { id: 'burn', stacks: 2, target: 'enemy' }
    },
    {
        name: 'Post-Combustion',
        shortDesc: 'Prend de la hauteur. Donne Vol.',
        longDesc: 'Propulse le lanceur dans les airs. Confère le statut bénéfique Vol.',
        damageType: 'pure',
        scaling: {},
        iconKey: 'surcharge', // Remplacé par 'surcharge' (qui existe)
        inflictsStatus: { id: 'flight', stacks: 1, target: 'self' }
    },
    {
        name: 'Kit de Secours',
        shortDesc: 'Soin léger et applique un bandage.',
        longDesc: 'Applique des pansements compressifs stériles qui stoppent net tous les saignements.',
        damageType: 'pure',
        scaling: {},
        healValue: 20,
        iconKey: 'heal', // Existe
        hasBandage: true
    },
    {
        name: 'Tir de DCA',
        shortDesc: 'Physique. Anti-Aérien.',
        longDesc: 'Un tir de missile guidé ignorant totalement les malus de dégâts contre les cibles en Vol.',
        damageType: 'physical',
        scaling: { att: 1.1 },
        iconKey: 'shockwave', // Remplacé par 'shockwave' (qui existe)
        hasAntiAir: true
    },
    {
        name: 'Go to the moon',
        shortDesc: 'Prépare un vol de 3 tours (Propulseurs + Anti-Air).',
        longDesc: 'Initialise la séquence de décollage (ne fait rien ce tour-ci). Au tour suivant, confère 3 charges de Vol et rend toutes vos attaques Anti-Aériennes. Impossible à relancer si déjà en Vol.',
        damageType: 'pure',
        scaling: {},
        iconKey: 'surcharge',
        inflictsStatus: { id: 'moon_prep', stacks: 1, target: 'self' }
    },
    {
        name: 'Baguette asiatique',
        shortDesc: 'Arme de maîtrise évolutive (S\'améliore au fil des tirs).',
        longDesc: 'Inné: Mitraille la cible de 2 coups consécutifs à 40% ATT.\n[Maîtrise 15+]: Ajoute un soin de 10% de vos PV Max.\n[Maîtrise 100+]: Déclenche un coup final cataclysmique à 400% ATT.',
        damageType: 'physical',
        scaling: {}, // Géré dynamiquement par le compteur de maîtrise
        iconKey: 'saber'
    }
];
