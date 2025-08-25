const H = globalThis.Helpers;
const $ = (id) => document.getElementById(id);

// Element references
const urlEl = $("yourlsUrl");
const keyEl = $("apiSignature");
const autoEl = $("autoCopy");
const btnSave = $("save");
const btnTest = $("test");
const btnRemove = $("removePerm");
const statusBox = $("status");

/**
 * Updates all text content in the document based on the browser's locale.
 */
function internationalize() {
  document.querySelectorAll('[data-i18n-key]').forEach(el => {
    const key = el.getAttribute('data-i18n-key');
    const message = browser.i18n.getMessage(key);
    if (message) {
      if (el.placeholder) el.placeholder = message;
      else el.textContent = message;
    }
  });
}

/**
 * Sets the status message text and appearance.
 */
function setStatus(text, cls = "") {
  statusBox.className = "info " + cls;
  statusBox.textContent = text;
}

/**
 * Handles the connection test logic.
 */
async function testConnection() {
  const base = H.sanitizeBaseUrl(urlEl.value);
  const key = keyEl.value.trim();
  if (!base || !key) {
    setStatus(browser.i18n.getMessage("optionsStatusEnterUrlAndToken"));
    return;
  }

  try {
    const origin = new URL(base).origin + "/*";
    const ok = await browser.permissions.request({ origins: [origin] });
    if (!ok) {
      setStatus(browser.i18n.getMessage("optionsStatusPermNotGranted"));
      return;
    }
  } catch (e) {
    setStatus(browser.i18n.getMessage("optionsStatusPermRequestError") + e);
    return;
  }

  const s = await browser.runtime.sendMessage({ type: "CHECK_CONNECTION" });
  if (s?.ok) {
    const total = s.total ?? "?";
    // Correctly use the placeholder for the total links message
    const message = browser.i18n.getMessage("optionsStatusConnOk", [total]);
    setStatus(message, "ok");
  } else {
    setStatus(s?.reason || browser.i18n.getMessage("optionsStatusConnFailed"));
  }
}

// Event Listeners
btnSave.addEventListener("click", async () => {
  const base = H.sanitizeBaseUrl(urlEl.value);
  await H.setSettings({
    yourlsUrl: base,
    apiSignature: keyEl.value.trim(),
                      autoCopy: autoEl.checked
  });
  setStatus(browser.i18n.getMessage("optionsStatusSaved"));
});

btnTest.addEventListener("click", testConnection);

btnRemove.addEventListener("click", async () => {
  const base = H.sanitizeBaseUrl(urlEl.value);
  if (!base) {
    return setStatus(browser.i18n.getMessage("optionsStatusEnterUrlToRemove"));
  }
  try {
    const origin = new URL(base).origin + "/*";
    await browser.permissions.remove({ origins: [origin] });
    setStatus(browser.i18n.getMessage("optionsStatusPermRemoved"));
  } catch (e) {
    setStatus(browser.i18n.getMessage("optionsStatusPermRemoveError") + e);
  }
});

/**
 * Initializes the options page.
 */
async function init() {
  internationalize();
  const s = await H.getSettings();
  urlEl.value = s.yourlsUrl || "";
  keyEl.value = s.apiSignature || "";
  autoEl.checked = s.autoCopy;
  setStatus(browser.i18n.getMessage("optionsStatusLoaded"));
}

init();
