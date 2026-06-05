// Définition de toutes les statistiques possibles du jeu
export type StatType = 
    | 'hp_max'        // Points de vie Max
    | 'att'           // Attaque Physique
    | 'att_magic'     // Attaque Magique
    | 'def_phys'      // Défense Physique
    | 'def_magic'     // Défense Magique
    | 'speed'         // Vitesse (Initiative du tour)
    | 'crit_rate'     // Chance de coup critique (ex: 0.15 = 15%)
    | 'crit_damage'   // Multiplicateur de dégâts critiques (ex: 1.50 = +50%)
    | 'agility';      // Chance d'esquiver (ex: 0.10 = 10%)

// Un dictionnaire contenant la valeur numérique de chaque statistique
export type CharacterStats = Record<StatType, number>;

// Statistiques par défaut du Héros (facilement modifiables)
export const DEFAULT_PLAYER_STATS: CharacterStats = {
    hp_max: 100,
    att: 22,
    att_magic: 14,
    def_phys: 8,
    def_magic: 6,
    speed: 15,
    crit_rate: 0.10,      // 10% de chance
    crit_damage: 1.50,    // Dégâts x1.50
    agility: 0.08         // 8% de chance d'esquive
};
