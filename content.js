/**
 * content.js
 * Handles link hover events, smart tooltip positioning, and smooth interactions.
 */

// --- Configuration ---
const HOVER_DELAY_MS = 300;
let hoverTimeout = null;
let fadeTimeout = null;

const TOOLTIP_ID = 'link-sentinel-tooltip-container';

/**
 * Creates the tooltip element if missing.
 */
function createTooltip() {
    if (document.getElementById(TOOLTIP_ID)) return;

    const tooltip = document.createElement('div');
    tooltip.id = TOOLTIP_ID;
    tooltip.innerHTML = `
    <div class="ls-header">
      <span class="ls-icon"></span>
      <span class="ls-title">LinkSentinel Analysis</span>
    </div>
    <div class="ls-body">
      <div class="ls-status"></div>
      <div class="ls-text"></div>
    </div>
  `;
    document.body.appendChild(tooltip);
}

/**
 * Updates content and styling based on risk report.
 */
function updateTooltip(report) {
    const tooltip = document.getElementById(TOOLTIP_ID);
    if (!tooltip) return;

    // Reset classes
    tooltip.className = `ls-visible ls-${report.level}`;

    const statusEl = tooltip.querySelector('.ls-status');
    const textEl = tooltip.querySelector('.ls-text');
    const iconEl = tooltip.querySelector('.ls-icon');

    const icons = {
        safe: '✅',
        suspicious: '⚠️',
        dangerous: '🚫'
    };

    const statusLabels = {
        safe: 'Safe to Click',
        suspicious: 'Suspicious Link',
        dangerous: 'Dangerous Link'
    };

    iconEl.textContent = icons[report.level];
    statusEl.textContent = statusLabels[report.level];
    textEl.textContent = report.text;
}

/**
 * Smartly positions the tooltip to avoid covering the link or going off-screen.
 */
function positionTooltip(e, anchorRect) {
    const tooltip = document.getElementById(TOOLTIP_ID);
    if (!tooltip) return;

    const tooltipRect = tooltip.getBoundingClientRect();
    const spacing = 12; // Gap between cursor/element and tooltip

    // Default: Below the cursor, slightly right
    let top = e.pageY + spacing + 10;
    let left = e.pageX + spacing;

    // 1. Vertical Check: If not enough space below, move above
    // (We check viewport bottom vs intended top + height)
    if (e.clientY + tooltipRect.height + spacing + 20 > window.innerHeight) {
        top = e.pageY - tooltipRect.height - spacing;
    }

    // 2. Horizontal Check: If not enough space right, move left
    if (e.clientX + tooltipRect.width + spacing + 20 > window.innerWidth) {
        left = e.pageX - tooltipRect.width - spacing;
    }

    // 3. Link Overlap Prevention (Basic)
    // Ensure we aren't directly on top of the anchor rect if the mouse is hovering it
    // (Since we track mouse, this is usually naturally handled, but 'top' flipping helps)

    tooltip.style.top = `${top}px`;
    tooltip.style.left = `${left}px`;
}

/**
 * Shows the tooltip with fade-in.
 */
function showTooltip() {
    const tooltip = document.getElementById(TOOLTIP_ID);
    if (!tooltip) return;

    // Force a reflow if needed, then add visible class
    requestAnimationFrame(() => {
        tooltip.style.opacity = '1';
        tooltip.style.transform = 'translateY(0) scale(1)';
    });
}

/**
 * Hides the tooltip with fade-out.
 */
function hideTooltip() {
    const tooltip = document.getElementById(TOOLTIP_ID);
    if (!tooltip) return;

    tooltip.style.opacity = '0';
    tooltip.style.transform = 'translateY(4px) scale(0.98)';

    // Optional: after transition, move it off-screen or reset? 
    // CSS pointer-events:none handles the interaction block.
}

/**
 * Handler for mouse enter on links.
 */
function onLinkHover(e) {
    const anchor = e.target.closest('a');
    if (!anchor || !anchor.href) return;
    if (anchor.href.startsWith('javascript:') || anchor.href === '#') return;

    clearTimeout(hoverTimeout);

    // Wait before showing (debounce/intent check)
    hoverTimeout = setTimeout(async () => {
        // 1. Check Global Toggle
        const settings = await chrome.storage.local.get(['enabled', 'customWhitelist']);
        if (settings.enabled === false) return; // Stop if disabled

        const whitelist = settings.customWhitelist || [];

        createTooltip();

        // Check risk
        if (typeof RiskScanner !== 'undefined') {
            const report = RiskScanner.scanUrl(anchor.href, whitelist);

            // Add URL to report for history persistence
            report.url = anchor.href;

            updateTooltip(report);

            const anchorRect = anchor.getBoundingClientRect();
            positionTooltip(e, anchorRect);

            showTooltip();

            // Save to History (Fire and forget)
            chrome.storage.local.set({ lastScan: report });
        }
    }, HOVER_DELAY_MS);
}

/**
 * Handler for mouse leave.
 */
function onLinkLeave(e) {
    clearTimeout(hoverTimeout);
    hideTooltip();
}

/**
 * Auto-hide on scroll for better UX.
 */
function onScroll() {
    hideTooltip();
}

// --- Initialization ---
document.addEventListener('mouseover', onLinkHover);
document.addEventListener('mouseout', onLinkLeave);
document.addEventListener('scroll', onScroll, { passive: true });
