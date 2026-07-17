import { loadState, saveState, checkVersion, getVersion, getDefaultState } from './storage.js';
import { IndividualMode } from './gameModes/individual.js';
import { TeamMode } from './gameModes/team.js';
import { renderVersion, showToast, setupModals, renderHelpModal } from './ui/renderer.js';
import { renderIndividualHistory } from './ui/individualUI.js';
import { renderTeamHistory } from './ui/teamUI.js';
import { escapeHtml, getScoreOptions, getSelectOptionsHTML } from './utils/helpers.js';
import { PAIRING_TABLES, DEFAULT_SETTINGS } from './config/settings.js';

let state = loadState();

// DOM refs
const tabs = document.querySelectorAll('.tab-bar button');
const sections = {
    playing: document.getElementById('tab-playing'),
    standings: document.getElementById('tab-standings'),
    history: document.getElementById('tab-history'),
    settings: document.getElementById('tab-settings')
};

// ---- App initialization ----
function init() {
    const versionUpdated = checkVersion();
    renderVersion(getVersion());

    // Setup modals
    setupModals();
    renderHelpModal();

    // Force refresh
    document.getElementById('forceRefreshBtn').addEventListener('click', () => {
        if (confirm('Load the latest version? This will refresh the page.')) {
            localStorage.removeItem('discgolf_app_version');
            window.location.href = window.location.href.split('?')[0] + '?v=' + Date.now();
        }
    });

    // Ensure state is valid
    if (!state.players) state.players = [];
    if (!state.scores) state.scores = {};
    if (!state.settings) state.settings = { ...DEFAULT_SETTINGS };
    if (!state.teamScores) state.teamScores = {};
    if (!state.oddPlayerScores) state.oddPlayerScores = {};
    if (!state.teamShuffleOrder) state.teamShuffleOrder = [];
    if (!state.teamShuffleIndex) state.teamShuffleIndex = 0;
    if (!state.teamHoleInShuffle) state.teamHoleInShuffle = 0;

    // If no players and phase not setup, reset
    if (state.players.length === 0 && state.phase !== 'setup') {
        state = { ...getDefaultState(), settings: state.settings };
    }

    saveState(state);

    // Tab switching
    tabs.forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;
            tabs.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            Object.keys(sections).forEach(key => {
                sections[key].classList.toggle('active', key === tab);
            });
            renderTab(tab);
        });
    });

    // Setup settings event listeners
    setupSettingsListeners();

    // Render initial tab (playing)
    renderTab('playing');

    // Show version toast if updated
    if (versionUpdated) {
        showToast(`🔄 New version ${getVersion()} loaded!`);
    }

    console.log('App initialized. Mode:', state.settings.gameMode);
}

// ---- Tab rendering ----
function renderTab(tab) {
    state = loadState(); // refresh from storage
    switch (tab) {
        case 'playing': renderPlaying(); break;
        case 'standings': renderStandings(); break;
        case 'history': renderHistory(); break;
        case 'settings': renderSettings(); break;
    }
}

// ---- Playing tab ----
function renderPlaying() {
    const container = sections.playing;
    const mode = state.settings.gameMode || 'individual';

    if (state.phase === 'setup' || state.players.length === 0) {
        container.innerHTML = `
            <div class="text-center text-muted" style="padding:30px 0;">
                <p style="font-size:16px;">No active round</p>
                <p style="font-size:14px; margin-top:8px;">Add players in Settings and start a round</p>
            </div>
        `;
        return;
    }

    if (state.phase === 'complete') {
        container.innerHTML = `
            <div class="complete-msg">🏆 Round complete!</div>
            <div class="complete-actions">
                <button id="newRoundFromPlayingBtn" class="success">New round</button>
            </div>
        `;
        const newBtn = container.querySelector('#newRoundFromPlayingBtn');
        if (newBtn) {
            newBtn.addEventListener('click', () => {
                if (confirm('Start a new round? All current data will be cleared.')) {
                    resetGame();
                }
            });
        }
        return;
    }

    // Render according to mode
    const modeObj = mode === 'individual' ? IndividualMode : TeamMode;
    modeObj.renderPlay(state, container, {
        onSaveHole: () => handleSaveHole()
    });
}

// ---- Standings tab ----
function renderStandings() {
    const container = sections.standings;
    const mode = state.settings.gameMode || 'individual';
    const modeObj = mode === 'individual' ? IndividualMode : TeamMode;
    const data = modeObj.renderStandings(state);

    if (!data || data.length === 0) {
        container.innerHTML = `
            <h2>Overall Standings</h2>
            <div class="standings-empty">No data</div>
        `;
        return;
    }

    let html = `<h2>Overall Standings</h2><div class="standings-wrap"><table class="standings-table">
        <thead><tr><th>Rank</th><th>Player</th><th class="holes">Holes</th><th class="total">Total</th></tr></thead><tbody>`;
    for (const row of data) {
        const totalDisplay = row.total !== null ? row.total : '—';
        html += `<tr><td class="rank">${row.rank}</td><td class="player-name">${escapeHtml(row.player)}</td><td class="holes">${row.holesPlayed}</td><td class="total">${totalDisplay}</td></tr>`;
    }
    html += `</tbody></table></div>`;
    container.innerHTML = html;
}

// ---- History tab ----
function renderHistory() {
    const container = sections.history;
    const mode = state.settings.gameMode || 'individual';

    let historyData;
    if (mode === 'individual') {
        historyData = renderIndividualHistory(state);
    } else {
        historyData = renderTeamHistory(state);
    }

    if (historyData.isEmpty) {
        container.innerHTML = `
            <h2>Hole History</h2>
            <div class="history-controls">
                <button id="addHoleBtn" class="success">➕ Add hole</button>
                <button id="clearHistoryBtn" class="danger">🗑️ Clear all scores</button>
            </div>
            <div class="history-empty">No holes played yet</div>
        `;
        // Attach controls
        attachHistoryControls(container);
        return;
    }

    const { rows, totals, players, isTeam } = historyData;

    let html = `<h2>Hole History</h2>
        <div class="history-controls">
            <button id="addHoleBtn" class="success">➕ Add hole</button>
            <button id="clearHistoryBtn" class="danger">🗑️ Clear all scores</button>
        </div>
        <div class="history-table-wrap"><table class="history-table"><thead><tr><th>Hole</th>`;

    // Headers
    if (isTeam) {
        // Show pair columns and odd columns
        const allKeys = new Set();
        for (const row of rows) {
            for (const key of Object.keys(row.pairs)) {
                allKeys.add(key);
            }
            for (const p of Object.keys(row.odd)) {
                allKeys.add(`odd:${p}`);
            }
        }
        // We'll just show player names as columns in team mode too (display individual scores)
        // Simpler: show each player's score (derived from pairs)
        // Actually, let's show pairs and odd players in a readable way.
        // For simplicity, display per-player columns (show each player's score)
        // In team mode, each player's score is the pair score or odd score.
        // We'll recompute per-player scores for each hole.
        const playersList = players;
        for (const p of playersList) {
            html += `<th>${escapeHtml(p)}</th>`;
        }
    } else {
        for (const p of players) {
            html += `<th>${escapeHtml(p)}</th>`;
        }
    }
    html += `</tr></thead><tbody>`;

    // Rows
    for (const row of rows) {
        html += `<tr><td class="hole-label">V${row.hole}</td>`;
        if (isTeam) {
            // Compute per-player scores for this hole
            const playerScores = {};
            // From pairs
            for (const key of Object.keys(row.pairs)) {
                const [p1, p2] = key.split('-');
                const val = row.pairs[key];
                playerScores[p1] = val;
                playerScores[p2] = val;
            }
            // From odd
            for (const p of Object.keys(row.odd)) {
                playerScores[p] = row.odd[p];
            }
            for (const p of players) {
                const val = playerScores[p] !== undefined ? playerScores[p] : 0;
                html += `<td class="score-cell">${val}</td>`;
            }
        } else {
            for (const p of players) {
                const val = row.scores[p] !== undefined ? row.scores[p] : 0;
                html += `<td class="score-cell">${val}</td>`;
            }
        }
        html += `</tr>`;
    }

    // Totals row
    html += `<tr class="total-row"><td class="hole-label"><strong>Total</strong></td>`;
    for (const p of players) {
        html += `<td><strong>${totals[p]}</strong></td>`;
    }
    html += `</tr></tbody></table></div>`;

    container.innerHTML = html;
    attachHistoryControls(container);
}

function attachHistoryControls(container) {
    const addBtn = container.querySelector('#addHoleBtn');
    const clearBtn = container.querySelector('#clearHistoryBtn');

    if (addBtn) {
        addBtn.addEventListener('click', () => {
            if (state.players.length === 0) {
                alert('Add players first.');
                return;
            }
            // Add a new hole
            const mode = state.settings.gameMode || 'individual';
            if (mode === 'individual') {
                for (const p of state.players) {
                    if (!state.scores[p]) state.scores[p] = [];
                    state.scores[p].push(null);
                }
            } else {
                // Team mode: add null to all pair scores and odd scores
                for (const key of Object.keys(state.teamScores)) {
                    state.teamScores[key].push(null);
                }
                for (const p of state.players) {
                    if (!state.oddPlayerScores[p]) state.oddPlayerScores[p] = [];
                    state.oddPlayerScores[p].push(null);
                }
            }
            state.currentHole = (state.scores[state.players[0]] || []).length;
            if (state.phase === 'complete') state.phase = 'playing';
            saveState(state);
            renderTab('history');
            // Also re-render playing tab if active
            if (document.querySelector('.tab-bar .active').dataset.tab === 'playing') renderTab('playing');
        });
    }

    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            if (!confirm('⚠️ Clear all scores? This cannot be undone!')) return;
            const mode = state.settings.gameMode || 'individual';
            if (mode === 'individual') {
                for (const p of state.players) {
                    state.scores[p] = [];
                }
            } else {
                state.teamScores = {};
                state.oddPlayerScores = {};
                // Reset shuffle
                state.teamShuffleOrder = [];
                state.teamShuffleIndex = 0;
                state.teamHoleInShuffle = 0;
                if (state.players.length > 0) {
                    TeamMode.init(state);
                }
            }
            state.currentHole = 1;
            state.phase = 'playing';
            saveState(state);
            renderTab('history');
            if (document.querySelector('.tab-bar .active').dataset.tab === 'playing') renderTab('playing');
        });
    }
}

// ---- Settings tab ----
function renderSettings() {
    const container = sections.settings;
    const players = state.players;

    let html = `<h2>Player Management</h2>
        <div class="setup-row">
            <input type="text" id="playerNameInput" placeholder="Player name" autocomplete="off" />
            <button id="addPlayerBtn">Add</button>
        </div>
        <div class="player-list" id="playerList">`;

    if (!players || players.length === 0) {
        html += `<span class="text-muted" style="font-size:14px;">No players</span>`;
    } else {
        for (const p of players) {
            html += `<span class="player-tag">${escapeHtml(p)}<button class="remove-player" data-player="${escapeHtml(p)}">✕</button></span>`;
        }
    }

    html += `</div>
        <div class="setup-options">
            <div class="setup-option">
                <label for="gameModeSelect">Game mode:</label>
                <select id="gameModeSelect">
                    <option value="individual" ${state.settings.gameMode === 'individual' ? 'selected' : ''}>Individual</option>
                    <option value="team" ${state.settings.gameMode === 'team' ? 'selected' : ''}>Team (rotating pairs)</option>
                </select>
            </div>
            <div class="setup-option" id="oddPlayerOption" style="${state.settings.gameMode === 'team' ? '' : 'display:none;'}">
                <label for="oddPlayerSelect">Odd player handling:</label>
                <select id="oddPlayerSelect">
                    <option value="zero" ${state.settings.oddPlayerHandling === 'zero' ? 'selected' : ''}>Odd player gets 0 (Par)</option>
                    <option value="record" ${state.settings.oddPlayerHandling === 'record' ? 'selected' : ''}>Record odd player's score</option>
                </select>
            </div>
        </div>
        <div class="setup-actions">
            <button id="roundActionBtn" class="primary">${getRoundActionLabel()}</button>
            <button id="clearAllBtn" class="clear-all-btn">🗑️ Remove all players</button>
        </div>
    `;

    container.innerHTML = html;

    // Event listeners for settings
    const addBtn = container.querySelector('#addPlayerBtn');
    const nameInput = container.querySelector('#playerNameInput');
    const playerListEl = container.querySelector('#playerList');
    const gameModeSelect = container.querySelector('#gameModeSelect');
    const oddPlayerSelect = container.querySelector('#oddPlayerSelect');
    const roundActionBtn = container.querySelector('#roundActionBtn');
    const clearAllBtn = container.querySelector('#clearAllBtn');

    addBtn.addEventListener('click', () => {
        const name = nameInput.value.trim();
        if (!name) { alert('Enter a name.'); return; }
        if (state.players.includes(name)) { alert('Player already exists.'); return; }
        state.players.push(name);
        if (state.settings.gameMode === 'individual') {
            state.scores[name] = [];
        } else {
            // Team mode: no per-player scores initially
            state.oddPlayerScores[name] = [];
        }
        // Remove from removed history if present
        if (state.removedPlayersHistory && state.removedPlayersHistory[name]) {
            delete state.removedPlayersHistory[name];
        }
        saveState(state);
        renderSettings();
        renderTab('playing');
    });

    nameInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') addBtn.click();
    });

    // Remove player via delegation
    playerListEl.addEventListener('click', (e) => {
        const btn = e.target.closest('.remove-player');
        if (!btn) return;
        const player = btn.dataset.player;
        if (confirm(`Remove player "${player}"?`)) {
            // Store in removed history
            if (!state.removedPlayersHistory) state.removedPlayersHistory = {};
            state.removedPlayersHistory[player] = true;
            const idx = state.players.indexOf(player);
            if (idx !== -1) {
                state.players.splice(idx, 1);
                delete state.scores[player];
                delete state.oddPlayerScores[player];
                // Remove from teamScores if any
                for (const key of Object.keys(state.teamScores)) {
                    if (key.includes(player)) {
                        delete state.teamScores[key];
                    }
                }
                // Reset shuffle if team mode
                if (state.settings.gameMode === 'team') {
                    state.teamShuffleOrder = [];
                    state.teamShuffleIndex = 0;
                    state.teamHoleInShuffle = 0;
                    if (state.players.length > 0) {
                        TeamMode.init(state);
                    }
                }
                saveState(state);
                renderSettings();
                renderTab('playing');
            }
        }
    });

    // Game mode change
    gameModeSelect.addEventListener('change', () => {
        const mode = gameModeSelect.value;
        state.settings.gameMode = mode;
        // Reset scores if switching
        if (mode === 'individual') {
            // Convert team data to individual if possible? Just reset.
            state.scores = {};
            state.teamScores = {};
            state.oddPlayerScores = {};
            state.teamShuffleOrder = [];
            state.teamShuffleIndex = 0;
            state.teamHoleInShuffle = 0;
            for (const p of state.players) {
                state.scores[p] = [];
            }
        } else {
            // Switch to team
            state.scores = {};
            state.teamScores = {};
            state.oddPlayerScores = {};
            state.teamShuffleOrder = [];
            state.teamShuffleIndex = 0;
            state.teamHoleInShuffle = 0;
            if (state.players.length > 0) {
                TeamMode.init(state);
            }
        }
        state.currentHole = 1;
        state.phase = 'playing';
        saveState(state);
        renderSettings();
        renderTab('playing');
        // Show/hide odd player option
        document.getElementById('oddPlayerOption').style.display = mode === 'team' ? '' : 'none';
    });

    // Odd player handling change
    oddPlayerSelect.addEventListener('change', () => {
        state.settings.oddPlayerHandling = oddPlayerSelect.value;
        saveState(state);
        renderTab('playing');
    });

    // Round action
    roundActionBtn.addEventListener('click', () => {
        const label = roundActionBtn.textContent;
        if (label.includes('Start')) {
            startRound();
        } else if (label.includes('End')) {
            endRound();
        } else if (label.includes('New')) {
            if (confirm('Start a new round? All current data will be cleared.')) {
                resetGame();
            }
        }
    });

    // Clear all players
    clearAllBtn.addEventListener('click', () => {
        if (!confirm('⚠️ Remove all players? This will delete all data!')) return;
        state.players = [];
        state.scores = {};
        state.teamScores = {};
        state.oddPlayerScores = {};
        state.removedPlayersHistory = {};
        state.teamShuffleOrder = [];
        state.teamShuffleIndex = 0;
        state.teamHoleInShuffle = 0;
        state.currentHole = 1;
        state.phase = 'setup';
        saveState(state);
        renderSettings();
        renderTab('playing');
    });

    // Show/hide odd option initially
    document.getElementById('oddPlayerOption').style.display = state.settings.gameMode === 'team' ? '' : 'none';
}

function getRoundActionLabel() {
    if (state.phase === 'setup' || state.players.length === 0) return '🚀 Start round';
    if (state.phase === 'playing') return '⏹️ End round';
    return '🔄 New round';
}

function startRound() {
    if (state.players.length === 0) { alert('Add at least one player.'); return; }
    const mode = state.settings.gameMode || 'individual';
    if (mode === 'individual') {
        for (const p of state.players) {
            state.scores[p] = [];
        }
    } else {
        // Team mode
        state.teamScores = {};
        state.oddPlayerScores = {};
        state.teamShuffleOrder = [];
        state.teamShuffleIndex = 0;
        state.teamHoleInShuffle = 0;
        TeamMode.init(state);
    }
    state.currentHole = 1;
    state.phase = 'playing';
    saveState(state);
    renderSettings();
    // Switch to playing tab
    tabs.forEach(b => b.classList.remove('active'));
    document.querySelector('[data-tab="playing"]').classList.add('active');
    Object.keys(sections).forEach(key => {
        sections[key].classList.toggle('active', key === 'playing');
    });
    renderTab('playing');
}

function endRound() {
    if (confirm('End the current round? This will mark it as complete.')) {
        state.phase = 'complete';
        saveState(state);
        renderSettings();
        renderTab('playing');
    }
}

function resetGame() {
    state.players = [];
    state.scores = {};
    state.teamScores = {};
    state.oddPlayerScores = {};
    state.removedPlayersHistory = {};
    state.teamShuffleOrder = [];
    state.teamShuffleIndex = 0;
    state.teamHoleInShuffle = 0;
    state.currentHole = 1;
    state.phase = 'setup';
    saveState(state);
    renderSettings();
    renderTab('playing');
}

// ---- Save hole handler ----
function handleSaveHole() {
    const mode = state.settings.gameMode || 'individual';
    const modeObj = mode === 'individual' ? IndividualMode : TeamMode;
    const success = modeObj.saveHole(state);
    if (!success) return;

    // Advance hole
    state.currentHole++;
    saveState(state);

    // Re-render playing tab
    renderTab('playing');
    // Also update standings/history if active
    const activeTab = document.querySelector('.tab-bar .active');
    if (activeTab) {
        const tab = activeTab.dataset.tab;
        if (tab === 'standings') renderStandings();
        if (tab === 'history') renderHistory();
    }
}

// ---- Settings listeners (initial) ----
function setupSettingsListeners() {
    // Delegated in renderSettings
}

// ---- Start ----
document.addEventListener('DOMContentLoaded', init);