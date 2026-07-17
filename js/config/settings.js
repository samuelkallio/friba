// Pairing tables for team mode (4-9 players)
export const PAIRING_TABLES = {
    4: [
        [['A','C'], ['D','B']],
        [['B','C'], ['A','D']],
        [['C','D'], ['B','A']]
    ],
    5: [
        [['A','E'], ['D','B']],
        [['B','C'], ['E','D']],
        [['D','A'], ['C','E']],
        [['E','B'], ['A','C']],
        [['C','D'], ['B','A']]
    ],
    6: [
        [['D','E'], ['A','F'], ['B','C']],
        [['C','F'], ['B','E'], ['A','D']],
        [['A','C'], ['D','F'], ['B','E']],
        [['B','E'], ['C','D'], ['A','F']],
        [['B','F'], ['A','E'], ['C','D']],
        [['A','D'], ['C','F'], ['B','E']],
        [['C','E'], ['A','B'], ['D','F']],
        [['B','D'], ['E','F'], ['A','C']],
        [['B','C'], ['A','F'], ['D','E']],
        [['D','F'], ['C','E'], ['A','B']],
        [['A','D'], ['B','C'], ['E','F']],
        [['E','F'], ['A','B'], ['C','D']],
        [['A','C'], ['D','E'], ['B','F']],
        [['B','F'], ['C','D'], ['A','E']],
        [['A','E'], ['B','D'], ['C','F']]
    ],
    7: [
        [['G','E'], ['D','F']],
        [['F','B'], ['A','E']],
        [['E','C'], ['G','B']],
        [['B','D'], ['F','C']],
        [['C','A'], ['E','D']],
        [['D','G'], ['B','A']],
        [['A','F'], ['C','G']]
    ],
    8: [
        [['H','G'], ['F','C'], ['B','A'], ['D','E']],
        [['G','D'], ['H','E'], ['C','B'], ['F','A']],
        [['H','C'], ['E','B'], ['D','A'], ['G','F']],
        [['E','G'], ['B','F'], ['A','C'], ['D','H']],
        [['A','E'], ['C','G'], ['F','H'], ['B','D']],
        [['C','D'], ['G','B'], ['E','F'], ['H','A']],
        [['D','F'], ['E','C'], ['B','H'], ['A','G']]
    ],
    9: [
        [['B','C'], ['D','G'], ['E','I'], ['F','H']],
        [['C','A'], ['E','H'], ['F','G'], ['D','I']],
        [['A','B'], ['F','I'], ['D','H'], ['E','G']],
        [['E','F'], ['G','A'], ['H','C'], ['I','B']],
        [['F','D'], ['H','B'], ['I','A'], ['G','C']],
        [['D','E'], ['I','C'], ['G','B'], ['H','A']],
        [['H','I'], ['A','D'], ['B','F'], ['C','E']],
        [['I','G'], ['B','E'], ['C','D'], ['A','F']],
        [['G','H'], ['C','F'], ['A','E'], ['B','D']]
    ]
};

// Default settings
export const DEFAULT_SETTINGS = {
    gameMode: 'individual', // 'individual' or 'team'
    oddPlayerHandling: 'zero' // 'zero' or 'record'
};

export const APP_VERSION = '1.2.0';
export const VERSION_STORAGE_KEY = 'discgolf_app_version';
export const STATE_STORAGE_KEY = 'discgolfTrackerState';