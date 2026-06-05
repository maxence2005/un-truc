import Phaser from 'phaser';

export class Preloader {
    public static preload(scene: Phaser.Scene) {
        // Chargement à la volée des SVG d'interface globaux et des monstres
        const coreModules = import.meta.glob('../assets/*.svg', { query: '?raw', eager: true }) as Record<string, { default: string }>;
        Object.entries(coreModules).forEach(([path, module]) => {
            const filename = path.split('/').pop()?.split('.').shift();
            if (filename !== 'hero') { // Évite d'écraser la texture humaine procédurale
                const blob = new Blob([module.default], { type: 'image/svg+xml' });
                scene.load.svg(filename!, URL.createObjectURL(blob));
            }
        });

        const monsters = import.meta.glob('../assets/monsters/*.svg', { query: '?raw', eager: true }) as Record<string, { default: string }>;
        Object.entries(monsters).forEach(([path, module]) => {
            const filename = path.split('/').pop()?.split('.').shift();
            const blob = new Blob([module.default], { type: 'image/svg+xml' });
            scene.load.svg(`monster_${filename}`, URL.createObjectURL(blob));
        });

        // Charge à la volée TOUS les icônes de compétences
        const skillIcons = import.meta.glob('../assets/skills/*.svg', { query: '?raw', eager: true }) as Record<string, { default: string }>;
        Object.entries(skillIcons).forEach(([path, module]) => {
            const filename = path.split('/').pop()?.split('.').shift();
            const key = `skill_${filename}`;
            const blob = new Blob([module.default], { type: 'image/svg+xml' });
            scene.load.svg(key, URL.createObjectURL(blob));
        });

        // Charge à la volée TOUS les icônes de statuts
        const statusIcons = import.meta.glob('../assets/statuses/*.svg', { query: '?raw', eager: true }) as Record<string, { default: string }>;
        Object.entries(statusIcons).forEach(([path, module]) => {
            const filename = path.split('/').pop()?.split('.').shift();
            const blob = new Blob([module.default], { type: 'image/svg+xml' });
            scene.load.svg(filename!, URL.createObjectURL(blob));
        });

        // Chargement des 4 musiques
        scene.load.audio('music1', '/music.mp3');
        scene.load.audio('music2', '/music2.mp3');
        scene.load.audio('music3', '/music3.mp3');
        scene.load.audio('music4', '/music4.mp3');
    }
}
