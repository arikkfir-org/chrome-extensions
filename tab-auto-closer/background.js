import { getSettings, isValidPattern, originOf } from "./settings.js";

const SCRIPT_ID = "auto-close";

// Runs content.js on pages matching the patterns whose sites the user granted access to, and nowhere else.
async function registerContentScript() {
  const { patterns } = await getSettings();
  const matches = [];
  for (const pattern of patterns.filter(isValidPattern)) {
    if (await chrome.permissions.contains({ origins: [originOf(pattern)] })) {
      matches.push(pattern);
    }
  }

  const registered = await chrome.scripting.getRegisteredContentScripts({ ids: [SCRIPT_ID] });
  if (registered.length > 0) {
    await chrome.scripting.unregisterContentScripts({ ids: [SCRIPT_ID] });
  }
  if (matches.length > 0) {
    await chrome.scripting.registerContentScripts([
      { id: SCRIPT_ID, matches, js: ["content.js"], runAt: "document_idle" },
    ]);
  }
}

// Saving the options changes both the patterns and the permissions at once; registering twice in parallel would fail
// on the duplicate ID, so registrations run one after the other.
let registration = Promise.resolve();
function syncContentScript() {
  registration = registration
    .then(registerContentScript)
    .catch((error) => console.error("could not register the content script", error));
  return registration;
}

chrome.runtime.onInstalled.addListener(({ reason }) => {
  if (reason === chrome.runtime.OnInstalledReason.INSTALL) {
    chrome.runtime.openOptionsPage();
  }
  syncContentScript();
});
chrome.runtime.onStartup.addListener(syncContentScript);
chrome.permissions.onAdded.addListener(syncContentScript);
chrome.permissions.onRemoved.addListener(syncContentScript);
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "sync" && changes.patterns) {
    syncContentScript();
  }
});

chrome.action.onClicked.addListener(() => chrome.runtime.openOptionsPage());

// Content scripts can't close their own tab: window.close() only works on windows a script opened.
chrome.runtime.onMessage.addListener((message, sender) => {
  if (message?.type === "close" && sender.tab?.id !== undefined) {
    chrome.tabs.remove(sender.tab.id);
  }
});
