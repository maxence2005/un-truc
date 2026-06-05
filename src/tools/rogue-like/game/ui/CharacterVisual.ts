import Phaser from 'phaser';
import { type ActiveStatus } from '../data/StatusRegistry';

export class CharacterVisual {
    private scene: Phaser.Scene;
    public container: Phaser.GameObjects.Container;
    private image: Phaser.GameObjects.Image; // On utilise un composant Image classique
    private hpBar: Phaser.GameObjects.Rectangle;
    private hpText: Phaser.GameObjects.Text;
    private statusIconsContainer: Phaser.GameObjects.Container | null = null;

    constructor(scene: Phaser.Scene, x: number, y: number, textureKey: string) {
        this.scene = scene;
        this.container = scene.add.container(x, y);

        // 1. On crée l'image avec la texture SVG ('hero_svg' ou 'monster_tiger', etc.)
        this.image = scene.add.image(0, 0, textureKey);
        
        // On l'agrandit un peu si nécessaire (le SVG ne pixelise pas !)
        this.image.setScale(1.5); 

        // 2. Interface (Barre de vie) sous le personnage
        const barBg = scene.add.rectangle(0, 55, 90, 12, 0x333333).setStrokeStyle(1, 0x000000);
        const barColor = textureKey.startsWith('monster_') ? 0xff003c : 0x00ff00;
        
        this.hpBar = scene.add.rectangle(-45, 55, 90, 12, barColor).setOrigin(0, 0.5);
        this.hpText = scene.add.text(-45, 68, '', { fontFamily: 'Courier New', fontSize: '12px', color: '#ffffff' });

        this.container.add([this.image, barBg, this.hpBar, this.hpText]);
    }

    public updateTexture(textureKey: string) {
        this.image.setTexture(textureKey);
    }

    public updateHp(current: number, max: number) {
        this.hpText.setText(`${current}/${max} PV`);
        const ratio = Math.max(0, current / max);
        this.hpBar.setScale(ratio, 1);
    }

    public updateStatusEffects(
        activeStatuses: ActiveStatus[],
        isLeftAligned: boolean,
        onHover: (status: ActiveStatus) => void,
        onOut: () => void
    ) {
        if (this.statusIconsContainer) {
            this.statusIconsContainer.destroy();
        }
        
        this.statusIconsContainer = this.scene.add.container(0, 0);
        this.container.add(this.statusIconsContainer);

        const xOffset = isLeftAligned ? -75 : 75;

        activeStatuses.forEach((status, index) => {
            const posY = -45 + (index * 30); // Alignement vertical

            const badgeBg = this.scene.add.rectangle(xOffset, posY, 22, 22, 0x222222)
                .setStrokeStyle(1, 0x000000)
                .setInteractive({ cursor: 'pointer' });

            const badgeIcon = this.scene.add.image(xOffset, posY, status.iconKey).setDisplaySize(16, 16);

            const displayStacks = status.isInfinite ? '∞' : `${status.stacks}`;
            const stackTxt = this.scene.add.text(xOffset + 5, posY + 4, displayStacks, {
                fontFamily: 'Arial', fontSize: '8px', fontStyle: 'bold', color: '#ffea00',
                backgroundColor: '#000000', padding: { x: 2, y: 1 }
            }).setOrigin(0.5);

            this.statusIconsContainer!.add([badgeBg, badgeIcon, stackTxt]);

            badgeBg.on('pointerover', () => {
                badgeBg.setStrokeStyle(1.5, isLeftAligned ? 0x00eaff : 0xff4d4d);
                onHover(status);
            });

            badgeBg.on('pointerout', () => {
                badgeBg.setStrokeStyle(1, 0x000000);
                onOut();
            });
        });
    }

    public playAttackAnimation(targetX: number, onImpact: () => void) {
        // Animation physique (Bascule en avant/arrière pour simuler le coup)
        this.scene.tweens.add({
            targets: this.container,
            x: targetX,
            angle: this.container.x < targetX ? 15 : -15, // Se penche vers l'ennemi
            duration: 150,
            yoyo: true,
            ease: 'Quad.easeInOut',
            onComplete: () => {
                this.container.setAngle(0); // Remet le personnage droit
                onImpact();
            }
        });
    }

    public playFlashAnimation(flashColor: number) {
        // Le flash de couleur fonctionne aussi sur le SVG via le Tint !
        this.image.setTint(flashColor);
        this.scene.time.delayedCall(150, () => {
            this.image.clearTint();
        });
    }

    public playDeathAnimation(onComplete: () => void) {
        this.scene.tweens.add({
            targets: this.container,
            alpha: 0,
            scale: 0.1,
            angle: 45,
            duration: 500,
            onComplete
        });
    }

    public resetVisual() {
        this.container.setAlpha(1).setScale(1).setAngle(0);
        if (this.statusIconsContainer) {
            this.statusIconsContainer.destroy();
            this.statusIconsContainer = null;
        }
    }
}
