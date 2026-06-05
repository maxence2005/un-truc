import { type CharacterStats } from './Stats';

export interface GeneratedHero {
    name: string;
    assetKey: string;
    svgRaw: string;
    stats: CharacterStats;
    classType: 'humain' | 'mage' | 'guerrier' | 'cyborg';
}

const SKINS = ['#ffdbac', '#f1c27d', '#e0ac69', '#c68642', '#8d5524', '#aaffaa', '#aaeaff'];
const CLOTHES = ['#3a86ff', '#8338ec', '#ff006e', '#fb5607', '#ffbe0b', '#2ec4b6', '#4a4a4a'];
const HAIRS = ['#1a1a1a', '#4e3629', '#d69f3d', '#a32626', '#7a7a7a', '#ffffff', '#00ffff'];
const METALS = ['#7f8c8d', '#bdc3c7', '#34495e', '#2c3e50', '#95a5a6', '#d35400'];
const VISORS = ['#00eaff', '#ff003c', '#00ff66', '#ffea00', '#ff00ff'];

const NAMES_EXPLORER = ['Explorer', 'Nomad', 'Agent', 'Scout', 'Pilot'];
const NAMES_WIZARD = ['Mage', 'Sorcerer', 'Oracle', 'Aether', 'Chronos'];
const NAMES_KNIGHT = ['Knight', 'Paladin', 'Vanguard', 'Sentry', 'Templar'];
const NAMES_CYBORG = ['Android', 'Cyborg', 'Unit', 'Cyber', 'Nexus'];

function getRandomElement<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)]!;
}

function getRandomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomFloat(min: number, max: number): number {
    return parseFloat((Math.random() * (max - min) + min).toFixed(2));
}

// Template 1: Classic Explorer (Slim Human) facing right
function generateExplorerSVG(skin: string, shirt: string, pants: string, hair: string): string {
    return `<svg viewBox="0 0 32 32" width="64" height="64" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">
        <!-- Legs -->
        <rect x="11" y="21" width="3" height="8" fill="${pants}" />
        <rect x="18" y="21" width="3" height="8" fill="${pants}" />
        <!-- Body & Arms -->
        <rect x="10" y="13" width="12" height="8" fill="${shirt}" />
        <rect x="8" y="13" width="2" height="6" fill="${shirt}" />
        <rect x="22" y="13" width="2" height="6" fill="${shirt}" />
        <rect x="8" y="19" width="2" height="2" fill="${skin}" />
        <rect x="22" y="19" width="2" height="2" fill="${skin}" />
        <!-- Head -->
        <rect x="12" y="6" width="8" height="7" fill="${skin}" />
        <!-- Eyes looking right -->
        <rect x="15" y="8" width="1" height="1" fill="#000000" />
        <rect x="18" y="8" width="1" height="1" fill="#000000" />
        <!-- Hair (longer in back-left, shorter in front-right) -->
        <rect x="12" y="4" width="8" height="2" fill="${hair}" />
        <rect x="11" y="6" width="2" height="4" fill="${hair}" />
        <rect x="19" y="6" width="1" height="2" fill="${hair}" />
    </svg>`;
}

// Template 2: Wizard / Mage (Robe & Wizard Hat) facing right
function generateWizardSVG(skin: string, robe: string, hatColor: string, beardColor: string): string {
    return `<svg viewBox="0 0 32 32" width="64" height="64" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">
        <!-- Long Robe -->
        <rect x="10" y="19" width="12" height="10" fill="${robe}" />
        <rect x="9" y="13" width="14" height="6" fill="${robe}" />
        <!-- Sleeves & Hands -->
        <rect x="7" y="13" width="2" height="6" fill="${robe}" />
        <rect x="23" y="13" width="2" height="6" fill="${robe}" />
        <rect x="7" y="19" width="2" height="2" fill="${skin}" />
        <rect x="23" y="19" width="2" height="2" fill="${skin}" />
        <!-- Head -->
        <rect x="12" y="7" width="8" height="6" fill="${skin}" />
        <!-- Eyes looking right -->
        <rect x="15" y="9" width="1" height="1" fill="#000000" />
        <rect x="18" y="9" width="1" height="1" fill="#000000" />
        <!-- Beard pointing right -->
        <rect x="14" y="13" width="7" height="4" fill="${beardColor}" />
        <rect x="16" y="17" width="5" height="2" fill="${beardColor}" />
        <!-- Wizard Hat pointing slightly forward -->
        <rect x="9" y="6" width="15" height="2" fill="${hatColor}" />
        <rect x="12" y="3" width="9" height="3" fill="${hatColor}" />
        <rect x="14" y="0" width="5" height="3" fill="${hatColor}" />
    </svg>`;
}

// Template 3: Armored Knight (Plate Armor & Helmet) facing right
function generateKnightSVG(armor: string, trimColor: string, visorColor: string, capeColor: string): string {
    return `<svg viewBox="0 0 32 32" width="64" height="64" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">
        <!-- Cape behind -->
        <rect x="8" y="13" width="16" height="15" fill="${capeColor}" />
        <!-- Heavy Legs -->
        <rect x="10" y="21" width="4" height="8" fill="${armor}" />
        <rect x="18" y="21" width="4" height="8" fill="${armor}" />
        <!-- Plate Chest & Shoulders -->
        <rect x="9" y="12" width="14" height="9" fill="${armor}" />
        <rect x="7" y="12" width="2" height="7" fill="${armor}" />
        <rect x="23" y="12" width="2" height="7" fill="${armor}" />
        <!-- Armor Trim -->
        <rect x="9" y="12" width="14" height="2" fill="${trimColor}" />
        <rect x="9" y="20" width="14" height="1" fill="${trimColor}" />
        <!-- Knight Helmet -->
        <rect x="11" y="4" width="10" height="8" fill="${armor}" />
        <!-- Visor shifted right (looking right) -->
        <rect x="15" y="7" width="6" height="2" fill="${visorColor}" />
        <!-- Plume waving backwards (left) -->
        <rect x="12" y="1" width="2" height="3" fill="${trimColor}" />
        <rect x="11" y="2" width="3" height="2" fill="${trimColor}" />
    </svg>`;
}

// Template 4: Cyborg / Android (Visor & Metallic Body) facing right
function generateCyborgSVG(metal: string, circuit: string, visor: string): string {
    return `<svg viewBox="0 0 32 32" width="64" height="64" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">
        <!-- Robot Legs -->
        <rect x="11" y="21" width="3" height="8" fill="${metal}" />
        <rect x="18" y="21" width="3" height="8" fill="${metal}" />
        <!-- Robot joints -->
        <rect x="12" y="23" width="1" height="2" fill="${circuit}" />
        <rect x="19" y="23" width="1" height="2" fill="${circuit}" />
        <!-- Mechanical Chest with glowing power core -->
        <rect x="10" y="13" width="12" height="8" fill="${metal}" />
        <circle cx="16" cy="17" r="2" fill="${circuit}" />
        <!-- Robotic Arms -->
        <rect x="8" y="13" width="2" height="7" fill="${metal}" />
        <rect x="22" y="13" width="2" height="7" fill="${metal}" />
        <rect x="8" y="20" width="2" height="2" fill="${circuit}" />
        <rect x="22" y="20" width="2" height="2" fill="${circuit}" />
        <!-- Mechanical Head -->
        <rect x="12" y="6" width="8" height="7" fill="${metal}" />
        <!-- Glowing Cyber Visor shifted right (looking right) -->
        <rect x="14" y="8" width="6" height="2" fill="${visor}" />
    </svg>`;
}

export class HeroFactory {
    public static generateThreeOptions(): GeneratedHero[] {
        const options: GeneratedHero[] = [];
        
        // On s'assure d'avoir 3 types différents si possible
        const bodyTypes = [0, 1, 2, 3];
        const chosenTypes = [...bodyTypes].sort(() => 0.5 - Math.random()).slice(0, 3);

        for (let i = 0; i < 3; i++) {
            const bodyType = chosenTypes[i]!; // 0 = Explorer, 1 = Wizard, 2 = Knight, 3 = Cyborg
            let stats!: CharacterStats;
            let name = '';
            let svg = '';
            let classType: 'humain' | 'mage' | 'guerrier' | 'cyborg' = 'humain';

            // Génération procédurale du modèle et des statistiques thématiques
            if (bodyType === 0) {
                // Explorer: Balanced, decent stats everywhere
                name = `${getRandomElement(NAMES_EXPLORER)}_${getRandomInt(10, 99)}`;
                svg = generateExplorerSVG(
                    getRandomElement(SKINS),
                    getRandomElement(CLOTHES),
                    getRandomElement(CLOTHES),
                    getRandomElement(HAIRS)
                );
                stats = {
                    hp_max: getRandomInt(80, 110),
                    att: getRandomInt(15, 25),
                    att_magic: getRandomInt(10, 20),
                    def_phys: getRandomInt(6, 12),
                    def_magic: getRandomInt(5, 10),
                    speed: getRandomInt(12, 20),
                    crit_rate: getRandomFloat(0.08, 0.16),
                    crit_damage: getRandomFloat(1.40, 1.65),
                    agility: getRandomFloat(0.06, 0.12)
                };
                classType = 'humain';
            } else if (bodyType === 1) {
                // Wizard: High magical power & defense, fragile
                name = `${getRandomElement(NAMES_WIZARD)}_${getRandomInt(10, 99)}`;
                svg = generateWizardSVG(
                    getRandomElement(SKINS),
                    getRandomElement(CLOTHES),
                    getRandomElement(CLOTHES),
                    getRandomElement(HAIRS)
                );
                stats = {
                    hp_max: getRandomInt(70, 95),
                    att: getRandomInt(6, 14),
                    att_magic: getRandomInt(22, 34),
                    def_phys: getRandomInt(3, 8),
                    def_magic: getRandomInt(12, 22),
                    speed: getRandomInt(10, 16),
                    crit_rate: getRandomFloat(0.05, 0.12),
                    crit_damage: getRandomFloat(1.30, 1.50),
                    agility: getRandomFloat(0.04, 0.10)
                };
                classType = 'mage';
            } else if (bodyType === 2) {
                // Knight: Tanky, high HP and physical defense, slow
                name = `${getRandomElement(NAMES_KNIGHT)}_${getRandomInt(10, 99)}`;
                svg = generateKnightSVG(
                    getRandomElement(METALS),
                    getRandomElement(CLOTHES),
                    getRandomElement(VISORS),
                    getRandomElement(CLOTHES)
                );
                stats = {
                    hp_max: getRandomInt(110, 140),
                    att: getRandomInt(18, 28),
                    att_magic: getRandomInt(3, 10),
                    def_phys: getRandomInt(12, 20),
                    def_magic: getRandomInt(6, 12),
                    speed: getRandomInt(6, 12),
                    crit_rate: getRandomFloat(0.04, 0.10),
                    crit_damage: getRandomFloat(1.25, 1.45),
                    agility: getRandomFloat(0.02, 0.06)
                };
                classType = 'guerrier';
            } else {
                // Cyborg: Fast, high agility & crit
                name = `${getRandomElement(NAMES_CYBORG)}_${getRandomInt(10, 99)}`;
                svg = generateCyborgSVG(
                    getRandomElement(METALS),
                    getRandomElement(VISORS),
                    getRandomElement(VISORS)
                );
                stats = {
                    hp_max: getRandomInt(85, 115),
                    att: getRandomInt(12, 22),
                    att_magic: getRandomInt(12, 22),
                    def_phys: getRandomInt(8, 14),
                    def_magic: getRandomInt(8, 14),
                    speed: getRandomInt(18, 28),
                    crit_rate: getRandomFloat(0.10, 0.20),
                    crit_damage: getRandomFloat(1.45, 1.75),
                    agility: getRandomFloat(0.08, 0.16)
                };
                classType = 'cyborg';
            }

            options.push({ name, assetKey: `hero_choice_${i}`, svgRaw: svg, stats, classType });
        }
        return options;
    }
}
