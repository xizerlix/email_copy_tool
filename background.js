if (typeof chrome === "undefined") {
  var chrome = browser;
}

const actionApi = chrome.action || chrome.browserAction;

const grayIconPaths = {
  16: "icons/icon16.png",
  48: "icons/icon48.png",
  128: "icons/icon128.png"
};

const redIconPaths = {
  16: "icons/icon16-red.png",
  48: "icons/icon48-red.png",
  128: "icons/icon128-red.png"
};

const HEARTBEAT_FRAME_COUNT = 8;
const HEARTBEAT_FRAME_MS = 120;
const HEARTBEAT_PAUSE_FRAMES = 6;

let globalLastEmail = "";
let keepScreenAwakeEnabled = false;
let targetUrls = [];
let pulseTabId = null;
let pulseFrame = 0;
let pulsePauseFrames = 0;
let heartbeatTimer = null;
let heartbeatPortCount = 0;

function normalizeTargetUrls(urls) {
  return (urls || []).map((url) => url.trim()).filter(Boolean);
}

function isTargetUrl(url) {
  return Boolean(url) && targetUrls.some((target) => url.includes(target));
}

function setIconPaths(tabId, paths, alsoSetGlobal) {
  actionApi.setIcon({ tabId, path: paths }, () => {
    void chrome.runtime.lastError;
  });

  if (alsoSetGlobal) {
    actionApi.setIcon({ path: paths }, () => {
      void chrome.runtime.lastError;
    });
  }
}

function getStaticIconPaths(isTarget) {
  return isTarget ? redIconPaths : grayIconPaths;
}

function getPulseFramePaths(frameIndex, isTarget) {
  const frame = frameIndex % HEARTBEAT_FRAME_COUNT;
  const variant = isTarget ? "red" : "gray";

  return {
    16: `icons/pulse/${variant}/16-f${frame}.png`,
    48: `icons/pulse/${variant}/48-f${frame}.png`,
    128: `icons/pulse/${variant}/128-f${frame}.png`
  };
}

function setStaticIcon(tabId, isTarget, isFocusedActive) {
  setIconPaths(tabId, getStaticIconPaths(isTarget), isFocusedActive);
}

function setPulseIcon(tabId, frameIndex, isTarget, isFocusedActive) {
  setIconPaths(tabId, getPulseFramePaths(frameIndex, isTarget), isFocusedActive);
}

function resetPulseState() {
  pulseFrame = 0;
  pulsePauseFrames = 0;
  pulseTabId = null;
}

function stopBackgroundHeartbeat() {
  if (heartbeatTimer !== null) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }

  resetPulseState();
}

function tickBackgroundHeartbeat() {
  if (!keepScreenAwakeEnabled) {
    stopBackgroundHeartbeat();
    refreshIconsForAllTabs();
    return;
  }

  chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
    if (chrome.runtime.lastError || !tabs?.length) return;

    const tab = tabs[0];
    if (!tab || typeof tab.id !== "number") return;

    advancePulseFrame(tab.id, tab.url || "", true);
  });
}

function startBackgroundHeartbeat() {
  if (heartbeatTimer !== null) return;

  tickBackgroundHeartbeat();
  heartbeatTimer = setInterval(tickBackgroundHeartbeat, HEARTBEAT_FRAME_MS);
}

function syncHeartbeatState() {
  if (keepScreenAwakeEnabled) {
    startBackgroundHeartbeat();
    return;
  }

  stopBackgroundHeartbeat();
  refreshIconsForAllTabs();
}

function advancePulseFrame(tabId, url, isFocusedActive) {
  const isTarget = isTargetUrl(url);

  if (!keepScreenAwakeEnabled) {
    setStaticIcon(tabId, isTarget, isFocusedActive);
    return;
  }

  pulseTabId = tabId;

  if (pulsePauseFrames > 0) {
    pulsePauseFrames -= 1;
    setStaticIcon(tabId, isTarget, isFocusedActive);
    return;
  }

  setPulseIcon(tabId, pulseFrame, isTarget, isFocusedActive);
  pulseFrame += 1;

  if (pulseFrame >= HEARTBEAT_FRAME_COUNT) {
    pulseFrame = 0;
    pulsePauseFrames = HEARTBEAT_PAUSE_FRAMES;
  }
}

function applyIconForTab(tabId, url, isFocusedActive) {
  setStaticIcon(tabId, isTargetUrl(url), isFocusedActive);
}

function refreshIconsForAllTabs() {
  if (keepScreenAwakeEnabled && heartbeatTimer !== null) {
    return;
  }

  chrome.tabs.query({ active: true, lastFocusedWindow: true }, (activeTabs) => {
    if (chrome.runtime.lastError) return;

    const focusedActiveTabId = activeTabs?.[0]?.id ?? null;

    chrome.tabs.query({}, (tabs) => {
      if (chrome.runtime.lastError || !tabs) return;

      for (const tab of tabs) {
        if (!tab || typeof tab.id !== "number") continue;

        const isFocusedActive = tab.id === focusedActiveTabId;
        applyIconForTab(tab.id, tab.url || "", isFocusedActive);
      }
    });
  });
}

function syncKeepAwake() {
  if (!chrome.power?.requestKeepAwake || !chrome.power?.releaseKeepAwake) return;

  if (keepScreenAwakeEnabled) {
    chrome.power.requestKeepAwake("display");
  } else {
    chrome.power.releaseKeepAwake();
  }
}

function loadSettings() {
  chrome.storage.sync.get(["keepScreenAwake", "targetUrls"], (data) => {
    keepScreenAwakeEnabled = Boolean(data.keepScreenAwake);
    targetUrls = normalizeTargetUrls(data.targetUrls);
    syncKeepAwake();
    syncHeartbeatState();
  });
}

chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== "heartbeat") return;

  heartbeatPortCount += 1;

  port.onDisconnect.addListener(() => {
    heartbeatPortCount = Math.max(0, heartbeatPortCount - 1);
  });
});

chrome.runtime.onInstalled.addListener(() => {
  console.log("Email Copy Tool: The extension is installed and ready to use.");
  loadSettings();
});

if (chrome.runtime.onStartup) {
  chrome.runtime.onStartup.addListener(() => {
    loadSettings();
  });
}

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== "sync") return;

  if (changes.keepScreenAwake) {
    keepScreenAwakeEnabled = Boolean(changes.keepScreenAwake.newValue);
    syncKeepAwake();
    syncHeartbeatState();
    return;
  }

  if (changes.targetUrls) {
    targetUrls = normalizeTargetUrls(changes.targetUrls.newValue);
    refreshIconsForAllTabs();
  }
});

chrome.tabs?.onActivated?.addListener(() => {
  if (keepScreenAwakeEnabled && heartbeatTimer !== null) {
    tickBackgroundHeartbeat();
    return;
  }

  refreshIconsForAllTabs();
});

chrome.tabs?.onUpdated?.addListener((tabId, changeInfo) => {
  if (!changeInfo.url) return;

  if (keepScreenAwakeEnabled && heartbeatTimer !== null) {
    tickBackgroundHeartbeat();
    return;
  }

  refreshIconsForAllTabs();
});

chrome.windows?.onFocusChanged?.addListener((windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) return;

  if (keepScreenAwakeEnabled && heartbeatTimer !== null) {
    tickBackgroundHeartbeat();
    return;
  }

  refreshIconsForAllTabs();
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "GET_LAST_COPIED") {
    sendResponse({ lastEmail: globalLastEmail });
    return;
  }

  if (request.type === "SET_LAST_COPIED") {
    globalLastEmail = request.email;
    return;
  }

  if (request.type === "REFRESH_TAB_ICON") {
    if (keepScreenAwakeEnabled) {
      syncHeartbeatState();
    } else {
      refreshIconsForAllTabs();
    }
  }
});

loadSettings();
