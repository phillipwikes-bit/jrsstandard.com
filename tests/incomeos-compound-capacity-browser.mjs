// Browser check of the Compound view's available-to-compound estimate at phone widths (simulated Chromium, not a physical iPhone).
// Synthetic records only. Nothing may be written to browser storage or fetched from outside the page.
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
const ctx=await browser.newContext({...devices["iPhone SE"]});
const page=await ctx.newPage();const errors=[],external=[];
page.on("pageerror",e=>errors.push(String(e)));page.on("dialog",d=>d.accept());
const origin=`http://127.0.0.1:${server.address().port}`;
page.on("request",r=>{if(!r.url().startsWith(origin)&&!r.url().startsWith("blob:")&&!r.url().startsWith("data:"))external.push(r.url());});
await page.goto(origin+"/index.html");
const nav=v=>page.locator(`.bottomnav button[data-view="${v}"]`).click();
const Y=String(new Date().getFullYear());
await nav("compound");
assert.match(await page.locator("#cc-result").textContent(),/Open your workspace/);
await nav("research");await page.locator("#briefing-new").tap();await nav("ledger");
async function income(label,amount,fees,state,scope,date){
  await page.locator("#receipt-label").fill(label);await page.locator("#receipt-amount").fill(amount);await page.locator("#receipt-fees").fill(fees);
  await page.locator("#receipt-date").fill(date);await page.locator("#receipt-state").selectOption(state);await page.locator("#receipt-scope").selectOption(scope);
  await page.locator("#receipt-save").tap();}
async function cost(label,amount,status,date){
  await page.locator("#cost-label").fill(label);await page.locator("#cost-payee").fill("Synthetic Vendor "+label);await page.locator("#cost-amount").fill(amount);
  await page.locator("#cost-date").fill(date);await page.locator("#cost-payment-status").selectOption(status);await page.locator("#cost-save").tap();}
await income("Synthetic consulting fee","1000","50","paid","income",Y+"-03-01");
await income("Synthetic invoice","400","0","invoiced","income",Y+"-03-02");
await income("Synthetic principal back","300","0","paid","nonincome",Y+"-03-03");
await income("Synthetic last year payout","500","0","paid","income",(Number(Y)-1)+"-06-01");
await cost("hosting","200","paid",Y+"-03-04");
await cost("insurance","40","scheduled",Y+"-12-01");
assert.equal(await page.locator("#ledger-list .entry").count()>=5,true);
await nav("compound");
await page.locator("#cc-reserve").fill("100");
// This year: 950 net received + 300 capital back - 200 paid - 40 scheduled - 100 reserve = 910; the invoice is not counted.
await page.waitForFunction(()=>document.getElementById("cc-available")&&/910\.00/.test(document.getElementById("cc-available").textContent));
const text=await page.locator("#cc-result").textContent();
assert.match(text,/Capital returned \(not earnings\)\$300\.00/);
assert.match(text,/Income received, after fees\$950\.00/);
assert.match(text,/not yet received \(\$400\.00\) is not counted/);
assert.match(text,/estimate, not reconciled/);
assert.match(await page.locator("#cc-downside").textContent(),/lost 20%, \$182\.00 would be gone and \$728\.00 would remain/);
// All years adds last year's payout.
await page.locator("#cc-year").fill("");
await page.waitForFunction(()=>/1,410\.00/.test(document.getElementById("cc-available").textContent));
// A reserve larger than the cash leaves nothing, never a negative figure.
await page.locator("#cc-reserve").fill("100000");
await page.waitForFunction(()=>/\$0\.00/.test(document.getElementById("cc-available").textContent));
assert.match(await page.locator("#cc-result").textContent(),/nothing is available/);
// Actual results by holding: one capital contribution and its interest under the same name.
// The principal returned earlier carries no payer name, so it is grouped and flagged rather than hidden.
{const t=await page.locator("#ch-result").textContent();
 assert.match(t,/Unnamed holdingNo money put in is recorded\./);assert.match(t,/Principal returned \(not earnings\)\$300\.00/);
 assert.match(t,/Records without a payer or payee name are grouped here/);}
await nav("ledger");
await page.locator("#cost-label").fill("Synthetic note purchase");await page.locator("#cost-payee").fill("Synthetic Notes Fund");
await page.locator("#cost-amount").fill("1000");await page.locator("#cost-date").fill(Y+"-01-10");await page.locator("#cost-type").selectOption("capital");
await page.locator("#cost-payment-status").selectOption("paid");await page.locator("#cost-save").tap();
await page.locator("#receipt-label").fill("Synthetic note interest");await page.locator("#receipt-payer").fill("Synthetic Notes Fund");
await page.locator("#receipt-amount").fill("60");await page.locator("#receipt-fees").fill("0");await page.locator("#receipt-date").fill(Y+"-06-30");
await page.locator("#receipt-state").selectOption("paid");await page.locator("#receipt-scope").selectOption("income");await page.locator("#receipt-category").selectOption("interest");
await page.locator("#receipt-save").tap();
await nav("compound");
const holding=page.locator('#ch-result .holding[data-holding="Synthetic Notes Fund"]');
await holding.waitFor();
const ht=await holding.textContent();
assert.match(ht,/Money put in\$1,000\.00/);assert.match(ht,/Income received\$60\.00/);assert.match(ht,/\$1,000\.00 of your money is still in it/);
assert.match(ht,/Income on money put in \(not annualised\)6%/);
// Reinvestment through the form: a second purchase paid partly with that $60 of interest.
await nav("ledger");
await page.locator("#cost-label").fill("Synthetic second note");await page.locator("#cost-payee").fill("Synthetic Notes Fund");
await page.locator("#cost-amount").fill("200");await page.locator("#cost-date").fill(Y+"-07-01");await page.locator("#cost-type").selectOption("capital");
await page.locator("#cost-payment-status").selectOption("paid");
await page.locator("#cost-reinvested").fill("80");await page.locator("#cost-save").tap();
assert.match(await page.locator("#cost-reinvested-from").getAttribute("aria-invalid")||"",/true/,"a reinvested amount needs its source holding");
await page.locator("#cost-reinvested-from").fill("Synthetic Notes Fund");await page.locator("#cost-save").tap();
await page.waitForFunction(()=>!document.getElementById("cost-label").value);
// An expense cannot carry reinvested earnings.
await page.locator("#cost-label").fill("Synthetic fee");await page.locator("#cost-payee").fill("Synthetic Bank");await page.locator("#cost-amount").fill("5");
await page.locator("#cost-date").fill(Y+"-07-02");await page.locator("#cost-type").selectOption("expense");await page.locator("#cost-reinvested").fill("5");
await page.locator("#cost-reinvested-from").fill("Synthetic Notes Fund");await page.locator("#cost-save").tap();
assert.match(await page.locator("#cost-errors").textContent(),/Only an asset purchase or capital contribution/);
await page.locator("#cost-reinvested").fill("");await page.locator("#cost-reinvested-from").fill("");await page.locator("#cost-label").fill("");
await nav("compound");
{const t=await page.locator('#ch-result .holding[data-holding="Synthetic Notes Fund"]').textContent();
 assert.match(t,/Money put in\$1,200\.00/);assert.match(t,/of which reinvested earnings\$60\.00/);assert.match(t,/of which new money\$1,140\.00/);
 assert.match(t,/\$20\.00 recorded as reinvested from Synthetic Notes Fund exceeds the income received from it/);}
// A transfer between own accounts, entered through the form, changes nothing and is disclosed.
await page.locator("#cc-year").fill("");await page.locator("#cc-reserve").fill("0");
const beforeTransfer=await page.locator("#cc-available").textContent();
await nav("ledger");
await page.locator("#cost-label").fill("Synthetic move to savings");await page.locator("#cost-payee").fill("Synthetic Savings");
await page.locator("#cost-amount").fill("250");await page.locator("#cost-date").fill(Y+"-08-01");await page.locator("#cost-type").selectOption("transfer");
await page.locator("#cost-payment-status").selectOption("paid");await page.locator("#cost-save").tap();
await page.waitForFunction(()=>!document.getElementById("cost-label").value);
await nav("compound");
assert.equal(await page.locator("#cc-available").textContent(),beforeTransfer,"a transfer does not reduce what is available");
assert.match(await page.locator("#cc-result").textContent(),/\$250\.00 moved between your own accounts is not counted/);
for(const w of [320,375,430]){await page.setViewportSize({width:w,height:800});
  assert.ok(await page.evaluate(w=>document.documentElement.scrollWidth<=w,w),"no horizontal overflow at "+w);}
assert.equal(await page.evaluate(()=>localStorage.length+sessionStorage.length),0,"nothing in browser storage");
assert.deepEqual(external,[]);assert.deepEqual(errors,[]);
await browser.close();server.close();
console.log("IncomeOS available-to-compound browser QA passed: received income only, invoice excluded, principal shown as capital back, reserve and scheduled bill deducted, 320/375/430 px.");
