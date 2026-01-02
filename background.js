/**
 * background.js
 * Service Worker for LinkSentinel.
 * Handles context menu events.
 */

importScripts('riskScanner.js');

// --- Initialization ---
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "checkLink",
        title: "Check with LinkSentinel",
        contexts: ["link"]
    });
});

/**
 * Handle Context Menu Clicks
 */
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "checkLink" && info.linkUrl) {
        const report = RiskScanner.scanUrl(info.linkUrl); // Updated to scanUrl

        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: (report) => {
                alert(`LinkSentinel Analysis\n\nStatus: ${report.level.toUpperCase()}\n\n${report.text}`);
            },
            args: [report]
        });
    }
});
