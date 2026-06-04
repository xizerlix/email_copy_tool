if (typeof chrome === "undefined") {
  var chrome = browser;
}
let isProcessing = false;
let lastToastTime = 0;
let lastCopiedValue = "";

function showToast(message) {
  const now = Date.now();
  if (now - lastToastTime < 2500) return;
  lastToastTime = now;

  const toast = document.createElement("div");
  toast.innerText = message;
  Object.assign(toast.style, {
    position: "fixed",
    bottom: "30px",
    right: "20px",
    backgroundColor: "#ff4444",
    color: "white",
    padding: "16px 24px",
    fontSize: "16px",
    borderRadius: "8px",
    zIndex: "1000000",
    fontFamily: "Segoe UI, Arial, sans-serif",
    boxShadow: "0 4px 15px rgba(0,0,0,0.4)",
    fontWeight: "bold",
    transition: "opacity 0.5s ease",
    pointerEvents: "none"
  });
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 500);
  }, 3000);
}

function processEmails() {
  if (isProcessing || !chrome.runtime?.id) return;

  chrome.storage.sync.get(["targetUrls", "domains", "allowDuplicates", "massCopy"], (data) => {
    const currentUrl = window.location.href;
    const targetUrls = data.targetUrls || [];
    const isAllowedUrl = targetUrls.some((url) => currentUrl.includes(url));

    if (chrome.runtime.lastError || !isAllowedUrl) return;

    const pageText = document.body.innerText;
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const rawEmails = pageText.match(emailRegex);

    if (!rawEmails) {
      lastCopiedValue = "";
      return;
    }

    isProcessing = true;

    chrome.runtime.sendMessage({ type: "GET_LAST_COPIED" }, (response) => {
      const lastGlobalCopy = response?.lastEmail || "";
      const { domains = [], allowDuplicates, massCopy } = data;

      const validEmails = [...new Set(
        rawEmails
          .map((e) => e.toLowerCase().trim())
          .filter((e) => domains.length === 0 || domains.some((d) => e.endsWith(d.toLowerCase().trim())))
      )];

      if (validEmails.length > 0) {
        const contentToCopy = massCopy ? validEmails.join("\n") : validEmails[0];
        const isNewGlobal = contentToCopy !== lastGlobalCopy;
        const isNewLocal = contentToCopy !== lastCopiedValue;

        if (isNewGlobal || (allowDuplicates && isNewLocal)) {
          lastCopiedValue = contentToCopy;
          chrome.runtime.sendMessage({ type: "SET_LAST_COPIED", email: contentToCopy });
          navigator.clipboard.writeText(contentToCopy).then(() => {
            const msg = massCopy ? `Copied ${validEmails.length} addresses` : contentToCopy;
            showToast(msg);
          });
        }
      }
      setTimeout(() => { isProcessing = false; }, 1000);
    });
  });
}

const observer = new MutationObserver(() => {
  clearTimeout(window.creatioTimer);
  window.creatioTimer = setTimeout(processEmails, 800);
});

let heartbeatPort = null;

function disconnectHeartbeatPort() {
  if (!heartbeatPort) return;

  heartbeatPort.disconnect();
  heartbeatPort = null;
}

function connectHeartbeatPort() {
  if (heartbeatPort || !chrome.runtime?.id) return;

  try {
    heartbeatPort = chrome.runtime.connect({ name: "heartbeat" });
    heartbeatPort.onDisconnect.addListener(() => {
      heartbeatPort = null;
    });
  } catch (error) {
    heartbeatPort = null;
  }
}

function requestIconRefresh() {
  if (!chrome.runtime?.id) return;

  chrome.runtime.sendMessage({ type: "REFRESH_TAB_ICON" }, () => {
    void chrome.runtime.lastError;
  });
}

function updateHeartIndicator() {
  chrome.storage.sync.get(["keepScreenAwake"], (data) => {
    requestIconRefresh();

    if (data.keepScreenAwake && document.visibilityState === "visible") {
      connectHeartbeatPort();
    } else {
      disconnectHeartbeatPort();
    }
  });
}

document.addEventListener("visibilitychange", () => {
  updateHeartIndicator();
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== "sync") return;

  if (changes.keepScreenAwake || changes.targetUrls) {
    updateHeartIndicator();
  }
});

function initContentScript() {
  if (!document.body) {
    document.addEventListener("DOMContentLoaded", initContentScript, { once: true });
    return;
  }

  observer.observe(document.body, { childList: true, subtree: true });
  processEmails();
  updateHeartIndicator();
}

initContentScript();
