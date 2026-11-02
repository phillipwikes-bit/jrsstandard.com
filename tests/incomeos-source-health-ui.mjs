import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";
const nodes=new Map();
function node(id){
  if(!nodes.has(id))nodes.set(id,{id,children:[],prepend(x){this.children.unshift(x);},remove(){nodes.delete(this.id);}});
  return nodes.get(id);
}
node("capital-readiness-results");
const listeners={};
const document={
  readyState:"complete",
  getElementById(id){return nodes.get(id)||null;},
  createElement(tag){return {tag,textContent:"",className:"",id:""};},
  addEventListener(type,fn){listeners[type]=fn;}
};
const window={IncomeOSSourceHealth:{assess(sources){assert.deepEqual(sources,[]);return {status:"HOLD"};}}};
const context={document,window,queueMicrotask:fn=>fn()};
vm.runInNewContext(readFileSync(new URL("../owner/incomeos/source-health-ui.js",import.meta.url),"utf8"),context);
const first=node("capital-readiness-results").children[0];
assert.equal(first.id,"source-health-display");
assert.match(first.textContent,/HOLD/);
assert.match(first.textContent,/cannot be established/);
assert.equal(nodes.get("capital-readiness-results").children.length,1);
console.log("IncomeOS source health UI staging test passed");
