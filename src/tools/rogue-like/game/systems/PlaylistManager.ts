import Phaser from 'phaser';

export class PlaylistManager {
    private static musicStarted = false;
    private static currentMusicIndex = 0;
    private static readonly MUSIC_KEYS = ['music1', 'music2', 'music3', 'music4'];

    public static start(scene: Phaser.Scene) {
        if (!this.musicStarted) {
            this.musicStarted = true;
            this.playNextTrack(scene);
        }
    }

    private static playNextTrack(scene: Phaser.Scene) {
        const key = this.MUSIC_KEYS[this.currentMusicIndex] as string;
        const music = scene.sound.add(key, { volume: 0.4 });
        
        music.once('complete', () => {
            this.currentMusicIndex = (this.currentMusicIndex + 1) % this.MUSIC_KEYS.length;
            scene.time.delayedCall(2000, () => {
                this.playNextTrack(scene);
            });
        });

        music.play();
    }
}
