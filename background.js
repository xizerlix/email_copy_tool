if (typeof chrome === "undefined") {
  var chrome = browser;
}
let globalLastEmail = "";
let keepScreenAwakeEnabled = false;

function syncKeepAwake() {
  if (!chrome.power || !chrome.power.requestKeepAwake || !chrome.power.releaseKeepAwake) return;

  if (keepScreenAwakeEnabled) {
    chrome.power.requestKeepAwake("display");
  } else {
    chrome.power.releaseKeepAwake();
  }
}

function loadKeepAwakeSetting() {
  chrome.storage.sync.get(["keepScreenAwake"], (data) => {
    keepScreenAwakeEnabled = Boolean(data.keepScreenAwake);
    syncKeepAwake();
  });
}

chrome.runtime.onInstalled.addListener(() => {
  console.log("Email Copy Tool: The extension is installed and ready to use.");
  loadKeepAwakeSetting();
});

if (chrome.runtime.onStartup) {
  chrome.runtime.onStartup.addListener(() => {
    loadKeepAwakeSetting();
  });
}

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== "sync" || !changes.keepScreenAwake) return;

  keepScreenAwakeEnabled = Boolean(changes.keepScreenAwake.newValue);
  syncKeepAwake();
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "GET_LAST_COPIED") {
    sendResponse({ lastEmail: globalLastEmail });
  }
  if (request.type === "SET_LAST_COPIED") {
    globalLastEmail = request.email;
  }
});

loadKeepAwakeSetting();