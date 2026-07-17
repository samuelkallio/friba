import { STATE_STORAGE_KEY, VERSION_STORAGE_KEY, APP_VERSION, DEFAULT_SETTINGS } from './config/settings.js';

export function loadState() {
    try {
        const raw = localStorage.getItem(STATE_STORAGE_KEY);
        if (!raw) return getDefaultState();
        const parsed = JSON.parse(raw);
        // Validate and fill missing fields
        if (!parsed.players) parsed.players = [];
        if (!parsed.scores) parsed.scores = {};
        if (!parsed.removedPlayersHistory) parsed.removedPlayersHistory = {};
        if (!parsed.currentHole || parsed.currentHole < 1) parsed.currentHole = 1;
        if (!['setup', 'playing', 'complete'].includes(parsed.phase)) parsed.phase = 'setup';
        if (!parsed.settings) parsed.settings = { ...DEFAULT_SETTINGS };
        // For team mode
        if (!parsed.teamScores) parsed.teamScores = {};
        if (!parsed.teamShuffleOrder) parsed.teamShuffleOrder = [];
        if (!parsed.teamShuffleIndex) parsed.teamShuffleIndex = 0;
        if (!parsed.teamHoleInShuffle) parsed.teamHoleInShuffle = 0;
        if (!parsed.oddPlayerScores) parsed.oddPlayerScores = {}; // { playerName: [score, ...] }
        return parsed;
    } catch (_) {
        return getDefaultState();
    }
}

export function saveState(state) {
    try {
        localStorage.setItem(STATE_STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
        console.warn('Save failed:', e);
        throw e;
    }
}

export function getDefaultState() {
    return {
        players: [],
        scores: {}, // individual mode: { playerName: [score, ...] }
        teamScores: {}, // team mode: { pairKey: [score, ...] } pairKey = "A-B" sorted letters
        oddPlayerScores: {}, // team mode: { playerName: [score, ...] } for odd player
        removedPlayersHistory: {},
        currentHole: 1,
        phase: 'setup',
        settings: { ...DEFAULT_SETTINGS },
        teamShuffleOrder: [],
        teamShuffleIndex: 0,
        teamHoleInShuffle: 0
    };
}

export function checkVersion() {
    try {
        const saved = localStorage.getItem(VERSION_STORAGE_KEY);
        if (saved && saved !== APP_VERSION) {
            localStorage.setItem(VERSION_STORAGE_KEY, APP_VERSION);
            return true;
        } else if (!saved) {
            localStorage.setItem(VERSION_STORAGE_KEY, APP_VERSION);
        }
        return false;
    } catch (_) {
        return false;
    }
}

export function getVersion() {
    return APP_VERSION;
}