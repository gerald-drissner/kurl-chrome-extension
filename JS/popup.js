/**
 * kurl - popup.js
 * This script controls the user interface and logic within the main popup window.
 * version: 1.3 (Final Chrome)
 */

const H = globalThis.Helpers;
const $ = (id) => document.getElementById(id);

// ==========================================================================
// ELEMENT REFERENCES
// ==========================================================================
const longUrl = $("longUrl");
const keyword = $("keyword");
const title = $("title");
const shortUrl = $("shortUrl");
const btnShorten = $("btnShorten");
const btnCopyClose = $("btnCopyClose");
const btnQrCode = $("btnQrCode");
const btnDownloadQr = $("btnDownloadQr");
const btnDelete = $("btnDelete");
const statsInput = $("statsInput");
const btnStats = $("btnStats");
const btnDetails = $("btnDetails");
const msg = $("msg");
const jsonBox = $("json");
const resultArea = $("result-area");
const qrcodeDisplay = $("qrcode-display");

// ==========================================================================
// INITIALIZATION
// ==========================================================================

document.addEventListener('DOMContentLoaded', async () => {
  internationalize();

  // Helper function to open the options page in a cross-browser way
  const openOptions = () => {
    if (chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    } else {
      browser.runtime.openOptionsPage();
    }
  };

  // Attach the event listener for the settings icon
  $('open-settings-link').addEventListener('click', (e) => {
    e.preventDefault();
    openOptions();
    window.close();
  });

  const settings = await H.getSettings();
  if (!settings.yourlsUrl || !settings.apiSignature) {
    // Pass the helper function to the setup display
    displaySetupMessage(openOptions);
    return;
  }

  const initial = await getInitialUrl(settings);
  if (initial.url) {
    if (initial.isShort) {
      handleExistingShortUrl(initial.url);
    } else {
      longUrl.value = initial.url;
    }
  }

  await browser.storage.local.remove(["yourls_prefill_long", "yourls_prefill_short"]);
  init();
});


// ==========================================================================
// UI LOGIC FUNCTIONS
// ==========================================================================

async function getInitialUrl(settings) {
  const storageData = await browser.storage.local.get(["yourls_prefill_long", "yourls_prefill_short"]);
  let url = storageData.yourls_prefill_long || storageData.yourls_prefill_short;
  let isShort = !!storageData.yourls_prefill_short;

  if (!url) {
    // Fallback for when the popup is opened directly without an action.
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.url && !tab.url.startsWith('about:')) {
      url = tab.url;
    }
  }

  if (url) {
    const base = H.sanitizeBaseUrl(settings.yourlsUrl);
    isShort = isShort || (base && url.startsWith(base) && url.length > base.length + 1);
  }
  return { url, isShort };
}

function handleExistingShortUrl(url) {
  resultArea.style.display = 'block';
  shortUrl.value = url;
  statsInput.value = url;
  btnDelete.disabled = false;
  longUrl.value = 'Loading...';
  longUrl.disabled = true;
  keyword.disabled = true;
  title.disabled = true;
  btnShorten.disabled = true;
  setMsg(browser.i18n.getMessage("popupInfoAutoStats"), "ok");
  btnStats.click();
}

// Accept the openOptions function as an argument
function displaySetupMessage(openOptions) {
  $('main-content').style.display = 'none';
  $('setup-message').style.display = 'block';
  $('btnGoToOptions').addEventListener('click', () => {
    openOptions();
    window.close();
  });
}

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

function setMsg(text, cls = "") {
  msg.className = "info " + cls;
  msg.textContent = text;
}

function toggleJson(show, data) {
  jsonBox.style.display = show ? "block" : "none";
  if (show && data) {
    jsonBox.textContent = typeof data === "string" ? data : JSON.stringify(data, null, 2);
  }
}

// ==========================================================================
// EVENT LISTENERS
// ==========================================================================

btnShorten.addEventListener("click", async () => {
  const url = longUrl.value.trim();
  if (!/^https?:\/\//i.test(url)) return setMsg(browser.i18n.getMessage("popupErrorInvalidUrl"));

    setMsg(browser.i18n.getMessage("popupStatusShortening"));
  toggleJson(false);

  const r = await browser.runtime.sendMessage({
    type: "SHORTEN_URL",
    longUrl: url,
    keyword: keyword.value.trim(),
                                              title: title.value.trim()
  });

  if (!r || !r.ok) return setMsg(r?.reason || browser.i18n.getMessage("errorShortenFailed"));

  resultArea.style.display = 'block';
  shortUrl.value = r.shortUrl || "";
  statsInput.value = r.shortUrl || "";
  btnDelete.disabled = !r.shortUrl;
  qrcodeDisplay.style.display = 'none';
  btnDownloadQr.style.display = 'none';

  setMsg(r.already ? browser.i18n.getMessage("popupInfoAlreadyShortened") : browser.i18n.getMessage("popupStatusCreated"), "ok");
});

btnCopyClose.addEventListener("click", () => {
  const v = shortUrl.value.trim();
  if (!v) return;
  navigator.clipboard.writeText(v).then(() => {
    window.close();
  }).catch(() => {
    setMsg(browser.i18n.getMessage("popupErrorCopyFailed"));
  });
});

btnQrCode.addEventListener("click", () => {
  const url = shortUrl.value.trim();
  if (!url) return;
  if (qrcodeDisplay.style.display === 'flex') {
    qrcodeDisplay.style.display = 'none';
    btnDownloadQr.style.display = 'none';
    return;
  }
  qrcodeDisplay.innerHTML = '';
  new QRCode(qrcodeDisplay, {
    text: url,
    width: 160,
    height: 160,
    colorDark: "#111827",
    colorLight: "#ffffff",
    correctLevel: QRCode.CorrectLevel.H
  });
  qrcodeDisplay.style.display = 'flex';
  btnDownloadQr.style.display = 'inline-block';
});

btnDownloadQr.addEventListener("click", () => {
  const url = shortUrl.value.trim();
  if (!url) return;
  const tempDiv = document.createElement('div');
  tempDiv.style.display = 'none';
  document.body.appendChild(tempDiv);
  new QRCode(tempDiv, {
    text: url, width: 512, height: 512,
    colorDark: "#000000", colorLight: "#ffffff",
    correctLevel: QRCode.CorrectLevel.H
  });
  const canvas = tempDiv.querySelector('canvas');
  if (!canvas) {
    document.body.removeChild(tempDiv);
    return;
  }
  const link = document.createElement('a');
  const customKeyword = keyword.value.trim();
  const shortKeyword = shortUrl.value.split('/').pop();
  link.download = `kurl-qrcode-${customKeyword || shortKeyword || 'link'}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
  document.body.removeChild(tempDiv);
});

btnStats.addEventListener("click", async () => {
  const q = (statsInput.value || shortUrl.value).trim();
  if (!q) return setMsg(browser.i18n.getMessage("popupErrorEnterUrlForStats"));

  setMsg(browser.i18n.getMessage("popupStatusFetchingStats"));
  toggleJson(false);
  btnDetails.style.visibility = 'hidden';

  const r = await browser.runtime.sendMessage({ type: "GET_STATS", shortUrl: q });
  if (!r || !r.ok) return setMsg(r?.reason || browser.i18n.getMessage("errorStatsFailed"));

  const l = r.data?.link || r.data?.url || {};
  const message = browser.i18n.getMessage("popupStatusStatsResult", [l.shorturl || "?", l.url || "?", l.clicks ?? "?"]);
  setMsg(message, "ok");

  if (longUrl.disabled && l.url) {
    longUrl.value = l.url;
  }

  jsonBox.textContent = JSON.stringify(r.data, null, 2);
  btnDetails.style.visibility = 'visible';
});

btnDetails.addEventListener("click", () => {
  toggleJson(jsonBox.style.display !== "block");
});

btnDelete.addEventListener("click", async () => {
  const v = (statsInput.value || shortUrl.value).trim();
  if (!v) return setMsg(browser.i18n.getMessage("popupErrorProvideUrlToDelete"));

  if (!btnDelete.classList.contains('confirm-delete')) {
    btnDelete.textContent = browser.i18n.getMessage("popupBtnConfirmDelete");
    btnDelete.classList.add('confirm-delete');
    setTimeout(() => {
      btnDelete.textContent = browser.i18n.getMessage("popupBtnDelete");
      btnDelete.classList.remove('confirm-delete');
    }, 4000);
    return;
  }

  btnDelete.classList.remove('confirm-delete');
  btnDelete.textContent = browser.i18n.getMessage("popupBtnDelete");
  setMsg(browser.i18n.getMessage("popupStatusDeleting"));

  const r = await browser.runtime.sendMessage({ type: "DELETE_SHORTURL", shortUrl: v });
  if (!r || !r.ok) return setMsg(r?.reason || browser.i18n.getMessage("errorDeleteFailed"));

  setMsg(browser.i18n.getMessage("popupStatusDeleted"), "ok");
  shortUrl.value = "";
  statsInput.value = "";
  btnDelete.disabled = true;
  resultArea.style.display = 'none';
  qrcodeDisplay.style.display = 'none';
  btnDownloadQr.style.display = 'none';
});

function init() {
  setMsg(browser.i18n.getMessage("popupStatusReady"));
  btnDetails.style.visibility = 'hidden';
}
