# kURL for Chrome / Chromium / Edge — 2.0.2 development preview

This is a **separate browser extension**, modernized using the tested kURL for Thunderbird 2.0.20 dashboard, security model, YOURLS API client, link search, bulk shortening and local logs. **Do not submit this preview to the store without live browser tests.**

## Features
- Full dashboard: two-way lookup (keyword/short URL → target and clicks; destination → existing short link via the optional server-side Helper), top and recent links, create and safely edit/delete links.
- Configurable HTTPS YOURLS connection with time-limited SHA-256 signatures, test-and-save setup, connection status and local optional notifications.
- Browser toolbar popup shortens the active page, allows custom keywords/titles, copying, link statistics and locally rendered/downloadable QR codes.
- Browser context menu shortens a selected URL, linked URL or current page and copies the result. It also preserves the earlier browser feature of unwrapping recognized Google, Bing, DuckDuckGo and YouTube redirect links when their embedded destination is a valid HTTP(S) URL. **On Chrome**, background clipboard access uses a minimal local offscreen document, not a remote service.
- Bulk shortening, local activity log (7 days/100 records) with TXT export, 10 locale directories, and RTL layouts.
- Optional YOURLS Helper 1.1.7 is provided as static PHP source to install on the user's YOURLS server. It is not executed in the browser.

## Upgrading
The existing Chrome Web Store listing remains linked to its installed extension ID. Connection settings `yourlsUrl`, `apiSignature` and `autoCopy` use the same storage keys as the old version. Re-test the connection after updating YOURLS, because API signatures may change.

**Permission change on update:** 2.x adds `clipboardWrite` (needed to copy the short link after a right-click; Chrome shows "Modify data you copy and paste"). Chrome disables an updated extension until the user accepts a newly added permission warning, so existing 1.0 users must re-enable kURL once. 2.x no longer requests `tabs`; the current page is read through `activeTab` when you click the kURL button.

**Chrome 148 and later** provide a native `browser` namespace. `JS/polyfill.js` is then skipped, so shared code must use names that exist natively in Chrome (for example `contextMenus`, reached through `browser.menus || browser.contextMenus`). `tests/native-namespace.cjs` covers this.

## Security notes
All API access is via HTTPS; raw signature tokens stay in local browser extension storage. The code rejects redirects and overlarge responses. User-selected host permissions are granted only after explicit setup. Clipboard/QR operations do not use third-party services. Do not claim full translations in all 10 languages; untranslated keys may fall back to English.

## Differences from Thunderbird
Thunderbird's message-reading, compose-editor insertion, QR attachment, `compose` and `messagesRead` APIs are *not* included. Browser page/link selection and copy replace them. The Chrome MV3 background is a service worker; Firefox uses background scripts.

## Local development
Run `node --check JS/*.js` file by file and execute all `node tests/*.cjs` scripts listed in `.github/workflows/ci.yml`. For Chrome, load the folder through `chrome://extensions` → Developer mode → Load unpacked. For Firefox, test as a temporary add-on through `about:debugging` → This Firefox → Load Temporary Add-on → select `manifest.json`.

Audit follow-up: safe Bing base64url link unwrapping, Google-host spoofing rejection and protection against overwriting settings edited during a connection test.

## Contact

For support and privacy questions, email [mail@drissner.media](mailto:mail@drissner.media), or open an issue in this repository.

## Dashboard footer (2.0.2 preview)

The dashboard displays the installed version dynamically and provides optional, user-clicked external links for contact and supporting development. No browser data or YOURLS credentials are sent to these sites by kURL; no donation is required for any feature.
