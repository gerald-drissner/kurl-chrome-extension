/* Chrome service worker clipboard bridge; no network or DOM manipulation. */
chrome.runtime.onMessage.addListener((message, sender, respond) => {
  if (message?.type !== "KURL_OFFSCREEN_COPY") return false;
  navigator.clipboard.writeText(String(message.text || ""))
    .then(() => respond({ok:true}), error => respond({ok:false,reason:String(error?.message||error)}));
  return true;
});
