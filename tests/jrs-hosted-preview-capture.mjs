#!/usr/bin/env node
// JRS hosted capture. Intercept ONLY the immutable preview origin.
// Never put bypass credentials in URLs, Chrome flags, logs, or artifacts.
import {spawn} from 'node:child_process';
import {mkdtemp, mkdir, readFile, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function hold(s){throw Error('RELEASE HOLD: '+s)}
function origin(value){
  const u=new URL(value);
  if(u.protocol!=='https:'||u.username||u.password||u.port||u.search||u.hash||
     !['','/'].includes(u.pathname)||!/^jrsstandard(?:com)?-[a-z0-9-]+\.vercel\.app$/.test(u.hostname))
    hold('non-immutable or unsafe Vercel preview URL');
  return u.origin;
}
const sameOrigin=(url,host)=>{try{return new URL(url).origin===host}catch{return false}};
function selfTest(){
  const good='https://jrsstandard-e73rn31oo-phillip-wikes-projects.vercel.app';
  if(origin(good)!==good||!sameOrigin(good+'/index.html',good)||
     sameOrigin('https://www.google-analytics.com/collect',good)||
     sameOrigin(good+'.evil.com/',good))hold('origin-check regression');
  for(const b of ['http://jrsstandard-x.vercel.app','https://evil.vercel.app',good+'/?secret=1']){
    let rejected=false;try{origin(b)}catch{rejected=true}
    if(!rejected)hold('host-check regression');
  }
  console.log('PASS: hosted capture origin and credential isolation self-test');
}
async function capture(input,output,bypass,browser){
  const host=origin(input);
  if(!bypass||bypass.length<32||bypass.length>256||/[\r\n]/.test(bypass))
    hold('dedicated GitHub CI bypass secret missing or invalid');
  await mkdir(output,{recursive:true});
  const profile=await mkdtemp(path.join(tmpdir(),'jrs-cdp-'));
  let child,ws,seq=0,interceptError=null,documentStatus=null;
  const calls=new Map();
  const send=(method,params={},sessionId)=>new Promise((resolve,reject)=>{
    const id=++seq;
    const timer=setTimeout(()=>{calls.delete(id);reject(Error('Chrome protocol timeout'))},12000);
    calls.set(id,{resolve,reject,timer});
    ws.send(JSON.stringify({id,method,params,...(sessionId?{sessionId}:{})}));
  });
  try{
    child=spawn(browser,['--headless=new','--no-sandbox','--disable-gpu',
      '--disable-dev-shm-usage','--hide-scrollbars','--no-first-run',
      '--no-default-browser-check','--remote-debugging-port=0',
      '--user-data-dir='+profile,'about:blank'],{stdio:'ignore'});
    let active;
    for(let i=0;i<100;i++){
      try{active=await readFile(path.join(profile,'DevToolsActivePort'),'utf8');break}
      catch{if(child.exitCode!==null)hold('Chrome exited before debugging started');await sleep(100)}
    }
    if(!active)hold('Chrome debugging not available');
    const [port,route]=active.trim().split('\n');
    if(!/^\d+$/.test(port)||!route.startsWith('/devtools/browser/'))hold('unexpected Chrome debugger');
    ws=new WebSocket('ws://127.0.0.1:'+port+route);
    await new Promise((resolve,reject)=>{
      const t=setTimeout(()=>reject(Error('Chrome WebSocket timeout')),8000);
      ws.addEventListener('open',()=>{clearTimeout(t);resolve()},{once:true});
      ws.addEventListener('error',()=>{clearTimeout(t);reject(Error('Chrome WebSocket error'))},{once:true});
    });
    ws.addEventListener('message',e=>{
      let m;try{m=JSON.parse(e.data)}catch{return}
      if(m.id){
        const p=calls.get(m.id);if(!p)return;
        calls.delete(m.id);clearTimeout(p.timer);
        if(m.error)p.reject(Error(m.error.message||'CDP error'));else p.resolve(m.result||{});
        return;
      }
      if(m.method==='Fetch.requestPaused'){
        void(async()=>{
          const req=m.params.request;
          if(!sameOrigin(req.url,host)){
            await send('Fetch.continueRequest',{requestId:m.params.requestId},m.sessionId);return;
          }
          const headers=Object.entries(req.headers||{})
            .filter(([n])=>n.toLowerCase()!=='x-vercel-protection-bypass')
            .map(([name,value])=>({name,value:String(value)}));
          headers.push({name:'x-vercel-protection-bypass',value:bypass});
          await send('Fetch.continueRequest',{requestId:m.params.requestId,headers},m.sessionId);
        })().catch(e=>{interceptError=e});
      }
      if(m.method==='Network.responseReceived'&&m.params?.type==='Document'){
        documentStatus={url:m.params.response.url,status:m.params.response.status};
      }
    });
    const target=await send('Target.createTarget',{url:'about:blank'});
    const attached=await send('Target.attachToTarget',{targetId:target.targetId,flatten:true});
    const session=attached.sessionId;
    await send('Page.enable',{},session);
    await send('Runtime.enable',{},session);
    await send('Network.enable',{},session);
    await send('Network.setBlockedURLs',{urls:['*://www.google-analytics.com/*',
      '*://www.googletagmanager.com/*','*://analytics.google.com/*']},session);
    await send('Fetch.enable',{patterns:[{urlPattern:host+'/*',requestStage:'Request'}]},session);
    const shots=[
      ['/', 'verified-preview-home-desktop.png',1440,1200],
      ['/', 'verified-preview-home-mobile.png',390,1100],
      ['/resources.html','verified-preview-resources-desktop.png',1440,2000]
    ];
    for(const [route,file,width,height] of shots){
      documentStatus=null;
      await send('Emulation.setDeviceMetricsOverride',
        {width,height,deviceScaleFactor:1,mobile:width<600},session);
      const nav=await send('Page.navigate',{url:host+route},session);
      if(nav.errorText)hold('hosted browser navigation failed');
      let info;
      for(let j=0;j<70;j++){
        if(interceptError)hold('first-party authentication interception failed');
        await sleep(150);
        const r=await send('Runtime.evaluate',{expression:
          '({url:location.href,title:document.title,ready:document.readyState,body:(document.body?.innerText||"").slice(0,1000)})',
          returnByValue:true},session);
        info=r.result?.value;
        if(info?.ready==='complete'&&documentStatus)break;
      }
      if(!info||!sameOrigin(info.url,host)||!documentStatus||
         !sameOrigin(documentStatus.url,host)||documentStatus.status!==200||
         /Vercel Authentication|Log in to Vercel|Sign in to Vercel/i.test(info.title+' '+info.body)||
         !/JRS|Justification Review Standard|Practitioner Resources/i.test(info.title))
        hold('browser did not render authorized JRS preview page: '+route);
      await sleep(400);
      const shot=await send('Page.captureScreenshot',
        {format:'png',captureBeyondViewport:false,fromSurface:true},session);
      if(!shot.data)hold('missing hosted screenshot');
      const data=Buffer.from(shot.data,'base64');
      if(data.subarray(0,8).toString('hex')!=='89504e470d0a1a0a')
        hold('invalid hosted screenshot');
      await writeFile(path.join(output,file),data);
      console.log('PASS: hosted screenshot '+file+' sha256='+createHash('sha256').update(data).digest('hex').slice(0,16));
    }
  }finally{
    if(ws)ws.close();
    if(child)child.kill('SIGTERM');
    // Runner Chrome may briefly retain the profile after SIGTERM.
    try{await sleep(300);await rm(profile,{recursive:true,force:true,maxRetries:4,retryDelay:150})}catch{}
  }
}
try{
  if(process.argv[2]==='--self-test')selfTest();
  else{
    if(process.argv.length!==4)hold('expected PREVIEW_URL and OUTPUT_DIR');
    await capture(process.argv[2],process.argv[3],process.env.JRS_VERCEL_PREVIEW_BYPASS,process.env.JRS_BROWSER||'google-chrome');
  }
}catch(e){
  // Error messages never include headers or credential values.
  console.error(e.message?.startsWith('RELEASE HOLD:')?e.message:'RELEASE HOLD: hosted browser verification failed');
  process.exitCode=1;
}
