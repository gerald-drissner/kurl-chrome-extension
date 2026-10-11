"use strict";
const vm=require('node:vm'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
let onMessage, copied='', removed=0, selected=0;
const doc={
  body:{appendChild(node){this.node=node;}},
  createElement:()=>({value:'',style:{},setAttribute(){},focus(){},select(){selected++;},remove(){removed++;}}),
  execCommand(command){assert.equal(command,'copy');copied=this.body.node.value;return true;}
};
const chrome={runtime:{onMessage:{addListener:fn=>onMessage=fn}}};
const ctx=vm.createContext({chrome,document:doc,navigator:{clipboard:{writeText:async()=>{throw Error('Document not focused')}}},console});
vm.runInContext(fs.readFileSync(path.join(__dirname,'..','JS/offscreen.js'),'utf8'),ctx);
(async()=>{
  const result=await new Promise(resolve=>{
    assert.equal(onMessage({type:'KURL_OFFSCREEN_COPY',text:'https://sho.rt/x'}, {},resolve),true);
  });
  assert.equal(result.ok,true);
  assert.equal(copied,'https://sho.rt/x');assert.equal(removed,1);assert.equal(selected,1);
  console.log('PASS: offscreen unfocused clipboard fallback');
})().catch(e=>{console.error(e);process.exitCode=1});
