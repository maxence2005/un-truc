import { ALL_SKILLS, type Skill } from '../data/SkillRegistry';
import { MONSTERS, type MonsterTemplate } from '../data/MonsterRegistry';
import { type CharacterStats, DEFAULT_PLAYER_STATS } from '../data/Stats';
import { type ActiveStatus, STATUS_TEMPLATES, type StatusId } from '../data/StatusRegistry';
import Phaser from 'phaser';

export interface StatUpgrade {
    name: string;
    desc: string;
    statKey: string;
    value: number;
}

export class CombatState {
    public score = 0;
    public classType: 'humain' | 'mage' | 'guerrier' | 'cyborg' = 'humain';
    public playerHp = 100;
    public playerMaxHp = 100;
    public monsterHp = 50;
    public monsterMaxHp = 50;
    public currentMonster!: MonsterTemplate;
    
    // Statistiques actives du joueur (permettant des bonus futurs)
    public playerStats: CharacterStats = { ...DEFAULT_PLAYER_STATS };

    // Commence vide, se remplit au fil des monstres tués
    public skills: Record<string, Skill> = {};

    // Enregistre le nombre de fois qu'une compétence a été lancée
    public skillUsage: Record<string, number> = {};

    // Ordre de déblocage des flèches au fil des rounds
    public readonly slotOrder = ['ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowLeft'];

    // --- TRACKING DES STATUTS ---
    public playerStatuses: ActiveStatus[] = [];
    public monsterStatuses: ActiveStatus[] = [];

    constructor() {
        this.pickRandomMonster();
        this.monsterMaxHp = this.currentMonster.stats.hp_max;
        this.monsterHp = this.monsterMaxHp;
        this.applyMonsterStartStatuses();
    }

    private applyMonsterStartStatuses() {
        if (this.currentMonster.startStatuses) {
            this.currentMonster.startStatuses.forEach(s => {
                const template = STATUS_TEMPLATES[s.id];
                this.monsterStatuses.push({
                    id: s.id,
                    name: template.name,
                    desc: template.desc,
                    iconKey: template.iconKey,
                    stacks: s.stacks,
                    isInfinite: s.isInfinite
                });
            });
        }
    }

    public addStatus(target: 'player' | 'monster', statusId: StatusId, amount: number) {
        const list = target === 'player' ? this.playerStatuses : this.monsterStatuses;
        const template = STATUS_TEMPLATES[statusId];
        const existing = list.find(s => s.id === statusId);

        if (existing) {
            existing.stacks += amount;
            if (template.maxStacks && existing.stacks > template.maxStacks) {
                existing.stacks = template.maxStacks;
            }
        } else {
            list.push({ 
                id: statusId, 
                name: template.name, 
                desc: template.desc, 
                iconKey: template.iconKey, 
                stacks: amount 
            });
        }
    }

    public removeStatus(target: 'player' | 'monster', statusId: StatusId) {
        if (target === 'player') {
            this.playerStatuses = this.playerStatuses.filter(s => s.id !== statusId);
        } else {
            this.monsterStatuses = this.monsterStatuses.filter(s => s.id !== statusId);
        }
    }

    /**
     * Pioche 3 compétences uniques au hasard dans la banque, en excluant celles déjà possédées.
     */
    public getRandomThreeChoices(): Skill[] {
        const ownedSkillNames = Object.values(this.skills).map(s => s.name);
        const availableSkills = ALL_SKILLS.filter(s => !ownedSkillNames.includes(s.name));
        
        const shuffled = [...availableSkills].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, 3);
    }

    public applyHeal(amount: number) {
        this.playerHp = Math.min(this.playerMaxHp, this.playerHp + amount);
    }

    public applyDamageToMonster(amount: number): boolean {
        this.monsterHp = Math.max(0, this.monsterHp - amount);
        return this.monsterHp <= 0; // Renvoie vrai si le monstre meurt
    }

    public applyDamageToPlayer(amount: number): boolean {
        this.playerHp = Math.max(0, this.playerHp - amount);
        return this.playerHp <= 0; // Renvoie vrai si le joueur meurt
    }

    public setupNextMonster() {
        this.score += 1;
        this.pickRandomMonster();
        
        // Équilibrage progressif de toutes les statistiques basé sur le score
        const stats = this.currentMonster.stats;

        // 1. PV Max (+15 flat par niveau)
        this.monsterMaxHp = stats.hp_max + (this.score * 15);
        this.monsterHp = this.monsterMaxHp;
        stats.hp_max = this.monsterMaxHp;

        // 2. Attaque et Attaque Magique (+8% par niveau)
        stats.att = Math.round(stats.att * (1 + this.score * 0.08));
        stats.att_magic = Math.round(stats.att_magic * (1 + this.score * 0.08));

        // 3. Défenses (+6% par niveau)
        stats.def_phys = Math.round(stats.def_phys * (1 + this.score * 0.06));
        stats.def_magic = Math.round(stats.def_magic * (1 + this.score * 0.06));

        // 4. Vitesse (+3% par niveau)
        stats.speed = Math.round(stats.speed * (1 + this.score * 0.03));

        // 5. Chances de critique (+1% par niveau, max 50%)
        stats.crit_rate = Math.min(0.50, stats.crit_rate + this.score * 0.01);

        // 6. Multiplicateur Critique (+2% de dégâts critiques par niveau)
        stats.crit_damage = stats.crit_damage + this.score * 0.02;
        
        // On nettoie uniquement les statuts du monstre à la fin d'un combat (les statuts du joueur persistent)
        this.monsterStatuses = [];

        this.applyMonsterStartStatuses();
    }

    private pickRandomMonster() {
        const randomIndex = Math.floor(Math.random() * MONSTERS.length);
        const template = MONSTERS[randomIndex] as MonsterTemplate;
        this.currentMonster = {
            ...template,
            stats: { ...template.stats }
        };
    }

    // --- RECOMPENSES LOGIQUE ---
    public isRewardScore(): boolean {
        const s = this.score;
        if (s === 2 || s === 3 || s === 4 || s === 5) return true;
        if (s > 5 && s % 5 === 0) return true;
        return false;
    }

    public getNextRewardScore(): number {
        const s = this.score;
        if (s < 2) return 2;
        if (s === 2) return 3;
        if (s === 3) return 4;
        if (s === 4) return 5;
        return Math.floor(s / 5) * 5 + 5;
    }

    public getRandomThreeStatUpgrades(): StatUpgrade[] {
        const pool: StatUpgrade[] = [
            { name: 'SYS.VITALITY', desc: 'PV Max +20 points (soigne d\'autant).', statKey: 'hp_max', value: 20 },
            { name: 'DRV.PHYS_ATT', desc: 'Attaque Physique +5 points.', statKey: 'att', value: 5 },
            { name: 'DRV.MAGI_ATT', desc: 'Attaque Magique +5 points.', statKey: 'att_magic', value: 5 },
            { name: 'SYS.DEF_PHYS', desc: 'Défense Physique +4 points.', statKey: 'def_phys', value: 4 },
            { name: 'SYS.DEF_MAGI', desc: 'Défense Magique +4 points.', statKey: 'def_magic', value: 4 },
            { name: 'SYS.OVERCLOCK', desc: 'Vitesse +3 points.', statKey: 'speed', value: 3 },
            { name: 'SYS.CRITICAL', desc: 'Taux de Critique +5%.', statKey: 'crit_rate', value: 0.05 },
            { name: 'DRV.EVASION', desc: 'Agilité (esquive) +4%.', statKey: 'agility', value: 0.04 }
        ];
        // Utiliser la fonction de shuffle Phaser
        return Phaser.Utils.Array.Shuffle(pool).slice(0, 3);
    }

    public applyStatUpgrade(statKey: string, value: number) {
        if (statKey === 'hp_max') {
            this.playerMaxHp += value;
            this.playerHp += value;
        }
        
        const key = statKey as keyof CharacterStats;
        this.playerStats[key] = (this.playerStats[key] || 0) + value;
    }
}
