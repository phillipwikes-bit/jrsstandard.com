// Synthetic two-selection JRS print preflight. No real records are collected.
// Uses Chrome DevTools Protocol through Node's built-in WebSocket on loopback.
// NOT a PDF/UA test, nor a real-browser user accessibility witness.
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {readFile,writeFile,mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';

const url=process.argv[2],destination=process.argv[3];
if(url!=='http://127.0.0.1:8796/check.html'||!destination)
 throw Error('Usage: node tests/jrs-check-selected-print.mjs http://127.0.0.1:8796/check.html PDF_OUTPUT');
const chrome=process.env.JRS_BROWSER||'chromium';
const dir=await mkdtemp(join(tmpdir(),'jrs-check-selected-'));
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const pending=new Map();let id=0,ws,child;
function command(method,params={}){
 return new Promise((resolve,reject)=>{
  const callId=++id;pending.set(callId,{resolve,reject});
  ws.send(JSON.stringify({id:callId,method,params}));
 });
}
async function evaluate(expression){
 const response=await command('Runtime.evaluate',{expression,returnByValue:true});
 if(response.exceptionDetails||response.result?.subtype==='error')
  throw Error('Browser evaluation rejected');
 return response.result?.value;
}
try{
 child=spawn(chrome,[
  '--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage',
  '--no-first-run','--no-default-browser-check','--no-proxy-server',
  '--remote-allow-origins=*','--remote-debugging-address=127.0.0.1',
  '--remote-debugging-port=0','--user-data-dir='+dir,'about:blank'
 ],{stdio:'ignore'});
 let port;
 for(let n=0;n<120;n++){
  try{
   port=Number((await readFile(join(dir,'DevToolsActivePort'),'utf8')).split('\n')[0]);
   if(port>0)break;
  }catch{}
  await sleep(100);
 }
 assert.ok(port>0,'Chrome local debugging endpoint unavailable');
 let tab;
 for(let n=0;n<80;n++){
  try{
   const result=await fetch('http://127.0.0.1:'+port+'/json/list');
   tab=(await result.json()).find(item=>item.type==='page'&&item.webSocketDebuggerUrl);
   if(tab)break;
  }catch{}
  await sleep(100);
 }
 assert.ok(tab,'Chrome page endpoint unavailable');
 ws=new WebSocket(tab.webSocketDebuggerUrl);
 await new Promise((resolve,reject)=>{
  ws.addEventListener('open',resolve,{once:true});
  ws.addEventListener('error',reject,{once:true});
 });
 ws.addEventListener('message',event=>{
  let obj;try{obj=JSON.parse(event.data)}catch{return}
  if(!obj.id||!pending.has(obj.id))return;
  const entry=pending.get(obj.id);pending.delete(obj.id);
  if(obj.error)entry.reject(Error('Chrome command failed: '+obj.error.message));
  else entry.resolve(obj.result||{});
 });
 await command('Page.enable');await command('Runtime.enable');
 await command('Page.navigate',{url});
 let ready=false;
 for(let n=0;n<120;n++){
  ready=await evaluate("document.readyState!=='loading'&&document.querySelectorAll('input.sa[type=checkbox]').length===7&&!!document.querySelector('#sa-announcement')");
  if(ready)break;
  await sleep(100);
 }
 assert.ok(ready,'seven-point check did not become interactive');
 const state=await evaluate("(function(){var boxes=Array.from(document.querySelectorAll('input.sa[type=checkbox]'));boxes[0].checked=true;boxes[0].dispatchEvent(new Event('change',{bubbles:true}));boxes[2].checked=true;boxes[2].dispatchEvent(new Event('change',{bubbles:true}));var out=document.querySelector('#sa-out');return {count:boxes.filter(x=>x.checked).length,summary:out.innerText,live:document.querySelector('#sa-announcement').textContent,printButton:!!document.querySelector('#sa-print')};})()");
 assert.equal(state.count,2,'synthetic two-answer fixture incomplete');
 assert.match(state.summary,/Fluent groundlessness/);
 assert.match(state.summary,/Chronology collapse/);
 assert.match(state.summary,/2 checked questions warrant review/);
 assert.match(state.live,/The count is not a score/);
 assert.ok(state.printButton,'print button missing on selected state');
 const result=await command('Page.printToPDF',{
  printBackground:true,displayHeaderFooter:false,preferCSSPageSize:true
 });
 assert.ok(typeof result.data==='string'&&result.data.length>1200,'selected print PDF absent');
 const bytes=Buffer.from(result.data,'base64');
 assert.equal(bytes.toString('ascii',0,5),'%PDF-','print result invalid');
 await writeFile(destination,bytes);
 console.log('PASS: Chrome printed selected two-answer review with non-scoring disclosure.');
 console.log('LIMITATION: scripted printing, not screen-reader or tagged-PDF acceptance.');
}finally{
 try{ws?.close()}catch{}
 for(const entry of pending.values())entry.reject(Error('Chrome session closed'));
 try{child?.kill('SIGTERM')}catch{}
 await sleep(150);
 await rm(dir,{recursive:true,force:true,maxRetries:3,retryDelay:100});
}
