const URL_CHECK_INTERVAL_MS = 500;
const ENABLED_KEY = "enabled";

let lastSeenUrl = window.location.href;
let isEnabled = true;

function getMerchantConfigForHost(hostname) {
  return MERCHANT_MAP.find((entry) => {
    return hostname === entry.site || hostname.endsWith(`.${entry.site}`);
  });
}

/**
 * Does most of the work, applies the param to the URL if the current host is in the merchant map 
 * and the param is not already present.
 * 
 * @returns {void}
 */
function ensureParamForMappedUrl() {
  if (!isEnabled) {
    return;
  }

  const currentUrl = new URL(window.location.href);
  const merchantConfig = getMerchantConfigForHost(currentUrl.hostname);

  if (!merchantConfig) {
    return;
  }

  const { paramKey, paramValue } = merchantConfig.params;

  if (currentUrl.searchParams.get(paramKey) === paramValue) {
    return;
  }

  currentUrl.searchParams.set(paramKey, paramValue);
  window.location.replace(currentUrl.toString());
}

function runIfUrlChanged() {
  const currentHref = window.location.href;

  if (currentHref === lastSeenUrl) {
    return;
  }

  lastSeenUrl = currentHref;
  ensureParamForMappedUrl();
}

function watchSpaNavigation() {
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;

  history.pushState = function pushStateWrapper(...args) {
    const result = originalPushState.apply(this, args);
    runIfUrlChanged();
    return result;
  };

  history.replaceState = function replaceStateWrapper(...args) {
    const result = originalReplaceState.apply(this, args);
    runIfUrlChanged();
    return result;
  };

  window.addEventListener("popstate", runIfUrlChanged);
  window.addEventListener("hashchange", runIfUrlChanged);

  // Some SPA transitions do not emit events in the extension context.
  window.setInterval(runIfUrlChanged, URL_CHECK_INTERVAL_MS);
}

function initialize() {
  chrome.storage.sync.get({ [ENABLED_KEY]: true }, (result) => {
    isEnabled = Boolean(result[ENABLED_KEY]);
    ensureParamForMappedUrl();
    lastSeenUrl = window.location.href;
    watchSpaNavigation();
  });

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "sync" || !changes[ENABLED_KEY]) {
      return;
    }

    isEnabled = Boolean(changes[ENABLED_KEY].newValue);

    if (isEnabled) {
      ensureParamForMappedUrl();
      lastSeenUrl = window.location.href;
    }
  });
}

initialize();
