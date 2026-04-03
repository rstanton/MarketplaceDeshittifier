const ENABLED_KEY = "enabled";

const toggle = document.getElementById("enabledToggle");
const statusText = document.getElementById("statusText");

function updateStatus(enabled) {
  statusText.textContent = enabled ? "Extension is ON" : "Extension is OFF";
}

chrome.storage.sync.get({ [ENABLED_KEY]: true }, (result) => {
  const isEnabled = Boolean(result[ENABLED_KEY]);
  toggle.checked = isEnabled;
  updateStatus(isEnabled);
});

toggle.addEventListener("change", () => {
  const nextValue = toggle.checked;
  chrome.storage.sync.set({ [ENABLED_KEY]: nextValue }, () => {
    updateStatus(nextValue);
  });
});
