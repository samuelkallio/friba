export function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

export function shuffleArray(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

export function getPlayerLetterMap(players) {
    const map = {};
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    players.forEach((name, index) => {
        map[letters[index]] = name;
    });
    return map;
}

export function getScoreOptions() {
    return [
        { value: -3, label: '-3 (Albatross)' },
        { value: -2, label: '-2 (Eagle)' },
        { value: -1, label: '-1 (Birdie)' },
        { value: 0, label: '0 (Par)' },
        { value: 1, label: '+1 (Bogey)' },
        { value: 2, label: '+2 (Double)' },
        { value: 3, label: '+3 (Triple)' },
        { value: 4, label: '+4' },
        { value: 5, label: '+5' },
        { value: 6, label: '+6' },
        { value: 7, label: '+7' },
        { value: 8, label: '+8' },
        { value: 9, label: '+9' },
        { value: 10, label: '+10' }
    ];
}

export function getSelectOptionsHTML(options, selectedValue) {
    return options.map(opt =>
        `<option value="${opt.value}" ${opt.value === selectedValue ? 'selected' : ''}>${opt.label}</option>`
    ).join('');
}