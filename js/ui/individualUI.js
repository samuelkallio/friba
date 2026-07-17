import { escapeHtml } from '../utils/helpers.js';
import { getScoreOptions, getSelectOptionsHTML } from '../utils/helpers.js';

export function renderIndividualHistory(state) {
    const players = state.players;
    if (!players || players.length === 0) {
        return { isEmpty: true };
    }
    const holeCount = (state.scores[players[0]] || []).length;
    if (holeCount === 0) {
        return { isEmpty: true };
    }

    const rows = [];
    for (let h = holeCount - 1; h >= 0; h--) {
        const row = { hole: h + 1, scores: {} };
        for (const p of players) {
            row.scores[p] = (state.scores[p] && state.scores[p][h] !== undefined) ? state.scores[p][h] : 0;
        }
        rows.push(row);
    }

    const totals = {};
    for (const p of players) {
        const scores = state.scores[p] || [];
        const valid = scores.filter(s => s !== null && s !== undefined);
        totals[p] = valid.reduce((a, b) => a + b, 0);
    }

    return { isEmpty: false, rows, totals, players };
}