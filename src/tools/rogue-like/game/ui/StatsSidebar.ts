import Phaser from 'phaser';
import { type CharacterStats } from '../data/Stats';
import { type Skill } from '../data/SkillRegistry';

export class StatsSidebar {
    private scene: Phaser.Scene;
    private playerTexts: Record<string, Phaser.GameObjects.Text> = {};
    private monsterTexts: Record<string, Phaser.GameObjects.Text> = {};
    private monsterNameText!: Phaser.GameObjects.Text;
    
    // Grilles d'icônes séparées pour le joueur et le monstre
    private playerSkillIcons: Phaser.GameObjects.Image[] = [];
    private monsterSkillIcons: Phaser.GameObjects.Image[] = [];

    constructor(scene: Phaser.Scene, x: number) {
        this.scene = scene;
        
        // Cadre principal Win95
        this.scene.add.rectangle(x, 320, 220, 620, 0xdbdbdb).setStrokeStyle(3, 0x808080);
        this.scene.add.text(x, 20, 'CORE_STATS.SYS', { fontFamily: 'Arial', fontSize: '13px', fontStyle: 'bold', color: '#000080' }).setOrigin(0.5);

        const statKeys = ['hp_max', 'att', 'att_magic', 'def_phys', 'def_magic', 'speed', 'crit_rate', 'crit_damage', 'agility'];
        const slotOffsets = [-60, -20, 20, 60];

        // ==========================================
        // L'ESPACE DU HÉROS
        // ==========================================
        this.scene.add.text(x - 95, 45, '--- HERO STATS ---', { fontFamily: 'Courier New', fontSize: '11px', fontStyle: 'bold', color: '#000000' });
        let currentY = 62;
        statKeys.forEach(key => {
            this.playerTexts[key] = this.scene.add.text(x - 95, currentY, '', { fontFamily: 'Courier New', fontSize: '11px', color: '#000000' });
            currentY += 14;
        });

        // Icônes de compétences du Héros
        this.scene.add.text(x - 95, 195, 'HERO_SKILLS.SYS', { fontFamily: 'Courier New', fontSize: '11px', fontStyle: 'bold', color: '#0000aa' });
        this.playerSkillIcons = slotOffsets.map(offset => {
            this.scene.add.rectangle(x + offset, 225, 30, 30, 0x111111).setStrokeStyle(1, 0xffffff);
            return this.scene.add.image(x + offset, 225, '').setDisplaySize(24, 24).setOrigin(0.5);
        });

        // ==========================================
        // L'ESPACE DU MONSTRE
        // ==========================================
        this.monsterNameText = this.scene.add.text(x - 95, 310, '--- MONSTER ---', { fontFamily: 'Courier New', fontSize: '11px', fontStyle: 'bold', color: '#990000' });
        currentY = 328;
        statKeys.forEach(key => {
            this.monsterTexts[key] = this.scene.add.text(x - 95, currentY, '', { fontFamily: 'Courier New', fontSize: '11px', color: '#330000' });
            currentY += 14;
        });

        // Icônes de compétences du Monstre
        this.scene.add.text(x - 95, 460, 'MONSTER_SKILLS.SYS', { fontFamily: 'Courier New', fontSize: '11px', fontStyle: 'bold', color: '#555555' });
        this.monsterSkillIcons = slotOffsets.map(offset => {
            this.scene.add.rectangle(x + offset, 490, 30, 30, 0x221111).setStrokeStyle(1, 0xffcccc);
            return this.scene.add.image(x + offset, 490, '').setDisplaySize(24, 24).setOrigin(0.5);
        });
    }

    // Mise à jour globale des caractéristiques numériques (Héros + Monstre)
    public updateAttributes(pStats: CharacterStats, mStats: CharacterStats, monsterName: string) {
        this.monsterNameText.setText(`--- ${monsterName.toUpperCase()} ---`);
        const formatValue = (k: string, v: number) => {
            if (k === 'crit_rate' || k === 'agility') return `${Math.round(v * 100)}%`;
            if (k === 'crit_damage') return `x${v.toFixed(2)}`;
            return Math.round(v).toString();
        };

        Object.keys(this.playerTexts).forEach(key => {
            this.playerTexts[key]!.setText(`${key.toUpperCase().padEnd(10, ' ')}: ${formatValue(key, pStats[key as keyof CharacterStats])}`);
            this.monsterTexts[key]!.setText(`${key.toUpperCase().padEnd(10, ' ')}: ${formatValue(key, mStats[key as keyof CharacterStats])}`);
        });
    }

    // Gestion de l'affichage et du survol des compétences du Héros
    public updatePlayerSkills(skills: Record<string, Skill>, onHover: (skill: Skill) => void, onOut: () => void) {
        const directions = ['ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowLeft'];
        directions.forEach((key, idx) => {
            const skill = skills[key];
            const icon = this.playerSkillIcons[idx]!;
            this.setupIconInteractions(icon, skill, onHover, onOut, 0x00eaff);
        });
    }

    // Gestion de l'affichage et du survol des compétences du Monstre (Reçoit un tableau simple)
    public updateMonsterSkills(skills: Skill[], onHover: (skill: Skill) => void, onOut: () => void) {
        this.monsterSkillIcons.forEach((icon, idx) => {
            const skill = skills[idx];
            this.setupIconInteractions(icon, skill, onHover, onOut, 0xff4d4d); // Surbrillance rouge pour l'ennemi
        });
    }

    // Abstraction réutilisable pour éviter la duplication de logique d'événements souris
    private setupIconInteractions(icon: Phaser.GameObjects.Image, skill: Skill | undefined, onHover: (skill: Skill) => void, onOut: () => void, tintColor: number) {
        if (skill) {
            icon.setTexture(`skill_${skill.iconKey}`).setAlpha(1).setInteractive({ cursor: 'pointer' });
            icon.removeAllListeners();
            icon.on('pointerover', () => { icon.setTint(tintColor); onHover(skill); });
            icon.on('pointerout', () => { icon.clearTint(); onOut(); });
        } else {
            icon.setAlpha(0).disableInteractive();
        }
    }
}
