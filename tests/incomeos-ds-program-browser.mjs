// Browser verification of the Decision Spellchecker Program view at iPhone width:
// default view, honest seeded status, start, record, save and reopen through the workspace file.
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
await page.goto(`http://127.0.0.1:${server.address().port}/index.html`);
// Program is the first navigation item and the default view.
assert.equal(await page.locator(".bottomnav button").first().getAttribute("data-view"),"ds");
assert.ok(await page.locator("#view-ds").isVisible());assert.ok(!(await page.locator("#view-research").isVisible()));
await page.waitForFunction(()=>document.querySelectorAll("#ds-output section").length>3);
let text=await page.locator("#ds-output").textContent();
assert.match(text,/SP acceptance \(original DS-A\): 0 of 18/);
assert.match(text,/0 of 8 mandatory gates met/);
assert.match(text,/No scheduled or autonomous process is configured/);
assert.match(text,/document not in the repository/);
assert.doesNotMatch(text,/\d+\s?%/,"no readiness percentage");
assert.ok(!(await page.locator("#ds-start").isVisible()),"start needs a workspace");
// Create a workspace under Research, then start the program record from the Program view.
await page.locator('.bottomnav button[data-view="research"]').click();
await page.locator("#briefing-new").tap();
await page.locator('.bottomnav button[data-view="ds"]').click();
await page.locator("#ds-start").tap();
await page.waitForFunction(()=>document.querySelectorAll("#view-ds details.ds-form").length>=6);
// Record evidence and a task through the forms.
const ev=page.locator("details.ds-form",{hasText:"Evidence"}).first();
await ev.locator("summary").tap();
await ev.getByLabel("Identifier",{exact:true}).fill("E-UI-001");await ev.getByLabel("Title").fill("Synthetic DS-C unit run");
await ev.getByLabel("Evidence level").selectOption("2");await ev.getByLabel("Source (file, URL or document)").fill("tests run");
await ev.getByLabel("Date",{exact:true}).fill("2026-11-01");await ev.getByLabel("Assumptions").fill("Synthetic");await ev.getByLabel("Contradictory evidence").fill("none found");
await ev.getByLabel("Decision it informs").fill("DS-C quality");
await ev.getByRole("button",{name:"Add"}).tap();
assert.match(await page.locator("#ds-status").textContent(),/Evidence added/);
const tk=page.locator("details.ds-form",{hasText:"Task"}).first();
await tk.locator("summary").tap();
await tk.getByLabel("Identifier",{exact:true}).fill("T-UI-1");await tk.getByLabel("Task",{exact:true}).fill("Recover DS-A source");
await tk.getByRole("button",{name:"Add"}).tap();
text=await page.locator("#ds-output").textContent();
assert.match(text,/T-UI-1 · Recover DS-A source/,"ready task listed as a next action");
// A rule violation is shown, not swallowed.
const tk2=page.locator("details.ds-form",{hasText:"Task"}).first();
if(!(await tk2.getAttribute("open")))await tk2.locator("summary").tap();
await tk2.getByLabel("Identifier",{exact:true}).fill("E-UI-001");await tk2.getByLabel("Task",{exact:true}).fill("dup");
await tk2.getByRole("button",{name:"Add"}).tap();
assert.match(await page.locator("#ds-status").textContent(),/already used/);
// A program cost goes to the workspace ledger with its dimension.
const cost=page.locator("details.ds-form",{hasText:"Program cost"}).first();
await cost.locator("summary").tap();
await cost.getByLabel("Date",{exact:true}).fill("2026-10-15");await cost.getByLabel("Vendor").fill("API provider");await cost.getByLabel("Amount (USD)").fill("40.00");
await cost.getByLabel("Dimension").selectOption("software_api");
await cost.getByRole("button",{name:"Add cost"}).tap();
await page.locator("#ds-output").getByRole("button",{name:"Run cycle"}).tap();
text=await page.locator("#ds-output").textContent();
assert.match(text,/Total recorded program cost\$40\.00/);
assert.match(text,/Last cycle CYCLE-1/);
// Save through the workspace, reopen, and the program comes back.
await page.locator('.bottomnav button[data-view="research"]').click();
const [dl]=await Promise.all([page.waitForEvent("download"),page.locator("#briefing-save").tap()]);
const saved=JSON.parse(readFileSync(await dl.path(),"utf8"));
assert.equal(saved.dsProgram.programId,"DSP");
assert.ok(saved.dsProgram.evidence.some(e=>e.id==="E-UI-001"));
assert.ok(saved.ledger.some(r=>r.program==="decision-spellchecker"&&r.dsDimension==="software_api"));
assert.ok(saved.changeLog.some(c=>/^DS_PROGRAM_/.test(c.action)));
await page.reload();
assert.match(await page.locator("#ds-output").textContent(),/Showing the initial program record/,"nothing persists in the browser");
await page.locator('.bottomnav button[data-view="research"]').click();
await page.locator("#briefing-file").setInputFiles({name:"w.json",mimeType:"application/json",buffer:Buffer.from(JSON.stringify(saved))});
await page.locator("#briefing-load").tap();
await page.waitForFunction(()=>/memory only/.test(document.getElementById("briefing-status").textContent),null,{timeout:30000});
await page.locator('.bottomnav button[data-view="ds"]').click();
assert.match(await page.locator("#ds-output").textContent(),/T-UI-1 · Recover DS-A source/);
// Phone layout: no horizontal overflow; every Program input is labelled; no storage written; no page errors.
assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1),"no horizontal scroll");
const unlabeled=await page.$$eval("#view-ds input,#view-ds select",els=>els.filter(e=>!(e.labels&&e.labels.length)).map(e=>e.id));
assert.deepEqual(unlabeled,[]);
assert.equal(await page.evaluate(()=>localStorage.length+sessionStorage.length),0);
assert.deepEqual(errors,[]);
await browser.close();server.close();
console.log("IncomeOS Decision Spellchecker browser QA passed: default Program view, honest seed, start, record, rule errors shown, ledger link, cycle, save and reopen, phone layout, labels, no storage.");
