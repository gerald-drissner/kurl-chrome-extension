"use strict";
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict'),crypto=require('crypto');
const root=path.join(__dirname,'..');
let creates=0,lookups=0,copies=[];let listener;
const events={addListener() {}};
const browser={
 i18n:{getMessage:()=>''},
 runtime:{getURL:p=>'chrome-extension://test/'+p,sendMessage:async msg=>{
   copies.push(msg);return {ok:true};},onMessage:{addListener(fn){listener=fn}},onInstalled:events,onStartup:events},
 menus:{onClicked:events},
 storage:{local:{get:async()=>({yourlsUrl:'https://sho.rt',apiSignature:'a',showCopyNotifications:true})}},
 action:{setBadgeText:async()=>{},setBadgeBackgroundColor:async()=>{}},
 notifications:{create:async()=>{}},
 permissions:{contains:async()=>true}
};
const chrome={
 runtime:{getURL:p=>'chrome-extension://test/'+p,getContexts:async()=>{lookups++;return [];}},
 offscreen:{createDocument:async()=>{creates++;await new Promise(r=>setTimeout(r,50));}}
};
const ctx=vm.createContext({browser,chrome,crypto:crypto.webcrypto,URL,URLSearchParams,
 AbortController,TextEncoder,TextDecoder,Uint8Array,console,setTimeout,clearTimeout,Promise,navigator:{}});
vm.runInContext(fs.readFileSync(path.join(root,'JS/helpers.js'),'utf8'),ctx);
vm.runInContext(fs.readFileSync(path.join(root,'JS/background.js'),'utf8'),ctx);
(async()=>{
 await Promise.all([
   vm.runInContext('copyShortUrl("https://sho.rt/a")',ctx),
   vm.runInContext('copyShortUrl("https://sho.rt/b")',ctx)
 ]);
 assert.equal(creates,1,'simultaneous copies should create one offscreen page');
 assert.equal(lookups,2);
 assert.deepEqual(copies.map(x=>x.text),['https://sho.rt/a','https://sho.rt/b']);
 assert(!Object.hasOwn(chrome.offscreen,'hasDocument'),'test explicitly models Chrome 116-149');
 console.log('PASS: Chrome 116 offscreen clipboard, concurrent creation, message delivery');
})().catch(e=>{console.error(e);process.exitCode=1});
