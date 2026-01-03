# LinkSentinel 🛡️

**LinkSentinel** is a privacy-focused, real-time link analysis Chrome Extension. It helps users avoid phishing, typosquatting (e.g., `goggle.com`), and dangerous downloads by scanning links instantly **offline** before they are clicked.


![LinkSentinel Preview](website/logo.png)

### 🌐 [Visit Official Website & Live Demo](https://link-sentinel.vercel.app/)


## 🚀 Features

*   **🔒 Privacy First:** 100% Offline analysis. No URL data is sent to any server.
*   **⚡ Zero Latency:** Instant tooltip feedback on hover.
*   **🚫 Phishing Detection:** Identifies misleading domains and typosquatting attempts.
*   **🔗 Smart Unshortener:** Resolves shortened URLs (e.g., bit.ly) to show the true destination.
*   **✅ Custom Whitelist:** Users can mark trusted sites to bypass checks.
*   **🎨 Premium UI:** Glassmorphism design with a focus on trust and clarity.

## 📦 Installation (Developer Mode)

Since this extension is in **Beta**, you can install it manually:

1.  Download or Clone this repository.
2.  Open Chrome and navigate to `chrome://extensions`.
3.  Toggle **Developer mode** in the top right corner.
4.  Click **Load unpacked**.
5.  Select the `LinkSentinel` folder.
6.  Pins the shield icon 🛡️ to your toolbar!

## 🛠️ Technologies

*   **Manifest V3**: Future-proof Chrome Extension architecture.
*   **Vanilla JS**: Lightweight, dependency-free core logic.
*   **Heuristic Engine**: Custom `riskScanner.js` algorithms for offline threat detection.

## 📂 Project Structure

*   `background.js`: Service worker for context menus.
*   `content.js`: Handles hover events and tooltip injection.
*   `riskScanner.js`: Core logic for URL analysis.
*   `popup/`: Extension popup UI (HTML/CSS/JS).
*   `website/`: The marketing landing page.

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
