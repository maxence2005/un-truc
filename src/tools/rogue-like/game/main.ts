import { Game, AUTO, Scale } from 'phaser';
import { CharSelectScene } from './scenes/CharSelectScene';
import { DuelScene } from './DuelScene';

export function initGame(parentContainer: HTMLElement) {
    const config: Phaser.Types.Core.GameConfig = {
        type: AUTO,
        width: 960,
        height: 640,
        parent: parentContainer,
        backgroundColor: '#000000',
        pixelArt: true,
        scale: {
            mode: Scale.FIT,
            autoCenter: Scale.CENTER_BOTH
        },
        // Séquence directe : Écran des héros puis Arène de duel avec Draft progressif
        scene: [CharSelectScene, DuelScene]
    };

    return new Game(config);
}
