// Settings live in chrome.storage.sync, so they follow the Chrome profile to every browser it signs in to.

export const DEFAULTS = Object.freeze({
  delaySeconds: 3,
  // Slack's pages that hand a link over to the desktop app and then stay open. The web client (app.slack.com/client)
  // matches none of them.
  patterns: Object.freeze([
    "https://*.slack.com/archives/*",
    "https://*.slack.com/app_redirect*",
    "https://*.slack.com/ssb/redirect*",
  ]),
});

export const MAX_DELAY_SECONDS = 600;

// A Chrome match pattern (https://developer.chrome.com/docs/extensions/develop/concepts/match-patterns) limited to
// http and https, which are the only schemes the manifest's optional host permissions cover.
const MATCH_PATTERN = /^(\*|https?):\/\/(\*|(?:\*\.)?[^/*]+)(\/.*)$/;

export function isValidPattern(pattern) {
  return MATCH_PATTERN.test(pattern);
}

// The host permission a pattern needs: Chrome grants access per scheme and host, never per path.
export function originOf(pattern) {
  const match = MATCH_PATTERN.exec(pattern);
  if (!match) {
    throw new Error(`not a match pattern: ${pattern}`);
  }
  return `${match[1]}://${match[2]}/*`;
}

export function isValidDelay(seconds) {
  return Number.isInteger(seconds) && seconds >= 0 && seconds <= MAX_DELAY_SECONDS;
}

// Parses the options page's text box: one pattern per line, blank lines ignored, duplicates dropped.
export function parsePatterns(text) {
  const patterns = [];
  const invalid = [];
  for (const line of text.split("\n")) {
    const pattern = line.trim();
    if (pattern === "" || patterns.includes(pattern)) {
      continue;
    }
    (isValidPattern(pattern) ? patterns : invalid).push(pattern);
  }
  return { patterns, invalid };
}

export async function getSettings() {
  return chrome.storage.sync.get(DEFAULTS);
}
