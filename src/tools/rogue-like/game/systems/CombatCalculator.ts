// src/tools/rogue-like/game/systems/CombatCalculator.ts
import { type Skill } from '../data/SkillRegistry';
import { type CharacterStats } from '../data/Stats';
import { type ActiveStatus } from '../data/StatusRegistry';

export interface BattleActionResult {
    damage: number;
    heal: number;
    casterSelfDamage: number;
    isCrit: boolean;
    isDodged: boolean;
    logMessage: string;
}

export class CombatCalculator {
    public static calculateAction(
        skill: Skill,
        casterStats: CharacterStats,
        targetStats: CharacterStats,
        casterStatuses: ActiveStatus[],
        targetStatuses: ActiveStatus[],
        casterName: string,
        targetName: string
    ): BattleActionResult {
        let logMessage = `[${casterName}] utilise [${skill.name}]. `;
        
        // 1. VÉRIFICATION DES EFFETS PRÉ-ACTION DU LANCEUR (Saignement & Brûlure)
        let casterSelfDamage = 0;
        const bleed = casterStatuses.find(s => s.id === 'bleed');
        const burn = casterStatuses.find(s => s.id === 'burn');

        if (bleed) {
            casterSelfDamage += bleed.stacks * 1; // 1 dégât par stack de bleed
            logMessage += `[Saignement] lui inflige ${bleed.stacks * 1} dégât(s). `;
        }
        if (burn) {
            casterSelfDamage += burn.stacks * 5; // 5 dégâts par stack de burn
            logMessage += `[Brûlure] lui inflige ${burn.stacks * 5} dégât(s). `;
        }

        // 2. RECOMPOSITION DU SOIN (Réduit de 50% si le lanceur est Brûlé)
        let finalHeal = skill.healValue || 0;
        if (finalHeal > 0 && burn) {
            finalHeal = Math.round(finalHeal * 0.5);
            logMessage += `Soins réduits de 50% par la Brûlure. `;
        }

        // Si c'est un sort pur de soin/utilitaire sans dégâts, on coupe court aux calculs offensifs
        if (skill.damageType === 'pure' && !skill.inflictsStatus && !Object.keys(skill.scaling).length) {
            return { damage: 0, heal: finalHeal, casterSelfDamage, isCrit: false, isDodged: false, logMessage };
        }

        // 3. VÉRIFICATION DE L'ESQUIVE (Agilité de la cible)
        if (skill.damageType !== 'pure' && Math.random() < targetStats.agility) {
            return { damage: 0, heal: finalHeal, casterSelfDamage, isCrit: false, isDodged: true, logMessage: logMessage + `L'attaque est esquivée !` };
        }

        // 4. CALCUL DU SCALING DES DÉGÂTS
        let baseDamage = 0;
        Object.entries(skill.scaling).forEach(([stat, coefficient]) => {
            const statValue = casterStats[stat as keyof CharacterStats] || 0;
            baseDamage += statValue * (coefficient || 0);
        });

        // 5. APPLICATION DES DÉFENSES
        let mitigatedDamage = baseDamage;
        if (skill.damageType === 'physical') {
            mitigatedDamage = Math.max(1, baseDamage - targetStats.def_phys);
        } else if (skill.damageType === 'magical') {
            mitigatedDamage = Math.max(1, baseDamage - targetStats.def_magic);
        }

        // 6. PROTECTION PAR LE STATUT "VOL" (Réduction de 75% si pas de capacité Anti-Air)
        // RÈGLE : Si le lanceur est lui-même en train de Voler, toutes ses attaques deviennent Anti-Aériennes
        const casterHasFlight = casterStatuses.some(s => s.id === 'flight');
        const isAntiAir = skill.hasAntiAir || casterHasFlight;

        const hasFlight = targetStatuses.some(s => s.id === 'flight');
        if (hasFlight && !isAntiAir) {
            mitigatedDamage = mitigatedDamage * 0.25;
            logMessage += `Cible en Vol ! Dégâts réduits de 75%. `;
        }

        // 7. CRITIQUE
        let isCrit = false;
        if (Math.random() < casterStats.crit_rate) {
            isCrit = true;
            mitigatedDamage = mitigatedDamage * casterStats.crit_damage;
        }

        mitigatedDamage = Math.round(mitigatedDamage);
        logMessage += `Inflige ${mitigatedDamage} dégâts.`;

        return {
            damage: mitigatedDamage,
            heal: finalHeal,
            casterSelfDamage,
            isCrit,
            isDodged: false,
            logMessage
        };
    }
}
