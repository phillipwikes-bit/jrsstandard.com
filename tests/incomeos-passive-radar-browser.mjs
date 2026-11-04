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
assert.equal(await page.evaluate(()=>localStorage.length+sessionStorage.length),0,"nothing in browser storage");
assert.deepEqual(external,[],"nothing fetched from outside the page");
assert.deepEqual(errors,[]);
await browser.close();server.close();
console.log("IncomeOS passive radar browser QA passed: sourced findings shown by type, refusals explained, projections not income, no storage or outside requests.");
