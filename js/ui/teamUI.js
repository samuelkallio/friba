import { escapeHtml } from '../utils/helpers.js';
import { getScoreOptions, getSelectOptionsHTML } from '../utils/helpers.js';
import { TeamMode } from '../gameModes/team.js';

export function renderTeamHistory(state) {
    const players = state.players;
    if (!players || players.length === 0) {
        return { isEmpty: true };
    }

    const holeCount = TeamMode.getHoleCount(state);
    if (holeCount === 0) {
        return { isEmpty: true };
    }

    const rows = [];
    for (let h = holeCount - 1; h >= 0; h--) {
        const row = { hole: h + 1, pairs: {}, odd: {} };
        // Pair scores
        for (const key of Object.keys(state.teamScores)) {
            const scores = state.teamScores[key] || [];
            if (scores[h] !== undefined && scores[h] !== null) {
                row.pairs[key] = scores[h];
            }
        }
        // Odd scores
        for (const p of players) {
            const scores = state.oddPlayerScores[p] || [];
            if (scores[h] !== undefined && scores[h] !== null) {
                row.odd[p] = scores[h];
            }
        }
        rows.push(row);
    }

    const totals = {};
    for (const p of players) {
        totals[p] = TeamMode.getTotalScore(state, p);
    }

    return { isEmpty: false, rows, totals, players, isTeam: true };
}