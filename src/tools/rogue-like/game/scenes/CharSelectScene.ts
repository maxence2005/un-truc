import { Scene } from 'phaser';
import { HeroFactory, type GeneratedHero } from '../data/HeroFactory';

export class CharSelectScene extends Scene {
    private options!: GeneratedHero[];

    constructor() { 
        super('CharSelectScene'); 
    }

    create() {
        // Fond bleu-vert Windows 95
        this.cameras.main.setBackgroundColor('#008080');

        // 1. Génération de nos 3 profils d'humains équilibrés
        this.options = HeroFactory.generateThreeOptions();

        // 2. Traitement et injection instantanée des chaînes SVG dans le cache de Phaser
        this.options.forEach(hero => {
            const blob = new Blob([hero.svgRaw], { type: 'image/svg+xml' });
            const url = URL.createObjectURL(blob);
            this.load.svg(hero.assetKey, url);
        });

        // Validation du cache pour le rendu
        this.load.once('complete', () => this.drawSelectionUI());
        this.load.start();
    }

    private drawSelectionUI() {
        this.add.text(480, 50, '💻 INITIALISATION_SYSTEME.EXE : RECRUTEMENT DE L\'HUMAIN', {
            fontFamily: 'Arial, sans-serif', 
            fontSize: '18px', 
            fontStyle: 'bold', 
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);

        this.options.forEach((hero, index) => {
            const posX = 180 + (index * 300);
            const container = this.add.container(posX, 320);

            // Boîte Win95 standard
            const bg = this.add.rectangle(0, 0, 250, 420, 0xdbdbdb).setStrokeStyle(3, 0x808080).setInteractive({ cursor: 'pointer' });
            
            // Relief 3D
            const shadow = this.add.rectangle(4, 4, 250, 420, 0x000000, 0.4);

            const header = this.add.rectangle(0, -195, 244, 24, 0x000080);
            const title = this.add.text(-110, -204, hero.name, { 
                fontFamily: 'Arial, sans-serif', 
                fontSize: '12px', 
                fontStyle: 'bold', 
                color: '#ffffff' 
            });
            
            // Texture humaine générée
            const sprite = this.add.image(0, -90, hero.assetKey).setScale(2.5);
            const hint = this.add.text(0, 180, '[ CHARGER LES CIRCUITS ]', { 
                fontFamily: 'Arial, sans-serif', 
                fontSize: '11px', 
                fontStyle: 'bold', 
                color: '#0000aa' 
            }).setOrigin(0.5);

            // Ajout ordonné (la shadow en premier pour s'afficher derrière, puis les autres éléments de fond)
            container.add([shadow, bg, header, title, sprite, hint]);
            container.sendToBack(shadow);

            let currentY = -10;
            const sumPrimary = hero.stats.att + hero.stats.att_magic + hero.stats.def_phys + hero.stats.def_magic + hero.stats.speed;

            Object.entries(hero.stats).forEach(([key, value]) => {
                let displayVal = Math.round(value).toString();
                if (key === 'crit_rate' || key === 'agility') {
                    displayVal = `${Math.round(value * 100)}%`;
                } else if (key === 'crit_damage') {
                    displayVal = `x${value.toFixed(2)}`;
                }

                container.add(this.add.text(-105, currentY, `${key.toUpperCase().padEnd(12, ' ')}: ${displayVal}`, {
                    fontFamily: 'Courier New, Courier, monospace', 
                    fontSize: '11px', 
                    color: '#000000',
                    fontStyle: 'bold'
                }));
                currentY += 18;
            });

            container.add(this.add.text(-105, currentY + 10, `STAT_TOTAL  : ${sumPrimary} PT`, {
                fontFamily: 'Courier New, Courier, monospace', 
                fontSize: '11px', 
                fontStyle: 'bold', 
                color: '#006600'
            }));

            bg.on('pointerover', () => bg.setFillStyle(0xeaeaea));
            bg.on('pointerout', () => bg.setFillStyle(0xdbdbdb));
            bg.on('pointerdown', () => {
                // On envoie directement à DuelScene
                this.scene.start('DuelScene', { hero });
            });
        });
    }
}
