/* Promise-compatible API facade for Chrome MV3 extension pages and service workers. */
(() => {
  "use strict";
  if (typeof globalThis.browser !== "undefined") return;
  if (typeof chrome === "undefined") throw new Error("Chrome APIs are unavailable");
  const wrap = (obj, name) => (...args) => new Promise((resolve, reject) => {
    try { obj[name](...args, value => {
      const err = chrome.runtime.lastError;
      if (err) reject(new Error(err.message)); else resolve(value);
    }); } catch (error) { reject(error); }
  });
  globalThis.browser = {
    i18n: chrome.i18n,
    storage: { local: {
      get: wrap(chrome.storage.local, "get"),
      set: wrap(chrome.storage.local, "set"),
      remove: wrap(chrome.storage.local, "remove")
    }, onChanged: chrome.storage.onChanged },
    permissions: {
      request: wrap(chrome.permissions, "request"),
      contains: wrap(chrome.permissions, "contains"),
      remove: wrap(chrome.permissions, "remove")
    },
    runtime: {
      onInstalled: chrome.runtime.onInstalled,
      onStartup: chrome.runtime.onStartup,
      onMessage: chrome.runtime.onMessage,
      getURL: chrome.runtime.getURL.bind(chrome.runtime),
      sendMessage: wrap(chrome.runtime, "sendMessage")
    },
    menus: {
      onClicked: chrome.contextMenus.onClicked,
      create: wrap(chrome.contextMenus, "create"),
      remove: wrap(chrome.contextMenus, "remove")
    },
    tabs: {
      query: wrap(chrome.tabs, "query"),
      create: wrap(chrome.tabs, "create"),
      get: wrap(chrome.tabs, "get")
    },
    action: {
      setBadgeText: wrap(chrome.action, "setBadgeText"),
      setBadgeBackgroundColor: wrap(chrome.action, "setBadgeBackgroundColor")
    },
    notifications: { create: (...args) => new Promise((resolve, reject) => {
      chrome.notifications.create(...args, id => {
        const err = chrome.runtime.lastError;
        if (err) reject(new Error(err.message)); else resolve(id);
      });
    }) },
    commands: { getAll: wrap(chrome.commands, "getAll") }
  };
})();
