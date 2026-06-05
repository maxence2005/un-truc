import Phaser from 'phaser';
import type { Skill } from './data/SkillRegistry';

export class SkillsLayout {
    private scene: Phaser.Scene;
    public container: Phaser.GameObjects.Container;
    // On garde une référence sur les fonds des boutons pour les animer
    private skillButtons: Record<string, Phaser.GameObjects.Rectangle> = {};

    constructor(scene: Phaser.Scene, playerX: number, playerY: number, skills: Record<string, Skill>) {
        this.scene = scene;
        this.container = scene.add.container(playerX, playerY);

        // Configuration du placement des 4 touches autour du joueur
        const layoutConfig = [
            { key: 'ArrowUp',    x: 0,    y: -75,  arrowIcon: 'arrow_up' },
            { key: 'ArrowDown',  x: 0,    y: 115,  arrowIcon: 'arrow_down' },
            { key: 'ArrowLeft',  x: -100,  y: 15,   arrowIcon: 'arrow_left' },
            { key: 'ArrowRight', x: 100,   y: 15,   arrowIcon: 'arrow_right' }
        ];

        layoutConfig.forEach(cfg => {
            const skill = skills[cfg.key];
            if (!skill) return; // Si le slot n'est pas encore débloqué, on passe

            // 1. Fond de la case (Agrandie un peu pour le confort visuel : 48x48)
            const btnBg = scene.add.rectangle(cfg.x, cfg.y, 48, 48, 0x111111).setStrokeStyle(2, 0xffffff);

            // 2. Icône personnalisée de la compétence (Chargée dynamiquement)
            const skillTextureKey = `skill_${skill.iconKey}`;
            const btnIcon = scene.add.image(cfg.x, cfg.y, skillTextureKey);
            btnIcon.setDisplaySize(34, 34); // On adapte la taille du SVG dans le bouton

            // 3. Mini-indicateur de direction (badge dans le coin supérieur gauche du bouton)
            const miniArrow = scene.add.image(cfg.x - 14, cfg.y - 14, cfg.arrowIcon);
            miniArrow.setDisplaySize(14, 14).setAlpha(0.8);

            // 4. Texte sous/sur le bouton
            let labelY = cfg.y + 36;
            if (cfg.key === 'ArrowUp') {
                labelY = cfg.y - 36;
            }
            const label = scene.add.text(cfg.x, labelY, skill.name, {
                fontFamily: 'Courier New', fontSize: '11px', color: '#ffffff', fontStyle: 'bold'
            }).setOrigin(0.5);

            // Stockage pour l'animation de flash lors de l'appui
            this.skillButtons[cfg.key] = btnBg;

            // Ajout de tous les éléments au conteneur Phaser
            this.container.add([btnBg, btnIcon, miniArrow, label]);
        });
    }

    public playSelectionAnimation(key: string, originalColor: number = 0x111111) {
        const btnBg = this.skillButtons[key];
        if (!btnBg) return;

        this.scene.tweens.add({
            targets: btnBg,
            scale: 1.25,
            fillColor: 0xffffff,
            duration: 80,
            yoyo: true,
            ease: 'Quad.easeOut',
            onComplete: () => {
                btnBg.fillColor = originalColor;
                btnBg.setScale(1);
            }
        });
    }

    public setVisible(visible: boolean) { this.container.setVisible(visible); }
    public destroy() { this.container.destroy(); }
}
