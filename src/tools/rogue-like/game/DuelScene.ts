import { Scene } from 'phaser';
import { CombatState, type Skill } from './CombatState';
import { CharacterVisual } from './CharacterVisual';
import { SkillsLayout } from './SkillsLayout';

// Vite va importer le contenu brut des fichiers SVG
import heroSvgRaw from './assets/hero.svg?raw';
import iconUpRaw from './assets/arrow_up.svg?raw';
import iconDownRaw from './assets/arrow_down.svg?raw';
import iconLeftRaw from './assets/arrow_left.svg?raw';
import iconRightRaw from './assets/arrow_right.svg?raw';
import bgSvgRaw from './assets/background.svg?raw';
import uiScoreRaw from './assets/ui_score.svg?raw';
import uiDialogRaw from './assets/ui_dialog.svg?raw';

// Imports des Monstres
import tigerSvgRaw from './assets/monsters/tiger.svg?raw';
import slimeSvgRaw from './assets/monsters/slime.svg?raw';
import robotSvgRaw from './assets/monsters/robot.svg?raw';
import ghostSvgRaw from './assets/monsters/ghost.svg?raw';
import demonSvgRaw from './assets/monsters/demon.svg?raw';

export class DuelScene extends Scene {
    private state!: CombatState;
    private playerVisual!: CharacterVisual;
    private monsterVisual!: CharacterVisual;
    private skillsLayout: SkillsLayout | null = null;

    private logText!: Phaser.GameObjects.Text;
    private scoreText!: Phaser.GameObjects.Text;
    private scoreContainer!: Phaser.GameObjects.Container;
    private dialogContainer!: Phaser.GameObjects.Container;
    private choiceContainer: Phaser.GameObjects.Container | null = null;
    
    private isTweening = false;
    private isChoosing = true; // Bloque le combat pendant le choix
    private static musicStarted = false;
    private static currentMusicIndex = 0;
    private static readonly MUSIC_KEYS = ['music1', 'music2', 'music3', 'music4'];

    constructor() {
        super('DuelScene');
    }

    preload() {
        // Utilisation de Blob URLs pour les ressources SVG
        const assets = [
            { key: 'hero_svg', raw: heroSvgRaw },
            { key: 'monster_tiger', raw: tigerSvgRaw },
            { key: 'monster_slime', raw: slimeSvgRaw },
            { key: 'monster_robot', raw: robotSvgRaw },
            { key: 'monster_ghost', raw: ghostSvgRaw },
            { key: 'monster_demon', raw: demonSvgRaw },
            { key: 'icon_up', raw: iconUpRaw },
            { key: 'icon_down', raw: iconDownRaw },
            { key: 'icon_left', raw: iconLeftRaw },
            { key: 'icon_right', raw: iconRightRaw },
            { key: 'cyber_bg', raw: bgSvgRaw },
            { key: 'ui_score', raw: uiScoreRaw },
            { key: 'ui_dialog', raw: uiDialogRaw }
        ];

        assets.forEach(asset => {
            const blob = new Blob([asset.raw], { type: 'image/svg+xml' });
            const url = URL.createObjectURL(blob);
            this.load.svg(asset.key, url);
        });

        // Chargement des 4 musiques
        this.load.audio('music1', '/music.mp3');
        this.load.audio('music2', '/music2.mp3');
        this.load.audio('music3', '/music3.mp3');
        this.load.audio('music4', '/music4.mp3');
    }

    create() {
        // 1. Lancement de la playlist séquentielle
        if (!DuelScene.musicStarted) {
            this.playNextTrack();
            DuelScene.musicStarted = true;
        }

        this.state = new CombatState();

        // 2. Arrière-plan
        this.add.image(0, 0, 'cyber_bg').setOrigin(0).setDisplaySize(640, 480);

        // 3. CONFIGURATION DU FOND DU SCORE (Style Win95)
        this.scoreContainer = this.add.container(560, 40); // Plus haut à droite
        const scoreBg = this.add.image(0, 0, 'ui_score');
        this.scoreText = this.add.text(0, 0, 'SCORE: 0', {
            fontFamily: 'Impact, sans-serif',
            fontSize: '18px',
            color: '#00ff00',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        this.scoreContainer.add([scoreBg, this.scoreText]);

        // 4. CONFIGURATION DE LA BOÎTE DE DIALOGUE (Style Fenêtre d'application)
        this.dialogContainer = this.add.container(320, 420); // Plus en bas
        const dialogBg = this.add.image(0, 0, 'ui_dialog');
        
        const dialogTitle = this.add.text(-276, -39, ' SYSTEM_LOG.EXE', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '10px',
            color: '#ffffff',
            fontStyle: 'bold'
        });

        this.logText = this.add.text(-270, -12, '', {
            fontFamily: 'Courier New, Courier, monospace',
            fontSize: '11px',
            color: '#00ff00',
            lineSpacing: 4,
            wordWrap: { width: 540 }
        });
        this.dialogContainer.add([dialogBg, dialogTitle, this.logText]);

        // 5. Instanciation des Personnages
        this.playerVisual = new CharacterVisual(this, 160, 180, 'hero_svg');
        this.monsterVisual = new CharacterVisual(this, 480, 180, this.state.currentMonster.assetKey);

        // Mise à jour initiale des textes PV
        this.updateHpGraphics();

        // Lancement du TOUT PREMIER choix de compétence (pour le slot Haut)
        this.showSkillDraftOptions();

        // Écouteur clavier
        this.input.keyboard?.on('keydown', (e: KeyboardEvent) => this.handleInput(e));
    }

    private playNextTrack() {
        const key = DuelScene.MUSIC_KEYS[DuelScene.currentMusicIndex] as string;
        const music = this.sound.add(key, { volume: 0.4 });
        
        music.once('complete', () => {
            DuelScene.currentMusicIndex = (DuelScene.currentMusicIndex + 1) % DuelScene.MUSIC_KEYS.length;
            this.time.delayedCall(2000, () => {
                this.playNextTrack();
            });
        });

        music.play();
    }

    private handleInput(event: KeyboardEvent) {
        if (this.isTweening || this.isChoosing || this.state.playerHp <= 0 || this.state.monsterHp <= 0) return;

        if (event.key in this.state.skills) {
            event.preventDefault();
            this.executePlayerTurn(event.key);
        }
    }

    /**
     * Affiche l'écran de draft avec 3 choix de fenêtres style Win95
     */
    private showSkillDraftOptions() {
        this.isChoosing = true;
        const currentSlotIndex = Object.keys(this.state.skills).length;
        
        // Détermine quelle flèche va recevoir la compétence
        const currentArrowKey = this.state.slotOrder[currentSlotIndex] as string;
        const arrowSymbols: Record<string, string> = { ArrowUp: 'HAUT (▲)', ArrowRight: 'DROITE (▶)', ArrowDown: 'BAS (▼)', ArrowLeft: 'GAUCHE (◀)' };

        this.logText.setText(`[SYSTEM] Choisissez une compétence pour votre touche : ${arrowSymbols[currentArrowKey]}`);

        const { width, height } = this.cameras.main;
        this.choiceContainer = this.add.container(width / 2, height / 2 - 20);

        // Récupérer 3 choix aléatoires
        const choices = this.state.getRandomThreeChoices();

        // Générer 3 boutons physiques côte à côte
        choices.forEach((skill, index) => {
            const posX = (index - 1) * 180; // Espacement horizontal

            const card = this.add.container(posX, 0);
            const bg = this.add.rectangle(0, 0, 160, 120, 0xdbdbdb).setStrokeStyle(2, 0x000000).setInteractive({ cursor: 'pointer' });
            
            // Relief 3D
            const shadow = this.add.rectangle(2, 2, 160, 120, 0x000000, 0.3);

            const title = this.add.text(0, -35, skill.name, { fontFamily: 'Arial', fontSize: '13px', fontStyle: 'bold', color: '#0000aa', align: 'center' }).setOrigin(0.5);
            const desc = this.add.text(0, 15, skill.desc, { fontFamily: 'Courier New', fontSize: '11px', color: '#000000', align: 'center', wordWrap: { width: 140 } }).setOrigin(0.5);

            card.add([shadow, bg, title, desc]);
            this.choiceContainer!.add(card);

            // Clic sur l'option
            bg.on('pointerover', () => bg.setFillStyle(0xeeeeee));
            bg.on('pointerout', () => bg.setFillStyle(0xdbdbdb));
            bg.on('pointerdown', () => this.selectDraftedSkill(currentArrowKey, skill));
        });
    }

    private selectDraftedSkill(arrowKey: string, skill: Skill) {
        // Assigne la compétence à la flèche correspondante
        this.state.skills[arrowKey] = skill;

        // Détruit le pop-up de choix
        if (this.choiceContainer) {
            this.choiceContainer.destroy();
            this.choiceContainer = null;
        }

        // Met à jour ou instancie le layout des touches autour du joueur
        if (this.skillsLayout) {
            this.skillsLayout.destroy();
        }
        this.skillsLayout = new SkillsLayout(this, 160, 180, this.state.skills);

        // Fin de la pause, le combat reprend !
        this.isChoosing = false;
        this.isTweening = false; // Réinitialise l'état pour permettre de nouvelles actions
        this.logText.setText(`Compétence [${skill.name}] assignée ! À toi de jouer.`);
    }

    private executePlayerTurn(key: string) {
        this.isTweening = true;
        const skill = this.state.skills[key];
        if (!skill) return;

        this.skillsLayout?.playSelectionAnimation(key);

        // Action de soin (Gauche)
        if (skill.heal > 0 && skill.damage === 0) {
            this.state.applyHeal(skill.heal);
            this.updateHpGraphics();
            this.logText.setText(`Tu lances [${skill.name}] et récupères +${skill.heal} PV.`);
            this.playerVisual.playFlashAnimation(0x00ff00);
            this.createFloatingText(160, 100, `+${skill.heal}`, '#00ff00');
            this.executeMonsterTurn();
            return;
        }

        this.logText.setText(`Tu lances [${skill.name}] !`);
        
        // Animation physique d'attaque : le joueur fonce vers X: 260
        this.playerVisual.playAttackAnimation(260, () => {
            // Callback déclenché à l'impact physique
            const isDead = this.state.applyDamageToMonster(skill.damage);
            
            // Si la compétence soigne aussi (ex: Drain de Vie)
            if (skill.heal > 0) {
                this.state.applyHeal(skill.heal);
                this.playerVisual.playFlashAnimation(0x00ff00);
                this.createFloatingText(160, 100, `+${skill.heal}`, '#00ff00');
            }

            this.updateHpGraphics();
            this.monsterVisual.playFlashAnimation(0xffffff);
            this.createFloatingText(480, 100, `-${skill.damage}`, '#ff0000');
            this.cameras.main.shake(100, 0.01);

            if (isDead) {
                this.handleMonsterDeath();
            } else {
                this.executeMonsterTurn();
            }
        });
    }

    private executeMonsterTurn() {
        this.time.delayedCall(600, () => {
            if (this.state.monsterHp <= 0) return;

            // Le monstre fonce vers la gauche à X: 380
            this.monsterVisual.playAttackAnimation(380, () => {
                const monsterDamage = Math.floor(Math.random() * 10) + 6;
                const isDead = this.state.applyDamageToPlayer(monsterDamage);
                this.updateHpGraphics();
                this.playerVisual.playFlashAnimation(0xff0000);
                this.createFloatingText(160, 100, `-${monsterDamage}`, '#ff0000');

                if (isDead) {
                    this.logText.setText("GAME OVER...\nRecharge la page pour recommencer !");
                    this.skillsLayout?.setVisible(false);
                } else {
                    this.logText.setText(this.logText.text + `\nLe ${this.state.currentMonster.name} réplique et t'inflige ${monsterDamage} dégâts !`);
                    this.isTweening = false; // Le joueur peut rejouer
                }
            });
        });
    }

    private handleMonsterDeath() {
        this.state.setupNextMonster();
        this.scoreText.setText(`SCORE: ${this.state.score}`);

        this.monsterVisual.playDeathAnimation(() => {
            this.monsterVisual.updateTexture(this.state.currentMonster.assetKey);
            this.monsterVisual.resetVisual();
            this.updateHpGraphics();
            
            // LOGIQUE DE PROGRESSION ROGUE-LIKE :
            // Si le deck de 4 flèches n'est pas encore complet, on propose un nouveau choix de draft !
            if (Object.keys(this.state.skills).length < 4) {
                this.showSkillDraftOptions();
            } else {
                // Deck complet ! Le jeu continue en boucle normalement
                this.logText.setText(`Monstre terrassé !\nUn nouveau ${this.state.currentMonster.name} approche...`);
                this.isTweening = false;
            }
        });
    }

    private updateHpGraphics() {
        this.playerVisual.updateHp(this.state.playerHp, this.state.playerMaxHp);
        this.monsterVisual.updateHp(this.state.monsterHp, this.state.monsterMaxHp);
    }

    private createFloatingText(x: number, y: number, msg: string, color: string) {
        const txt = this.add.text(x, y, msg, { fontFamily: 'Courier New', fontSize: '20px', color, fontStyle: 'bold' }).setOrigin(0.5);
        this.tweens.add({ targets: txt, y: y - 40, alpha: 0, duration: 800, onComplete: () => txt.destroy() });
    }
}
