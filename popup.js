/**
 * popup.js
 * Handles UI interactions, settings, and history display.
 */

const toggleEl = document.getElementById('toggleExtension');
const statusTextEl = document.getElementById('statusText');
const lastScanCard = document.getElementById('lastScanCard');
const trustBtn = document.getElementById('trustBtn');
const trustAction = document.getElementById('trustAction');

let currentReport = null;

// --- Initialization ---
document.addEventListener('DOMContentLoaded', async () => {
    // 1. Load Settings
    const data = await chrome.storage.local.get(['enabled', 'lastScan']);

    // Default to enabled if not set
    const isEnabled = data.enabled !== false;
    toggleEl.checked = isEnabled;
    updateStatusText(isEnabled);

    // 2. Load History
    if (data.lastScan) {
        currentReport = data.lastScan;
        const whitelist = data.customWhitelist || [];
        renderHistory(data.lastScan, whitelist);
    }
});

// --- Event Listeners ---
toggleEl.addEventListener('change', async (e) => {
    const isEnabled = e.target.checked;
    await chrome.storage.local.set({ enabled: isEnabled });
    updateStatusText(isEnabled);
});

trustBtn.addEventListener('click', async () => {
    if (!currentReport) return;

    let domain;
    try {
        domain = new URL(currentReport.url).hostname;
    } catch (e) { return; }

    const data = await chrome.storage.local.get('customWhitelist');
    const whitelist = data.customWhitelist || [];

    if (!whitelist.includes(domain)) {
        whitelist.push(domain);
        await chrome.storage.local.set({ customWhitelist: whitelist });

        // Update UI immediately
        const newReport = { ...currentReport, level: 'safe', text: 'Marked as safe by you.' };
        renderHistory(newReport, whitelist);

        trustBtn.textContent = "Trusted ✓";
        trustBtn.disabled = true;
    }
});

// --- Helpers ---
function updateStatusText(enabled) {
    if (enabled) {
        statusTextEl.textContent = "Active and Monitoring";
        statusTextEl.style.color = "#10B981"; // Green
    } else {
        statusTextEl.textContent = "Protection Disabled";
        statusTextEl.style.color = "#9CA3AF"; // Gray
    }
}

function renderHistory(report, whitelist) {
    // Remove 'empty' class
    lastScanCard.classList.remove('empty');

    // Reset borders
    lastScanCard.classList.remove('safe', 'suspicious', 'dangerous');
    lastScanCard.classList.add(report.level);

    const icons = {
        safe: '✅',
        suspicious: '⚠️',
        dangerous: '🚫'
    };

    lastScanCard.querySelector('.scan-icon').textContent = icons[report.level];

    // Try to parse hostname for nicer display, or fall back to full string
    let displayUrl = report.url;
    try {
        displayUrl = new URL(report.url).hostname;
    } catch (e) { }

    lastScanCard.querySelector('.scan-domain').textContent = displayUrl;

    // Shorten the text if needed
    lastScanCard.querySelector('.scan-result').textContent = report.level.toUpperCase();

    // Trust Button Logic
    let hostname = "";
    try { hostname = new URL(report.url).hostname; } catch (e) { }

    if (whitelist && whitelist.includes(hostname)) {
        trustAction.style.display = 'block';
        trustBtn.textContent = "Trusted ✓";
        trustBtn.disabled = true;
    } else if (report.level !== 'safe') {
        trustAction.style.display = 'block';
        trustBtn.textContent = "Trust this site";
        trustBtn.disabled = false;
    } else {
        trustAction.style.display = 'none';
    }
}
