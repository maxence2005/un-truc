import Phaser from 'phaser';
import { type CharacterStats } from '../data/Stats';
import { type Skill } from '../data/SkillRegistry';
import { type ActiveStatus } from '../data/StatusRegistry';

export class StatsSidebar {
    private scene: Phaser.Scene;
    private playerTexts: Record<string, Phaser.GameObjects.Text> = {};
    private monsterTexts: Record<string, Phaser.GameObjects.Text> = {};
    private monsterNameText!: Phaser.GameObjects.Text;
    
    // Grilles d'icônes séparées pour le joueur et le monstre
    private playerSkillIcons: Phaser.GameObjects.Image[] = [];
    private monsterSkillIcons: Phaser.GameObjects.Image[] = [];

    // Conteneurs de statuts distincts pour les futurs buffs/debuffs
    public playerStatusContainer!: Phaser.GameObjects.Container;
    public monsterStatusContainer!: Phaser.GameObjects.Container;

    constructor(scene: Phaser.Scene, x: number) {
        this.scene = scene;
        
        // Cadre principal Win95
        this.scene.add.rectangle(x, 320, 220, 620, 0xdbdbdb).setStrokeStyle(3, 0x808080);
        this.scene.add.text(x, 20, '📊 CORE_STATS.SYS', { fontFamily: 'Arial', fontSize: '13px', fontStyle: 'bold', color: '#000080' }).setOrigin(0.5);

        const statKeys = ['hp_max', 'att', 'att_magic', 'def_phys', 'def_magic', 'speed', 'crit_rate', 'crit_damage', 'agility'];
        const slotOffsets = [-60, -20, 20, 60];

        // ==========================================
        // L'ESPACE DU HÉROS (Y: 45 à 275)
        // ==========================================
        this.scene.add.text(x - 95, 45, '--- HERO STATS ---', { fontFamily: 'Courier New', fontSize: '11px', fontStyle: 'bold', color: '#000000' });
        let currentY = 62;
        statKeys.forEach(key => {
            this.playerTexts[key] = this.scene.add.text(x - 95, currentY, '', { fontFamily: 'Courier New', fontSize: '11px', color: '#000000' });
            currentY += 14;
        });

        // Icônes de compétences du Héros
        this.scene.add.text(x - 95, 195, '⚡ HERO SKILLS', { fontFamily: 'Courier New', fontSize: '11px', fontStyle: 'bold', color: '#0000aa' });
        this.playerSkillIcons = slotOffsets.map(offset => {
            this.scene.add.rectangle(x + offset, 225, 30, 30, 0x111111).setStrokeStyle(1, 0xffffff);
            return this.scene.add.image(x + offset, 225, '').setDisplaySize(24, 24).setOrigin(0.5);
        });

        // Zone de statuts du Héros
        this.scene.add.text(x - 95, 248, '🧪 HERO STATUS', { fontFamily: 'Courier New', fontSize: '10px', fontStyle: 'bold', color: '#006600' });
        this.playerStatusContainer = this.scene.add.container(x - 95, 265);
        this.createEmptyStatusSlots(x, 270);

        // ==========================================
        // L'ESPACE DU MONSTRE (Y: 300 à 630)
        // ==========================================
        this.monsterNameText = this.scene.add.text(x - 95, 310, '--- MONSTER ---', { fontFamily: 'Courier New', fontSize: '11px', fontStyle: 'bold', color: '#990000' });
        currentY = 328;
        statKeys.forEach(key => {
            this.monsterTexts[key] = this.scene.add.text(x - 95, currentY, '', { fontFamily: 'Courier New', fontSize: '11px', color: '#330000' });
            currentY += 14;
        });

        // Icônes de compétences du Monstre
        this.scene.add.text(x - 95, 460, '💀 MONSTER SKILLS', { fontFamily: 'Courier New', fontSize: '11px', fontStyle: 'bold', color: '#555555' });
        this.monsterSkillIcons = slotOffsets.map(offset => {
            this.scene.add.rectangle(x + offset, 490, 30, 30, 0x221111).setStrokeStyle(1, 0xffcccc);
            return this.scene.add.image(x + offset, 490, '').setDisplaySize(24, 24).setOrigin(0.5);
        });

        // Zone de statuts du Monstre
        this.scene.add.text(x - 95, 515, '🧪 MONSTER STATUS', { fontFamily: 'Courier New', fontSize: '10px', fontStyle: 'bold', color: '#006600' });
        this.monsterStatusContainer = this.scene.add.container(x - 95, 532);
        this.createEmptyStatusSlots(x, 537);
    }

    private createEmptyStatusSlots(baseX: number, y: number) {
        const slotOffsets = [-60, -24, 12, 48];
        slotOffsets.forEach(offset => {
            this.scene.add.rectangle(baseX + offset, y + 12, 28, 28, 0xb8b8b8).setStrokeStyle(1, 0x808080);
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

    public drawStatusEffects(
        target: 'player' | 'monster', 
        activeStatuses: ActiveStatus[],
        onHover: (status: ActiveStatus) => void,
        onOut: () => void
    ) {
        // Choix du conteneur adéquat
        const container = target === 'player' ? this.playerStatusContainer : this.monsterStatusContainer;
        
        // Nettoyage complet des icônes du tour précédent
        container.removeAll(true);

        activeStatuses.forEach((status, index) => {
            const posX = (index % 4) * 36 - 60; // Alignement en grille serrée (s'aligne avec les slots)
            const posY = Math.floor(index / 4) * 36 + 12;

            // 1. Fond cliquable/survolable
            const badgeBg = this.scene.add.rectangle(posX, posY, 26, 26, 0x222222)
                .setStrokeStyle(1, 0x000000)
                .setInteractive({ cursor: 'pointer' });
            
            // 2. Icône illustrative (Pris en charge par notre loader automatique)
            const badgeIcon = this.scene.add.image(posX, posY, status.iconKey).setDisplaySize(20, 20);

            // 3. Compteur numérique de stacks empilés (ex: x5 ou ∞)
            const displayStacks = status.isInfinite ? '∞' : `${status.stacks}`;
            const stackTxt = this.scene.add.text(posX + 6, posY + 4, displayStacks, {
                fontFamily: 'Arial', fontSize: '9px', fontStyle: 'bold', color: '#ffea00',
                backgroundColor: '#000000', padding: { x: 2, y: 1 }
            }).setOrigin(0.5);

            container.add([badgeBg, badgeIcon, stackTxt]);

            // 4. EFFETS DE SURVOL SOURIS POUR LIRE LA DESCRIPTION DÉTAILLÉE
            badgeBg.on('pointerover', () => {
                // Surbrillance cyan pour le joueur, rouge pour l'ennemi
                badgeBg.setStrokeStyle(1.5, target === 'player' ? 0x00eaff : 0xff4d4d); 
                onHover(status);
            });

            badgeBg.on('pointerout', () => {
                badgeBg.setStrokeStyle(1, 0x000000);
                onOut();
            });
        });
    }
}
