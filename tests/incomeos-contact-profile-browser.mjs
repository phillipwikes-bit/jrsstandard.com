// E2E P0: encrypted contact information survives tab reload without leaving plaintext in storage.
// Uses synthetic data and a local static server. No recruiter links are submitted.
import assert from "node:assert/strict";
import {createServer} from "node:http";
import {readFileSync,existsSync} from "node:fs";
import {join,extname} from "node:path";
import {createRequire} from "node:module";
const require=createRequire(import.meta.url);
let chromium,devices;
try{({chromium,devices}=require("playwright"));}
catch{try{({chromium,devices}=require("playwright-core"));}
catch{if(process.env.CI){console.error("playwright-core is required in CI");process.exit(1);}
console.log("SKIPPED: playwright is not installed");process.exit(0);}}
const launchOptions=process.env.INCOMEOS_BROWSER?{executablePath:process.env.INCOMEOS_BROWSER,args:["--no-sandbox"]}:{};
const root=new URL("../owner/incomeos/",import.meta.url).pathname;
const mime={".html":"text/html",".js":"text/javascript",".css":"text/css",".json":"application/json",".svg":"image/svg+xml",".webmanifest":"application/manifest+json"};
const server=createServer((req,res)=>{
  const path=join(root,decodeURIComponent(req.url.split("?")[0]).replace(/^\/+/, "")||"index.html");
  if(!path.startsWith(root)||!existsSync(path)){res.writeHead(404);res.end();return;}
  res.writeHead(200,{"content-type":mime[extname(path)]||"application/octet-stream"});res.end(readFileSync(path));
}).listen(0,"127.0.0.1");
await new Promise(resolve=>server.once("listening",resolve));
const browser=await chromium.launch(launchOptions);
try{
  const ctx=await browser.newContext({...devices["iPhone 13"],viewport:{width:375,height:812}});
  const page=await ctx.newPage();
  const errors=[];
  page.on("pageerror",e=>errors.push(String(e)));
  page.on("dialog",d=>d.accept());
  const base=`http://127.0.0.1:${server.address().port}/index.html`;
  const pw="a-long-synthetic-contact-passphrase";
  await page.goto(base);
  await page.locator('.bottomnav button[data-view="research"]').click();
  const panel=page.locator("#incomeos-contact-panel");
  await panel.waitFor();
  assert.equal(await page.locator("#contact-fullName").inputValue(),"");
  assert.match(await page.locator("#contact-status").textContent(),/No encrypted contact/);
  await page.locator("#contact-fullName").fill("Test Contact");
  await page.locator("#contact-email").fill("test@example.invalid");
  await page.locator("#contact-phone").fill("555-0102");
  await page.locator("#contact-cityState").fill("Test City, MD");
  await page.locator("#contact-qualifications").fill("Synthetic evaluation experience");
  await page.locator("#contact-password").fill(pw);
  await page.locator("#contact-confirm").fill(pw);
  await page.locator("#contact-save").click();
  await page.waitForFunction(()=>document.getElementById("contact-status").textContent.includes("saved encrypted"),null,{timeout:30000});
  const cipher=await page.evaluate(()=>localStorage.getItem("incomeos.contact.encrypted.v1"));
  assert.ok(cipher && cipher.includes("AES-256-GCM"));
  assert.ok(!cipher.includes("Test Contact")&&!cipher.includes("test@example.invalid")&&!cipher.includes(pw));
  await page.reload();
  await page.locator('.bottomnav button[data-view="research"]').click();
  assert.equal(await page.locator("#contact-fullName").inputValue(),"","fields do not unlock automatically");
  assert.match(await page.locator("#contact-status").textContent(),/Encrypted contact details found/);
  await page.locator("#contact-password").fill("incorrect-synthetic-passphrase");
  await page.locator("#contact-unlock").click();
  await page.waitForFunction(()=>document.getElementById("contact-status").textContent.includes("Unlock failed"),null,{timeout:30000});
  assert.equal(await page.locator("#contact-fullName").inputValue(),"");
  await page.locator("#contact-password").fill(pw);
  await page.locator("#contact-unlock").click();
  await page.waitForFunction(()=>document.getElementById("contact-fullName").value==="Test Contact",null,{timeout:30000});
  assert.equal(await page.locator("#contact-phone").inputValue(),"555-0102");
  // The local CI server has no external study feed. Add a constructed card so
  // this test verifies button decoration without relying on live opportunities.
  await page.evaluate(() => {
    const list=document.getElementById("research-cards");
    const card=document.createElement("article");
    card.className="card";
    card.dataset.contactTest="1";
    const region=document.createElement("div");
    region.className="cardalt";
    const link=document.createElement("a");
    link.href="https://example.invalid/synthetic-study";
    link.textContent="Fictional test study";
    region.appendChild(link);
    card.appendChild(region);
    list.appendChild(card);
  });
  // Owner-initiated local contact download. Never fills or submits a recruiter form.
  assert.equal(await page.locator("#contact-vcard").isEnabled(),true);
  const downloaded=page.waitForEvent("download");
  await page.locator("#contact-vcard").click();
  const contactDownload=await downloaded;
  assert.equal(contactDownload.suggestedFilename(),"IncomeOS-contact.vcf");
  const cardBytes=readFileSync(await contactDownload.path(),"utf8");
  assert.ok(cardBytes.startsWith("BEGIN:VCARD"));
  assert.ok(cardBytes.includes("EMAIL;TYPE=INTERNET:test@example.invalid"));
  assert.ok(!cardBytes.includes("Synthetic evaluation experience"));
  assert.ok(!cardBytes.includes(pw));
  const study=page.locator('#research-cards article.card[data-contact-test="1"]');
  await study.getByRole("button",{name:"Prepare contact details"}).waitFor();
  assert.equal(await study.getByRole("button",{name:"Prepare contact details"}).count(),1);
  const direct=await study.locator('a[href^="http"]').first().getAttribute("href");
  assert.match(direct,/^https?:\/\//);
  await study.getByRole("button",{name:"Prepare contact details"}).click();
  assert.match(await page.locator("#contact-status").textContent(),/copy them/);
  assert.equal(await study.locator('a[href^="http"]').first().getAttribute("href"),direct,"application URL unchanged");
  let overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  assert.ok(overflow<=2,"no horizontal scroll at 375px; overflow="+overflow);
  await page.setViewportSize({width:320,height:812});
  overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  assert.ok(overflow<=2,"no horizontal scroll at 320px; overflow="+overflow);
  await page.locator("#contact-delete").click();
  assert.equal(await page.evaluate(()=>localStorage.getItem("incomeos.contact.encrypted.v1")),null);
  await page.reload();
  await page.locator('.bottomnav button[data-view="research"]').click();
  assert.equal(await page.locator("#contact-fullName").inputValue(),"");
  assert.match(await page.locator("#contact-status").textContent(),/No encrypted contact/);
  assert.deepEqual(errors,[]);
  console.log("IncomeOS contact browser P0 passed: save, encrypted localStorage, reload, wrong/correct unlock, study preparation, iPhone widths, delete.");
}finally{await browser.close();server.close();}
