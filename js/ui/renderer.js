import { escapeHtml } from '../utils/helpers.js';
import { APP_VERSION } from '../config/settings.js';

export function renderVersion(version) {
    document.getElementById('versionDisplay').textContent = `Version ${version}`;
}

export function showToast(message, type = 'version') {
    const toast = document.getElementById('versionToast');
    const msgEl = document.getElementById('versionToastMessage');
    msgEl.textContent = message;
    toast.classList.add('show');

    const btn = document.getElementById('versionToastBtn');
    btn.onclick = () => {
        toast.classList.remove('show');
        clearTimeout(toast._timeout);
    };

    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(() => {
        toast.classList.remove('show');
    }, 6000);
}

export function showCopyToast(message) {
    const toast = document.getElementById('copyToast');
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toast._copyTimeout);
    toast._copyTimeout = setTimeout(() => {
        toast.classList.remove('show');
    }, 2500);
}

export function renderHelpModal() {
    const content = document.getElementById('helpContent');
    content.innerHTML = `
        <p><strong>How to use:</strong></p>
        <ul>
            <li><strong>Settings</strong> — Add players, choose game mode, then tap <strong>"Start round"</strong></li>
            <li><strong>Play</strong> — Select scores and tap <strong>"Save hole"</strong></li>
            <li><strong>History</strong> — View and edit scores from any hole</li>
            <li><strong>Standings</strong> — See live rankings and total scores</li>
        </ul>
        <p><strong>Game modes:</strong></p>
        <ul>
            <li><strong>Individual</strong> — Each player scores their own game.</li>
            <li><strong>Team (rotating pairs)</strong> — Players are paired each hole according to a schedule. Both players in a pair receive the same score.</li>
        </ul>
        <p><strong>Playing order (Team):</strong> On the first shuffle, order follows the player list. When the pairing table is exhausted, a new random shuffle is generated.</p>
        <div class="privacy-badge">
            <strong>🔒 Privacy &amp; Data</strong>
            <ul>
                <li>All data is stored <strong>locally</strong> in your browser's Local Storage</li>
                <li>No data is ever sent to any server — <strong>100% offline</strong></li>
                <li>No cookies, no tracking, no analytics</li>
                <li>Data is <strong>not</strong> shared between devices or browsers</li>
                <li class="warn">⚠️ If you clear your browser cache/history, your scores will be lost</li>
            </ul>
        </div>
        <p style="margin-top:12px;font-size:13px;color:#94a3b8;">Version ${APP_VERSION} · Open source</p>
    `;
}

export function setupModals() {
    // Help
    const helpBtn = document.getElementById('helpBtn');
    const helpModal = document.getElementById('helpModal');
    const helpClose = document.getElementById('helpCloseBtn');

    function openHelp() {
        helpModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    function closeHelp() {
        helpModal.classList.remove('active');
        document.body.style.overflow = '';
    }

    helpBtn.addEventListener('click', openHelp);
    helpClose.addEventListener('click', closeHelp);
    helpModal.addEventListener('click', (e) => {
        if (e.target === helpModal) closeHelp();
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && helpModal.classList.contains('active')) closeHelp();
    });

    // Share
    const shareBtn = document.getElementById('shareBtn');
    const shareModal = document.getElementById('shareModal');
    const shareClose = document.getElementById('shareCloseBtn');
    const shareUrlInput = document.getElementById('shareUrlInput');
    const qrImg = document.getElementById('qrCodeImage');
    const copyBtn = document.getElementById('copyShareBtn');

    function openShare() {
        const url = window.location.href.split('?')[0];
        shareUrlInput.value = url;
        qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`;
        shareModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    function closeShare() {
        shareModal.classList.remove('active');
        document.body.style.overflow = '';
    }

    shareBtn.addEventListener('click', openShare);
    shareClose.addEventListener('click', closeShare);
    shareModal.addEventListener('click', (e) => {
        if (e.target === shareModal) closeShare();
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && shareModal.classList.contains('active')) closeShare();
    });

    copyBtn.addEventListener('click', () => {
        const text = shareUrlInput.value;
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(() => showCopyToast('✅ Copied!')).catch(() => fallbackCopy(text));
        } else {
            fallbackCopy(text);
        }
    });

    function fallbackCopy(text) {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        try {
            document.execCommand('copy');
            showCopyToast('✅ Copied!');
        } catch (_) {
            showCopyToast('❌ Copy failed.');
        }
        document.body.removeChild(ta);
    }

    shareUrlInput.addEventListener('click', function() { this.select(); });
}