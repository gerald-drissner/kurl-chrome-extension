const vm=require('node:vm'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const make=(value)=>function(...args){const cb=args.at(-1);if(typeof cb==='function')cb(value)};
const events=()=>({addListener:()=>{}});
const chrome={
 runtime:{onInstalled:events(),onStartup:events(),onMessage:events(),getURL:p=>'chrome-extension://id/'+p,
   sendMessage:make({ok:true}),lastError:null},
 i18n:{getMessage:()=>'',getUILanguage:()=> 'en'},
 storage:{local:{get:make({token:'ok'}),set:make(),remove:make()},onChanged:events()},
 permissions:{contains:make(true),request:make(true),remove:make(true)},
 contextMenus:{onClicked:events(),create:make(1),remove:make()},
 tabs:{query:make([{url:'https://example.com'}]),create:make({id:7}),get:make({id:7})},
 action:{setBadgeText:make(),setBadgeBackgroundColor:make()},
 notifications:{create:make('kurl-notification')},
 commands:{getAll:make([])}
};
const context=vm.createContext({chrome,Promise,console});
const file=path.join(__dirname,'..','JS/polyfill.js');
vm.runInContext(fs.readFileSync(file,'utf8'),context);
(async()=>{
 const b=context.browser;
 assert.equal((await b.storage.local.get('token')).token,'ok');
 assert.equal(await b.permissions.request({origins:['https://example.com/*']}),true);
 assert.equal((await b.runtime.sendMessage({type:'PING'})).ok,true);
 assert.equal((await b.tabs.query({active:true}))[0].url,'https://example.com');
 await b.menus.create({id:'x'});
 await b.action.setBadgeText({text:'✓',tabId:7});
 assert.equal(await b.notifications.create({title:'kURL',message:'copied'}),'kurl-notification');
 console.log('PASS: Chrome callback-to-Promise API adapter');
})().catch(e=>{console.error(e);process.exitCode=1});
