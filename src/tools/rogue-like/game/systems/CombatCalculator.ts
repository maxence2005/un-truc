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
    /**
     * Analyse les statuts pour calculer le coefficient d'une statistique spécifique.
     * Exemples de statuts : att_up_1 (+20% att), speed_down_3 (-60% speed)
     */
    public static getStatModifier(statuses: ActiveStatus[], prefix: 'att' | 'def' | 'att_mag' | 'def_mag' | 'speed'): number {
        let multiplier = 1.0;
        
        statuses.forEach(status => {
            const parts = status.id.split('_');
            let statKey = parts[0];
            let suffix = parts[1];
            let tier = parts[2];
            
            if (parts.length === 4) {
                statKey = `${parts[0]}_${parts[1]}`;
                suffix = parts[2];
                tier = parts[3];
            }
            
            if (statKey === prefix) {
                let percentage = 0;
                if (tier === '1') percentage = 0.20;
                else if (tier === '2') percentage = 0.40;
                else if (tier === '3') percentage = 0.60;
                
                if (suffix === 'up') {
                    multiplier += percentage;
                } else if (suffix === 'down') {
                    multiplier -= percentage;
                }
            }
        });
        
        return Math.max(0.10, multiplier); // Empêche une stat de descendre en dessous de 10%
    }

    public static calculateAction(
        skill: Skill,
        casterStats: CharacterStats,
        targetStats: CharacterStats,
        casterStatuses: ActiveStatus[],
        targetStatuses: ActiveStatus[],
        casterName: string,
        targetName: string,
        skillUsageCount: number = 0
    ): BattleActionResult {
        let logMessage = `[${casterName}] utilise [${skill.name}]. `;
        
        // 1. VÉRIFICATION DES EFFETS PRÉ-ACTION DU LANCEUR (Saignement, Brûlure, Gel & Sacrifice)
        let casterSelfDamage = 0;
        const bleed = casterStatuses.find(s => s.id === 'bleed');
        const burn = casterStatuses.find(s => s.id === 'burn');
        const freeze = casterStatuses.find(s => s.id === 'freeze');

        if (bleed) {
            casterSelfDamage += bleed.stacks * 1; // 1 dégât par charge de bleed
            logMessage += `[Saignement] lui inflige ${bleed.stacks * 1} dégât(s). `;
        }
        if (burn) {
            casterSelfDamage += burn.stacks * 5; // 5 dégâts par charge de burn
            logMessage += `[Brûlure] lui inflige ${burn.stacks * 5} dégât(s). `;
        }
        if (freeze) {
            // Gel: inflige par charge 50% de la défense magique du personnage gelé
            const freezeDamage = Math.round(freeze.stacks * (casterStats.def_magic * 0.50));
            casterSelfDamage += freezeDamage;
            logMessage += `[Gel] lui inflige ${freezeDamage} dégât(s). `;
        }
        if (skill.casterHpCostPercent) {
            const selfHpCost = Math.round(casterStats.hp_max * skill.casterHpCostPercent);
            casterSelfDamage += selfHpCost;
            logMessage += `[Sacrifice] consomme ${selfHpCost} PV. `;
        }

        // Ajustement des statistiques actives selon les bonus/malus de statistiques dynamiques
        const activeCasterStats = { ...casterStats };
        const activeTargetStats = { ...targetStats };

        activeCasterStats.att = Math.round(activeCasterStats.att * this.getStatModifier(casterStatuses, 'att'));
        activeCasterStats.att_magic = Math.round(activeCasterStats.att_magic * this.getStatModifier(casterStatuses, 'att_mag'));
        activeCasterStats.def_phys = Math.round(activeCasterStats.def_phys * this.getStatModifier(casterStatuses, 'def'));
        activeCasterStats.def_magic = Math.round(activeCasterStats.def_magic * this.getStatModifier(casterStatuses, 'def_mag'));
        activeCasterStats.speed = Math.round(activeCasterStats.speed * this.getStatModifier(casterStatuses, 'speed'));

        activeTargetStats.att = Math.round(activeTargetStats.att * this.getStatModifier(targetStatuses, 'att'));
        activeTargetStats.att_magic = Math.round(activeTargetStats.att_magic * this.getStatModifier(targetStatuses, 'att_mag'));
        activeTargetStats.def_phys = Math.round(activeTargetStats.def_phys * this.getStatModifier(targetStatuses, 'def'));
        activeTargetStats.def_magic = Math.round(activeTargetStats.def_magic * this.getStatModifier(targetStatuses, 'def_mag'));
        activeTargetStats.speed = Math.round(activeTargetStats.speed * this.getStatModifier(targetStatuses, 'speed'));

        // 2. RECOMPOSITION DU SOIN (Réduit de 50% si le lanceur est Brûlé)
        let finalHeal = skill.healValue || 0;
        if (finalHeal > 0 && burn) {
            finalHeal = Math.round(finalHeal * 0.5);
            logMessage += `Soins réduits de 50% par la Brûlure. `;
        }

        // Si c'est un sort pur sans dégâts et sans statut à infliger, on coupe court
        const hasScaling = Object.keys(skill.scaling).length > 0 || skill.flatDamage !== undefined || skill.name === 'Apprentissage Continu';
        if (skill.damageType === 'pure' && !skill.inflictsStatus && !skill.inflictsStatuses && !hasScaling) {
            return { damage: 0, heal: finalHeal, casterSelfDamage, isCrit: false, isDodged: false, logMessage };
        }

        // 3. VÉRIFICATION DE L'ESQUIVE (Agilité de la cible)
        if (skill.damageType !== 'pure' && Math.random() < activeTargetStats.agility) {
            return { damage: 0, heal: finalHeal, casterSelfDamage, isCrit: false, isDodged: true, logMessage: logMessage + `L'attaque est esquivée !` };
        }

        // 4. CALCUL DU SCALING DES DÉGÂTS
        let baseDamage = skill.flatDamage || 0;
        
        if (skill.name === 'Apprentissage Continu') {
            const usageCount = skillUsageCount || 0;
            const currentCoef = 0.30 + Math.max(0, usageCount - 1) * 0.10;
            baseDamage += activeCasterStats.att * currentCoef;
        } else if (skill.name === 'Boule de feu') {
            // Chance sur 1000 de se transformer en Boule de feu ultime (999 dégâts fixes)
            if (Math.random() < 0.001) {
                baseDamage = 999;
                logMessage += `[SYS.EXCEPTION] LA BOULE DE FEU DEVIENT ULTIME (999 DEGATS FIXES) ! `;
            }
        } else {
            Object.entries(skill.scaling).forEach(([stat, coefficient]) => {
                const statValue = activeCasterStats[stat as keyof CharacterStats] || 0;
                baseDamage += statValue * (coefficient || 0);
            });
        }

        // 5. APPLICATION DES DÉFENSES
        let mitigatedDamage = baseDamage;
        if (skill.damageType === 'physical') {
            mitigatedDamage = Math.max(1, baseDamage - activeTargetStats.def_phys);
        } else if (skill.damageType === 'magical') {
            mitigatedDamage = Math.max(1, baseDamage - activeTargetStats.def_magic);
        }

        // 6. PROTECTION PAR LE STATUT "VOL" (Réduction de 75% si pas de capacité Anti-Air)
        const casterHasFlight = casterStatuses.some(s => s.id === 'flight');
        const isAntiAir = skill.hasAntiAir || casterHasFlight;

        const hasFlight = targetStatuses.some(s => s.id === 'flight');
        if (hasFlight && !isAntiAir) {
            mitigatedDamage = mitigatedDamage * 0.25;
            logMessage += `Cible en Vol ! Dégâts réduits de 75%. `;
        }

        // 7. CRITIQUE
        let isCrit = false;
        if (Math.random() < activeCasterStats.crit_rate) {
            isCrit = true;
            mitigatedDamage = mitigatedDamage * activeCasterStats.crit_damage;
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
