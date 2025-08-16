const ID_PREFIX = "bta_";
const STORAGE_KEY = "allowedSites";

function scriptIdFor(pattern) { return ID_PREFIX + pattern; }

function register(pattern) {
  return chrome.scripting.registerContentScripts([{
    id: scriptIdFor(pattern),
    matches: [pattern],
    js: ["content.js"],
    runAt: "document_end",
    persistAcrossSessions: true
  }]).catch(() => {});
}

function unregister(pattern) {
  return chrome.scripting.unregisterContentScripts({ ids: [scriptIdFor(pattern)] }).catch(() => {});
}

function initAll() {
  chrome.storage.sync.get({ [STORAGE_KEY]: [] }, data => {
    (data[STORAGE_KEY] || []).forEach(register);
  });
}

chrome.runtime.onInstalled.addListener(initAll);
chrome.runtime.onStartup.addListener(initAll);

chrome.storage.onChanged.addListener(changes => {
  if (!changes[STORAGE_KEY]) return;
  const oldV = changes[STORAGE_KEY].oldValue || [];
  const newV = changes[STORAGE_KEY].newValue || [];
  oldV.filter(x => !newV.includes(x)).forEach(unregister);
  newV.filter(x => !oldV.includes(x)).forEach(register);
});

chrome.action.onClicked.addListener(async (tab) => {
  if (!tab?.id || !tab.url?.startsWith("http")) return;
  const origin = new URL(tab.url).origin + "/*";

  chrome.permissions.request({ origins: [origin] }, async (granted) => {
    if (!granted) return;
    await register(origin);

    chrome.storage.sync.get({ [STORAGE_KEY]: [] }, data => {
      const list = new Set(data[STORAGE_KEY] || []);
      list.add(origin);
      chrome.storage.sync.set({ [STORAGE_KEY]: [...list] });
    });

    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["content.js"]
    });
  });
});
