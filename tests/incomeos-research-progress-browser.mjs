// Browser check that study progress (Applied, Paid ...) works in the hosted staging mode: it is enabled once a
// workspace is open, recorded in the workspace file, survives an encrypted save and reopen, and never touches
// browser storage. Synthetic study data from the page's own public sample only.
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
const browser=await chromium.launch(launchOptions);
const ctx=await browser.newContext({...devices["iPhone 13"],acceptDownloads:true});
const page=await ctx.newPage();const errors=[];page.on("pageerror",e=>errors.push(String(e)));
page.on("dialog",d=>d.accept());
const base=`http://127.0.0.1:${server.address().port}/index.html`;
const nav=v=>page.locator(`.bottomnav button[data-view="${v}"]`).click();
const firstSelect=()=>page.locator('select[aria-label^="Owner progress for "]').first();

await page.goto(base);await nav("research");
await firstSelect().waitFor();
assert.ok(await firstSelect().isDisabled(),"locked until a workspace is open");
assert.match(await firstSelect().getAttribute("title"),/Open or start your workspace/);
// Start a workspace: progress becomes available and is recorded in the workspace.
await page.locator("#briefing-new").tap();
await firstSelect().waitFor();assert.ok(await firstSelect().isEnabled(),"enabled with a workspace open");
const label=await firstSelect().getAttribute("aria-label");
await firstSelect().selectOption("Applied");
await page.waitForFunction(()=>/Study progress saved in your workspace: Applied/.test(document.getElementById("briefing-status").textContent));
// Marking it paid offers "Record this payment in Income": the Income form is filled for review, saved once, and a
// second press opens the existing record instead of creating another.
{const card=page.locator("article.radar-card",{has:page.locator(`select[aria-label="${label}"]`)});
 assert.equal(await card.getByRole("button",{name:"Record this payment in Income"}).count(),0,"not offered before Paid");
 await page.locator(`select[aria-label="${label}"]`).selectOption("Paid (self-reported)");
 const rec=page.locator("article.radar-card",{has:page.locator(`select[aria-label="${label}"]`)}).getByRole("button",{name:"Record this payment in Income"});
 await rec.click();
 assert.ok(await page.locator("#view-ledger").isVisible(),"goes to Income");
 const title=label.replace(/^Owner progress for /,"");
 assert.equal(await page.locator("#receipt-label").inputValue(),title.slice(0,100));
 assert.equal(await page.locator("#receipt-category").inputValue(),"research");
 assert.equal(await page.locator("#receipt-state").inputValue(),"paid");
 assert.match(await page.locator("#receipt-reference").inputValue(),/^study:/);
 assert.ok(Number(await page.locator("#receipt-amount").inputValue())>0,"advertised amount filled as a starting value");
 assert.equal(await page.evaluate(()=>document.activeElement.id),"receipt-amount","cursor on the amount to confirm");
 assert.match(await page.locator("#receipt-editing").textContent(),/check the amount and date, then save/);
 const before=await page.locator("#ledger-list .entry").count();
 await page.locator("#receipt-date").fill("2026-10-30");await page.locator("#receipt-save").click();
 assert.equal(await page.locator("#ledger-list .entry").count(),before+1,"saved once by the owner");
 await nav("research");
 await page.locator("article.radar-card",{has:page.locator(`select[aria-label="${label}"]`)}).getByRole("button",{name:"Record this payment in Income"}).click();
 assert.match(await page.locator("#receipt-editing").textContent(),/^Already recorded for this study\. Editing: /);
 assert.equal(await page.locator("#ledger-list .entry").count(),before+1,"no second record");
 await page.locator("#receipt-cancel").click();
 await nav("research");
 await page.locator(`select[aria-label="${label}"]`).selectOption("Applied");}
// Save encrypted, reload, reopen: the study is still marked Applied.
await page.locator("#briefing-passphrase").fill("synthetic passphrase for tests");
const [dl]=await Promise.all([page.waitForEvent("download"),page.locator("#briefing-save").tap()]);
const saved=readFileSync(await dl.path(),"utf8");
assert.doesNotMatch(saved,/researchProgress|Applied/,"saved file is encrypted");
await page.reload();await nav("research");
assert.ok(await page.locator(`select[aria-label="${label}"]`).isDisabled(),"locked again without a workspace");
await page.locator("#briefing-passphrase").fill("synthetic passphrase for tests");
await page.locator("#briefing-file").setInputFiles({name:"w.json",mimeType:"application/json",buffer:Buffer.from(saved)});
await page.locator("#briefing-load").tap();
await page.waitForFunction(()=>/memory only/.test(document.getElementById("briefing-status").textContent),null,{timeout:30000});
assert.equal(await page.locator(`select[aria-label="${label}"]`).inputValue(),"Applied","progress restored from the workspace");
// Setting it back to New removes the entry.
await page.locator(`select[aria-label="${label}"]`).selectOption("New");
await page.waitForFunction(()=>/Study progress saved in your workspace: New/.test(document.getElementById("briefing-status").textContent));
assert.equal(await page.evaluate(()=>localStorage.length+sessionStorage.length),0,"nothing in browser storage");
assert.deepEqual(errors,[]);
await browser.close();server.close();
console.log("IncomeOS research progress browser QA passed: locked without workspace, enabled with one, saved encrypted, restored on reopen, no browser storage.");
