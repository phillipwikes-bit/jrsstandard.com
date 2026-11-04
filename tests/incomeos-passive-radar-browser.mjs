// Browser check of the Passive Opportunity Radar import on an iPhone-sized viewport (simulated Chromium, not a physical iPhone).
// Synthetic findings only. Nothing may be fetched from outside the page's own origin or written to browser storage.
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
const ctx=await browser.newContext({...devices["iPhone SE"],acceptDownloads:true});
const page=await ctx.newPage();const errors=[],external=[];
page.on("pageerror",e=>errors.push(String(e)));
const origin=`http://127.0.0.1:${server.address().port}`;
page.on("request",r=>{if(!r.url().startsWith(origin)&&!r.url().startsWith("blob:")&&!r.url().startsWith("data:"))external.push(r.url());});
await page.goto(origin+"/index.html");
await page.locator('.bottomnav button[data-view="assets"]').click();
await page.locator("#passive-radar-panel").waitFor();
const d=new Date(),today=d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
const f=(o)=>({sourceName:"Synthetic source",sourceUrl:"https://example.org/s",foundOn:today,amountBasis:"stated",...o});
const file={schema:"incomeos.passive-findings.v1",findings:[
  f({id:"a",title:"Synthetic unclaimed property match",directUrl:"https://example.gov/claim",valueType:"returned_capital",amountUsd:80}),
  f({id:"b",title:"Synthetic yield projection",directUrl:"https://example.org/p",valueType:"projection",amountUsd:500,amountBasis:"estimated"}),
  f({id:"c",title:"Synthetic finding with no link",valueType:"new_income",amountUsd:20}),
  f({id:"d",title:"Synthetic fee scam",directUrl:"https://example.org/d",valueType:"new_income",summary:"Pay a processing fee to release your money"})]};
await page.locator("#passive-import-file").setInputFiles({name:"f.json",mimeType:"application/json",buffer:Buffer.from(JSON.stringify(file))});
await page.locator("#passive-import").tap();
await page.locator(".passive-finding").first().waitFor();
assert.equal(await page.locator(".passive-finding").count(),2);
assert.equal(await page.locator(".passive-refused").count(),2);
const status=await page.locator("#passive-status").textContent();
assert.match(status,/2 finding\(s\) accepted, 2 refused\. Received so far from these findings: \$0\.00/);
const proj=await page.locator('.passive-finding[data-finding-id="b"]').textContent();
assert.match(proj,/Projection: not income/);
const cap=await page.locator('.passive-finding[data-finding-id="a"]').textContent();
assert.match(cap,/Returned capital/);assert.match(cap,/Synthetic source · found /);assert.match(cap,/Official \.gov link/);
const callout=await page.locator("#passive-results .callout").textContent();
assert.match(callout,/not received/);assert.match(callout,/Returned capital \$80\.00/);assert.match(callout,/1 projection\(s\), never counted/);
const refused=(await page.locator(".passive-refused").allTextContents()).join(" ");
assert.match(refused,/no safe https direct link/);assert.match(refused,/scam or paid-finder/);
assert.equal(await page.locator('.passive-finding[data-finding-id="a"] a').first().getAttribute("href"),"https://example.gov/claim");
// No horizontal overflow at the phone width.
const vw=page.viewportSize().width;
assert.ok(await page.evaluate(w=>document.documentElement.scrollWidth<=w,vw),"no horizontal page overflow");
// A malformed file is refused with a message and clears the previous results.
await page.locator("#passive-import-file").setInputFiles({name:"bad.json",mimeType:"application/json",buffer:Buffer.from('{"schema":"x"}')});
await page.locator("#passive-import").tap();
await page.waitForFunction(()=>/Findings not reviewed/.test(document.getElementById("passive-status").textContent));
assert.equal(await page.locator(".passive-finding").count(),0);
// The sample format downloads.
const [dl]=await Promise.all([page.waitForEvent("download"),page.locator("#passive-template").tap()]);
assert.equal(JSON.parse(readFileSync(await dl.path(),"utf8")).schema,"incomeos.passive-findings.v1");
// Decisions: disabled until a workspace is open; then Pursuing keeps a finding, Dismissed hides it in later files,
// and both survive an encrypted save, page reload and reopen.
const nav=v=>page.locator(`.bottomnav button[data-view="${v}"]`).click();
const load=async()=>{await page.locator("#passive-import-file").setInputFiles({name:"f.json",mimeType:"application/json",buffer:Buffer.from(JSON.stringify(file))});
  await page.locator("#passive-import").tap();await page.locator(".passive-finding").first().waitFor();};
await load();
const decision=id=>page.locator(`.passive-finding[data-finding-id="${id}"] select`);
assert.ok(await decision("a").isDisabled(),"no decision without a workspace");
assert.match(await page.locator("#passive-kept").textContent(),/Open your workspace/);
await nav("research");await page.locator("#briefing-new").tap();await nav("assets");
assert.ok(!(await decision("a").isDisabled()),"enabled once a workspace is open");
await decision("a").selectOption("Pursuing");
await decision("b").selectOption("Dismissed");
assert.match(await page.locator("#passive-status").textContent(),/1 dismissed earlier and hidden/);
assert.equal(await page.locator(".passive-finding").count(),1,"dismissed finding hidden");
const keptText=await page.locator("#passive-kept").textContent();
assert.match(keptText,/Synthetic unclaimed property match/);assert.match(keptText,/Pursuing since/);assert.match(keptText,/Returned capital/);
assert.doesNotMatch(keptText,/Synthetic yield projection/,"dismissed findings are not in the kept list");
assert.equal(await page.locator('#passive-kept a').first().getAttribute("href"),"https://example.gov/claim");
await nav("research");
await page.locator("#briefing-passphrase").fill("synthetic passphrase for tests");
const [saveDl]=await Promise.all([page.waitForEvent("download"),page.locator("#briefing-save").tap()]);
const saved=readFileSync(await saveDl.path(),"utf8");
assert.doesNotMatch(saved,/Synthetic unclaimed property/,"saved workspace is encrypted");
await page.reload();await nav("assets");
assert.match(await page.locator("#passive-kept").textContent(),/Open your workspace/,"nothing kept in the page after reload");
await nav("research");
await page.locator("#briefing-passphrase").fill("synthetic passphrase for tests");
await page.locator("#briefing-file").setInputFiles({name:"w.json",mimeType:"application/json",buffer:Buffer.from(saved)});
await page.locator("#briefing-load").tap();
await page.waitForFunction(()=>/memory only/.test(document.getElementById("briefing-status").textContent),null,{timeout:30000});
await nav("assets");
assert.match(await page.locator("#passive-kept").textContent(),/Synthetic unclaimed property match/,"kept finding back after reopening");
await load();
assert.equal(await page.locator(".passive-finding").count(),1,"dismissed finding still hidden after reopening");
assert.equal(await decision("a").inputValue(),"Pursuing");
// A returned-capital finding opens one recovery claim, shown in This week; projections offer no claim.
assert.equal(await page.locator('.passive-finding[data-finding-id="b"] .passive-claim').count(),0);
await page.locator('.passive-finding[data-finding-id="a"]').getByRole("button",{name:/Track .* as a recovery claim/}).tap();
assert.match(await page.locator("#passive-status").textContent(),/Recovery claim opened.*Nothing is counted as received/);
assert.match(await page.locator('.passive-finding[data-finding-id="a"] .passive-claim').textContent(),/Recovery claim open: search due/);
assert.equal(await page.locator('.passive-finding[data-finding-id="a"] button').count(),0,"cannot open a second claim");
assert.match(await page.locator("#passive-kept").textContent(),/Recovery claim: search due/);
await nav("research");
assert.match(await page.locator("#briefing-output").textContent(),/Synthetic unclaimed property match \(unclaimed property\): search due/);
await nav("assets");
// Terms the source did not state read "not stated".
assert.match(await page.locator('.passive-finding[data-finding-id="a"] dl').textContent(),/Capital requirednot stated/);
assert.ok(await page.evaluate(w=>document.documentElement.scrollWidth<=w,vw),"no horizontal page overflow with decisions shown");
assert.equal(await page.evaluate(()=>localStorage.length+sessionStorage.length),0,"nothing in browser storage");
assert.deepEqual(external,[],"nothing fetched from outside the page");
assert.deepEqual(errors,[]);
await browser.close();server.close();
console.log("IncomeOS passive radar browser QA passed: sourced findings shown by type, refusals explained, projections not income, no storage or outside requests.");
