import { getScoreOptions, getSelectOptionsHTML, escapeHtml } from '../utils/helpers.js';

export const IndividualMode = {
    init(state) {
        // Nothing special needed
    },

    getPlayingOrder(state) {
        return state.players.slice();
    },

    renderPlay(state, container, callbacks) {
        const players = state.players;
        if (!players || players.length === 0) {
            container.innerHTML = `<div class="text-center text-muted" style="padding:30px 0;">
                <p style="font-size:16px;">No players</p>
            </div>`;
            return;
        }

        const idx = state.currentHole - 1;
        const options = getScoreOptions();
        let html = `<div class="hole-header">⛳ Hole ${state.currentHole}</div><div class="score-entry">`;

        for (const p of players) {
            const currentVal = (state.scores[p] && state.scores[p][idx] !== undefined) ? state.scores[p][idx] : 0;
            html += `
                <div class="score-row" data-player="${escapeHtml(p)}">
                    <span class="s-name">${escapeHtml(p)}</span>
                    <div class="s-select">
                        <select data-player="${escapeHtml(p)}">
                            ${getSelectOptionsHTML(options, currentVal)}
                        </select>
                    </div>
                </div>
            `;
        }

        html += `<div class="save-row"><button id="saveHoleBtn" class="success">Save hole</button></div></div>`;
        container.innerHTML = html;

        const saveBtn = container.querySelector('#saveHoleBtn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => callbacks.onSaveHole());
        }

        setTimeout(() => {
            const firstSelect = container.querySelector('select');
            if (firstSelect) firstSelect.focus();
        }, 100);
    },

    saveHole(state) {
        const idx = state.currentHole - 1;
        const selects = document.querySelectorAll('#tab-playing select[data-player]');
        const values = {};
        let allValid = true;

        selects.forEach(sel => {
            const player = sel.dataset.player;
            const val = parseInt(sel.value);
            if (!isNaN(val)) {
                values[player] = val;
            } else {
                allValid = false;
            }
        });

        if (!allValid) {
            alert('Invalid score.');
            return false;
        }

        for (const p of state.players) {
            if (!state.scores[p]) state.scores[p] = [];
            while (state.scores[p].length <= idx) state.scores[p].push(null);
            state.scores[p][idx] = values[p] !== undefined ? values[p] : 0;
        }

        return true;
    },

    renderStandings(state) {
        const result = [];
        for (const p of state.players) {
            const scores = state.scores[p] || [];
            const valid = scores.filter(s => s !== null && s !== undefined);
            const holes = valid.length;
            const total = holes > 0 ? valid.reduce((a, b) => a + b, 0) : null;
            result.push({ player: p, holesPlayed: holes, total });
        }

        result.sort((a, b) => {
            if (a.total === null && b.total === null) return a.player.localeCompare(b.player);
            if (a.total === null) return 1;
            if (b.total === null) return -1;
            if (a.total !== b.total) return a.total - b.total;
            if (a.holesPlayed !== b.holesPlayed) return b.holesPlayed - a.holesPlayed;
            return a.player.localeCompare(b.player);
        });

        let rank = 1;
        for (let i = 0; i < result.length; i++) {
            if (i === 0) {
                result[i].rank = rank;
            } else {
                const prev = result[i - 1];
                const curr = result[i];
                if (curr.total === null && prev.total === null) {
                    result[i].rank = prev.rank;
                } else if (curr.total === null) {
                    result[i].rank = i + 1;
                } else if (prev.total !== null && curr.total === prev.total && curr.holesPlayed === prev.holesPlayed) {
                    result[i].rank = prev.rank;
                } else {
                    result[i].rank = i + 1;
                }
            }
        }

        return result;
    },

    renderHistory(state) {
        const holeCount = state.players.length > 0 ? (state.scores[state.players[0]] || []).length : 0;
        const players = state.players;

        if (holeCount === 0 || players.length === 0) {
            return { isEmpty: true };
        }

        const allPlayers = players;
        const rows = [];
        for (let h = holeCount - 1; h >= 0; h--) {
            const row = { hole: h + 1, scores: {} };
            for (const p of allPlayers) {
                const val = (state.scores[p] && state.scores[p][h] !== undefined) ? state.scores[p][h] : 0;
                row.scores[p] = val;
            }
            rows.push(row);
        }

        // Totals
        const totals = {};
        for (const p of allPlayers) {
            const scores = state.scores[p] || [];
            const valid = scores.filter(s => s !== null && s !== undefined);
            totals[p] = valid.reduce((a, b) => a + b, 0);
        }

        return { isEmpty: false, rows, totals, players: allPlayers };
    },

    getTotalScore(state, player) {
        const scores = state.scores[player] || [];
        const valid = scores.filter(s => s !== null && s !== undefined);
        return valid.reduce((a, b) => a + b, 0);
    }
};