import { PAIRING_TABLES } from '../config/settings.js';
import { getScoreOptions, getSelectOptionsHTML, escapeHtml, shuffleArray, getPlayerLetterMap } from '../utils/helpers.js';

export const TeamMode = {
    init(state) {
        // Ensure team state fields exist
        if (!state.teamShuffleOrder || state.teamShuffleOrder.length === 0) {
            this.reseedShuffle(state);
        }
        if (!state.teamScores) state.teamScores = {};
        if (!state.oddPlayerScores) state.oddPlayerScores = {};
        if (!state.teamShuffleIndex) state.teamShuffleIndex = 0;
        if (!state.teamHoleInShuffle) state.teamHoleInShuffle = 0;
    },

    reseedShuffle(state) {
        const shuffled = shuffleArray(state.players);
        state.teamShuffleOrder = shuffled;
        state.teamShuffleIndex = 0;
        state.teamHoleInShuffle = 0;
    },

    getPairKey(p1, p2) {
        const sorted = [p1, p2].sort();
        return sorted.join('-');
    },

    getPairsForCurrentHole(state) {
        const players = state.players;
        const count = players.length;
        const table = PAIRING_TABLES[count];
        if (!table) return null;

        // Determine which shuffle cycle we're on and which hole within shuffle
        const shuffleOrder = state.teamShuffleOrder;
        const shuffleIndex = state.teamShuffleIndex;
        const holeInShuffle = state.teamHoleInShuffle;

        // If shuffleOrder doesn't match current players, reseed
        if (shuffleOrder.length !== count || !shuffleOrder.every(p => players.includes(p))) {
            this.reseedShuffle(state);
            return this.getPairsForCurrentHole(state);
        }

        // Get the pairing row from table
        const tableIndex = holeInShuffle % table.length;
        const row = table[tableIndex];

        // Map letters to actual player names using shuffleOrder
        const letterMap = getPlayerLetterMap(shuffleOrder);

        // Convert pairs
        const pairs = row.map(pair => pair.map(letter => letterMap[letter]));

        // Find odd player (if any)
        const allPlayersInPairs = pairs.flat();
        const oddPlayer = players.find(p => !allPlayersInPairs.includes(p));

        return { pairs, oddPlayer };
    },

    renderPlay(state, container, callbacks) {
        const players = state.players;
        if (!players || players.length === 0) {
            container.innerHTML = `<div class="text-center text-muted" style="padding:30px 0;">
                <p style="font-size:16px;">No players</p>
            </div>`;
            return;
        }

        const pairData = this.getPairsForCurrentHole(state);
        if (!pairData) {
            container.innerHTML = `<div class="text-center text-muted">No pairing table for ${players.length} players.</div>`;
            return;
        }

        const { pairs, oddPlayer } = pairData;
        const idx = state.currentHole - 1;
        const options = getScoreOptions();
        let html = `<div class="hole-header">⛳ Hole ${state.currentHole}</div><div class="score-entry">`;

        // Render each pair with one score select
        for (const pair of pairs) {
            const key = this.getPairKey(pair[0], pair[1]);
            const currentVal = (state.teamScores[key] && state.teamScores[key][idx] !== undefined) ? state.teamScores[key][idx] : 0;
            html += `
                <div class="score-row" data-pair="${escapeHtml(key)}">
                    <span class="s-name">${escapeHtml(pair.join(' & '))}</span>
                    <div class="s-select">
                        <select data-pair="${escapeHtml(key)}">
                            ${getSelectOptionsHTML(options, currentVal)}
                        </select>
                    </div>
                </div>
            `;
        }

        // Odd player handling
        if (oddPlayer) {
            const setting = state.settings.oddPlayerHandling || 'zero';
            if (setting === 'record') {
                const currentVal = (state.oddPlayerScores[oddPlayer] && state.oddPlayerScores[oddPlayer][idx] !== undefined) ? state.oddPlayerScores[oddPlayer][idx] : 0;
                html += `
                    <div class="score-row" data-player="${escapeHtml(oddPlayer)}">
                        <span class="s-name">${escapeHtml(oddPlayer)} (odd)</span>
                        <div class="s-select">
                            <select data-odd="${escapeHtml(oddPlayer)}">
                                ${getSelectOptionsHTML(options, currentVal)}
                            </select>
                        </div>
                    </div>
                `;
            } else {
                html += `<div class="odd-player-note">${escapeHtml(oddPlayer)} is without a partner and gets 0 (Par) for this hole.</div>`;
            }
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
        const pairSelects = document.querySelectorAll('#tab-playing select[data-pair]');
        const oddSelects = document.querySelectorAll('#tab-playing select[data-odd]');

        // Save pair scores
        for (const sel of pairSelects) {
            const key = sel.dataset.pair;
            const val = parseInt(sel.value);
            if (isNaN(val)) {
                alert('Invalid score for pair.');
                return false;
            }
            if (!state.teamScores[key]) state.teamScores[key] = [];
            while (state.teamScores[key].length <= idx) state.teamScores[key].push(null);
            state.teamScores[key][idx] = val;
        }

        // Save odd player scores if recording
        for (const sel of oddSelects) {
            const player = sel.dataset.odd;
            const val = parseInt(sel.value);
            if (isNaN(val)) {
                alert('Invalid score for odd player.');
                return false;
            }
            if (!state.oddPlayerScores[player]) state.oddPlayerScores[player] = [];
            while (state.oddPlayerScores[player].length <= idx) state.oddPlayerScores[player].push(null);
            state.oddPlayerScores[player][idx] = val;
        }

        // For odd players with 'zero' setting, ensure they get 0
        const pairData = this.getPairsForCurrentHole(state);
        if (pairData && pairData.oddPlayer) {
            const odd = pairData.oddPlayer;
            const setting = state.settings.oddPlayerHandling || 'zero';
            if (setting === 'zero') {
                if (!state.oddPlayerScores[odd]) state.oddPlayerScores[odd] = [];
                while (state.oddPlayerScores[odd].length <= idx) state.oddPlayerScores[odd].push(null);
                state.oddPlayerScores[odd][idx] = 0;
            }
        }

        // Advance shuffle if needed
        const pairDataAfter = this.getPairsForCurrentHole(state);
        const table = PAIRING_TABLES[state.players.length];
        if (pairDataAfter) {
            const nextHoleInShuffle = state.teamHoleInShuffle + 1;
            if (nextHoleInShuffle >= table.length) {
                // Reseed for next shuffle
                this.reseedShuffle(state);
                state.teamHoleInShuffle = 0;
            } else {
                state.teamHoleInShuffle = nextHoleInShuffle;
            }
        }

        return true;
    },

    renderStandings(state) {
        // Compute per-player totals from pair scores and odd player scores
        const players = state.players;
        const result = [];
        const holeCount = players.length > 0 ? this.getHoleCount(state) : 0;

        for (const p of players) {
            let total = 0;
            let holesPlayed = 0;

            // Sum pair scores where player appears
            const pairKeys = Object.keys(state.teamScores);
            for (const key of pairKeys) {
                const [p1, p2] = key.split('-');
                if (p1 === p || p2 === p) {
                    const scores = state.teamScores[key] || [];
                    const valid = scores.filter(s => s !== null && s !== undefined);
                    total += valid.reduce((a, b) => a + b, 0);
                    holesPlayed += valid.length;
                }
            }

            // Add odd player scores
            const oddScores = state.oddPlayerScores[p] || [];
            const validOdd = oddScores.filter(s => s !== null && s !== undefined);
            total += validOdd.reduce((a, b) => a + b, 0);
            holesPlayed += validOdd.length;

            result.push({
                player: p,
                holesPlayed: holesPlayed,
                total: holesPlayed > 0 ? total : null
            });
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
        const players = state.players;
        const holeCount = this.getHoleCount(state);
        if (holeCount === 0 || players.length === 0) {
            return { isEmpty: true };
        }

        // Build rows for each hole (newest first)
        const rows = [];
        for (let h = holeCount - 1; h >= 0; h--) {
            const row = { hole: h + 1, pairs: {}, odd: {} };
            // Collect pair scores
            const pairKeys = Object.keys(state.teamScores);
            for (const key of pairKeys) {
                const scores = state.teamScores[key] || [];
                if (scores[h] !== undefined && scores[h] !== null) {
                    row.pairs[key] = scores[h];
                }
            }
            // Collect odd scores
            for (const p of players) {
                const scores = state.oddPlayerScores[p] || [];
                if (scores[h] !== undefined && scores[h] !== null) {
                    row.odd[p] = scores[h];
                }
            }
            rows.push(row);
        }

        // Totals per player
        const totals = {};
        for (const p of players) {
            let total = 0;
            // From pairs
            for (const key of Object.keys(state.teamScores)) {
                const [p1, p2] = key.split('-');
                if (p1 === p || p2 === p) {
                    const scores = state.teamScores[key] || [];
                    const valid = scores.filter(s => s !== null && s !== undefined);
                    total += valid.reduce((a, b) => a + b, 0);
                }
            }
            // From odd
            const oddScores = state.oddPlayerScores[p] || [];
            const validOdd = oddScores.filter(s => s !== null && s !== undefined);
            total += validOdd.reduce((a, b) => a + b, 0);
            totals[p] = total;
        }

        return { isEmpty: false, rows, totals, players, isTeam: true };
    },

    getHoleCount(state) {
        // Determine from any pair or odd player
        const pairKeys = Object.keys(state.teamScores);
        if (pairKeys.length > 0) {
            return (state.teamScores[pairKeys[0]] || []).length;
        }
        const oddKeys = Object.keys(state.oddPlayerScores);
        if (oddKeys.length > 0) {
            return (state.oddPlayerScores[oddKeys[0]] || []).length;
        }
        return 0;
    },

    getTotalScore(state, player) {
        let total = 0;
        for (const key of Object.keys(state.teamScores)) {
            const [p1, p2] = key.split('-');
            if (p1 === player || p2 === player) {
                const scores = state.teamScores[key] || [];
                const valid = scores.filter(s => s !== null && s !== undefined);
                total += valid.reduce((a, b) => a + b, 0);
            }
        }
        const oddScores = state.oddPlayerScores[player] || [];
        const validOdd = oddScores.filter(s => s !== null && s !== undefined);
        total += validOdd.reduce((a, b) => a + b, 0);
        return total;
    },

    getPairingsForDisplay(state) {
        const pairData = this.getPairsForCurrentHole(state);
        if (!pairData) return null;
        const { pairs, oddPlayer } = pairData;
        return { pairs, oddPlayer };
    }
};