import Phaser, { Scene } from 'phaser';
import { CombatState } from './CombatState';
import { CharacterVisual } from './CharacterVisual';
import { SkillsLayout } from './SkillsLayout';
import { StatsSidebar } from './ui/StatsSidebar';
import { CombatCalculator } from './systems/CombatCalculator';
import { type GeneratedHero } from './data/HeroFactory';
import { ALL_SKILLS, type Skill, getScalingFormulaString } from './data/SkillRegistry';
import { type ActiveStatus } from './data/StatusRegistry';

export class DuelScene extends Scene {
    private state!: CombatState;
    private playerVisual!: CharacterVisual;
    private monsterVisual!: CharacterVisual;
    private skillsLayout: SkillsLayout | null = null;
    private sidebar!: StatsSidebar;

    private heroSetup!: GeneratedHero;

    private logText!: Phaser.GameObjects.Text;
    private scoreText!: Phaser.GameObjects.Text;
    private scoreContainer!: Phaser.GameObjects.Container;
    private dialogContainer!: Phaser.GameObjects.Container;

    private isTweening = false;
    private isChoosing = true; // Bloque les touches pendant le choix de compétence
    private choiceContainer: Phaser.GameObjects.Container | null = null;
    private static musicStarted = false;
    private static currentMusicIndex = 0;
    private static readonly MUSIC_KEYS = ['music1', 'music2', 'music3', 'music4'];
    private lastLogMessage = ""; // Sauvegarde pour restaurer le log après un survol

    constructor() { 
        super('DuelScene'); 
    }

    init(data: { hero: GeneratedHero }) {
        this.heroSetup = data.hero;
    }

    preload() {
        // Chargement à la volée des SVG d'interface globaux et des monstres
        const coreModules = import.meta.glob('./assets/*.svg', { query: '?raw', eager: true }) as Record<string, { default: string }>;
        Object.entries(coreModules).forEach(([path, module]) => {
            const filename = path.split('/').pop()?.split('.').shift();
            if (filename !== 'hero') { // Évite d'écraser la texture humaine procédurale
                const blob = new Blob([module.default], { type: 'image/svg+xml' });
                this.load.svg(filename!, URL.createObjectURL(blob));
            }
        });

        const monsters = import.meta.glob('./assets/monsters/*.svg', { query: '?raw', eager: true }) as Record<string, { default: string }>;
        Object.entries(monsters).forEach(([path, module]) => {
            const filename = path.split('/').pop()?.split('.').shift();
            const blob = new Blob([module.default], { type: 'image/svg+xml' });
            this.load.svg(`monster_${filename}`, URL.createObjectURL(blob));
        });

        // Charge à la volée TOUS les icônes de compétences
        const skillIcons = import.meta.glob('./assets/skills/*.svg', { query: '?raw', eager: true }) as Record<string, { default: string }>;
        Object.entries(skillIcons).forEach(([path, module]) => {
            const filename = path.split('/').pop()?.split('.').shift();
            const key = `skill_${filename}`;
            const blob = new Blob([module.default], { type: 'image/svg+xml' });
            this.load.svg(key, URL.createObjectURL(blob));
        });

        // Charge à la volée TOUS les icônes de statuts
        const statusIcons = import.meta.glob('./assets/statuses/*.svg', { query: '?raw', eager: true }) as Record<string, { default: string }>;
        Object.entries(statusIcons).forEach(([path, module]) => {
            const filename = path.split('/').pop()?.split('.').shift();
            const blob = new Blob([module.default], { type: 'image/svg+xml' });
            this.load.svg(filename!, URL.createObjectURL(blob));
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
        // On démarre le jeu avec 0 compétences !
        this.state.skills = {};
        this.state.playerStats = this.heroSetup.stats;
        this.state.playerMaxHp = this.heroSetup.stats.hp_max;
        this.state.playerHp = this.heroSetup.stats.hp_max;

        // 2. Arrière-plan étendu pour couvrir la nouvelle résolution de 960x640
        this.add.image(0, 0, 'background').setOrigin(0).setDisplaySize(960, 640);

        // --- 3. CONFIGURATION DU PANNEAU DE LOGS (Plus large, en bas à gauche) ---
        this.dialogContainer = this.add.container(360, 565);
        const dialogBg = this.add.image(0, 0, 'ui_dialog').setDisplaySize(700, 130);
        const dialogTitle = this.add.text(-335, -53, ' SYSTEM_LOG.EXE', { 
            fontFamily: 'Arial, sans-serif', 
            fontSize: '11px', 
            color: '#ffffff', 
            fontStyle: 'bold' 
        });
        this.logText = this.add.text(-330, -25, '', { 
            fontFamily: 'Courier New, Courier, monospace', 
            fontSize: '12px', 
            color: '#00ff00', 
            lineSpacing: 4, 
            wordWrap: { width: 660 } 
        });
        this.dialogContainer.add([dialogBg, dialogTitle, this.logText]);

        // --- 4. CONFIGURATION DU SCORE ---
        this.scoreContainer = this.add.container(640, 45);
        const scoreBg = this.add.image(0, 0, 'ui_score');
        this.scoreText = this.add.text(0, 0, 'SCORE: 0', {
            fontFamily: 'Impact, sans-serif',
            fontSize: '20px',
            color: '#00ff00',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        this.scoreContainer.add([scoreBg, this.scoreText]);

        // --- 5. BRANCHEMENT DU COMPOSANT ENCAPSULÉ UI SIDEBAR ---
        this.sidebar = new StatsSidebar(this, 840);

        // --- 6. POSITIONNEMENT DES ACTEURS (Avec texture personnalisée pour le héros choisi) ---
        this.playerVisual = new CharacterVisual(this, 220, 260, this.heroSetup.assetKey);
        this.monsterVisual = new CharacterVisual(this, 500, 260, this.state.currentMonster.assetKey);

        this.skillsLayout = null;

        // Mise à jour de l'affichage
        this.refreshInterfaceDisplay();

        // LANCEMENT DE LA PREMIÈRE COMPÉTENCE (Touche HAUT)
        this.showSkillDraftOptions();

        // Écouteur clavier
        this.input.keyboard?.on('keydown', (e: KeyboardEvent) => {
            if (this.isTweening || this.isChoosing || this.state.playerHp <= 0) return;
            if (e.key in this.state.skills) { 
                e.preventDefault(); 
                this.executePlayerTurn(e.key); 
            }
        });
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

    private refreshInterfaceDisplay() {
        // 1. Mise à jour des barres de vie physiques sous les avatars
        this.playerVisual.updateHp(this.state.playerHp, this.state.playerMaxHp);
        this.monsterVisual.updateHp(this.state.monsterHp, this.state.monsterMaxHp);
        
        // 2. Mise à jour des statistiques numériques textuelles (Héros + Monstre)
        this.sidebar.updateAttributes(
            this.state.playerStats, 
            this.state.currentMonster.stats, 
            this.state.currentMonster.name
        );
        
        // --- MISE À JOUR VISUELLE DES MINI BADGES DE STATUTS DANS LA SIDEBAR ---
        this.sidebar.drawStatusEffects('player', this.state.playerStatuses, (s) => this.showStatusTooltip(s, 'HÉROS'), () => this.hideSkillTooltip());
        this.sidebar.drawStatusEffects('monster', this.state.monsterStatuses, (s) => this.showStatusTooltip(s, this.state.currentMonster.name.toUpperCase()), () => this.hideSkillTooltip());
        
        // 3. Mise à jour des icônes du Héros avec branchement Tooltip
        this.sidebar.updatePlayerSkills(
            this.state.skills,
            (skill) => this.showSkillTooltip(skill, this.heroSetup.name.toUpperCase()),
            () => this.hideSkillTooltip()
        );

        // 4. Mise à jour des icônes du Monstre avec branchement Tooltip
        this.sidebar.updateMonsterSkills(
            this.state.currentMonster.skills,
            (skill) => this.showSkillTooltip(skill, this.state.currentMonster.name.toUpperCase()),
            () => this.hideSkillTooltip()
        );
    }

    // Génère la notice technique propre dans la console du bas au survol
    private showSkillTooltip(skill: Skill, ownerLabel: string) {
        this.lastLogMessage = this.logText.text; // Sauvegarde le message de combat en arrière-plan
        
        // Utilise notre traducteur automatique de formules (ex: 100% ATT)
        const formula = getScalingFormulaString(skill); 
        
        this.logText.setText(`💡 [PROFIL DE CAPACITÉ - ${ownerLabel}]\nNom: ${skill.name}\nEffet: ${skill.longDesc}\n⚡ Calculs: ${formula}`);
    }

    private showStatusTooltip(status: ActiveStatus, ownerLabel: string) {
        this.lastLogMessage = this.logText.text;
        const durationType = status.isInfinite ? "PERMANENT / INNÉ" : `CHARGES ACTIVES : x${status.stacks}`;
        this.logText.setText(`🧪 [EFFET DE STATUT - ${ownerLabel}]\nNom: ${status.name} (${durationType})\nNotice technique: ${status.desc}`);
    }

    private hideSkillTooltip() {
        this.logText.setText(this.lastLogMessage); // Restaure l'état du combat direct
    }

    // 2. ORCHESTRATEUR DE COMBAT COMPORTANT LA STATISTIQUE DE VITESSE (SPEED)
    private executePlayerTurn(playerSkillKey: string) {
        // --- EVOLUTION GO TO THE MOON : Résolution des préparations lunaires du tour précédent ---
        const playerPrep = this.state.playerStatuses.find(s => s.id === 'moon_prep');
        if (playerPrep) {
            this.state.removeStatus('player', 'moon_prep');
            this.state.addStatus('player', 'flight', 3);
            this.createFloatingText(220, 180, "DÉCOLLAGE 🚀", "#00eaff");
        }

        const monsterPrep = this.state.monsterStatuses.find(s => s.id === 'moon_prep');
        if (monsterPrep) {
            this.state.removeStatus('monster', 'moon_prep');
            this.state.addStatus('monster', 'flight', 3);
            this.createFloatingText(500, 180, "DÉCOLLAGE 🚀", "#ff4d4d");
        }

        const playerSkill = this.state.skills[playerSkillKey]!;

        // --- RESTRICTION GO TO THE MOON ---
        if (playerSkill.name === 'Go to the moon' && this.state.playerStatuses.some(s => s.id === 'flight')) {
            this.logText.setText(`🚀 [SYSTEM] Erreur: Impossible de relancer 'Go to the moon' pendant que vous volez déjà !`);
            return;
        }

        this.isTweening = true;
        this.skillsLayout?.playSelectionAnimation(playerSkillKey);

        // Incrémentation automatique du compteur de maîtrise
        this.state.skillUsage[playerSkill.name] = (this.state.skillUsage[playerSkill.name] || 0) + 1;

        // Récupération des informations d'action
        const playerStats = this.state.playerStats;
        const monsterStats = this.state.currentMonster.stats;

        // IA du monstre : Choix d'une compétence aléatoire dans son catalogue
        const monsterSkills = this.state.currentMonster.skills;
        const monsterSkill = monsterSkills[Math.floor(Math.random() * monsterSkills.length)]!;

        // Vider la boîte de dialogue pour le nouveau tour
        this.logText.setText('');

        // --- ORDRE DE JEU BASÉ SUR LA VITESSE ---
        const playerGoesFirst = playerStats.speed >= monsterStats.speed;

        const firstAction = () => {
            if (playerGoesFirst) {
                this.executeSingleAction(playerSkill, true, () => secondAction());
            } else {
                this.executeSingleAction(monsterSkill, false, () => secondAction());
            }
        };

        const secondAction = () => {
            // Sécurité : On vérifie que personne n'est mort pendant la première attaque
            if (this.state.playerHp <= 0 || this.state.monsterHp <= 0) {
                this.checkBattleEnd();
                return;
            }

            if (playerGoesFirst) {
                this.executeSingleAction(monsterSkill, false, () => this.checkBattleEnd());
            } else {
                this.executePlayerActionDirectly(playerSkill);
            }
        };

        firstAction();
    }

    // Exécute une action isolée avec son animation physique
    private executeSingleAction(skill: Skill, isPlayer: boolean, next: () => void) {
        const casterVisual = isPlayer ? this.playerVisual : this.monsterVisual;
        const targetVisual = isPlayer ? this.monsterVisual : this.playerVisual;
        const casterTag = isPlayer ? 'player' : 'monster';
        const targetTag = isPlayer ? 'monster' : 'player';

        const casterStats = isPlayer ? this.heroSetup.stats : this.state.currentMonster.stats;
        const targetStats = isPlayer ? this.state.currentMonster.stats : this.heroSetup.stats;
        const casterStatuses = isPlayer ? this.state.playerStatuses : this.state.monsterStatuses;
        const targetStatuses = isPlayer ? this.state.monsterStatuses : this.state.playerStatuses;

        const result = CombatCalculator.calculateAction(
            skill, 
            casterStats, 
            targetStats, 
            casterStatuses, 
            targetStatuses, 
            isPlayer ? 'Héros' : this.state.currentMonster.name, 
            isPlayer ? this.state.currentMonster.name : 'Héros'
        );
        
        // Application immédiate des contrecoups de Saignement / Brûlure du lanceur
        if (result.casterSelfDamage > 0) {
            if (isPlayer) this.state.playerHp = Math.max(0, this.state.playerHp - result.casterSelfDamage);
            else this.state.monsterHp = Math.max(0, this.state.monsterHp - result.casterSelfDamage);
            this.createFloatingText(isPlayer ? 220 : 500, 180, `-${result.casterSelfDamage}`, '#ff003c');
        }

        // Si le lanceur succombe à ses propres altérations (ex: Brûlé à mort en attaquant)
        if (this.state.playerHp <= 0 || this.state.monsterHp <= 0) {
            this.logText.setText((this.logText.text ? (this.logText.text + '\n') : '') + result.logMessage + `\nLe lanceur succombe à ses altérations d'état !`);
            this.refreshInterfaceDisplay();
            next();
            return;
        }

        // =============================================================
        // INTERCEPTEUR SPÉCIAL : COMPÉTENCE ÉVOLUTIVE BAGUETTE ASIATIQUE
        // =============================================================
        if (skill.name === 'Baguette asiatique') {
            const count = isPlayer ? (this.state.skillUsage[skill.name] || 0) : 0;
            casterVisual.playAttackAnimation(isPlayer ? 320 : 400, () => {
                let totalDamage = 0;
                let logMsg = `[${isPlayer ? 'Héros' : this.state.currentMonster.name}] utilise [Baguette asiatique] (Maîtrise: ${count}). `;

                // Sous-routine pour lancer un coup physique calibré
                const fireHit = (multiplier: number, label: string) => {
                    const fakeSkill: Skill = { name: label, shortDesc: '', longDesc: '', damageType: 'physical', scaling: { att: multiplier }, iconKey: '' };
                    const hit = CombatCalculator.calculateAction(fakeSkill, casterStats, targetStats, casterStatuses, targetStatuses, '', '');
                    if (!hit.isDodged) {
                        if (isPlayer) this.state.applyDamageToMonster(hit.damage); else this.state.applyDamageToPlayer(hit.damage);
                        totalDamage += hit.damage;
                        targetVisual.playFlashAnimation(hit.isCrit ? 0xff0000 : 0xffffff);
                        this.createFloatingText(isPlayer ? 500 : 220, 180, `-${hit.damage}`, hit.isCrit ? '#ffaa00' : '#ff3333');
                    } else {
                        this.createFloatingText(isPlayer ? 500 : 220, 180, 'ESQUIVE !', '#ffffff');
                    }
                };

                // Inné : Double coup à 40%
                fireHit(0.40, 'Coup 1');
                fireHit(0.40, 'Coup 2');

                // Palier 15 : Soin de 10% des PV Max (soumis aux réductions de Brûlure)
                if (count >= 15) {
                    let healAmt = Math.round(casterStats.hp_max * 0.10);
                    if (casterStatuses.some(s => s.id === 'burn')) healAmt = Math.round(healAmt * 0.5);
                    
                    if (isPlayer) this.state.applyHeal(healAmt);
                    else this.state.monsterHp = Math.min(this.state.currentMonster.stats.hp_max, this.state.monsterHp + healAmt);
                    
                    casterVisual.playFlashAnimation(0x00ff00);
                    this.createFloatingText(isPlayer ? 220 : 500, 180, `+${healAmt}`, '#00ff00');
                    logMsg += `[Soin de Maîtrise +${healAmt} PV] `;
                }

                // Palier 100 : Coup final dévastateur à 400%
                if (count >= 100) {
                    logMsg += `[COUP FINAL COMPLÈTE] `;
                    fireHit(4.00, 'Impact Cataclysmique');
                }

                logMsg += `Dégâts cumulés : ${totalDamage}.`;
                this.logText.setText((this.logText.text ? (this.logText.text + '\n') : '') + logMsg);

                this.decrementStatusStacks(casterTag);
                this.refreshInterfaceDisplay();
                next();
            });
            return;
        }

        // B. TRAITEMENT DE LA CAPACITÉ BANDAGE
        if (skill.hasBandage) {
            this.state.removeStatus(casterTag, 'bleed');
        }

        // C. TRAITEMENT DE L'EFFET DE DÉGÂTS PHYSIQUES / MAGIQUES
        const isOffensive = skill.damageType !== 'pure';

        const applyImpact = () => {
            let logSummary = result.logMessage;
            if (result.isDodged) {
                this.createFloatingText(isPlayer ? 500 : 220, 180, 'ESQUIVE !', '#ffffff');
            } else {
                if (result.damage > 0) {
                    if (isPlayer) this.state.applyDamageToMonster(result.damage);
                    else this.state.applyDamageToPlayer(result.damage);
                    targetVisual.playFlashAnimation(result.isCrit ? 0xff0000 : 0xffffff);
                    this.createFloatingText(isPlayer ? 500 : 220, 180, `-${result.damage}`, result.isCrit ? '#ffaa00' : '#ff0000');
                }
                
                // Traitement du soin
                if (result.heal > 0) {
                    if (isPlayer) {
                        this.state.applyHeal(result.heal);
                        this.createFloatingText(220, 180, `+${result.heal}`, '#00ff00');
                    } else {
                        this.state.monsterHp = Math.min(this.state.monsterMaxHp, this.state.monsterHp + result.heal);
                        this.createFloatingText(500, 180, `+${result.heal}`, '#00ff00');
                    }
                    casterVisual.playFlashAnimation(0x00ff00);
                }

                // ON INFLIGE LE STATUT SI L'ATTAQUE TOUCHE ET EST LÉGALE
                if (skill.inflictsStatus) {
                    const statusDest = skill.inflictsStatus.target === 'enemy' ? targetTag : casterTag;
                    this.state.addStatus(statusDest, skill.inflictsStatus.id, skill.inflictsStatus.stacks);
                }
            }

            // D. DÉCRÉMENTATION DES STATUTS DE TOUR APRÈS ACTION
            this.decrementStatusStacks(casterTag);

            this.refreshInterfaceDisplay();
            const finalLog = (this.logText.text ? (this.logText.text + '\n') : '') + logSummary;
            this.logText.setText(finalLog);
            next();
        };

        if (isOffensive) {
            casterVisual.playAttackAnimation(isPlayer ? 320 : 400, applyImpact);
        } else {
            // Logique utilitaire pure sans déplacement physique (ex: Kit de Secours)
            applyImpact();
        }
    }

    private executePlayerActionDirectly(skill: Skill) {
        this.executeSingleAction(skill, true, () => this.checkBattleEnd());
    }

    private checkBattleEnd() {
        if (this.state.monsterHp <= 0) {
            this.handleMonsterDeath();
        } else if (this.state.playerHp <= 0) {
            this.logText.setText(this.logText.text + "\nGAME OVER...\nRecharge la page pour recommencer !");
            this.skillsLayout?.setVisible(false);
        } else {
            this.isTweening = false; // Le tour est fini, le joueur peut rejouer
        }
    }

    private handleMonsterDeath() {
        this.state.setupNextMonster();
        this.scoreText.setText(`SCORE: ${this.state.score}`);

        this.monsterVisual.playDeathAnimation(() => {
            this.monsterVisual.updateTexture(this.state.currentMonster.assetKey);
            this.monsterVisual.resetVisual();
            this.updateHpGraphics();
            this.refreshInterfaceDisplay(); // Met à jour instantanément les stats du nouveau monstre sur la droite !
            
            // PROGRESSION PROGRESSIVE : Si on a moins de 4 compétences, on relance un choix au milieu du combat !
            if (Object.keys(this.state.skills).length < 4) {
                this.showSkillDraftOptions();
            } else {
                this.logText.setText(this.logText.text + `\nMonstre terrassé !\nUn nouveau ${this.state.currentMonster.name} approche...`);
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

    /**
     * Affiche le draft d'une compétence au milieu de l'arène
     */
    private showSkillDraftOptions() {
        this.isChoosing = true;
        const currentSlotIndex = Object.keys(this.state.skills).length;
        const currentArrowKey = this.state.slotOrder[currentSlotIndex]!;
        
        const arrowSymbols: Record<string, string> = { 
            ArrowUp: 'HAUT (▲)', ArrowRight: 'DROITE (▶)', ArrowDown: 'BAS (▼)', ArrowLeft: 'GAUCHE (◀)' 
        };

        this.logText.setText(`[SYSTEM] Choisissez une compétence pour votre touche : ${arrowSymbols[currentArrowKey]}`);

        // Centré dans la zone de combat (X: 360, Y: 260)
        this.choiceContainer = this.add.container(360, 260);

        // --- CORRECTION BUG ANTI-DOUBLONS ---
        // 1. On liste les noms des compétences que le joueur possède déjà dans son deck
        const ownedSkillNames = Object.values(this.state.skills).map(s => s.name);
        
        // 2. On filtre la banque globale pour ne garder que ce qu'il n'a pas encore équipé
        const availableSkills = ALL_SKILLS.filter(s => !ownedSkillNames.includes(s.name));
        
        // 3. Mélange aléatoire et sélection de 3 propositions uniques
        const choices = Phaser.Utils.Array.Shuffle(availableSkills).slice(0, 3);

        choices.forEach((skill, index) => {
            const posX = (index - 1) * 215;
            const card = this.add.container(posX, 0);

            const bg = this.add.rectangle(0, 0, 195, 170, 0xdbdbdb).setStrokeStyle(3, 0x808080).setInteractive({ cursor: 'pointer' });
            
            // Relief 3D
            const shadow = this.add.rectangle(4, 4, 195, 170, 0x000000, 0.4);

            const title = this.add.text(0, -60, skill.name, { 
                fontFamily: 'Arial, sans-serif', 
                fontSize: '13px', 
                fontStyle: 'bold', 
                color: '#0000aa' 
            }).setOrigin(0.5);
            
            const bodyText = this.add.text(0, -10, skill.shortDesc, {
                fontFamily: 'Courier New, Courier, monospace', 
                fontSize: '11px', 
                color: '#000000', 
                wordWrap: { width: 175 }, 
                align: 'center'
            }).setOrigin(0.5);

            const infoBtnBg = this.add.rectangle(74, 64, 24, 24, 0x000080).setInteractive({ cursor: 'pointer' });
            const infoBtnTxt = this.add.text(74, 64, 'i', { 
                fontFamily: 'Arial, sans-serif', 
                fontSize: '13px', 
                fontStyle: 'bold', 
                color: '#ffffff' 
            }).setOrigin(0.5);
            
            const selectHint = this.add.text(0, 64, '[ ÉQUIPER ]', { 
                fontFamily: 'Arial, sans-serif', 
                fontSize: '11px', 
                fontStyle: 'bold', 
                color: '#333333' 
            }).setOrigin(0.5);

            card.add([shadow, bg, title, bodyText, infoBtnBg, infoBtnTxt, selectHint]);
            card.sendToBack(shadow);
            this.choiceContainer!.add(card);

            bg.on('pointerover', () => bg.setFillStyle(0xeaeaea));
            bg.on('pointerout', () => bg.setFillStyle(0xdbdbdb));
            bg.on('pointerdown', () => this.selectDraftedSkill(currentArrowKey, skill));

            // Basculement [i] / [X] local au texte de la carte
            let isExpanded = false;
            const formula = getScalingFormulaString(skill);

            infoBtnBg.on('pointerover', () => {
                infoBtnBg.setFillStyle(isExpanded ? 0xff4d4d : 0x0000ff);
            });
            infoBtnBg.on('pointerout', () => {
                infoBtnBg.setFillStyle(isExpanded ? 0xff003c : 0x000080);
            });

            infoBtnBg.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
                pointer.event?.stopPropagation(); // Stoppe la sélection de la carte lors du clic sur [i]
                isExpanded = !isExpanded;
                if (isExpanded) {
                    bodyText.setText(`${skill.longDesc}\n\n${formula}`).setFontSize('9px');
                    infoBtnBg.setFillStyle(0xff003c);
                    infoBtnTxt.setText('X');
                } else {
                    bodyText.setText(skill.shortDesc).setFontSize('11px');
                    infoBtnBg.setFillStyle(0x000080);
                    infoBtnTxt.setText('i');
                }
            });
        });
    }

    private selectDraftedSkill(arrowKey: string, skill: Skill) {
        this.state.skills[arrowKey] = skill;

        if (this.choiceContainer) { 
            this.choiceContainer.destroy(); 
            this.choiceContainer = null; 
        }
        if (this.skillsLayout) {
            this.skillsLayout.destroy();
        }
        
        // Redessine l'ath des touches mis à jour
        this.skillsLayout = new SkillsLayout(this, 220, 260, this.state.skills);

        this.refreshInterfaceDisplay();
        this.isChoosing = false;
        this.isTweening = false;
        this.logText.setText(`Compétence [${skill.name}] assignée ! À vous de jouer.`);
    }

    private decrementStatusStacks(casterTag: 'player' | 'monster') {
        const statuses = casterTag === 'player' ? this.state.playerStatuses : this.state.monsterStatuses;
        
        // Décrémentation Brûlure
        const activeBurn = statuses.find(s => s.id === 'burn');
        if (activeBurn && !activeBurn.isInfinite) {
            activeBurn.stacks -= 1;
            if (activeBurn.stacks <= 0) this.state.removeStatus(casterTag, 'burn');
        }

        // Décrémentation Vol : Consomme une charge après chaque attaque lancée
        const activeFlight = statuses.find(s => s.id === 'flight');
        if (activeFlight && !activeFlight.isInfinite) {
            activeFlight.stacks -= 1;
            if (activeFlight.stacks <= 0) this.state.removeStatus(casterTag, 'flight');
        }
    }
}
