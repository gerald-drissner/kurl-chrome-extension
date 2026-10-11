"use strict";
// Chrome 148+ defines a native `browser` namespace whose objects are the `chrome`
// objects: contextMenus exists, menus does not, and polyfill.js is skipped.
// The 2.0.0 preview threw at startup here ("reading 'onClicked'"), so the service
// worker never answered any message. This test runs the real worker scripts.
const vm=require('node:vm'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.join(__dirname,'..');
const created=[];let clickListener=null,installed=null,messageListener=null;
const ev=()=>({addListener(){}});
const chrome={
  i18n:{getMessage:()=>'',getUILanguage:()=>'en'},
  runtime:{onInstalled:{addListener:fn=>{installed=fn;}},onStartup:ev(),onMessage:{addListener:fn=>{messageListener=fn;}},
    getURL:p=>'chrome-extension://id/'+p,getContexts:async()=>[],sendMessage:async()=>({ok:true})},
  storage:{local:{get:async()=>({}),set:async()=>{},remove:async()=>{}},onChanged:ev()},
  permissions:{contains:async()=>true},
  contextMenus:{create:item=>{created.push(item.id);return item.id;},remove:async()=>{},onClicked:{addListener:fn=>{clickListener=fn;}}},
  action:{setBadgeText:async()=>{},setBadgeBackgroundColor:async()=>{}},
  notifications:{create:async()=>'n'},
  offscreen:{createDocument:async()=>{}}
};
const context={chrome,browser:chrome,console,URL,URLSearchParams,TextEncoder,TextDecoder,Uint8Array,AbortController,
  setTimeout,clearTimeout,Promise,atob,crypto:require('node:crypto').webcrypto};
context.globalThis=context;vm.createContext(context);
for (const file of ['JS/polyfill.js','JS/helpers.js','JS/background.js'])
  vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),context,{filename:file});
assert.equal(context.browser,chrome,'polyfill must leave a native browser namespace untouched');
assert.equal(typeof clickListener,'function','context-menu click listener must be registered via contextMenus');
assert.equal(typeof messageListener,'function','message listener must be registered');
(async()=>{
  installed({reason:'install'});
  await vm.runInContext('menuInit',context);
  assert.deepEqual(created,['kurl-browser-copy','kurl-browser-page']);
  const reply=await new Promise(resolve=>assert.equal(messageListener({type:'GET_LOG'},{},resolve),true));
  assert.equal(reply.ok,true);
  console.log('PASS: Chrome 148+ native browser namespace (contextMenus, no menus, no polyfill)');
})().catch(e=>{console.error(e);process.exitCode=1});
