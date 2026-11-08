// Browser round trip of the private vault against an intercepted fake Supabase (simulated Chromium, iPhone width).
// SYNTHETIC DATA ONLY; the real project is never contacted. Checks that only ciphertext leaves the page.
import assert from "node:assert/strict";
import {createServer} from "node:http";
import {readFileSync,existsSync} from "node:fs";
import {join,extname} from "node:path";
import {createRequire} from "node:module";
const require=createRequire(import.meta.url);
let chromium,devices;
try{({chromium,devices}=require("playwright"));}
catch{try{({chromium,devices}=require("playwright-core"));}
  catch{if(process.env.CI){console.error("playwright-core is required in CI");process.exit(1);}console.log("SKIPPED: playwright not installed");process.exit(0);}}
const launchOptions=process.env.INCOMEOS_BROWSER?{executablePath:process.env.INCOMEOS_BROWSER,args:["--no-sandbox"]}:{};
const root=new URL("../owner/incomeos/",import.meta.url).pathname;
const types={".html":"text/html",".js":"text/javascript",".css":"text/css",".json":"application/json",".svg":"image/svg+xml",".webmanifest":"application/manifest+json"};
const server=createServer((req,res)=>{const p=join(root,decodeURIComponent(req.url.split("?")[0]).replace(/^\/+/,"")||"index.html");
  if(!p.startsWith(root)||!existsSync(p)){res.writeHead(404);res.end();return;}
  res.writeHead(200,{"content-type":types[extname(p)]||"application/octet-stream"});res.end(readFileSync(p));}).listen(0,"127.0.0.1");
await new Promise(r=>server.once("listening",r));
const origin=`http://127.0.0.1:${server.address().port}`,VAULT="https://pmvqxdgvnwhckzxojioa.supabase.co";
const browser=await chromium.launch(launchOptions);
const ctx=await browser.newContext({...devices["iPhone SE"]});
const sent=[],rows=[],external=[];
let holdNextUpload=false,releaseHeldUpload=null;
const cors={"access-control-allow-origin":origin,"access-control-allow-headers":"apikey,authorization,content-type,prefer","access-control-allow-methods":"GET,POST,OPTIONS","content-type":"application/json"};
await ctx.route(VAULT+"/**",async route=>{
  const r=route.request(),u=new URL(r.url());
  if(r.method()==="OPTIONS")return route.fulfill({status:204,headers:cors});
  sent.push({path:u.pathname,body:r.postData()||""});
  if(u.pathname==="/auth/v1/token"){const b=JSON.parse(r.postData());
    return route.fulfill({status:b.password==="synthetic vault pw"?200:400,headers:cors,body:JSON.stringify(b.password==="synthetic vault pw"?{access_token:"tok",user:{id:"u-1",email:b.email}}:{error_description:"Invalid login credentials"})});}
  if(u.pathname==="/rest/v1/incomeos_vault"){
    if(r.method()==="POST"){
      rows.unshift({id:rows.length+1,...JSON.parse(r.postData()),saved_at:"2026-11-05T12:00:00Z"});
      if(holdNextUpload){
        holdNextUpload=false;
        releaseHeldUpload=()=>route.fulfill({status:201,headers:cors,body:""});
        return;
      }
      return route.fulfill({status:201,headers:cors,body:""});
    }
    return route.fulfill({status:200,headers:cors,body:JSON.stringify(rows.slice(0,1))});}
  return route.fulfill({status:404,headers:cors,body:"{}"});
});
const page=await ctx.newPage();const errors=[];page.on("pageerror",e=>errors.push(String(e)));page.on("dialog",d=>d.accept());
page.on("request",r=>{const u=r.url();if(!u.startsWith(origin)&&!u.startsWith(VAULT)&&!u.startsWith("blob:")&&!u.startsWith("data:"))external.push(u);});
await page.goto(origin+"/index.html");
const nav=v=>page.locator(`.bottomnav button[data-view="${v}"]`).click();
const vault=async()=>{await nav("research");if((await page.locator("#cloud-vault-panel").getAttribute("open"))===null)await page.locator("#cloud-vault-panel summary").tap();};
await nav("research");await page.locator("#briefing-new").tap();
await nav("ledger");
await page.locator("#receipt-label").fill("Synthetic vault payout");await page.locator("#receipt-amount").fill("321");
await page.locator("#receipt-date").fill("2026-10-20");await page.locator("#receipt-state").selectOption("paid");await page.locator("#receipt-save").tap();
await vault();
assert.ok(await page.locator("#cloud-vault-save").isDisabled(),"save needs sign-in");
await page.locator("#cloud-vault-email").fill("owner@example.org");await page.locator("#cloud-vault-password").fill("wrong password 99");
await page.locator("#cloud-vault-signin").tap();
await page.waitForFunction(()=>/Invalid login credentials/.test(document.getElementById("cloud-vault-status").textContent));
await page.locator("#cloud-vault-password").fill("synthetic vault pw");await page.locator("#cloud-vault-signin").tap();
await page.waitForFunction(()=>/Signed in/.test(document.getElementById("cloud-vault-status").textContent));
assert.equal(await page.locator("#cloud-vault-password").inputValue(),"","password cleared after sign-in");
// Without a passphrase nothing is sent.
const before=sent.length;
await page.locator("#cloud-vault-save").tap();
await page.waitForFunction(()=>/passphrase of at least 16/.test(document.getElementById("cloud-vault-status").textContent));
assert.equal(sent.length,before,"no upload without encryption");
await page.locator("#briefing-passphrase").fill("synthetic passphrase for tests");
await page.locator("#cloud-vault-save").tap();
await page.waitForFunction(()=>/saved to your private vault/.test(document.getElementById("cloud-vault-status").textContent),null,{timeout:30000});
const up=sent.find(s=>s.path==="/rest/v1/incomeos_vault"&&s.body);
assert.ok(up,"an upload happened");
for(const s of sent)assert.doesNotMatch(s.body,/Synthetic vault payout|synthetic passphrase/,"no readable record or passphrase leaves the page");
assert.deepEqual(Object.keys(JSON.parse(up.body)).sort(),["ciphertext","format","sha256"]);
// Regression: an upload can complete AFTER the owner replaces the workspace.
// The old successful upload must not clear the new workspace's unsaved state.
holdNextUpload=true;
await page.locator("#briefing-passphrase").fill("synthetic passphrase for tests");
await page.locator("#cloud-vault-save").tap();
await page.waitForFunction(()=>/Saving encrypted copy/.test(document.getElementById("cloud-vault-status").textContent),null,{timeout:30000});
for(let i=0;i<60&&!releaseHeldUpload;i++)await new Promise(resolve=>setTimeout(resolve,100));
assert.ok(releaseHeldUpload,"the fake vault upload is paused after encryption");
assert.equal(await page.locator("#cloud-vault-save").isDisabled(),true,"overlapping vault uploads must be disabled");
await nav("research");
await page.locator("#briefing-new").tap();
assert.match(await page.locator("#briefing-status").textContent(),/New empty workspace/);
await releaseHeldUpload();
await page.waitForFunction(()=>/earlier workspace version was saved to the vault/.test(document.getElementById("briefing-status").textContent),null,{timeout:30000});
assert.match(await page.locator("#briefing-status").textContent(),/Changes made during that save are not included/);
assert.equal(await page.locator("#cloud-vault-save").isDisabled(),false,"save is available again after the upload");
assert.ok(sent.filter(s=>s.path==="/rest/v1/incomeos_vault"&&s.body).length===2,"the in-flight request remained a single upload");
// A new local workspace was NOT inadvertently declared saved; a reload may
// still retrieve the earlier encrypted snapshot from the fake vault.

// Reload: nothing remains in the page; sign in again and restore.
await page.reload();
assert.equal(await page.evaluate(()=>localStorage.length+sessionStorage.length),0,"nothing in browser storage");
await vault();
assert.ok(await page.locator("#cloud-vault-restore").isDisabled(),"signed out after reload");
await page.locator("#cloud-vault-email").fill("owner@example.org");await page.locator("#cloud-vault-password").fill("synthetic vault pw");await page.locator("#cloud-vault-signin").tap();
await page.waitForFunction(()=>/Signed in/.test(document.getElementById("cloud-vault-status").textContent));
await page.locator("#briefing-passphrase").fill("synthetic passphrase for tests");
await page.locator("#cloud-vault-restore").tap();
await page.waitForFunction(()=>/Opened the vault copy saved 2026-11-05 12:00/.test(document.getElementById("cloud-vault-status").textContent),null,{timeout:30000});
await nav("ledger");await page.locator("#report-year").fill("2026");await page.locator("#report-year").dispatchEvent("change");
assert.match(await page.locator("#ledger-list").textContent(),/Synthetic vault payout/,"record restored from the vault");
// A pending encrypted restore must never replace an owner workspace created
// while decryption is in flight. Dispatch then create synchronously in the same
// browser turn so the race is reproducible, not dependent on crypto timing.
const staleRestore=await page.evaluate(async encrypted=>{
  const done=new Promise(resolve=>{
    document.dispatchEvent(new CustomEvent("incomeos:vault-open",{detail:{text:encrypted,done:resolve}}));
  });
  document.getElementById("briefing-new").click();
  return done;
},rows[0].ciphertext);
assert.equal(staleRestore.ok,false,"outdated restore must be refused");
assert.match(staleRestore.error,/Workspace changed during file restore/);
await nav("ledger");
assert.doesNotMatch(await page.locator("#ledger-list").textContent(),/Synthetic vault payout/,
  "new workspace must not be overwritten by a stale decrypted vault copy");
assert.match(await page.locator("#briefing-status").textContent(),/New empty workspace/);

// Logout during local PBKDF2/AES restoration must not install a decrypted
// workspace or report success, even though the encrypted GET has completed.
// A second listener signs out synchronously after the workspace listener has
// started its asynchronous decryption. No fake service or real account is used.
await vault();
await page.evaluate(()=>document.addEventListener("incomeos:vault-open",
  ()=>window.IncomeOSVaultCloud.signOut(),{once:true}));
await page.locator("#cloud-vault-restore").tap();
await page.waitForFunction(()=>/Vault session changed during workspace operation/.test(
  document.getElementById("cloud-vault-status").textContent),null,{timeout:30000});
await nav("ledger");
assert.doesNotMatch(await page.locator("#ledger-list").textContent(),/Synthetic vault payout/,
  "Owner sign-out during decryption cannot restore a stale plaintext workspace");
assert.equal(await page.evaluate(()=>window.IncomeOSVaultCloud.signedIn()),false);
assert.equal(await page.locator("#briefing-passphrase").inputValue(),"",
  "Vault logout must clear the retained local encryption passphrase");
await vault();
await page.locator("#cloud-vault-email").fill("owner@example.org");
await page.locator("#cloud-vault-password").fill("synthetic vault pw");
await page.locator("#cloud-vault-signin").tap();
await page.waitForFunction(()=>/Signed in/.test(document.getElementById("cloud-vault-status").textContent));
// Logout during local AES encryption must prevent the browser-to-vault POST.
await page.locator("#briefing-passphrase").fill("synthetic passphrase for tests");
const beforeLogoutUpload=sent.filter(x=>x.path==="/rest/v1/incomeos_vault"&&x.body).length;
await page.evaluate(()=>document.addEventListener("incomeos:vault-encrypt",
  ()=>window.IncomeOSVaultCloud.signOut(),{once:true}));
await page.locator("#cloud-vault-save").tap();
await page.waitForFunction(()=>/Vault session changed during workspace operation/.test(
  document.getElementById("cloud-vault-status").textContent),null,{timeout:30000});
assert.equal(sent.filter(x=>x.path==="/rest/v1/incomeos_vault"&&x.body).length,beforeLogoutUpload,
  "Owner sign-out during encryption cannot submit a vault copy");
await page.locator("#cloud-vault-email").fill("owner@example.org");
await page.locator("#cloud-vault-password").fill("synthetic vault pw");
await page.locator("#cloud-vault-signin").tap();
await page.waitForFunction(()=>/Signed in/.test(document.getElementById("cloud-vault-status").textContent));

// Fast, deterministic simulation of a local crypto operation that completes
// AFTER the browser vault's handoff deadline. No 15-second wall-clock sleep is
// required: only the local test's 15,000 ms deadline is accelerated.
const holdLocalCrypto=async()=>{
  await page.evaluate(()=>{
    const nativeDerive=SubtleCrypto.prototype.deriveKey;
    const nativeTimer=window.setTimeout;
    const marker={started:false,completed:false,release:null,restore:null};
    window.__incomeosHeldCrypto=marker;
    SubtleCrypto.prototype.deriveKey=function(...args){
      marker.started=true;
      const subtle=this;
      return new Promise((resolve,reject)=>{
        marker.release=()=>{
          nativeDerive.apply(subtle,args).then(resolve,reject).finally(()=>{marker.completed=true;});
        };
      });
    };
    marker.restore=()=>{
      SubtleCrypto.prototype.deriveKey=nativeDerive;
      window.setTimeout=nativeTimer;
    };
    window.setTimeout=function(fn,ms,...args){
      return nativeTimer(fn,ms===15000?80:ms,...args);
    };
  });
};
const releaseLocalCrypto=async()=>{
  const started=await page.evaluate(()=>window.__incomeosHeldCrypto?.started===true);
  assert.equal(started,true,"Local AES key derivation must actually be held");
  await page.evaluate(()=>{
    const marker=window.__incomeosHeldCrypto;
    marker.restore();
    marker.release();
  });
  await page.waitForFunction(()=>window.__incomeosHeldCrypto?.completed===true,null,{timeout:30000});
  await page.waitForTimeout(50);
};
await vault();
await page.locator("#briefing-passphrase").fill("synthetic passphrase for tests");
await holdLocalCrypto();
await page.locator("#cloud-vault-restore").tap();
await page.waitForFunction(()=>/Workspace handoff timed out/.test(
  document.getElementById("cloud-vault-status").textContent),null,{timeout:10000});
await releaseLocalCrypto();
await nav("ledger");
assert.doesNotMatch(await page.locator("#ledger-list").textContent(),/Synthetic vault payout/,
  "A late decrypt cannot replace a newer owner workspace after the handoff times out");
await vault();
// Clear the previous restore error so this assertion cannot match a stale
// status before the second, independent timeout has actually fired.
await page.evaluate(()=>{document.getElementById("cloud-vault-status").textContent="Synthetic save deadline test initialized";});
const beforeExpiredSave=sent.filter(x=>x.path==="/rest/v1/incomeos_vault"&&x.body).length;
await holdLocalCrypto();
await page.locator("#cloud-vault-save").tap();
await page.waitForFunction(()=>window.__incomeosHeldCrypto?.started===true);
await page.waitForFunction(()=>/Workspace handoff timed out/.test(
  document.getElementById("cloud-vault-status").textContent),null,{timeout:10000});
await releaseLocalCrypto();
assert.equal(sent.filter(x=>x.path==="/rest/v1/incomeos_vault"&&x.body).length,beforeExpiredSave,
  "A late encrypted workspace handoff must never upload after its deadline");
assert.equal(await page.evaluate(()=>localStorage.length+sessionStorage.length),0,
  "Expired cryptographic operations must not fall back to browser storage");

// A hostile or corrupted hosted response larger than the accepted encrypted-workspace limit
// must be refused before hashing, decrypting, or replacing the current workspace.
rows[0].ciphertext="x".repeat(5000001);
await vault();await page.locator("#cloud-vault-restore").tap();
await page.waitForFunction(()=>/exceeds the 5 MB encrypted workspace limit/.test(document.getElementById("cloud-vault-status").textContent));
await nav("ledger");
assert.doesNotMatch(await page.locator("#ledger-list").textContent(),/Synthetic vault payout/,"oversized hosted response must not replace workspace");
// Restore the last legitimate ciphertext before testing tamper detection.
rows[0].ciphertext=JSON.parse(up.body).ciphertext;

// A tampered vault copy is refused.
rows[0].ciphertext=rows[0].ciphertext.replace(/"data":"(.)/,(m,c)=>'"data":"'+(c==="A"?"B":"A"));
await vault();await page.locator("#cloud-vault-restore").tap();
await page.waitForFunction(()=>/integrity check/.test(document.getElementById("cloud-vault-status").textContent));
assert.ok(await page.evaluate(w=>document.documentElement.scrollWidth<=w,page.viewportSize().width),"no horizontal overflow");
assert.equal(await page.evaluate(()=>localStorage.length+sessionStorage.length),0);
assert.deepEqual(external,[]);assert.deepEqual(errors,[]);
await browser.close();server.close();
console.log("IncomeOS vault browser QA passed: sign-in in memory, no upload without a passphrase, only ciphertext sent, reload then restore brings records back, tampered copy refused.");
