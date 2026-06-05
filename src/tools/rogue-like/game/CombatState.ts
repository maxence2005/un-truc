// src/tools/rogue-like/game/CombatState.ts
import { ALL_SKILLS, type Skill } from './data/SkillRegistry';
import { MONSTERS, type MonsterTemplate } from './data/MonsterRegistry';
import { type CharacterStats, DEFAULT_PLAYER_STATS } from './data/Stats';
import { type ActiveStatus, STATUS_TEMPLATES, type StatusId } from './data/StatusRegistry';

export class CombatState {
    public score = 0;
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
        // Équilibrage progressif basé sur le score
        this.monsterMaxHp = this.currentMonster.stats.hp_max + (this.score * 15);
        this.monsterHp = this.monsterMaxHp;
        // Aligner la stat hp_max clonée pour l'affichage de la sidebar
        this.currentMonster.stats.hp_max = this.monsterMaxHp;
        
        // On nettoie les statuts à la fin d'un combat
        this.playerStatuses = [];
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
}
