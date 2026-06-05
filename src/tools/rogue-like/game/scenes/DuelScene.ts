import { Scene } from 'phaser';
import { CombatState, type StatUpgrade } from '../state/CombatState';
import { CharacterVisual } from '../ui/CharacterVisual';
import { SkillsLayout } from '../ui/SkillsLayout';
import { StatsSidebar } from '../ui/StatsSidebar';
import { DraftManager } from '../ui/DraftManager';
import { Preloader } from '../systems/Preloader';
import { PlaylistManager } from '../systems/PlaylistManager';
import { TurnManager } from '../systems/TurnManager';
import { type GeneratedHero } from '../data/HeroFactory';
import { type Skill, getScalingFormulaString } from '../data/SkillRegistry';
import { type ActiveStatus } from '../data/StatusRegistry';

export class DuelScene extends Scene {
    public state!: CombatState;
    public playerVisual!: CharacterVisual;
    public monsterVisual!: CharacterVisual;
    public skillsLayout: SkillsLayout | null = null;
    public sidebar!: StatsSidebar;
    public turnManager!: TurnManager;

    private heroSetup!: GeneratedHero;
    private logText!: Phaser.GameObjects.Text;
    private scoreText!: Phaser.GameObjects.Text;
    private nextRewardText!: Phaser.GameObjects.Text;
    
    private isTweening = false;
    private isChoosing = true;
    private choiceContainer: Phaser.GameObjects.Container | null = null;
    private lastLogMessage = "";

    constructor() { 
        super('DuelScene'); 
    }

    init(data: { hero: GeneratedHero }) {
        this.heroSetup = data.hero;
    }

    preload() {
        Preloader.preload(this);
    }

    create() {
        PlaylistManager.start(this);

        this.state = new CombatState();
        this.state.classType = this.heroSetup.classType;
        this.state.skills = {};
        this.state.playerStats = this.heroSetup.stats;
        this.state.playerMaxHp = this.heroSetup.stats.hp_max;
        this.state.playerHp = this.heroSetup.stats.hp_max;

        this.add.image(0, 0, 'background').setOrigin(0).setDisplaySize(960, 640);

        // Panneau de logs
        const dialogContainer = this.add.container(360, 550);
        const dialogBg = this.add.image(0, 0, 'ui_dialog').setDisplaySize(700, 160);
        const dialogTitle = this.add.text(-335, -68, ' SYSTEM_LOG.EXE', { 
            fontFamily: 'Arial, sans-serif', fontSize: '11px', color: '#ffffff', fontStyle: 'bold' 
        });
        this.logText = this.add.text(-330, -38, '', { 
            fontFamily: 'Courier New, Courier, monospace', fontSize: '12px', color: '#00ff00', 
            lineSpacing: 5, wordWrap: { width: 660 } 
        });
        dialogContainer.add([dialogBg, dialogTitle, this.logText]);

        // Affichage du score
        const scoreContainer = this.add.container(640, 45);
        const scoreBg = this.add.image(0, 0, 'ui_score');
        this.scoreText = this.add.text(0, 0, 'SCORE: 0', {
            fontFamily: 'Impact, sans-serif', fontSize: '20px', color: '#00ff00', fontStyle: 'bold'
        }).setOrigin(0.5);
        scoreContainer.add([scoreBg, this.scoreText]);

        // Indicateur de prochaine récompense
        this.nextRewardText = this.add.text(640, 100, '', {
            fontFamily: 'Courier New, Courier, monospace',
            fontSize: '11px',
            color: '#00ff00',
            fontStyle: 'bold',
            backgroundColor: '#000000',
            padding: { x: 6, y: 3 }
        }).setOrigin(0.5);

        this.sidebar = new StatsSidebar(this, 840);
        this.playerVisual = new CharacterVisual(this, 220, 260, this.heroSetup.assetKey);
        this.monsterVisual = new CharacterVisual(this, 500, 260, this.state.currentMonster.assetKey);

        this.turnManager = new TurnManager(
            this,
            this.state,
            this.playerVisual,
            this.monsterVisual,
            this.sidebar,
            this.heroSetup,
            this.logText,
            this.scoreText,
            () => this.skillsLayout,
            () => { this.isTweening = true; },
            (isGameOver) => {
                if (!isGameOver) {
                    this.isTweening = false;
                } else {
                    this.skillsLayout?.setVisible(false);
                    this.showGameOverScreen();
                }
            },
            () => {
                this.isChoosing = false;
                this.isTweening = false;
                
                // Si le score actuel correspond à un draft/reward
                if (this.state.isRewardScore()) {
                    this.showRewardDraftOptions(false); // isFirstChoice = false
                } else {
                    this.logText.setText(this.logText.text + `\nMonstre terrassé !\nUn nouveau ${this.state.currentMonster.name} approche...`);
                }
            },
            () => this.refreshInterfaceDisplay()
        );

        this.refreshInterfaceDisplay();
        this.showRewardDraftOptions(true); // Premier choix de compétence (isFirstChoice = true)

        this.input.keyboard?.on('keydown', (e: KeyboardEvent) => {
            if (this.isTweening || this.isChoosing || this.state.playerHp <= 0) return;
            if (e.key in this.state.skills) { 
                e.preventDefault(); 
                this.turnManager.executePlayerTurn(e.key); 
            }
        });
    }

    public refreshInterfaceDisplay() {
        this.turnManager.updateHpGraphics();
        
        this.sidebar.updateAttributes(
            this.state.playerStats, 
            this.state.currentMonster.stats, 
            this.state.currentMonster.name
        );
        
        this.playerVisual.updateStatusEffects(this.state.playerStatuses, true, (s) => this.showStatusTooltip(s, 'HÉROS'), () => this.hideSkillTooltip());
        this.monsterVisual.updateStatusEffects(this.state.monsterStatuses, false, (s) => this.showStatusTooltip(s, this.state.currentMonster.name.toUpperCase()), () => this.hideSkillTooltip());
        
        this.sidebar.updatePlayerSkills(
            this.state.skills,
            (skill) => this.showSkillTooltip(skill, this.heroSetup.name.toUpperCase()),
            () => this.hideSkillTooltip()
        );

        this.sidebar.updateMonsterSkills(
            this.state.currentMonster.skills,
            (skill) => this.showSkillTooltip(skill, this.state.currentMonster.name.toUpperCase()),
            () => this.hideSkillTooltip()
        );

        // Rafraîchir l'affichage du prochain draft
        const nextScore = this.state.getNextRewardScore();
        const diff = nextScore - this.state.score;
        this.nextRewardText.setText(`NEXT_REWARD: -${diff} ROUNDS`);
    }

    private showSkillTooltip(skill: Skill, ownerLabel: string) {
        this.lastLogMessage = this.logText.text;
        const formula = getScalingFormulaString(skill); 
        this.logText.setText(`[PROFIL DE CAPACITÉ - ${ownerLabel}]\nNom: ${skill.name}\nEffet: ${skill.longDesc}\nCalculs: ${formula}`);
    }

    private showStatusTooltip(status: ActiveStatus, ownerLabel: string) {
        this.lastLogMessage = this.logText.text;
        const durationType = status.isInfinite ? "PERMANENT / INNÉ" : `CHARGES ACTIVES : x${status.stacks}`;
        this.logText.setText(`[EFFET DE STATUT - ${ownerLabel}]\nNom: ${status.name} (${durationType})\nNotice technique: ${status.desc}`);
    }

    private hideSkillTooltip() {
        this.logText.setText(this.lastLogMessage);
    }

    private showRewardDraftOptions(isFirstChoice: boolean) {
        this.isChoosing = true;
        
        if (isFirstChoice) {
            this.logText.setText(`[SYSTEM] Choisissez votre première compétence pour démarrer !`);
        } else {
            this.logText.setText(`[SYSTEM] Récompense disponible ! Choisissez une Capacité ou améliorez une Stat.`);
        }

        this.choiceContainer = DraftManager.show(
            this,
            this.state,
            isFirstChoice,
            (arrowKey, skill) => this.selectDraftedSkill(arrowKey, skill),
            (upgrade) => this.selectStatUpgrade(upgrade)
        );
    }

    private selectDraftedSkill(arrowKey: string, skill: Skill) {
        this.state.skills[arrowKey] = skill;

        if (this.choiceContainer) { 
            this.choiceContainer = null; 
        }
        if (this.skillsLayout) {
            this.skillsLayout.destroy();
        }
        
        this.skillsLayout = new SkillsLayout(this, 220, 260, this.state.skills);

        this.refreshInterfaceDisplay();
        this.isChoosing = false;
        this.isTweening = false;
        this.logText.setText(`Compétence [${skill.name}] assignée à [${arrowKey}] ! À vous de jouer.`);
    }

    private selectStatUpgrade(upgrade: StatUpgrade) {
        this.state.applyStatUpgrade(upgrade.statKey, upgrade.value);

        if (this.choiceContainer) {
            this.choiceContainer = null;
        }

        this.refreshInterfaceDisplay();
        this.isChoosing = false;
        this.isTweening = false;
        this.logText.setText(`Mise à niveau [${upgrade.name}] installée ! À vous de jouer.`);
    }

    private showGameOverScreen() {
        this.isChoosing = true; // Empêche d'autres actions
        this.isTweening = true;
        
        // 1. Superposition sombre translucide sur tout l'écran
        const screenOverlay = this.add.rectangle(480, 320, 960, 640, 0x000000, 0.6).setInteractive();
        
        // 2. Fenêtre de Game Over (Fenêtre standard Win95)
        const winContainer = this.add.container(480, 260);
        
        // Cadre de la fenêtre
        const winBg = this.add.rectangle(0, 0, 420, 220, 0xdbdbdb).setStrokeStyle(3, 0x808080);
        const winShadow = this.add.rectangle(4, 4, 420, 220, 0x000000, 0.4);
        
        // Barre de titre rouge foncé (erreur système fatale)
        const titleBar = this.add.rectangle(0, -95, 414, 24, 0x800000);
        const titleText = this.add.text(-195, -104, ' SYSTEM CRASH: GAME_OVER.EXE', {
            fontFamily: 'Arial, sans-serif', fontSize: '12px', fontStyle: 'bold', color: '#ffffff'
        });
        
        // Description de l'erreur
        const errorText = this.add.text(0, -30, `FATAL ERROR: HERO_DEFEATED\n\nScore final : ${this.state.score} round(s)\n\nVotre système a rencontré une erreur fatale.`, {
            fontFamily: 'Courier New', fontSize: '13px', color: '#000000', fontStyle: 'bold', align: 'center'
        }).setOrigin(0.5);

        // Bouton de relance
        const btnRestart = this.add.container(0, 50);
        const btnBg = this.add.rectangle(0, 0, 200, 36, 0xdbdbdb).setStrokeStyle(2, 0x808080).setInteractive({ cursor: 'pointer' });
        const btnShadow = this.add.rectangle(3, 3, 200, 36, 0x000000, 0.4);
        const btnText = this.add.text(0, 0, 'RELANCER [R]', {
            fontFamily: 'Arial', fontSize: '13px', fontStyle: 'bold', color: '#000000'
        }).setOrigin(0.5);
        btnRestart.add([btnShadow, btnBg, btnText]);
        btnRestart.sendToBack(btnShadow);
        
        winContainer.add([winShadow, winBg, titleBar, titleText, errorText, btnRestart]);
        winContainer.sendToBack(winShadow);
        
        // Animations de boutons
        btnBg.on('pointerover', () => btnBg.setFillStyle(0xeaeaea));
        btnBg.on('pointerout', () => btnBg.setFillStyle(0xdbdbdb));
        
        const triggerRestart = () => {
            this.scene.start('CharSelectScene');
        };
        
        btnBg.on('pointerdown', triggerRestart);
        
        // Écouteur de la touche R
        const keyListener = (e: KeyboardEvent) => {
            if (e.key === 'r' || e.key === 'R') {
                this.input.keyboard?.off('keydown', keyListener);
                triggerRestart();
            }
        };
        this.input.keyboard?.on('keydown', keyListener);
        
        // Suppression automatique de l'écouteur si la scène s'arrête
        this.events.once('shutdown', () => {
            this.input.keyboard?.off('keydown', keyListener);
        });
    }
}
