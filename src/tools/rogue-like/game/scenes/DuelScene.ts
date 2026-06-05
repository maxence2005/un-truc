import { Scene } from 'phaser';
import { CombatState } from '../state/CombatState';
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
        this.state.skills = {};
        this.state.playerStats = this.heroSetup.stats;
        this.state.playerMaxHp = this.heroSetup.stats.hp_max;
        this.state.playerHp = this.heroSetup.stats.hp_max;

        this.add.image(0, 0, 'background').setOrigin(0).setDisplaySize(960, 640);

        // Logs panel
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

        // Score display
        const scoreContainer = this.add.container(640, 45);
        const scoreBg = this.add.image(0, 0, 'ui_score');
        this.scoreText = this.add.text(0, 0, 'SCORE: 0', {
            fontFamily: 'Impact, sans-serif', fontSize: '20px', color: '#00ff00', fontStyle: 'bold'
        }).setOrigin(0.5);
        scoreContainer.add([scoreBg, this.scoreText]);

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
                }
            },
            () => {
                this.isChoosing = false;
                this.isTweening = false;
                this.logText.setText(this.logText.text + `\nMonstre terrassé !\nUn nouveau ${this.state.currentMonster.name} approche...`);
                
                if (Object.keys(this.state.skills).length < 4) {
                    this.showSkillDraftOptions();
                }
            },
            () => this.refreshInterfaceDisplay()
        );

        this.refreshInterfaceDisplay();
        this.showSkillDraftOptions();

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
        
        // Mise à jour des badges de statuts sur les combattants (à gauche pour le joueur, à droite pour le monstre)
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
    }

    private showSkillTooltip(skill: Skill, ownerLabel: string) {
        this.lastLogMessage = this.logText.text;
        const formula = getScalingFormulaString(skill); 
        this.logText.setText(`💡 [PROFIL DE CAPACITÉ - ${ownerLabel}]\nNom: ${skill.name}\nEffet: ${skill.longDesc}\n⚡ Calculs: ${formula}`);
    }

    private showStatusTooltip(status: ActiveStatus, ownerLabel: string) {
        this.lastLogMessage = this.logText.text;
        const durationType = status.isInfinite ? "PERMANENT / INNÉ" : `CHARGES ACTIVES : x${status.stacks}`;
        this.logText.setText(`🧪 [EFFET DE STATUT - ${ownerLabel}]\nNom: ${status.name} (${durationType})\nNotice technique: ${status.desc}`);
    }

    private hideSkillTooltip() {
        this.logText.setText(this.lastLogMessage);
    }

    private showSkillDraftOptions() {
        this.isChoosing = true;
        const currentSlotIndex = Object.keys(this.state.skills).length;
        const currentArrowKey = this.state.slotOrder[currentSlotIndex]!;
        
        const arrowSymbols: Record<string, string> = { 
            ArrowUp: 'HAUT (▲)', ArrowRight: 'DROITE (▶)', ArrowDown: 'BAS (▼)', ArrowLeft: 'GAUCHE (◀)' 
        };

        this.logText.setText(`[SYSTEM] Choisissez une compétence pour votre touche : ${arrowSymbols[currentArrowKey]}`);

        this.choiceContainer = DraftManager.show(
            this,
            this.state.skills,
            (skill) => this.selectDraftedSkill(currentArrowKey, skill)
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
        this.logText.setText(`Compétence [${skill.name}] assignée ! À vous de jouer.`);
    }
}
