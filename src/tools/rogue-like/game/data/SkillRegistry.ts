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
    inflictsStatuses?: { id: StatusId; stacks: number; target: 'enemy' | 'self' }[];
    hasBandage?: boolean;  // Nettoie le saignement
    hasAntiAir?: boolean;  // Ignore la réduction du statut Vol
    flatDamage?: number;   // Dégâts fixes
    casterHpCostPercent?: number; // Pourcentage de PV max sacrifiés
}

export function getScalingFormulaString(skill: Skill): string {
    const formulas: string[] = [];
    if (skill.flatDamage) formulas.push(`${skill.flatDamage} dégâts fixes`);
    Object.entries(skill.scaling).forEach(([stat, coefficient]) => {
        if (coefficient && coefficient > 0) {
            formulas.push(`${coefficient * 100}% ${stat.toUpperCase()}`);
        }
    });
    if (skill.healValue) formulas.push(`+${skill.healValue} PV`);
    if (skill.inflictsStatus) formulas.push(`Applique ${skill.inflictsStatus.stacks}x ${skill.inflictsStatus.id.toUpperCase()}`);
    if (skill.inflictsStatuses) {
        skill.inflictsStatuses.forEach(s => {
            formulas.push(`Applique ${s.stacks}x ${s.id.toUpperCase()}`);
        });
    }
    if (skill.hasBandage) formulas.push(`[Soigne Saignement]`);
    if (skill.hasAntiAir) formulas.push(`[Anti-Aérien]`);
    if (skill.casterHpCostPercent) formulas.push(`[Coût: ${Math.round(skill.casterHpCostPercent * 100)}% PV Max]`);
    return formulas.length > 0 ? ` Formule: (${formulas.join(' + ')})` : ' Effet Fixe';
}

export const CLASS_SKILLS: Record<'humain' | 'mage' | 'guerrier' | 'cyborg', Skill[]> = {
    humain: [
        {
            name: 'Coup Standard',
            shortDesc: 'Physique. Inflige 100% de l\'attaque physique.',
            longDesc: 'Une attaque rapide et équilibrée à l\'aide d\'une lame standard.',
            damageType: 'physical',
            scaling: { att: 1.0 },
            iconKey: 'saber'
        },
        {
            name: 'Tir Magique',
            shortDesc: 'Magique. Inflige 100% de l\'attaque magique.',
            longDesc: 'Projette une boule d\'énergie pure vers la cible.',
            damageType: 'magical',
            scaling: { att_magic: 1.0 },
            iconKey: 'magic_shot'
        },
        {
            name: 'Courir',
            shortDesc: 'Physique. Dégâts 70% ATT + 40% Vitesse (2 tours).',
            longDesc: 'Prend de l\'élan pour frapper l\'ennemi puis se déplacer rapidement.',
            damageType: 'physical',
            scaling: { att: 0.7 },
            inflictsStatus: { id: 'speed_up_2', stacks: 2, target: 'self' },
            iconKey: 'run'
        },
        {
            name: 'Apprentissage Continu',
            shortDesc: 'Physique. 30% ATT + 10% par utilisation antérieure.',
            longDesc: 'Frappe l\'ennemi. Chaque utilisation précédente augmente les dégâts physiques de ce sort de +10% ATT.',
            damageType: 'physical',
            scaling: { att: 0.3 },
            iconKey: 'continuous_learning'
        },
        {
            name: 'Jet de Pierre',
            shortDesc: 'Physique/Magique. 30% ATT Magique + 60% ATT. Anti-Air.',
            longDesc: 'Lance un projectile lourd. Ignore la réduction de dégâts du Vol.',
            damageType: 'physical',
            scaling: { att_magic: 0.3, att: 0.6 },
            hasAntiAir: true,
            iconKey: 'stone_throw'
        },
        {
            name: 'Bûcher',
            shortDesc: 'Pur. Inflige 3x Brûlure à l\'adversaire.',
            longDesc: 'Déclenche un embrasement sous l\'adversaire, lui infligeant 3 charges de Brûlure.',
            damageType: 'pure',
            scaling: {},
            inflictsStatus: { id: 'burn', stacks: 3, target: 'enemy' },
            iconKey: 'pyre'
        }
    ],
    guerrier: [
        {
            name: 'Coup de Glaive',
            shortDesc: 'Physique. Inflige 100% de l\'attaque physique.',
            longDesc: 'Tranche la cible avec une épée lourde.',
            damageType: 'physical',
            scaling: { att: 1.0 },
            iconKey: 'glaive'
        },
        {
            name: 'Frappe Lourde',
            shortDesc: 'Dégâts Fixes. Inflige exactement 20 dégâts.',
            longDesc: 'Une frappe directe infligeant 20 points de dégâts purs ignorants les défenses.',
            damageType: 'pure',
            scaling: {},
            flatDamage: 20,
            iconKey: 'heavy_strike'
        },
        {
            name: 'Posture Défensive',
            shortDesc: 'Magique. 70% ATT Magique + 20% Défense (2 tours).',
            longDesc: 'Frappe magiquement et renforce le bouclier, augmentant les défenses physiques et magiques de 20% pendant 2 tours.',
            damageType: 'magical',
            scaling: { att_magic: 0.7 },
            inflictsStatuses: [
                { id: 'def_up_1', stacks: 2, target: 'self' },
                { id: 'def_mag_up_1', stacks: 2, target: 'self' }
            ],
            iconKey: 'defensive_posture'
        },
        {
            name: 'Brise-Bouclier',
            shortDesc: 'Physique. 70% ATT + réduit la Défense ennemie de 20%.',
            longDesc: 'Détruit la garde adverse. Inflige 70% d\'attaque physique et réduit les défenses physiques et magiques ennemies de 20% pendant 2 tours.',
            damageType: 'physical',
            scaling: { att: 0.7 },
            inflictsStatuses: [
                { id: 'def_down_1', stacks: 2, target: 'enemy' },
                { id: 'def_mag_down_1', stacks: 2, target: 'enemy' }
            ],
            iconKey: 'shield_breaker'
        },
        {
            name: 'Heurt de Bouclier',
            shortDesc: 'Physique. Inflige 100% de votre Défense Physique.',
            longDesc: 'Assomme la cible en utilisant le bouclier. Les dégâts dépendent entièrement de votre statistique de Défense Physique.',
            damageType: 'physical',
            scaling: { def_phys: 1.0 },
            iconKey: 'shield_slam'
        },
        {
            name: 'Coup Sacrificiel',
            shortDesc: 'Physique. 120% ATT au coût de 5% de vos PV Max.',
            longDesc: 'Une attaque dévastatrice mais risquée. Inflige 120% de l\'attaque physique mais consomme 5% de vos PV max.',
            damageType: 'physical',
            scaling: { att: 1.2 },
            casterHpCostPercent: 0.05,
            iconKey: 'sacrificial_strike'
        }
    ],
    mage: [
        {
            name: 'Boule de feu',
            shortDesc: 'Pur. 10 dégâts fixes + 1x Brûlure.',
            longDesc: 'Lance une sphère incandescente infligeant 10 dégâts fixes et 1 charge de Brûlure. Rarement (1/1000), se transforme en Boule de feu ultime (999 dégâts fixes).',
            damageType: 'pure',
            scaling: {},
            flatDamage: 10,
            inflictsStatus: { id: 'burn', stacks: 1, target: 'enemy' },
            iconKey: 'fireball'
        },
        {
            name: 'Missile Magique',
            shortDesc: 'Magique. Inflige 90% de l\'attaque magique.',
            longDesc: 'Projette un projectile d\'énergie arcanique guidé vers l\'adversaire.',
            damageType: 'magical',
            scaling: { att_magic: 0.9 },
            iconKey: 'magic_missile'
        },
        {
            name: 'Coup de Bâton',
            shortDesc: 'Physique. Inflige 150% de l\'attaque physique.',
            longDesc: 'Frappe l\'ennemi avec force à l\'aide d\'un bâton de combat.',
            damageType: 'physical',
            scaling: { att: 1.5 },
            iconKey: 'staff_strike'
        },
        {
            name: 'Gel Glaciaire',
            shortDesc: 'Magique. 40% ATT Magique + 3x Gel.',
            longDesc: 'Souffle un vent glacial qui inflige 40% d\'attaque magique et applique 3 charges de Gel à l\'ennemi.',
            damageType: 'magical',
            scaling: { att_magic: 0.4 },
            inflictsStatus: { id: 'freeze', stacks: 3, target: 'enemy' },
            iconKey: 'glacial_freeze'
        },
        {
            name: 'Lance de Glace',
            shortDesc: 'Magique. 70% ATT Magique + 1x Gel.',
            longDesc: 'Matérialise un pic de glace pour transpercer l\'ennemi, infligeant 70% d\'attaque magique et 1 charge de Gel.',
            damageType: 'magical',
            scaling: { att_magic: 0.7 },
            inflictsStatus: { id: 'freeze', stacks: 1, target: 'enemy' },
            iconKey: 'ice_spear'
        },
        {
            name: 'Drain de Mana',
            shortDesc: 'Magique. 50% ATT Magique + Anti-Air + Malus ATT Magique (-20%).',
            longDesc: 'Siphonne la magie de l\'adversaire. Capacité anti-aérienne infligeant 50% de dégâts magiques et réduisant l\'attaque magique ennemie de 20% pendant 2 tours.',
            damageType: 'magical',
            scaling: { att_magic: 0.5 },
            inflictsStatus: { id: 'att_mag_down_1', stacks: 2, target: 'enemy' },
            hasAntiAir: true,
            iconKey: 'mana_drain'
        },
        {
            name: 'Explosion Arcane',
            shortDesc: 'Magique. 70% ATT Magique + Malus DEF Magique (-20%).',
            longDesc: 'Déclenche une détonation arcane fragilisant les défenses magiques de la cible de 20% pendant 2 tours.',
            damageType: 'magical',
            scaling: { att_magic: 0.7 },
            inflictsStatus: { id: 'def_mag_down_1', stacks: 2, target: 'enemy' },
            iconKey: 'arcane_explosion'
        }
    ],
    cyborg: [
        {
            name: 'Laser de Poche',
            shortDesc: 'Magique. Inflige 100% de l\'attaque magique.',
            longDesc: 'Tire un rayon laser ciblé.',
            damageType: 'magical',
            scaling: { att_magic: 1.0 },
            iconKey: 'pocket_laser'
        },
        {
            name: 'Lame Cyber',
            shortDesc: 'Physique. Inflige 100% de l\'attaque physique.',
            longDesc: 'Active la blade d\'énergie corporelle.',
            damageType: 'physical',
            scaling: { att: 1.0 },
            iconKey: 'cyber_blade'
        },
        {
            name: 'Overclocking',
            shortDesc: 'Pur. Augmente la vitesse de 40% pendant 2 tours.',
            longDesc: 'Sur-cadence les processeurs de mouvement pour augmenter la vitesse de 40% pendant 2 tours.',
            damageType: 'pure',
            scaling: {},
            inflictsStatus: { id: 'speed_up_2', stacks: 2, target: 'self' },
            iconKey: 'overclock'
        },
        {
            name: 'Nanites Réparatrices',
            shortDesc: 'Soin Pur 20 PV + Soigne Saignement.',
            longDesc: 'Libère des micro-drones médicaux pour refermer les plaies et régénérer 20 PV.',
            damageType: 'pure',
            scaling: {},
            healValue: 20,
            hasBandage: true,
            iconKey: 'nanites'
        },
        {
            name: 'Canon DCA',
            shortDesc: 'Physique. 100% ATT. Anti-Aérien.',
            longDesc: 'Défense anti-aérienne intégrée. Ignore la réduction de dégâts du Vol.',
            damageType: 'physical',
            scaling: { att: 1.0 },
            hasAntiAir: true,
            iconKey: 'dca_cannon'
        },
        {
            name: 'Siphon de Code',
            shortDesc: 'Magique. 70% ATT Magique + Soigne 10 PV.',
            longDesc: 'Vampirise les flux de données ennemis pour infliger des dégâts et se soigner.',
            damageType: 'magical',
            scaling: { att_magic: 0.7 },
            healValue: 10,
            iconKey: 'code_siphon'
        }
    ]
};

export const GENERAL_ADVENTURE_SKILLS: Skill[] = [
    {
        name: 'Morsure Sévère',
        shortDesc: 'Physique. Cause un saignement.',
        longDesc: 'Déchire la chair de la cible, provoquant une hémorragie continue (Saignement).',
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
        iconKey: 'plasma',
        inflictsStatus: { id: 'burn', stacks: 2, target: 'enemy' }
    },
    {
        name: 'Post-Combustion',
        shortDesc: 'Prend de la hauteur. Donne Vol.',
        longDesc: 'Propulse le lanceur dans les airs. Confère le statut bénéfique Vol.',
        damageType: 'pure',
        scaling: {},
        iconKey: 'booster',
        inflictsStatus: { id: 'flight', stacks: 1, target: 'self' }
    },
    {
        name: 'Kit de Secours',
        shortDesc: 'Soin léger et applique un bandage.',
        longDesc: 'Applique des pansements compressifs stériles qui restaurent 20 PV et stoppent net tous les saignements.',
        damageType: 'pure',
        scaling: {},
        healValue: 20,
        iconKey: 'heal',
        hasBandage: true
    },
    {
        name: 'Tir de DCA',
        shortDesc: 'Physique. Anti-Aérien.',
        longDesc: 'Un tir de missile guidé ignorant totalement les malus de dégâts contre les cibles en Vol.',
        damageType: 'physical',
        scaling: { att: 1.1 },
        iconKey: 'shockwave',
        hasAntiAir: true
    },
    {
        name: 'Go to the moon',
        shortDesc: 'Prépare un vol de 3 tours (Propulseurs + Anti-Air).',
        longDesc: 'Initialise la séquence de décollage (ne fait rien ce tour-ci). Au tour suivant, confère 3 charges de Vol et rend toutes vos attaques Anti-Aériennes. Impossible à relancer si déjà en Vol.',
        damageType: 'pure',
        scaling: {},
        iconKey: 'moon',
        inflictsStatus: { id: 'moon_prep', stacks: 1, target: 'self' }
    },
    {
        name: 'Baguette asiatique',
        shortDesc: 'Arme de maîtrise évolutive (S\'améliore au fil des tirs).',
        longDesc: 'Inné: Mitraille la cible de 2 coups consécutifs à 40% ATT.\n[Maîtrise 15+]: Ajoute un soin de 10% de vos PV Max.\n[Maîtrise 100+]: Déclenche un coup final cataclysmique à 400% ATT.',
        damageType: 'physical',
        scaling: {},
        iconKey: 'baguette'
    }
];

export const ALL_SKILLS: Skill[] = [
    ...CLASS_SKILLS.humain,
    ...CLASS_SKILLS.guerrier,
    ...CLASS_SKILLS.mage,
    ...CLASS_SKILLS.cyborg,
    ...GENERAL_ADVENTURE_SKILLS
];
