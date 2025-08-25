// Minimal browser.* polyfill for Chromium-based browsers.
(function () {
    if (typeof globalThis.browser !== "undefined") return;
    if (typeof chrome === "undefined") return;

    const asPromise = (fn, ctx) => (...args) =>
    new Promise((resolve, reject) => {
        try {
            fn.apply(ctx, [
                ...args,
                (result) => {
                    const err = chrome.runtime && chrome.runtime.lastError;
                    if (err) reject(new Error(err.message || String(err)));
                    else resolve(result);
                }
            ]);
        } catch (e) {
            reject(e);
        }
    });

    const b = {};

    b.i18n = chrome.i18n;

    b.storage = {
        local: {
            get: asPromise(chrome.storage.local.get, chrome.storage.local),
 set: asPromise(chrome.storage.local.set, chrome.storage.local),
 remove: asPromise(chrome.storage.local.remove, chrome.storage.local)
        }
    };

    if (chrome.permissions) {
        b.permissions = {
            request: asPromise(chrome.permissions.request, chrome.permissions),
 contains: asPromise(chrome.permissions.contains, chrome.permissions),
 remove: asPromise(chrome.permissions.remove, chrome.permissions)
        };
    }

    b.runtime = {
        onMessage: chrome.runtime.onMessage,
        onInstalled: chrome.runtime.onInstalled,
        onStartup: chrome.runtime.onStartup,
        sendMessage: (msg) =>
        new Promise((resolve, reject) => {
            try {
                chrome.runtime.sendMessage(msg, (response) => {
                    const err = chrome.runtime && chrome.runtime.lastError;
                    if (err) reject(new Error(err.message || String(err)));
                    else resolve(response);
                });
            } catch (e) {
                reject(e);
            }
        })
    };

    b.action = {
        onClicked: chrome.action.onClicked,
        openPopup: () => { try { chrome.action.openPopup(); } catch {} return Promise.resolve(); },
 setPopup: chrome.action.setPopup,
 setTitle: chrome.action.setTitle,
 setIcon: chrome.action.setIcon
    };

    b.notifications = {
        create: (...args) => chrome.notifications.create(...args)
    };

    b.menus = chrome.contextMenus || chrome.menus;
    b.tabs = chrome.tabs;

    globalThis.browser = b;
})();
