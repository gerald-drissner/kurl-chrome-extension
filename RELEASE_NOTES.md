## 2.0.2 — Dashboard version, contact and voluntary support

- The dashboard now shows the installed kURL version dynamically from the extension manifest.
- Added localized Contact and optional Support development links. External links open only after an explicit click; all features remain free.
- No new permissions or changes to the Chrome 148+ compatibility fix, YOURLS authentication, the optional server-side Helper or browser data handling.

The 2.0.1 and 2.0.0 changes below remain included in 2.0.2.

# kURL Chrome 2.0.1 — development preview

Fixes after review of the 2.0.0 preview:

- Chrome 148 and later: the background service worker no longer fails at startup. Chrome's native `browser` namespace has `contextMenus` but no `menus`; 2.0.0 never answered the popup, dashboard or settings there.
- The Logs page works on Chrome 116–147 (it loaded without the API adapter).
- Right-click copy uses the supported offscreen-document fallback (`document.execCommand("copy")`); 2.0.0 failed with "Document is not focused".
- The activity log again records created, deleted, looked-up, edited and regenerated links (type and status only, never URLs), as in Thunderbird.
- Bing redirect links are decoded (base64url after `a1`), and Google `/url?q=` links are unwrapped.
- The `tabs` permission was removed (`activeTab` is sufficient). 16, 32 and 128 px icons were added (the Chrome Web Store requires 128 px).
- URLs and dates keep left-to-right order in Arabic and Hebrew. Untranslated context-menu entries and Thunderbird-specific wording were corrected; the popup no longer replaces "URL already shortened." with the copy confirmation.
- The Helper source link points to an immutable commit; legacy 1.x prefill values are deleted on update.

## 2.0.0

This major rewrite brings the Thunderbird kURL 2.0.20 dashboard and security model to Chrome / Chromium browsers, while retaining browser-native toolbar and context-menu behavior.

- Complete YOURLS dashboard with most-clicked and recent links, link counts and click statistics.
- Two-way lookup of short URLs and their destinations using the optional YOURLS Helper.
- Create, inspect, copy, update, regenerate and safely delete links, with confirmation.
- Browser toolbar popup for the active page, custom keywords/titles, click statistics and locally generated QR images.
- Context-menu shortening and copying of selected URLs, links or the current page.
- Bulk URL processing and bounded local activity log with pagination and TXT export.
- HTTPS-only YOURLS connection with short-lived SHA-256 API signatures and test-before-save setup.
- Configurable copy confirmations and localized error messages; RTL layout improvements.

**No automatic update of store listings**: this is a development preview awaiting full browser GUI tests and store validation. A configured YOURLS server and API token are required. Advanced editing and deletion require optional kURL Helper 1.1.6+ installed on the YOURLS server.
