/**
 * riskScanner.js
 * Core logic for analyzing URLs and determining risk levels.
 */

const RiskScanner = {
  /**
   * Analyzes a URL and returns a risk report.
   * @param {string} urlString - The URL to analyze.
   * @returns {Object} - { level: 'safe'|'suspicious'|'dangerous', score: number, text: string }
   */
  scanUrl: function (urlString, customWhitelist = []) {
    let url;
    try {
      url = new URL(urlString);
    } catch (e) {
      return {
        level: 'suspicious',
        score: 50,
        text: "We couldn't fully read this link structure. Proceed with caution."
      };
    }

    // --- 0. Definitive Whitelist (Offline & Custom) ---

    // A. User's Custom Whitelist (Priority 1)
    if (customWhitelist.includes(url.hostname)) {
      return {
        level: 'safe',
        score: 0,
        text: "Marked as safe by you (Custom Trusted)."
      };
    }

    // B. Global Top Domains (Priority 2)
    const TOP_DOMAINS = [
      'google.com', 'www.google.com',
      'youtube.com', 'www.youtube.com',
      'facebook.com', 'www.facebook.com',
      'twitter.com', 'x.com',
      'linkedin.com', 'www.linkedin.com',
      'amazon.com', 'www.amazon.com',
      'wikipedia.org', 'en.wikipedia.org',
      'instagram.com', 'www.instagram.com',
      'netflix.com', 'www.netflix.com',
      'microsoft.com', 'www.microsoft.com',
      'apple.com', 'www.apple.com',
      'github.com', 'www.github.com',
      'stackoverflow.com'
    ];

    if (TOP_DOMAINS.includes(url.hostname)) {
      return {
        level: 'safe',
        score: 0,
        text: "Verified popular website via internal database."
      };
    }

    let score = 0; // Lower is safer
    let reasons = [];

    // --- Heuristic Checks ---

    // 1. Protocol Check
    if (url.protocol === 'http:') {
      score += 30;
      reasons.push("It uses an unencrypted connection (HTTP).");
    }

    // 2. IP Address Check (Host is IP)
    const isIpAddress = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(url.hostname);
    if (isIpAddress) {
      score += 60;
      reasons.push("It points to a raw server address (IP) instead of a verified domain.");
    }

    // 3. Length Check
    if (urlString.length > 700) {
      score += 20;
      reasons.push("The link is unusually long and complex.");
    }

    // 4. Suspicious TLDs
    const suspiciousTLDs = ['.xyz', '.top', '.gq', '.work', '.click', '.zip', '.mov'];
    const tld = url.hostname.split('.').pop();
    if (suspiciousTLDs.includes(`.${tld}`)) {
      score += 25;
      reasons.push(`It uses a domain ending (.${tld}) often associated with spam.`);
    }

    // 5. Sensitive Keywords in Path (Phishing indicators)
    const sensitiveKeywords = ['login', 'signin', 'verify', 'wallet', 'secure', 'account', 'update'];
    const pathLower = url.pathname.toLowerCase();
    const hasSensitiveKeyword = sensitiveKeywords.some(kw => pathLower.includes(kw));

    if (hasSensitiveKeyword) {
      score += 20;
      reasons.push("The link asks for sensitivity (like 'login') but the source is unverified.");
    }

    // 6. Subdomain Count
    const subdomainCount = url.hostname.split('.').length - 2; // rough calc
    if (subdomainCount > 3) {
      score += 15;
      reasons.push("The domain structure is complicated with many sub-levels.");
    }

    // 7. Punycode
    if (url.hostname.startsWith('xn--')) {
      score += 10;
      reasons.push("It uses special characters that might be used to spoof real sites.");
    }

    // 8. Suspicious Domain Keywords (High Risk if not whitelisted)
    // Keywords often found in phishing domains trying to look like support/login
    const suspiciousDomainKeywords = ['protection', 'secure', 'access', 'update', 'verify', 'support', 'service', 'account', 'login', 'signin', 'confirm'];
    const hostnameLower = url.hostname.toLowerCase();

    // Check if hostname contains these words (e.g. protection-accesser.com)
    // We already passed the whitelist check, so if these words are here, it's likely weird.
    const foundKeyword = suspiciousDomainKeywords.find(kw => hostnameLower.includes(kw));
    if (foundKeyword) {
      // High penalty because these words in a non-whitelisted domain are VERY suspicious
      score += 30;
      reasons.push(`The domain name contains alarming keywords ("${foundKeyword}") but is not a verified service.`);
    }

    // 9. URL Shorteners
    const shorteners = ['bit.ly', 'tinyurl.com', 'is.gd', 't.co', 'goo.gl', 'ow.ly', 'buff.ly', 'rebrand.ly'];
    if (shorteners.includes(url.hostname)) {
      score += 20; // Suspicious because destination is hidden
      reasons.push("This is a shortened link. The final destination is hidden.");
    }

    // 10. Dangerous File Extensions
    const dangerousExts = ['.exe', '.bat', '.cmd', '.sh', '.msi', '.apk', '.scr', '.vbs', '.iso'];
    if (dangerousExts.some(ext => url.pathname.toLowerCase().endsWith(ext))) {
      score += 50;
      reasons.push("This link directly downloads an executable or script file.");
    }

    // 11. Typosquatting (Brand Impersonation)
    // Check if hostname is "close" to a top domain but not it.
    for (const safeDomain of TOP_DOMAINS) {
      // Skip if lengths are too different
      if (Math.abs(url.hostname.length - safeDomain.length) > 2) continue;

      const dist = RiskScanner._levenshtein(url.hostname, safeDomain);
      if (dist > 0 && dist <= 2) {
        score += 45;
        reasons.push(`This looks potentially like a fake version of ${safeDomain} (Typosquatting).`);
        break;
      }
    }

    // --- Determining Level ---

    let level = 'safe';
    if (score >= 60) {
      level = 'dangerous';
    } else if (score >= 20) {
      level = 'suspicious';
    }

    // --- Human-Friendly Explanation Generation ---

    let explanation = "";
    if (level === 'safe') {
      explanation = "This link looks verified and safe.";
    } else {
      explanation = `Caution advised: ${reasons.join(" ")}`;
    }

    // Fallback
    if (level !== 'safe' && reasons.length === 0) {
      explanation = "This link shows irregular patterns.";
    }

    return {
      level: level,
      score: score,
      text: explanation
    };
  },

  /**
   * Calculates Levenshtein distance between two strings.
   * Internal helper.
   */
  _levenshtein: function (a, b) {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;

    const matrix = [];

    // increment along the first column of each row
    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }

    // increment each column in the first row
    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }

    // Fill in the rest of the matrix
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) == a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            Math.min(
              matrix[i][j - 1] + 1, // insertion
              matrix[i - 1][j] + 1 // deletion
            )
          );
        }
      }
    }

    return matrix[b.length][a.length];
  }
};

// Make it available globally for content script
if (typeof window !== 'undefined') {
  window.RiskScanner = RiskScanner;
}
// Export for background/tests if needed
if (typeof module !== 'undefined') {
  module.exports = RiskScanner;
}
