import './polyfill.js';
import './helpers.js';

/**
 * kurl - background.js
 * This script is the central hub for the kurl extension. It handles all
 * communication with the YOURLS API, manages browser-level interactions like
 * context menus and the toolbar icon, and listens for requests from the popup.
 *
 * version: 1.2 (Final Chrome)
 */
const H = globalThis.Helpers;

const REDIRECT_PATTERNS = [
  { host_prefix: 'www.google.', path: '/url', param: 'url' },
{ host_prefix: 'www.bing.com', path: '/ck/a', param: 'u', prefix_to_strip: 'a1' },
{ host_prefix: 'duckduckgo.com', path: '/l/', param: 'uddg' },
{ host_prefix: 'www.youtube.com', path: '/redirect', param: 'q' }
];

// ==========================================================================
// API ACTION IMPLEMENTATIONS
// ==========================================================================

async function apiDbStats() {
  const { yourlsUrl, apiSignature } = await H.getSettings();
  const base = H.sanitizeBaseUrl(yourlsUrl);
  const { res, json } = await yourlsFetch(base, { action: "stats", format: "json", signature: apiSignature });
  if (!res.ok || !json) throw new Error(browser.i18n.getMessage("errorStatsFailed"));
  return json;
}

async function apiStats(shortOrKeyword) {
  const { yourlsUrl, apiSignature } = await H.getSettings();
  const base = H.sanitizeBaseUrl(yourlsUrl);
  const kw = H.extractKeyword(base, shortOrKeyword);
  const { res, text, json } = await yourlsFetch(base, { action: "url-stats", format: "json", signature: apiSignature, shorturl: kw });
  if (!res.ok) {
    if (res.status === 404) throw new Error(browser.i18n.getMessage("popupErrorStatsNotFound"));
    throw new Error(`HTTP ${res.status}${text ? ": " + text.slice(0, 100) : ""}`);
  }
  return json;
}

async function apiShorten(longUrl, keyword, title) {
  const { yourlsUrl, apiSignature } = await H.getSettings();
  const base = H.sanitizeBaseUrl(yourlsUrl);
  if (!base || !apiSignature) throw new Error(browser.i18n.getMessage("errorNoSettings"));

  const payload = { action: "shorturl", format: "json", signature: apiSignature, url: longUrl };
  if (keyword) payload.keyword = keyword;
  if (title) payload.title = title;

  const { res, text, json } = await yourlsFetch(base, payload);

  if (json && /already exists/i.test(String(json.message || ""))) {
    let existingShortUrl = null;
    const match = String(json.message).match(/\(short URL: (https?:\/\/\S+)\)/i);
    existingShortUrl = match && match[1] ? match[1] : H.extractShort(json, base);
    toast(browser.i18n.getMessage("extensionName"), browser.i18n.getMessage("toastUrlExists"));
    return { ok: true, shortUrl: existingShortUrl, already: true };
  }

  const short = H.extractShort(json, base);
  if (res.ok && json && short) {
    toast(browser.i18n.getMessage("extensionName"), browser.i18n.getMessage("toastUrlCreated"));
    return { ok: true, shortUrl: short, already: false };
  }

  if (json?.status === "fail" && json.message) throw new Error(json.message);
  throw new Error(`HTTP ${res.status}${text ? (": " + text.slice(0, 200)) : ""}`);
}

async function apiDelete(shortOrKeyword) {
  const { yourlsUrl, apiSignature } = await H.getSettings();
  const base = H.sanitizeBaseUrl(yourlsUrl);
  const keyword = H.extractKeyword(base, shortOrKeyword);
  if (!keyword) throw new Error(browser.i18n.getMessage("errorEnterKeywordToDelete"));

  const payload = { action: "delete", format: "json", signature: apiSignature, shorturl: keyword };
  const { res, json } = await yourlsFetch(base, payload);

  const isSuccess = (j) => j && (j.status === "success" || /success.*deleted/i.test(j.message || "") || j.statusCode === 200);

  if (res.ok && isSuccess(json)) {
    toast(browser.i18n.getMessage("extensionName"), browser.i18n.getMessage("toastUrlDeleted"));
    return { ok: true };
  }

  const errorDetails = json?.message || json?.error || "";
  throw new Error(`Delete failed: HTTP ${res.status} ${errorDetails ? `- ${errorDetails}` : ''}`);
}

async function apiCheck() {
  const { yourlsUrl, apiSignature } = await H.getSettings();
  const base = H.sanitizeBaseUrl(yourlsUrl);
  if (!base || !apiSignature) {
    return { ok: false, reason: browser.i18n.getMessage("errorNoSettings") };
  }
  try {
    const { res, json } = await yourlsFetch(base, { action: "stats", format: "json", signature: apiSignature });
    if (res.ok && json) {
      const total = (json.total_links ?? json.stats?.total_links ?? "?");
      return { ok: true, total };
    }
  } catch (e) {
    return { ok: false, reason: String(e?.message || e) };
  }
  return { ok: false, reason: browser.i18n.getMessage("optionsStatusConnFailed") };
}

// ==========================================================================
// ADD-ON INTEGRATION & EVENT LISTENERS
// ==========================================================================

async function getUrlForAction(info) {
  // 1. Prioritize a link from a context menu click.
  if (info && info.linkUrl) {
    let link = info.linkUrl;
    try {
      const urlObject = new URL(link);
      for (const pattern of REDIRECT_PATTERNS) {
        if (urlObject.hostname.startsWith(pattern.host_prefix) && urlObject.pathname.startsWith(pattern.path)) {
          let realUrl = urlObject.searchParams.get(pattern.param);
          if (realUrl) {
            if (pattern.prefix_to_strip && realUrl.startsWith(pattern.prefix_to_strip)) {
              realUrl = realUrl.substring(pattern.prefix_to_strip.length);
            }
            link = realUrl;
            break;
          }
        }
      }
    } catch (e) {
      console.warn("Could not parse link for cleaning, falling back.", e);
    }
    return link;
  }

  // 2. Fall back to selected text.
  if (info && info.selectionText) {
    const match = info.selectionText.match(/https?:\/\/\S+/);
    if (match) return match[0];
  }

  // 3. For toolbar clicks or page context menu, query for the active tab.
  // This now works because of the "tabs" permission in the manifest.
  const [activeTab] = await browser.tabs.query({ active: true, currentWindow: true });
  if (activeTab && activeTab.url && !activeTab.url.startsWith('about:')) {
    return activeTab.url;
  }

  return '';
}

async function handleAction(tab, info) {
  browser.action.openPopup();
  const urlToShorten = await getUrlForAction(info);
  await browser.storage.local.remove(["yourls_prefill_long", "yourls_prefill_short"]);

  if (urlToShorten) {
    const { yourlsUrl } = await H.getSettings();
    const base = H.sanitizeBaseUrl(yourlsUrl);
    if (base && urlToShorten.startsWith(base)) {
      await browser.storage.local.set({ yourls_prefill_short: urlToShorten });
    } else {
      await browser.storage.local.set({ yourls_prefill_long: urlToShorten });
    }
  }
}

browser.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  (async () => {
    try {
      let response;
      switch (msg.type) {
        case "CHECK_CONNECTION":
          response = await apiCheck();
          break;
        case "SHORTEN_URL":
          response = await apiShorten(msg.longUrl, msg.keyword || "", msg.title || "");
          break;
        case "GET_STATS":
          response = { ok: true, data: await apiStats(msg.shortUrl) };
          break;
        case "DELETE_SHORTURL":
          response = await apiDelete(msg.shortUrl);
          break;
        case "GET_DB_STATS":
          response = { ok: true, data: await apiDbStats() };
          break;
        default:
          response = { ok: false, reason: "Unknown message type" };
      }
      sendResponse(response);
    } catch (e) {
      const message = String(e?.message || e);
      if (/keyword.*already exists/i.test(message)) {
        sendResponse({ ok: false, reason: browser.i18n.getMessage("errorKeywordExists") });
      } else {
        sendResponse({ ok: false, reason: message });
      }
    }
  })();
  return true;
});

// For toolbar clicks, info is null. For context menus, info is provided.
browser.action.onClicked.addListener((tab) => handleAction(tab, null));
browser.menus.onClicked.addListener((info, tab) => handleAction(tab, info));

// ==========================================================================
// SETUP & UTILITY FUNCTIONS
// ==========================================================================

function setupMenus() {
  browser.menus.removeAll(() => {
    browser.menus.create({ id: "yourls-shorten-page", title: browser.i18n.getMessage("menuItemShortenPage"), contexts: ["page"] });
    browser.menus.create({ id: "yourls-shorten-selection", title: browser.i18n.getMessage("menuItemShortenSelection"), contexts: ["selection"] });
    browser.menus.create({ id: "yourls-shorten-link", title: browser.i18n.getMessage("menuItemShortenLink"), contexts: ["link"] });
  });
}

function toast(title, message) {
  browser.notifications.create({
    type: "basic",
    title,
    message,
    iconUrl: "images/kurl-icon-48.png"
  });
}

async function yourlsFetch(baseUrl, payload) {
  const origin = new URL(baseUrl).origin;
  if (!(await browser.permissions.contains({ origins: [`${origin}/*`] }))) {
    throw new Error("Host permission was not granted.");
  }
  const endpoint = `${baseUrl}/yourls-api.php`;
  const params = H.toFormData(payload);

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      "Accept": "application/json"
    },
    body: params
  });

  const text = await res.text().catch(() => "");
  return { res, text, json: H.parseMaybeJson(text) };
}

browser.runtime.onInstalled.addListener(setupMenus);
browser.runtime.onStartup.addListener(setupMenus);
