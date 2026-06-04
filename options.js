if (typeof chrome === "undefined") {
    var chrome = browser;
}
const toggleKeepAwake = document.getElementById('toggleKeepAwake');
const allowDuplicates = document.getElementById('allowDuplicates');
const massCopy = document.getElementById('massCopy');
let keepScreenAwakeEnabled = false;

function updateKeepAwakeButton(isEnabled) {
  toggleKeepAwake.innerText = isEnabled ? 'Disable keep awake' : 'Enable keep awake';
}

function setKeepAwakeState(isEnabled) {
  keepScreenAwakeEnabled = isEnabled;
  updateKeepAwakeButton(isEnabled);
}

allowDuplicates.addEventListener('change', () => {
  if (allowDuplicates.checked) massCopy.checked = false;
});

massCopy.addEventListener('change', () => {
  if (massCopy.checked) allowDuplicates.checked = false;
});

toggleKeepAwake.addEventListener('click', () => {
  const nextState = !keepScreenAwakeEnabled;
  setKeepAwakeState(nextState);

  chrome.storage.sync.set({
    keepScreenAwake: nextState
  });
});

document.getElementById('save').addEventListener('click', () => {
  const targetUrls = document.getElementById('targetUrl').value
    .split(/[\n,]+/)
    .map(u => u.trim())
    .filter(u => u.length > 0);

  const domains = document.getElementById('domains').value
    .split(/[\n,]+/)
    .map(d => d.trim())
    .filter(d => d.length > 0);

  chrome.storage.sync.set({
    keepScreenAwake: keepScreenAwakeEnabled,
    targetUrls,
    domains,
    allowDuplicates: allowDuplicates.checked,
    massCopy: massCopy.checked
  }, () => {
    const btn = document.getElementById('save');
    const originalText = btn.innerText;
    btn.innerText = '✅ Saved!';
    btn.style.background = '#4CAF50';

    setTimeout(() => {
      btn.innerText = originalText;
      btn.style.background = '#ff4444';
    }, 1500);
  });
});

chrome.storage.sync.get(['keepScreenAwake', 'targetUrls', 'domains', 'allowDuplicates', 'massCopy'], (data) => {
  const keepAwakeEnabled = data.keepScreenAwake || false;
  setKeepAwakeState(keepAwakeEnabled);
  if (data.targetUrls) document.getElementById('targetUrl').value = data.targetUrls.join('\n');
  if (data.domains) document.getElementById('domains').value = data.domains.join('\n');
  allowDuplicates.checked = data.allowDuplicates || false;
  massCopy.checked = data.massCopy || false;
});