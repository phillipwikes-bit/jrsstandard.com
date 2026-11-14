// Browser round trip of the accounting editor's JSON backup: back up a workspace ledger, reload the page,
// restore into a fresh workspace and compare every record and the report totals. Also checks that a
// repeated restore adds nothing and that tampered backups are refused without changing the ledger.
// Synthetic records only; nothing may be written to browser storage.
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
const base=`http://127.0.0.1:${server.address().port}/index.html`;
const nav=v=>page.locator(`.bottomnav button[data-view="${v}"]`).click();
async function freshWorkspace(){await nav("research");await page.locator("#briefing-new").tap();await nav("ledger");
  await page.locator("#report-year").fill("2026");await page.locator("#report-year").dispatchEvent("change");}
const entryText=async()=>(await page.locator("#ledger-list .entry").allTextContents()).sort();
const report=async()=>page.locator("#report-preview").textContent();

await page.goto(base);await freshWorkspace();
// Three synthetic records covering received income, an outstanding invoice and a scheduled bill with a label and question.
await page.locator("#receipt-label").fill("Synthetic backup payout");await page.locator("#receipt-amount").fill("150");
await page.locator("#receipt-date").fill("2026-10-15");await page.locator("#receipt-state").selectOption("paid");await page.locator("#receipt-save").tap();
await page.locator("#receipt-label").fill("Synthetic backup invoice");await page.locator("#receipt-amount").fill("400");
await page.locator("#receipt-date").fill("2026-10-17");await page.locator("#receipt-state").selectOption("invoiced");await page.locator("#receipt-save").tap();
await page.locator("#cost-label").fill("Synthetic backup hosting");await page.locator("#cost-payee").fill("Synthetic Host");
await page.locator("#cost-amount").fill("12.34");await page.locator("#cost-date").fill("2026-10-18");
await page.locator("#cost-payment-status").selectOption("scheduled");await page.locator("#cost-payment-account").fill("Card ending 4242");
await page.locator("#cost-questions").fill("Business or personal?");await page.locator("#cost-save").tap();
assert.equal(await page.locator("#ledger-list .entry").count(),3);
const beforeEntries=await entryText(),beforeReport=await report();

// Back up.
const [dl]=await Promise.all([page.waitForEvent("download"),page.locator("#backup-ledger").tap()]);
const backup=JSON.parse(readFileSync(await dl.path(),"utf8"));
assert.equal(backup.format,"incomeos-accountant");assert.equal(backup.entries.length,3);
const hosting=backup.entries.find(e=>e.label==="Synthetic backup hosting");
assert.deepEqual([hosting.paymentStatus,hosting.paymentAccount,hosting.accountantQuestions,hosting.amountUsd],["scheduled","Card ending 4242","Business or personal?",12.34]);

// Reload: nothing survives in the page or browser storage.
await page.goto(base);await freshWorkspace();
assert.equal(await page.locator("#ledger-list .entry").count(),0,"fresh workspace starts empty");
// Uploads a backup and waits for the alert that reports the outcome (a restore first asks for confirmation).
const upload=async(obj,name)=>{const n=dialogs.length;
  await page.locator("#import-ledger").setInputFiles({name,mimeType:"application/json",buffer:Buffer.from(JSON.stringify(obj))});
  for(let i=0;i<100&&!dialogs.slice(n).some(m=>/^Import /.test(m));i++)await page.waitForTimeout(50);
  assert.ok(dialogs.slice(n).some(m=>/^Import /.test(m)),"an outcome alert is shown");};

// Tampered backups are refused and change nothing.
const tampered=[
  [{...backup,entries:backup.entries.map(e=>e.label==="Synthetic backup hosting"?{...e,paymentAccount:"4111 1111 1111 1111"}:e)},/invalid or incomplete/],
  [{...backup,entries:backup.entries.map(e=>({...e,id:"same"}))},/unique identifier/],
  [{...backup,format:"other"},/Not a supported IncomeOS accountant backup/]];
for(const [obj,msg] of tampered){
  await upload(obj,"t.json");
  assert.match(dialogs.at(-1),/Import was not completed\./);assert.match(dialogs.at(-1),msg);
  assert.equal(await page.locator("#ledger-list .entry").count(),0,"refused backup adds nothing");
}

// Restore: identical records and identical report.
await upload(backup,"b.json");
assert.match(dialogs.at(-1),/Import complete: 3 records added/);
assert.deepEqual(await entryText(),beforeEntries,"restored records match the originals");
assert.equal(await report(),beforeReport,"restored report totals match");
// Restoring the same backup again adds nothing.
await upload(backup,"b.json");
assert.match(dialogs.at(-1),/Import complete: 0 records added, 3 duplicates skipped/);
assert.equal(await page.locator("#ledger-list .entry").count(),3);
// The restored records are in the workspace and can still be edited.
await page.locator("#ledger-list .entry",{hasText:"Synthetic backup hosting"}).getByRole("button",{name:"Edit"}).tap();
assert.equal(await page.locator("#cost-payment-account").inputValue(),"Card ending 4242");
assert.equal(await page.locator("#cost-payment-status").inputValue(),"scheduled");

assert.equal(await page.evaluate(()=>localStorage.length+sessionStorage.length),0,"nothing in browser storage");
assert.deepEqual(errors,[]);
await browser.close();server.close();
console.log("IncomeOS accounting backup browser QA passed: backup, reload, refused tampered backups, identical restore, duplicate restore skipped, no browser storage.");
