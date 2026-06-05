import { type CharacterStats } from './Stats';

export interface GeneratedHero {
    name: string;
    assetKey: string;
    svgRaw: string;
    stats: CharacterStats;
}

const SKINS = ['#ffdbac', '#f1c27d', '#e0ac69', '#c68642', '#8d5524'];
const CLOTHES = ['#3a86ff', '#8338ec', '#ff006e', '#fb5607', '#ffbe0b', '#2ec4b6'];
const HAIRS = ['#1a1a1a', '#4e3629', '#d69f3d', '#a32626', '#7a7a7a'];
const NAMES = ['User_Alpha', 'Operator_X', 'Agent_Core', 'Pilot_Null', 'Nomad_Grid'];

function getRandomElement<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)]!;
}

function getRandomBetween(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateHumanSVG(skin: string, shirt: string, pants: string, hair: string): string {
    return `<svg viewBox="0 0 32 32" width="64" height="64" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">
        <rect x="11" y="21" width="3" height="8" fill="${pants}" />
        <rect x="18" y="21" width="3" height="8" fill="${pants}" />
        <rect x="10" y="13" width="12" height="8" fill="${shirt}" />
        <rect x="8" y="13" width="2" height="6" fill="${shirt}" />
        <rect x="22" y="13" width="2" height="6" fill="${shirt}" />
        <rect x="8" y="19" width="2" height="2" fill="${skin}" />
        <rect x="22" y="19" width="2" height="2" fill="${skin}" />
        <rect x="12" y="6" width="8" height="7" fill="${skin}" />
        <rect x="13" y="8" width="1" height="1" fill="#000000" />
        <rect x="17" y="8" width="1" height="1" fill="#000000" />
        <rect x="12" y="4" width="8" height="2" fill="${hair}" />
        <rect x="11" y="6" width="2" height="3" fill="${hair}" />
        <rect x="19" y="6" width="2" height="3" fill="${hair}" />
    </svg>`;
}

export class HeroFactory {
    public static generateThreeOptions(): GeneratedHero[] {
        const options: GeneratedHero[] = [];
        for (let i = 0; i < 3; i++) {
            const totalPointsTarget = getRandomBetween(75, 90);
            // On a désormais 6 statistiques primaires à nourrir (min 5 points par stat = 30)
            let pool = totalPointsTarget - 30; 

            // Attribution des points de vie (vitalité)
            const hp_points = 5 + Math.floor(Math.random() * pool * 0.25); pool -= (hp_points - 5);
            
            const att = 5 + Math.floor(Math.random() * pool * 0.35); pool -= (att - 5);
            const att_magic = 5 + Math.floor(Math.random() * pool * 0.4); pool -= (att_magic - 5);
            const def_phys = 5 + Math.floor(Math.random() * pool * 0.4); pool -= (def_phys - 5);
            const def_magic = 5 + Math.floor(Math.random() * pool * 0.5); pool -= (def_magic - 5);
            const speed = 5 + pool;

            const stats: CharacterStats = {
                hp_max: 50 + (hp_points * 5), // Ex: 5 points = 75 HP, 15 points = 125 HP
                att, att_magic, def_phys, def_magic, speed,
                crit_rate: parseFloat((0.05 + Math.random() * 0.12).toFixed(2)),
                crit_damage: parseFloat((1.30 + Math.random() * 0.35).toFixed(2)),
                agility: parseFloat((0.05 + Math.random() * 0.08).toFixed(2))
            };

            const name = `${getRandomElement(NAMES)}_${getRandomBetween(10, 99)}`;
            const svg = generateHumanSVG(getRandomElement(SKINS), getRandomElement(CLOTHES), getRandomElement(CLOTHES), getRandomElement(HAIRS));

            options.push({ name, assetKey: `hero_choice_${i}`, svgRaw: svg, stats });
        }
        return options;
    }
}
