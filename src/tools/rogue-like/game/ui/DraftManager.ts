import Phaser from 'phaser';
import { ALL_SKILLS, type Skill, getScalingFormulaString } from '../data/SkillRegistry';

export class DraftManager {
    public static show(
        scene: Phaser.Scene,
        ownedSkills: Record<string, Skill>,
        onSelect: (skill: Skill) => void
    ): Phaser.GameObjects.Container {
        const choiceContainer = scene.add.container(360, 260);

        // 1. On liste les noms des compétences que le joueur possède déjà dans son deck
        const ownedSkillNames = Object.values(ownedSkills).map(s => s.name);
        
        // 2. On filtre la banque globale pour ne garder que ce qu'il n'a pas encore équipé
        const availableSkills = ALL_SKILLS.filter(s => !ownedSkillNames.includes(s.name));
        
        // 3. Mélange aléatoire et sélection de 3 propositions uniques
        const choices = Phaser.Utils.Array.Shuffle(availableSkills).slice(0, 3);

        choices.forEach((skill, index) => {
            const posX = (index - 1) * 215;
            const card = scene.add.container(posX, 0);

            const bg = scene.add.rectangle(0, 0, 195, 170, 0xdbdbdb).setStrokeStyle(3, 0x808080).setInteractive({ cursor: 'pointer' });
            
            // Relief 3D
            const shadow = scene.add.rectangle(4, 4, 195, 170, 0x000000, 0.4);

            const title = scene.add.text(0, -60, skill.name, { 
                fontFamily: 'Arial, sans-serif', 
                fontSize: '13px', 
                fontStyle: 'bold', 
                color: '#0000aa' 
            }).setOrigin(0.5);
            
            const bodyText = scene.add.text(0, -10, skill.shortDesc, {
                fontFamily: 'Courier New, Courier, monospace', 
                fontSize: '11px', 
                color: '#000000', 
                wordWrap: { width: 175 }, 
                align: 'center'
            }).setOrigin(0.5);

            const infoBtnBg = scene.add.rectangle(74, 64, 24, 24, 0x000080).setInteractive({ cursor: 'pointer' });
            const infoBtnTxt = scene.add.text(74, 64, 'i', { 
                fontFamily: 'Arial, sans-serif', 
                fontSize: '13px', 
                fontStyle: 'bold', 
                color: '#ffffff' 
            }).setOrigin(0.5);
            
            const selectHint = scene.add.text(0, 64, '[ ÉQUIPER ]', { 
                fontFamily: 'Arial, sans-serif', 
                fontSize: '11px', 
                fontStyle: 'bold', 
                color: '#333333' 
            }).setOrigin(0.5);

            card.add([shadow, bg, title, bodyText, infoBtnBg, infoBtnTxt, selectHint]);
            card.sendToBack(shadow);
            choiceContainer.add(card);

            bg.on('pointerover', () => bg.setFillStyle(0xeaeaea));
            bg.on('pointerout', () => bg.setFillStyle(0xdbdbdb));
            bg.on('pointerdown', () => {
                choiceContainer.destroy();
                onSelect(skill);
            });

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

        return choiceContainer;
    }
}
