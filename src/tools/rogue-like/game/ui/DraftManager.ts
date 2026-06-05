import Phaser from 'phaser';
import { ALL_SKILLS, type Skill, getScalingFormulaString } from '../data/SkillRegistry';
import { type StatUpgrade } from '../state/CombatState';

export class DraftManager {
    public static show(
        scene: Phaser.Scene,
        ownedSkills: Record<string, Skill>,
        isFirstChoice: boolean,
        onSelectSkill: (arrowKey: string, skill: Skill) => void,
        onSelectStat: (upgrade: StatUpgrade) => void
    ): Phaser.GameObjects.Container {
        const choiceContainer = scene.add.container(360, 260);

        if (isFirstChoice) {
            // Premier choix du jeu : compétences obligatoires
            this.showSkillsDraft(scene, choiceContainer, ownedSkills, onSelectSkill);
        } else {
            // Choix suivants : Sélection de la catégorie de récompense
            this.showCategorySelection(scene, choiceContainer, ownedSkills, onSelectSkill, onSelectStat);
        }

        return choiceContainer;
    }

    private static showCategorySelection(
        scene: Phaser.Scene,
        choiceContainer: Phaser.GameObjects.Container,
        ownedSkills: Record<string, Skill>,
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
        const textSkill = scene.add.text(0, 0, "💾 LOGICIEL.EXE\n\n[ NOUVELLE CAPACITÉ ]", {
            fontFamily: 'Arial', fontSize: '12px', fontStyle: 'bold', color: '#0000aa', align: 'center'
        }).setOrigin(0.5);
        btnSkill.add([shadowSkill, bgSkill, textSkill]);
        btnSkill.sendToBack(shadowSkill);
        choiceContainer.add(btnSkill);

        bgSkill.on('pointerover', () => bgSkill.setFillStyle(0xeaeaea));
        bgSkill.on('pointerout', () => bgSkill.setFillStyle(0xdbdbdb));
        bgSkill.on('pointerdown', () => {
            this.showSkillsDraft(scene, choiceContainer, ownedSkills, onSelectSkill);
        });

        // 2. Bouton Statistique
        const btnStat = scene.add.container(115, 0);
        const bgStat = scene.add.rectangle(0, 0, 200, 120, 0xdbdbdb).setStrokeStyle(3, 0x808080).setInteractive({ cursor: 'pointer' });
        const shadowStat = scene.add.rectangle(4, 4, 200, 120, 0x000000, 0.4);
        const textStat = scene.add.text(0, 0, "⚙️ CONFIG.SYS\n\n[ AMÉLIORATION STAT ]", {
            fontFamily: 'Arial', fontSize: '12px', fontStyle: 'bold', color: '#006600', align: 'center'
        }).setOrigin(0.5);
        btnStat.add([shadowStat, bgStat, textStat]);
        btnStat.sendToBack(shadowStat);
        choiceContainer.add(btnStat);

        bgStat.on('pointerover', () => bgStat.setFillStyle(0xeaeaea));
        bgStat.on('pointerout', () => bgStat.setFillStyle(0xdbdbdb));
        bgStat.on('pointerdown', () => {
            this.showStatsDraft(scene, choiceContainer, onSelectStat);
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
            
            const selectHint = scene.add.text(0, 64, '[ ÉQUIPER ]', { 
                fontFamily: 'Arial, sans-serif', fontSize: '11px', fontStyle: 'bold', color: '#333333' 
            }).setOrigin(0.5);

            card.add([shadow, bg, title, bodyText, infoBtnBg, infoBtnTxt, selectHint]);
            card.sendToBack(shadow);
            choiceContainer.add(card);

            bg.on('pointerover', () => bg.setFillStyle(0xeaeaea));
            bg.on('pointerout', () => bg.setFillStyle(0xdbdbdb));
            bg.on('pointerdown', () => {
                const ownedKeys = Object.keys(ownedSkills);
                if (ownedKeys.length < 4) {
                    const slotOrder = ['ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowLeft'];
                    const chosenKey = slotOrder[ownedKeys.length]!;
                    choiceContainer.destroy();
                    onSelectSkill(chosenKey, skill);
                } else {
                    this.showReplacementSelection(scene, choiceContainer, ownedSkills, skill, onSelectSkill);
                }
            });

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

        const keys = ['ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowLeft'];
        keys.forEach((key, index) => {
            const posY = -30 + (index * 45);
            const btn = scene.add.container(0, posY);

            const bg = scene.add.rectangle(0, 0, 360, 36, 0xdbdbdb).setStrokeStyle(2, 0x808080).setInteractive({ cursor: 'pointer' });
            const shadow = scene.add.rectangle(3, 3, 360, 36, 0x000000, 0.4);

            const skill = ownedSkills[key]!;
            const text = scene.add.text(0, 0, `[${arrowSymbols[key]}]  ${skill.name} (${skill.shortDesc})`, {
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
    }

    private static showStatsDraft(
        scene: Phaser.Scene,
        choiceContainer: Phaser.GameObjects.Container,
        onSelectStat: (upgrade: StatUpgrade) => void
    ) {
        choiceContainer.removeAll(true);

        const dummyState = new (class {
            public getRandomThreeStatUpgrades() {
                const pool: StatUpgrade[] = [
                    { name: '🔋 VITALITE.SYS', desc: 'PV Max +20 points (soigne d\'autant).', statKey: 'hp_max', value: 20 },
                    { name: '⚔️ POWER_ATT.EXE', desc: 'Attaque Physique +5 points.', statKey: 'att', value: 5 },
                    { name: '🔮 MAGIC_ATT.EXE', desc: 'Attaque Magique +5 points.', statKey: 'att_magic', value: 5 },
                    { name: '🛡️ DEF_PHYS.SYS', desc: 'Défense Physique +4 points.', statKey: 'def_phys', value: 4 },
                    { name: '🛡️ DEF_MAGIC.SYS', desc: 'Défense Magique +4 points.', statKey: 'def_magic', value: 4 },
                    { name: '⚡ OVERCLOCK.EXE', desc: 'Vitesse +3 points.', statKey: 'speed', value: 3 },
                    { name: '🎯 CRIT_BOOST.SYS', desc: 'Taux de Critique +5%.', statKey: 'crit_rate', value: 0.05 },
                    { name: '💨 EVASION.EXE', desc: 'Agilité (esquive) +4%.', statKey: 'agility', value: 0.04 }
                ];
                return Phaser.Utils.Array.Shuffle(pool).slice(0, 3);
            }
        })();
        const upgrades = dummyState.getRandomThreeStatUpgrades();

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

            const selectHint = scene.add.text(0, 64, '[ INSTALLER ]', { 
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
    }
}
