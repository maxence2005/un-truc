import Phaser from 'phaser';
import { CombatState } from '../state/CombatState';
import { CharacterVisual } from '../ui/CharacterVisual';
import { StatsSidebar } from '../ui/StatsSidebar';
import { SkillsLayout } from '../ui/SkillsLayout';
import { CombatCalculator } from './CombatCalculator';
import { type Skill } from '../data/SkillRegistry';
import { type GeneratedHero } from '../data/HeroFactory';

export class TurnManager {
    private scene: Phaser.Scene;
    private state: CombatState;
    private playerVisual: CharacterVisual;
    private monsterVisual: CharacterVisual;
    private sidebar: StatsSidebar;
    private heroSetup: GeneratedHero;
    private logText: Phaser.GameObjects.Text;
    private scoreText: Phaser.GameObjects.Text;
    
    private onTurnStart: () => void;
    private onTurnEnd: (isGameOver: boolean) => void;
    private onMonsterKilled: () => void;
    private getSkillsLayout: () => SkillsLayout | null;
    private refreshUI: () => void;

    constructor(
        scene: Phaser.Scene,
        state: CombatState,
        playerVisual: CharacterVisual,
        monsterVisual: CharacterVisual,
        sidebar: StatsSidebar,
        heroSetup: GeneratedHero,
        logText: Phaser.GameObjects.Text,
        scoreText: Phaser.GameObjects.Text,
        getSkillsLayout: () => SkillsLayout | null,
        onTurnStart: () => void,
        onTurnEnd: (isGameOver: boolean) => void,
        onMonsterKilled: () => void,
        refreshUI: () => void
    ) {
        this.scene = scene;
        this.state = state;
        this.playerVisual = playerVisual;
        this.monsterVisual = monsterVisual;
        this.sidebar = sidebar;
        this.heroSetup = heroSetup;
        this.logText = logText;
        this.scoreText = scoreText;
        this.getSkillsLayout = getSkillsLayout;
        this.onTurnStart = onTurnStart;
        this.onTurnEnd = onTurnEnd;
        this.onMonsterKilled = onMonsterKilled;
        this.refreshUI = refreshUI;
    }

    public executePlayerTurn(playerSkillKey: string) {
        // --- EVOLUTION GO TO THE MOON : Résolution des préparations lunaires du tour précédent ---
        const playerPrep = this.state.playerStatuses.find(s => s.id === 'moon_prep');
        if (playerPrep) {
            this.state.removeStatus('player', 'moon_prep');
            this.state.addStatus('player', 'flight', 3);
            this.createFloatingText(220, 180, "DÉCOLLAGE", "#00eaff");
        }

        const monsterPrep = this.state.monsterStatuses.find(s => s.id === 'moon_prep');
        if (monsterPrep) {
            this.state.removeStatus('monster', 'moon_prep');
            this.state.addStatus('monster', 'flight', 3);
            this.createFloatingText(500, 180, "DÉCOLLAGE", "#ff4d4d");
        }

        const playerSkill = this.state.skills[playerSkillKey]!;

        // --- RESTRICTION GO TO THE MOON ---
        if (playerSkill.name === 'Go to the moon' && this.state.playerStatuses.some(s => s.id === 'flight')) {
            this.logText.setText(`[SYSTEM] Erreur: Impossible de relancer 'Go to the moon' pendant que vous volez déjà !`);
            return;
        }

        this.onTurnStart();
        
        const skillsLayout = this.getSkillsLayout();
        skillsLayout?.playSelectionAnimation(playerSkillKey);

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

    public executeSingleAction(skill: Skill, isPlayer: boolean, next: () => void) {
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
            this.refreshUI();
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
                this.refreshUI();
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

            this.refreshUI();
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
            this.onTurnEnd(true); // Game over
        } else {
            this.onTurnEnd(false);
        }
    }

    private handleMonsterDeath() {
        this.state.setupNextMonster();
        this.scoreText.setText(`SCORE: ${this.state.score}`);

        this.monsterVisual.playDeathAnimation(() => {
            this.monsterVisual.updateTexture(this.state.currentMonster.assetKey);
            this.monsterVisual.resetVisual();
            this.updateHpGraphics();
            this.refreshUI(); // Met à jour instantanément les stats du nouveau monstre sur la droite !
            this.onMonsterKilled();
        });
    }

    public updateHpGraphics() {
        this.playerVisual.updateHp(this.state.playerHp, this.state.playerMaxHp);
        this.monsterVisual.updateHp(this.state.monsterHp, this.state.monsterMaxHp);
    }

    public createFloatingText(x: number, y: number, msg: string, color: string) {
        const txt = this.scene.add.text(x, y, msg, { fontFamily: 'Courier New', fontSize: '20px', color, fontStyle: 'bold' }).setOrigin(0.5);
        this.scene.tweens.add({ targets: txt, y: y - 40, alpha: 0, duration: 800, onComplete: () => txt.destroy() });
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
