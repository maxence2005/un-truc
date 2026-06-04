import Phaser from 'phaser';

export class CharacterVisual {
    private scene: Phaser.Scene;
    public container: Phaser.GameObjects.Container;
    private image: Phaser.GameObjects.Image; // On utilise un composant Image classique
    private hpBar: Phaser.GameObjects.Rectangle;
    private hpText: Phaser.GameObjects.Text;

    constructor(scene: Phaser.Scene, x: number, y: number, textureKey: string) {
        this.scene = scene;
        this.container = scene.add.container(x, y);

        // 1. On crée l'image avec la texture SVG ('hero_svg' ou 'monster_tiger', etc.)
        this.image = scene.add.image(0, 0, textureKey);
        
        // On l'agrandit un peu si nécessaire (le SVG ne pixelise pas !)
        this.image.setScale(1.5); 

        // 2. Interface (Barre de vie) sous le personnage
        const barBg = scene.add.rectangle(0, 55, 90, 12, 0x333333).setStrokeStyle(1, 0x000000);
        const barColor = textureKey === 'hero_svg' ? 0x00ff00 : 0xff003c;
        
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
    }
}
