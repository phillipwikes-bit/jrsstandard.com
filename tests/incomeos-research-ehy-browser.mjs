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
// ---------- Owner-entered times make EHY available and re-rank (memory only) ----------
const firstTitle=titles[0],target=page.locator("#radar-results article").last();
const targetTitle=await target.locator("strong").first().textContent();
await target.locator("details.radar-time summary").tap();
await target.locator("input[id^=t-prep-]").fill("-5");
await target.getByRole("button",{name:"Use these times"}).tap();
assert.match(await page.locator("#radar-status").textContent(),/Times not used: Invalid preparation minutes/);
await target.locator("input[id^=t-screen-]").fill("1");
await target.locator("input[id^=t-prep-]").fill("0");
await target.locator("input[id^=t-admin-]").fill("1");
await target.getByRole("button",{name:"Use these times"}).tap();
assert.match(await page.locator("#radar-status").textContent(),/Times applied for .*To keep them/);
const card2=page.locator("#radar-results article",{hasText:targetTitle});
const t2=await card2.textContent();
assert.match(t2,/Effective hourly yield \$[\d,.]+\/hr .* time estimated/);assert.match(t2,/EHY uses estimated time/);
const newTitles=await page.$$eval("#radar-results article strong",els=>els.map(e=>e.textContent));
const held=await page.$$eval("#radar-results article",els=>els.map(e=>/HOLD/.test(e.querySelector(".radar-heading span").textContent)));
if(!held[newTitles.indexOf(targetTitle)])assert.equal(newTitles[0],targetTitle,"only study with an EHY now ranks first unless held");
const [dl2]=await Promise.all([page.waitForEvent("download"),page.locator("#radar-export").tap()]);
const csv2=readFileSync(await dl2.path(),"utf8").trim().split(/\r\n/).map(r=>r.match(/("([^"]|"")*")/g).map(x=>x.slice(1,-1).replace(/""/g,'"')));
const row2=csv2.find(r=>r[csv2[0].indexOf("Title")]===targetTitle);
assert.ok(row2[csv2[0].indexOf("EHY USD/hour")]!=="","CSV carries the newly computed EHY");assert.equal(row2[csv2[0].indexOf("Time confidence")],"estimated");
assert.ok(t2.includes("$"+Number(row2[csv2[0].indexOf("EHY USD/hour")]).toFixed(2)+"/hr"),"CSV EHY equals card EHY");
// ---------- Application notes reuse the documented profile ----------
await card2.getByRole("button",{name:"Prepare application notes"}).tap();
assert.match(await page.locator("#radar-status").textContent(),/Open your qualification profile/);
await page.locator("#profile-edit-panel summary").tap();
const prof={schema:"incomeos.owner-profile.v1",education:[{level:"masters",degree:"SYN Master of Science",evidence:{status:"documented",ref:"SYN diploma",verifiedOn:"2026-11-01"}},{level:"bachelors",degree:"SYN undocumented BA",evidence:{status:"attested"}}]};
await page.locator("#profile-edit-file").setInputFiles({name:"p.json",mimeType:"application/json",buffer:Buffer.from(JSON.stringify(prof))});
await page.locator("#profile-edit-load").tap();
await page.waitForFunction(()=>/loaded/.test(document.getElementById("profile-status").textContent));
await page.locator("#radar-results article",{hasText:targetTitle}).getByRole("button",{name:"Prepare application notes"}).tap();
const notes=await page.locator("#radar-results article",{hasText:targetTitle}).locator("pre.app-notes").textContent();
assert.match(notes,/SYN Master of Science/);assert.doesNotMatch(notes,/undocumented BA/);assert.match(notes,/Nothing has been submitted/);
// ---------- Times persist through the workspace file; "This week" lists research by EHY ----------
await page.locator("#briefing-new").tap();
// Use an open (not held) study: held studies are deliberately excluded from "This week".
const openTitle=await page.$$eval("#radar-results article",els=>{const e=els.find(x=>!/HOLD/.test(x.querySelector(".radar-heading span").textContent));return e?e.querySelector("strong").textContent:null;});
assert.ok(openTitle,"snapshot has at least one open study");
const card3=page.locator("#radar-results article",{hasText:openTitle});
if(!(await card3.locator("details.radar-time").getAttribute("open")))await card3.locator("details.radar-time summary").tap();
await card3.locator("input[id^=t-screen-]").fill("2");await card3.locator("input[id^=t-prep-]").fill("0");await card3.locator("input[id^=t-admin-]").fill("2");
await card3.getByRole("button",{name:"Use these times"}).tap();
assert.match(await page.locator("#briefing-status").textContent(),/Study times added to your workspace/);
const brief=await page.locator("#briefing-output").textContent();
assert.match(brief,/Paid research by effective hourly yield/);assert.ok(brief.includes(openTitle),"open study listed in This week");
const ehyBefore=(await page.locator("#radar-results article",{hasText:openTitle}).textContent()).match(/Effective hourly yield (\$[\d,.]+)\/hr/)[1];
await page.locator("#briefing-passphrase").fill("synthetic passphrase for tests");
const [wdl]=await Promise.all([page.waitForEvent("download"),page.locator("#briefing-save").tap()]);
const savedWs=readFileSync(await wdl.path(),"utf8");
await page.reload();await page.waitForFunction(()=>document.querySelectorAll("#radar-results article").length>0);
assert.match(await page.locator("#radar-results article",{hasText:openTitle}).textContent(),/EHY unavailable/,"times are gone after reload until the workspace is opened");
await page.locator("#briefing-passphrase").fill("synthetic passphrase for tests");
await page.locator("#briefing-file").setInputFiles({name:"w.json",mimeType:"application/json",buffer:Buffer.from(savedWs)});
await page.locator("#briefing-load").tap();
await page.waitForFunction(()=>/memory only/.test(document.getElementById("briefing-status").textContent),null,{timeout:30000});
const restored=await page.locator("#radar-results article",{hasText:openTitle}).textContent();
assert.ok(restored.includes("Effective hourly yield "+ehyBefore+"/hr"),"opening the saved workspace restores the study times and EHY");
const unl2=await page.$$eval("#research-radar-panel input,#research-radar-panel select",els=>els.filter(e=>!(e.labels&&e.labels.length)&&!e.getAttribute("aria-label")).map(e=>e.id||e.type));
assert.deepEqual(unl2,[],"time-entry controls are labelled");
const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
assert.ok(overflow<=1,"no horizontal scroll, overflow="+overflow);
assert.deepEqual(errors,[]);
await browser.close();server.close();
console.log(`IncomeOS research EHY browser QA passed (iPhone 13): ${cards.length} cards state EHY or the missing time, payment form shown, CSV matches cards and order, touch export, keyboard reach, labels, no overflow`);
