// Browser verification of research-radar EHY at iPhone width: card display, CSV export
// consistency with the cards, touch tap, keyboard reachability and labels.
// Uses the committed dated research snapshot (opportunities.json); no live recruiter data.
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
await page.waitForFunction(()=>document.querySelectorAll("#radar-results article").length>0,null,{timeout:15000});
const cards=await page.$$eval("#radar-results article",els=>els.map(e=>e.textContent));
assert.ok(cards.length>=1,"research cards rendered");
for(const c of cards){
  assert.ok(/Effective hourly yield \$[\d,.]+\/hr/.test(c)||/EHY unavailable: missing [a-z ,-]+ time\./.test(c),"each card states EHY or names the missing time: "+c.slice(0,120));
  assert.match(c,/Advertised \$[\d,.]+ \((cash|gift card|points|payment form not stated)\)\. Advertised pay is not earned income\./);
  assert.doesNotMatch(c,/EHY.*\$0\.00\/hr/,"no zero-time EHY");
}
// CSV export: tap (touch) the export button and compare with the cards.
const [dl]=await Promise.all([page.waitForEvent("download"),page.locator("#radar-export").tap()]);
const csv=readFileSync(await dl.path(),"utf8").trim().split(/\r\n/).map(r=>r.match(/("([^"]|"")*")/g).map(x=>x.slice(1,-1).replace(/""/g,'"')));
const head=csv[0],rows=csv.slice(1);
for(const col of ["EHY USD/hour","EHY missing components","Time confidence","Payment form","Total minutes"])assert.ok(head.includes(col),"CSV has "+col);
assert.equal(rows.length,cards.length,"one CSV row per card, same set");
const titles=await page.$$eval("#radar-results article strong",els=>els.map(e=>e.textContent));
assert.deepEqual(rows.map(r=>r[head.indexOf("Title")]),titles,"CSV order matches on-screen ranking");
rows.forEach((r,i)=>{
  const ehy=r[head.indexOf("EHY USD/hour")],missing=r[head.indexOf("EHY missing components")];
  if(ehy==="")assert.ok(/EHY unavailable/.test(cards[i])&&missing.length>0,"blank EHY in CSV matches an unavailable card with named components");
  else assert.ok(cards[i].includes("$"+Number(ehy).toFixed(2)+"/hr"),"CSV EHY equals the displayed EHY");
});
// Keyboard: the radar controls are reachable by Tab, and every radar control is labelled.
const unlabeled=await page.$$eval("#research-radar-panel input,#research-radar-panel select",els=>els.filter(e=>!(e.labels&&e.labels.length)&&!e.getAttribute("aria-label")).map(e=>e.id||e.type));
assert.deepEqual(unlabeled,[],"every research control is labelled");
await page.focus("#radar-rescan");
const reached=new Set();
for(let i=0;i<30;i++){await page.keyboard.press("Tab");reached.add(await page.evaluate(()=>document.activeElement&&document.activeElement.id));}
for(const id of ["radar-min-ehy","radar-export"])if(!(await page.locator("#"+id).isDisabled()))assert.ok(reached.has(id),id+" reachable by keyboard");
assert.ok(reached.has("radar-export"),"export reachable by keyboard");
const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
assert.ok(overflow<=1,"no horizontal scroll, overflow="+overflow);
assert.deepEqual(errors,[]);
await browser.close();server.close();
console.log(`IncomeOS research EHY browser QA passed (iPhone 13): ${cards.length} cards state EHY or the missing time, payment form shown, CSV matches cards and order, touch export, keyboard reach, labels, no overflow`);
