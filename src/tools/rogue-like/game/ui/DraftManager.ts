import Phaser from 'phaser';
import { ALL_SKILLS, type Skill, getScalingFormulaString } from '../data/SkillRegistry';
import { type CombatState, type StatUpgrade } from '../state/CombatState';

export class DraftManager {
    private static activeKeyListener: ((e: KeyboardEvent) => void) | null = null;

    private static registerKeyListener(scene: Phaser.Scene, listener: (e: KeyboardEvent) => void) {
        if (this.activeKeyListener) {
            scene.input.keyboard?.off('keydown', this.activeKeyListener);
        }
        this.activeKeyListener = listener;
        scene.input.keyboard?.on('keydown', listener);
    }

    private static cleanupKeyListener(scene: Phaser.Scene) {
        if (this.activeKeyListener) {
            scene.input.keyboard?.off('keydown', this.activeKeyListener);
            this.activeKeyListener = null;
        }
    }

    public static show(
        scene: Phaser.Scene,
        state: CombatState,
        isFirstChoice: boolean,
        onSelectSkill: (arrowKey: string, skill: Skill) => void,
        onSelectStat: (upgrade: StatUpgrade) => void
    ): Phaser.GameObjects.Container {
        const choiceContainer = scene.add.container(360, 260);

        // Nettoyage automatique des écouteurs de touches lorsque la boîte de dialogue se ferme
        choiceContainer.once('destroy', () => {
            this.cleanupKeyListener(scene);
        });

        if (isFirstChoice) {
            this.showSkillsDraft(scene, choiceContainer, state.skills, onSelectSkill);
        } else {
            this.showCategorySelection(scene, choiceContainer, state, onSelectSkill, onSelectStat);
        }

        return choiceContainer;
    }

    private static showCategorySelection(
        scene: Phaser.Scene,
        choiceContainer: Phaser.GameObjects.Container,
        state: CombatState,
        onSelectSkill: (arrowKey: string, skill: Skill) => void,
        onSelectStat: (upgrade: StatUpgrade) => void
    ) {
        choiceContainer.removeAll(true);

        const titleText = scene.add.text(0, -90, "--- TYPE DE RÉCOMPENSE ---", {
            fontFamily: 'Courier New', fontSize: '13px', fontStyle: 'bold', color: '#ffffff'
        }).setOrigin(0.5);
        choiceContainer.add(titleText);

        // 1. Bouton Compétence
        const btnSkill = scene.add.container(-115, 0);
        const bgSkill = scene.add.rectangle(0, 0, 200, 120, 0xdbdbdb).setStrokeStyle(3, 0x808080).setInteractive({ cursor: 'pointer' });
        const shadowSkill = scene.add.rectangle(4, 4, 200, 120, 0x000000, 0.4);
        const textSkill = scene.add.text(0, 0, "SYS.LOGICIEL\n\n[&] NOUVELLE CAPACITÉ", {
            fontFamily: 'Arial', fontSize: '12px', fontStyle: 'bold', color: '#0000aa', align: 'center'
        }).setOrigin(0.5);
        btnSkill.add([shadowSkill, bgSkill, textSkill]);
        btnSkill.sendToBack(shadowSkill);
        choiceContainer.add(btnSkill);

        bgSkill.on('pointerover', () => bgSkill.setFillStyle(0xeaeaea));
        bgSkill.on('pointerout', () => bgSkill.setFillStyle(0xdbdbdb));
        bgSkill.on('pointerdown', () => {
            this.showSkillsDraft(scene, choiceContainer, state.skills, onSelectSkill);
        });

        // 2. Bouton Statistique
        const btnStat = scene.add.container(115, 0);
        const bgStat = scene.add.rectangle(0, 0, 200, 120, 0xdbdbdb).setStrokeStyle(3, 0x808080).setInteractive({ cursor: 'pointer' });
        const shadowStat = scene.add.rectangle(4, 4, 200, 120, 0x000000, 0.4);
        const textStat = scene.add.text(0, 0, "SYS.CONFIG\n\n[é] AMÉLIORATION STAT", {
            fontFamily: 'Arial', fontSize: '12px', fontStyle: 'bold', color: '#006600', align: 'center'
        }).setOrigin(0.5);
        btnStat.add([shadowStat, bgStat, textStat]);
        btnStat.sendToBack(shadowStat);
        choiceContainer.add(btnStat);

        bgStat.on('pointerover', () => bgStat.setFillStyle(0xeaeaea));
        bgStat.on('pointerout', () => bgStat.setFillStyle(0xdbdbdb));
        bgStat.on('pointerdown', () => {
            this.showStatsDraft(scene, choiceContainer, state, onSelectStat);
        });

        // Enregistre l'écouteur clavier pour la sélection de catégorie (& ou é)
        this.registerKeyListener(scene, (e: KeyboardEvent) => {
            if (e.key === '&' || e.key === '1' || e.code === 'Digit1') {
                this.showSkillsDraft(scene, choiceContainer, state.skills, onSelectSkill);
            } else if (e.key === 'é' || e.key === '2' || e.code === 'Digit2') {
                this.showStatsDraft(scene, choiceContainer, state, onSelectStat);
            }
        });
    }

    private static showSkillsDraft(
        scene: Phaser.Scene,
        choiceContainer: Phaser.GameObjects.Container,
        ownedSkills: Record<string, Skill>,
        onSelectSkill: (arrowKey: string, skill: Skill) => void
    ) {
        choiceContainer.removeAll(true);

        const ownedSkillNames = Object.values(ownedSkills).map(s => s.name);
        const availableSkills = ALL_SKILLS.filter(s => !ownedSkillNames.includes(s.name));
        const choices = Phaser.Utils.Array.Shuffle(availableSkills).slice(0, 3);

        const shortcutKeys = ['&', 'é', '"'];

        choices.forEach((skill, index) => {
            const posX = (index - 1) * 215;
            const card = scene.add.container(posX, 0);

            const bg = scene.add.rectangle(0, 0, 195, 170, 0xdbdbdb).setStrokeStyle(3, 0x808080).setInteractive({ cursor: 'pointer' });
            const shadow = scene.add.rectangle(4, 4, 195, 170, 0x000000, 0.4);

            const title = scene.add.text(0, -60, skill.name, { 
                fontFamily: 'Arial, sans-serif', fontSize: '13px', fontStyle: 'bold', color: '#0000aa' 
            }).setOrigin(0.5);
            
            const bodyText = scene.add.text(0, -10, skill.shortDesc, {
                fontFamily: 'Courier New, Courier, monospace', fontSize: '11px', color: '#000000', 
                wordWrap: { width: 175 }, align: 'center'
            }).setOrigin(0.5);

            const infoBtnBg = scene.add.rectangle(74, 64, 24, 24, 0x000080).setInteractive({ cursor: 'pointer' });
            const infoBtnTxt = scene.add.text(74, 64, 'i', { 
                fontFamily: 'Arial, sans-serif', fontSize: '13px', fontStyle: 'bold', color: '#ffffff' 
            }).setOrigin(0.5);
            
            const keyHint = shortcutKeys[index]!;
            const selectHint = scene.add.text(0, 64, `[ ${keyHint} ] ÉQUIPER`, { 
                fontFamily: 'Arial, sans-serif', fontSize: '11px', fontStyle: 'bold', color: '#333333' 
            }).setOrigin(0.5);

            card.add([shadow, bg, title, bodyText, infoBtnBg, infoBtnTxt, selectHint]);
            card.sendToBack(shadow);
            choiceContainer.add(card);

            bg.on('pointerover', () => bg.setFillStyle(0xeaeaea));
            bg.on('pointerout', () => bg.setFillStyle(0xdbdbdb));
            
            const handleSelection = () => {
                const ownedKeys = Object.keys(ownedSkills);
                if (ownedKeys.length < 4) {
                    const slotOrder = ['ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowLeft'];
                    const chosenKey = slotOrder[ownedKeys.length]!;
                    choiceContainer.destroy();
                    onSelectSkill(chosenKey, skill);
                } else {
                    this.showReplacementSelection(scene, choiceContainer, ownedSkills, skill, onSelectSkill);
                }
            };

            bg.on('pointerdown', handleSelection);

            let isExpanded = false;
            const formula = getScalingFormulaString(skill);

            infoBtnBg.on('pointerover', () => {
                infoBtnBg.setFillStyle(isExpanded ? 0xff4d4d : 0x0000ff);
            });
            infoBtnBg.on('pointerout', () => {
                infoBtnBg.setFillStyle(isExpanded ? 0xff003c : 0x000080);
            });

            infoBtnBg.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
                pointer.event?.stopPropagation();
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

        // Écouteur clavier pour sélectionner une carte de compétence
        this.registerKeyListener(scene, (e: KeyboardEvent) => {
            let idx = -1;
            if (e.key === '&' || e.key === '1' || e.code === 'Digit1') idx = 0;
            else if (e.key === 'é' || e.key === '2' || e.code === 'Digit2') idx = 1;
            else if (e.key === '"' || e.key === '3' || e.code === 'Digit3') idx = 2;

            if (idx !== -1 && choices[idx]) {
                const skill = choices[idx]!;
                const ownedKeys = Object.keys(ownedSkills);
                if (ownedKeys.length < 4) {
                    const slotOrder = ['ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowLeft'];
                    const chosenKey = slotOrder[ownedKeys.length]!;
                    choiceContainer.destroy();
                    onSelectSkill(chosenKey, skill);
                } else {
                    this.showReplacementSelection(scene, choiceContainer, ownedSkills, skill, onSelectSkill);
                }
            }
        });
    }

    private static showReplacementSelection(
        scene: Phaser.Scene,
        choiceContainer: Phaser.GameObjects.Container,
        ownedSkills: Record<string, Skill>,
        newSkill: Skill,
        onSelectSkill: (arrowKey: string, skill: Skill) => void
    ) {
        choiceContainer.removeAll(true);

        const titleText = scene.add.text(0, -100, "--- REMPLACER UNE COMPÉTENCE ---", {
            fontFamily: 'Courier New', fontSize: '13px', fontStyle: 'bold', color: '#ff003c'
        }).setOrigin(0.5);
        choiceContainer.add(titleText);

        const subtitleText = scene.add.text(0, -75, `Remplacer par [${newSkill.name}]`, {
            fontFamily: 'Courier New', fontSize: '11px', color: '#ffffff'
        }).setOrigin(0.5);
        choiceContainer.add(subtitleText);

        const arrowSymbols: Record<string, string> = { 
            ArrowUp: '▲ HAUT', ArrowRight: '▶ DROITE', ArrowDown: '▼ BAS', ArrowLeft: '◀ GAUCHE' 
        };

        const shortcutKeys = ['&', 'é', '"', '\''];
        const keys = ['ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowLeft'];
        
        keys.forEach((key, index) => {
            const posY = -30 + (index * 45);
            const btn = scene.add.container(0, posY);

            const bg = scene.add.rectangle(0, 0, 360, 36, 0xdbdbdb).setStrokeStyle(2, 0x808080).setInteractive({ cursor: 'pointer' });
            const shadow = scene.add.rectangle(3, 3, 360, 36, 0x000000, 0.4);

            const skill = ownedSkills[key]!;
            const keyHint = shortcutKeys[index]!;
            const text = scene.add.text(0, 0, `[ ${keyHint} ] [${arrowSymbols[key]}]  ${skill.name} (${skill.shortDesc})`, {
                fontFamily: 'Courier New', fontSize: '11px', fontStyle: 'bold', color: '#000000'
            }).setOrigin(0.5);

            btn.add([shadow, bg, text]);
            btn.sendToBack(shadow);
            choiceContainer.add(btn);

            bg.on('pointerover', () => bg.setFillStyle(0xeaeaea));
            bg.on('pointerout', () => bg.setFillStyle(0xdbdbdb));
            bg.on('pointerdown', () => {
                choiceContainer.destroy();
                onSelectSkill(key, newSkill);
            });
        });

        // Écouteur clavier pour remplacer la compétence correspondante
        this.registerKeyListener(scene, (e: KeyboardEvent) => {
            let idx = -1;
            if (e.key === '&' || e.key === '1' || e.code === 'Digit1') idx = 0;
            else if (e.key === 'é' || e.key === '2' || e.code === 'Digit2') idx = 1;
            else if (e.key === '"' || e.key === '3' || e.code === 'Digit3') idx = 2;
            else if (e.key === '\'' || e.key === '4' || e.code === 'Digit4') idx = 3;

            if (idx !== -1) {
                const chosenKey = keys[idx]!;
                choiceContainer.destroy();
                onSelectSkill(chosenKey, newSkill);
            }
        });
    }

    private static showStatsDraft(
        scene: Phaser.Scene,
        choiceContainer: Phaser.GameObjects.Container,
        state: CombatState,
        onSelectStat: (upgrade: StatUpgrade) => void
    ) {
        choiceContainer.removeAll(true);

        const upgrades = state.getRandomThreeStatUpgrades();
        const shortcutKeys = ['&', 'é', '"'];

        upgrades.forEach((up, index) => {
            const posX = (index - 1) * 215;
            const card = scene.add.container(posX, 0);

            const bg = scene.add.rectangle(0, 0, 195, 170, 0xdbdbdb).setStrokeStyle(3, 0x808080).setInteractive({ cursor: 'pointer' });
            const shadow = scene.add.rectangle(4, 4, 195, 170, 0x000000, 0.4);

            const title = scene.add.text(0, -50, up.name, { 
                fontFamily: 'Arial, sans-serif', fontSize: '13px', fontStyle: 'bold', color: '#006600' 
            }).setOrigin(0.5);
            
            const bodyText = scene.add.text(0, 10, up.desc, {
                fontFamily: 'Courier New, Courier, monospace', fontSize: '11px', color: '#000000', 
                wordWrap: { width: 175 }, align: 'center'
            }).setOrigin(0.5);

            const keyHint = shortcutKeys[index]!;
            const selectHint = scene.add.text(0, 64, `[ ${keyHint} ] INSTALLER`, { 
                fontFamily: 'Arial, sans-serif', fontSize: '11px', fontStyle: 'bold', color: '#333333' 
            }).setOrigin(0.5);

            card.add([shadow, bg, title, bodyText, selectHint]);
            card.sendToBack(shadow);
            choiceContainer.add(card);

            bg.on('pointerover', () => bg.setFillStyle(0xeaeaea));
            bg.on('pointerout', () => bg.setFillStyle(0xdbdbdb));
            bg.on('pointerdown', () => {
                choiceContainer.destroy();
                onSelectStat(up);
            });
        });

        // Écouteur clavier pour sélectionner une carte de statistiques
        this.registerKeyListener(scene, (e: KeyboardEvent) => {
            let idx = -1;
            if (e.key === '&' || e.key === '1' || e.code === 'Digit1') idx = 0;
            else if (e.key === 'é' || e.key === '2' || e.code === 'Digit2') idx = 1;
            else if (e.key === '"' || e.key === '3' || e.code === 'Digit3') idx = 2;

            if (idx !== -1 && upgrades[idx]) {
                choiceContainer.destroy();
                onSelectStat(upgrades[idx]!);
            }
        });
    }
}
