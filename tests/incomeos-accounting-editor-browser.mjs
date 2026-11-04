// Browser verification of the accounting editor in workspace mode at iPhone width: entries are kept in the
// owner workspace file (encrypted on save), never in browser storage; the staging lock still blocks storage.
// Synthetic records only.
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
const dialogs=[];page.on("dialog",d=>{dialogs.push(d.message());d.accept();});
await page.goto(`http://127.0.0.1:${server.address().port}/index.html`);
const nav=v=>page.locator(`.bottomnav button[data-view="${v}"]`).click();
// Without a workspace the editor stays locked by the staging interlock.
await nav("ledger");
assert.ok(await page.locator("#financial-staging-interlock").isVisible());
assert.ok(await page.locator("#receipt-save").isDisabled());
// Create a workspace; the editor unlocks and says where records are kept.
await nav("research");await page.locator("#briefing-new").tap();
await nav("ledger");
assert.ok(!(await page.locator("#financial-staging-interlock").isVisible()));
assert.match(await page.locator("#ledger-mode").textContent(),/Editing the ledger in your open workspace/);
// Add a received research payment and an expense with unknown business use.
await page.locator("#receipt-label").fill("Synthetic study payout");await page.locator("#receipt-payer").fill("Synthetic Recruiter");
await page.locator("#receipt-amount").fill("150");await page.locator("#receipt-date").fill("2026-10-15");
await page.locator("#receipt-state").selectOption("paid");
await page.locator("#receipt-save").tap();
await page.locator("#cost-label").fill("Synthetic AI subscription");await page.locator("#cost-payee").fill("Synthetic Vendor");
await page.locator("#cost-amount").fill("20");await page.locator("#cost-date").fill("2026-10-16");
await page.locator("#cost-save").tap();
await page.locator("#report-year").fill("2026");await page.locator("#report-year").dispatchEvent("change");
let list=await page.locator("#ledger-list").textContent();
assert.match(list,/Synthetic study payout/);assert.match(list,/Synthetic AI subscription/);
assert.match(list,/Business use not determined/,"unknown business use stays unknown");
// The Income view warns about unsaved changes and offers a route to the save control.
assert.match(await page.locator("#ledger-mode").textContent(),/UNSAVED CHANGES/);
assert.ok(await page.locator("#ledger-save-now").isVisible());
// Edit then delete the expense.
await page.locator("#ledger-list .entry",{hasText:"Synthetic AI subscription"}).getByRole("button",{name:"Edit"}).tap();
await page.locator("#cost-amount").fill("25");await page.locator("#cost-save").tap();
assert.match(await page.locator("#ledger-list").textContent(),/\$25\.00/);
await page.locator("#ledger-list .entry",{hasText:"Synthetic AI subscription"}).getByRole("button",{name:"Remove"}).tap();
assert.doesNotMatch(await page.locator("#ledger-list").textContent(),/Synthetic AI subscription/);
// Save the workspace encrypted, reload, and the ledger is gone from the page until the file is reopened.
await nav("research");
await page.locator("#briefing-passphrase").fill("synthetic passphrase for tests");
const [dl]=await Promise.all([page.waitForEvent("download"),page.locator("#briefing-save").tap()]);
const saved=readFileSync(await dl.path(),"utf8");
assert.doesNotMatch(saved,/Synthetic study payout/,"saved file is encrypted");
assert.equal(await page.evaluate(()=>localStorage.length+sessionStorage.length),0,"nothing in browser storage");
await nav("ledger");
assert.doesNotMatch(await page.locator("#ledger-mode").textContent(),/UNSAVED CHANGES/,"saving clears the warning");
assert.ok(!(await page.locator("#ledger-save-now").isVisible()));
await page.locator("#ledger-mode").scrollIntoViewIfNeeded();
await page.reload();await nav("ledger");
assert.doesNotMatch(await page.locator("#ledger-list").textContent(),/Synthetic study payout/);
assert.ok(await page.locator("#receipt-save").isDisabled(),"locked again without a workspace");
await nav("research");
await page.locator("#briefing-passphrase").fill("synthetic passphrase for tests");
await page.locator("#briefing-file").setInputFiles({name:"w.json",mimeType:"application/json",buffer:Buffer.from(saved)});
await page.locator("#briefing-load").tap();
await page.waitForFunction(()=>/memory only/.test(document.getElementById("briefing-status").textContent),null,{timeout:30000});
await nav("ledger");await page.locator("#report-year").fill("2026");await page.locator("#report-year").dispatchEvent("change");
list=await page.locator("#ledger-list").textContent();
assert.match(list,/Synthetic study payout/);assert.doesNotMatch(list,/Synthetic AI subscription/);
// Phone layout, no storage, no errors.
assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1),"no horizontal scroll");
assert.equal(await page.evaluate(()=>localStorage.length+sessionStorage.length),0);
assert.deepEqual(errors,[]);
await browser.close();server.close();
console.log("IncomeOS accounting editor workspace-mode browser QA passed: locked without workspace, add/edit/delete, encrypted save, reload, reopen, no browser storage.");
