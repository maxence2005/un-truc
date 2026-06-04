import { Game, AUTO, Scale } from 'phaser';
import { DuelScene } from './DuelScene';

export function initGame(parentContainer: HTMLElement) {
    const config: Phaser.Types.Core.GameConfig = {
        type: AUTO,
        width: 640,
        height: 480,
        parent: parentContainer,
        backgroundColor: '#000000',
        pixelArt: true,
        scale: {
            mode: Scale.FIT,
            autoCenter: Scale.CENTER_BOTH
        },
        // On commence directement par le Duel (qui gère son propre draft)
        scene: [DuelScene]
    };

    return new Game(config);
}
