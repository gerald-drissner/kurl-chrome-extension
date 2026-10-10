/* Chrome MV3 clipboard bridge. Only a local text copy; no network requests. */
"use strict";
async function copyText(text) {
  // Clipboard API can reject writes from an unfocused offscreen document.
  if (navigator.clipboard?.writeText) {
    try { await navigator.clipboard.writeText(text); return; }
    catch { /* Use Chrome's supported offscreen document fallback. */ }
  }
  const field = document.createElement("textarea");
  field.value = text;
  field.setAttribute("aria-hidden", "true");
  Object.assign(field.style, {position:"fixed",opacity:"0",pointerEvents:"none"});
  document.body.appendChild(field);
  try {
    field.focus();field.select();
    if (!document.execCommand("copy")) throw new Error("Clipboard access was denied.");
  } finally {field.remove();}
}
chrome.runtime.onMessage.addListener((message, sender, respond) => {
  if (message?.type !== "KURL_OFFSCREEN_COPY") return false;
  copyText(String(message.text || ""))
    .then(() => respond({ok:true}), error => respond({ok:false,reason:String(error?.message||error)}));
  return true;
});
