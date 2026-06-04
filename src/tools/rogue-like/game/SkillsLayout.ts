import Phaser from 'phaser';
import type { Skill } from './CombatState';

export class SkillsLayout {
    private scene: Phaser.Scene;
    public container: Phaser.GameObjects.Container;
    // On garde une référence sur les fonds des boutons pour les animer
    private skillButtons: Record<string, Phaser.GameObjects.Rectangle> = {};

    constructor(scene: Phaser.Scene, playerX: number, playerY: number, skills: Record<string, Skill>) {
        this.scene = scene;
        this.container = scene.add.container(playerX, playerY);

        // Configuration asymétrique pour éviter de chevaucher la barre de vie sous le personnage
        const layoutConfig = [
            { key: 'ArrowUp',    x: 0,    y: -75,  texture: 'icon_up' },    // Plus proche du haut
            { key: 'ArrowDown',  x: 0,    y: 115,  texture: 'icon_down' },  // Repoussée sous la barre de PV
            { key: 'ArrowLeft',  x: -100,  y: 15,   texture: 'icon_left' },  // Serrée à gauche
            { key: 'ArrowRight', x: 100,   y: 15,   texture: 'icon_right' }  // Serrée à droite
        ];

        layoutConfig.forEach(cfg => {
            const skill = skills[cfg.key];
            
            // REGLAGE : Si la compétence n'est pas encore draftée pour cette flèche, on passe au suivant
            if (!skill) return;
            
            // Fond de la case
            const btnBg = scene.add.rectangle(cfg.x, cfg.y, 44, 44, 0x111111).setStrokeStyle(2, 0xffffff);
            
            // Icône SVG
            const btnIcon = scene.add.image(cfg.x, cfg.y, cfg.texture);
            btnIcon.setScale(0.8);

            // Placement intelligent des textes descriptifs
            let labelY = cfg.y + 34; // Par défaut en dessous
            if (cfg.key === 'ArrowUp') {
                labelY = cfg.y - 34; // Pour le haut, on met le texte au-dessus
            }

            const label = scene.add.text(cfg.x, labelY, skill.name, {
                fontFamily: 'Courier New', fontSize: '11px', color: '#ffffff', fontStyle: 'bold'
            }).setOrigin(0.5);

            // On stocke la référence du fond pour l'animation plus tard
            this.skillButtons[cfg.key] = btnBg;

            this.container.add([btnBg, btnIcon, label]);
        });
    }

    /**
     * Déclenche une animation visuelle (flash de sélection) sur la compétence choisie
     */
    public playSelectionAnimation(key: string, originalColor: number = 0x111111) {
        const btnBg = this.skillButtons[key];
        if (!btnBg) return;

        // On fait flasher le fond en blanc très vite, en augmentant un peu sa taille
        this.scene.tweens.add({
            targets: btnBg,
            scale: 1.25,              // Effet de zoom sur la case
            fillColor: 0xffffff,     // Devient blanche
            duration: 80,
            yoyo: true,              // Revient à l'état initial
            ease: 'Quad.easeOut',
            onComplete: () => {
                // Sécurité pour remettre la couleur d'origine
                btnBg.fillColor = originalColor;
                btnBg.setScale(1);
            }
        });
    }

    public setVisible(visible: boolean) {
        this.container.setVisible(visible);
    }

    public destroy() {
        this.container.destroy();
    }
}
