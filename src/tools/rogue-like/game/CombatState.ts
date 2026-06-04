export interface Skill {
    name: string;
    damage: number;
    heal: number;
    desc: string;
}

export interface MonsterData {
    name: string;
    assetKey: string;
}

export class CombatState {
    public score = 0;
    public playerHp = 100;
    public playerMaxHp = 100;
    public monsterHp = 50;
    public monsterMaxHp = 50;
    public currentMonster!: MonsterData;
    
    // Commence vide, se remplit au fil des monstres tués
    public skills: Record<string, Skill> = {};

    // Ordre de déblocage des flèches au fil des rounds
    public readonly slotOrder = ['ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowLeft'];

    private readonly monsters: MonsterData[] = [
        { name: 'Tigre Pixel', assetKey: 'monster_tiger' },
        { name: 'Slime Gluant', assetKey: 'monster_slime' },
        { name: 'Robot Cyber', assetKey: 'monster_robot' },
        { name: 'Fantôme Code', assetKey: 'monster_ghost' },
        { name: 'Démon Bug', assetKey: 'monster_demon' }
    ];

    // Banque globale de toutes les compétences possibles du jeu
    public static readonly ALL_SKILLS: Skill[] = [
        { name: 'Sabre Laser', damage: 18, heal: 0, desc: 'Dégâts d\'énergie stables' },
        { name: 'Nano-Soin', damage: 0, heal: 25, desc: 'Te soigne de 25 PV' },
        { name: 'Coup Critique', damage: 35, heal: 0, desc: 'Gros dégâts (50% de chance d\'échec)' },
        { name: 'Drain de Vie', damage: 10, heal: 12, desc: 'Vole des PV à l\'ennemi' },
        { name: 'Surcharge', damage: 25, heal: 0, desc: 'Dégâts lourds' },
        { name: 'Bouclier Réactif', damage: 8, heal: 6, desc: 'Petite attaque + petit soin' },
        { name: 'Onde de Choc', damage: 15, heal: 0, desc: 'Frappe l\'ennemi au sol' },
        { name: 'Laser Plasma', damage: 22, heal: 0, desc: 'Brûle la cible' }
    ];

    constructor() {
        this.pickRandomMonster();
    }

    /**
     * Pioche 3 compétences uniques au hasard dans la banque, en excluant celles déjà possédées.
     */
    public getRandomThreeChoices(): Skill[] {
        const ownedSkillNames = Object.values(this.skills).map(s => s.name);
        const availableSkills = CombatState.ALL_SKILLS.filter(s => !ownedSkillNames.includes(s.name));
        
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
        this.monsterMaxHp += 15;
        this.monsterHp = this.monsterMaxHp;
        this.pickRandomMonster();
    }

    private pickRandomMonster() {
        const randomIndex = Math.floor(Math.random() * this.monsters.length);
        this.currentMonster = this.monsters[randomIndex] as MonsterData;
    }
}
