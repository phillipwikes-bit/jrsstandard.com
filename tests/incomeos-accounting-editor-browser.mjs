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
// A scheduled bill with a question for the accountant is shown as not paid and does not count yet.
await page.locator("#cost-label").fill("Synthetic domain renewal");await page.locator("#cost-payee").fill("Synthetic Registrar");
await page.locator("#cost-amount").fill("15");await page.locator("#cost-date").fill("2026-10-18");
await page.locator("#cost-payment-status").selectOption("scheduled");await page.locator("#cost-questions").fill("Business or personal?");
await page.locator("#cost-save").tap();
{const row=await page.locator("#ledger-list .entry",{hasText:"Synthetic domain renewal"}).textContent();
 assert.match(row,/Scheduled, not paid/);assert.match(row,/Question for accountant: Business or personal\?/);}
{const cats=await page.locator("#report-preview").textContent();
 assert.match(cats,/Outflows not paid \(scheduled, disputed or refunded\) · [a-z]+ \(1\)\$15\.00/,"scheduled bill listed apart from paid expenses");
 assert.match(cats,/Expenses paid · [a-z]+ \(1\)\$20\.00/,"paid expense total excludes the scheduled bill");
 assert.match(cats,/Reconciliation evidence/);assert.match(cats,/Not yet received or paid \(outside reconciliation\) \(1\)\$15\.00/,"scheduled bill outside reconciliation");
 assert.match(cats,/No bank matching, audit or tax determination has been performed/);
 assert.match(cats,/Receipt gaps/);assert.match(cats,/1 paid outflow\(s\), \$20\.00, have no receipt or invoice on file/,"scheduled bill is not a receipt gap");
 assert.match(cats,/Unclassified transactions/);assert.match(cats,/Every record has a specific category and type\./);}
// The printed accountant report renders every section, including category, reconciliation and receipt-gap tables.
{await page.evaluate(()=>{window.print=()=>{};});await page.locator("#print-accountant").click();
 const pr=await page.locator("#print-report").textContent();
 for(const h of [/Record completeness: INCOMPLETE/,/By category/,/Reconciliation evidence/,/Receipt gaps: 1 paid outflow\(s\), \$20\.00/,/Receipt not located/,/Unclassified transactions: 0, \$0\.00/])assert.match(pr,h);
 assert.doesNotMatch(pr,/Receipt gaps[^]*Synthetic domain renewal[^]*Outstanding documentation review/,"scheduled bill not listed as a receipt gap");}
// A full card number in "Paid from" is refused and nothing is saved; a short label is kept and shown.
{const before=await page.locator("#ledger-list .entry").count();
 await page.locator("#cost-label").fill("Synthetic printer ink");await page.locator("#cost-amount").fill("12");await page.locator("#cost-date").fill("2026-10-19");
 await page.locator("#cost-payment-account").fill("4111 1111 1111 1111");await page.locator("#cost-save").tap();
 assert.match(await page.locator("#cost-payment-account-error").textContent(),/Full card or account numbers are not stored/);
 assert.equal(await page.locator("#cost-payment-account").getAttribute("aria-invalid"),"true");
 assert.equal(await page.evaluate(()=>document.activeElement.id),"cost-payment-account","focus moves to the field to fix");
 assert.equal(await page.locator("#ledger-list .entry").count(),before,"refused entry not saved");
 await page.locator("#cost-payment-account").fill("Card ending 4242");await page.locator("#cost-save").tap();
 assert.match(await page.locator("#ledger-list .entry",{hasText:"Synthetic printer ink"}).textContent(),/Paid from: Card ending 4242/);
 // CSV import carries payment status, the accountant question and a safe label; an unsafe number is dropped with a note.
 const csvText=["kind,date,description,vendor,category,amount_usd,status,business_use_pct,evidence_ref,notes,payment_status,accountant_questions,payment_account",
   "expense,2026-10-21,Synthetic hosting import,Host,software,9.00,paid,,R-1,n1,scheduled,Business or personal?,Card ending 5555",
   "expense,2026-10-22,Synthetic mail import,Mail,software,6.00,paid,,R-2,n2,,,4111 1111 1111 1111",
   "expense,2026-10-23,Synthetic unsorted import,Shop,misc,7.00,paid,,R-3,n3,,,"].join("\n");
 await page.locator("#import-csv").setInputFiles({name:"i.csv",mimeType:"text/csv",buffer:Buffer.from(csvText)});
 const hosting=page.locator("#ledger-list .entry",{hasText:"Synthetic hosting import"});await hosting.waitFor();
 const ht=await hosting.textContent();assert.match(ht,/Scheduled, not paid/);assert.match(ht,/Paid from: Card ending 5555/);assert.match(ht,/Question for accountant: Business or personal\?/);
 const mt=await page.locator("#ledger-list .entry",{hasText:"Synthetic mail import"}).textContent();
 assert.doesNotMatch(mt,/4111/,"full number never displayed or stored");assert.doesNotMatch(mt,/Paid from/);
 // An unknown imported category becomes "other" and is listed as unclassified, with its next action.
 assert.match(await page.locator("#report-preview").textContent(),/2026-10-23 · Synthetic unsorted import · Cost category not chosen \(other\): choose a specific category\$7\.00/);}
// An invoiced amount is recorded as outstanding, not received, and appears under the outstanding filter.
await page.locator("#receipt-label").fill("Synthetic consulting invoice");await page.locator("#receipt-amount").fill("900");
await page.locator("#receipt-date").fill("2026-10-20");await page.locator("#receipt-state").selectOption("invoiced");
await page.locator("#receipt-save").tap();
assert.match(await page.locator("#ledger-list .entry",{hasText:"Synthetic consulting invoice"}).textContent(),/Invoiced, not received/);
await page.locator("#ledger-filter").selectOption("pending");
assert.match(await page.locator("#ledger-list").textContent(),/Synthetic consulting invoice/);
assert.doesNotMatch(await page.locator("#ledger-list").textContent(),/Synthetic study payout/);
await page.locator("#ledger-filter").selectOption("all");
// The Income view warns about unsaved changes and offers a route to the save control.
assert.match(await page.locator("#ledger-mode").textContent(),/UNSAVED CHANGES/);
assert.ok(await page.locator("#ledger-save-now").isVisible());
// Edit then delete the expense.
await page.locator("#ledger-list .entry",{hasText:"Synthetic AI subscription"}).getByRole("button",{name:"Edit"}).tap();
await page.locator("#cost-amount").fill("25");await page.locator("#cost-save").tap();
assert.match(await page.locator("#ledger-list").textContent(),/\$25\.00/);
// The correction is kept: the row says so, and the detailed CSV keeps the earlier value and the record's source.
assert.match(await page.locator("#ledger-list .entry",{hasText:"Synthetic AI subscription"}).textContent(),/Corrected 1 time\(s\), last \d{4}-\d\d-\d\d/);
{const [d]=await Promise.all([page.waitForEvent("download"),page.locator("#export-ledger").tap()]);
 const line=readFileSync(await d.path(),"utf8").split("\r\n").find(l=>l.includes("Synthetic AI subscription"));
 assert.match(line,/"manual","\d{4}-\d\d-\d\d: amountUsd 20 to 25"$/,"earlier amount kept in the detailed CSV");}
// The printed report lists corrected records with their earlier values; unedited records are not listed there.
{await page.evaluate(()=>{window.print=()=>{};});await page.locator("#print-accountant").click();
 const pr=await page.locator("#print-report").textContent();
 assert.match(pr,/Corrected records: 1/);assert.match(pr,/Synthetic AI subscriptionmanual\d{4}-\d\d-\d\d: amountUsd 20 to 25/);
 assert.doesNotMatch(pr,/Corrected records: 1[^]*Synthetic study payout[^]*Outstanding documentation review/,"unedited record not listed as corrected");}
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
assert.ok(await page.evaluate(w=>window.innerWidth<=w+1&&document.documentElement.scrollWidth<=w+1,page.viewportSize().width),"no horizontal scroll");
// Invalid entries show a message beside each field, are announced, take focus and save nothing; fixing them clears the errors.
{const before=await page.locator("#ledger-list .entry").count();
 await page.locator("#receipt-label").fill("");await page.locator("#receipt-amount").fill("0");await page.locator("#receipt-fees").fill("-1");
 await page.locator("#receipt-save").tap();
 assert.equal(await page.locator("#ledger-list .entry").count(),before,"nothing saved");
 assert.match(await page.locator("#receipt-label-error").textContent(),/Enter a description/);
 assert.match(await page.locator("#receipt-amount-error").textContent(),/greater than 0/);
 assert.match(await page.locator("#receipt-fees-error").textContent(),/cannot be negative/);
 assert.equal(await page.locator("#receipt-errors").getAttribute("role"),"alert");assert.match(await page.locator("#receipt-errors").textContent(),/^Not saved\./);
 assert.equal(await page.evaluate(()=>document.activeElement.id),"receipt-label","focus on the first problem");
 assert.match(await page.locator("#receipt-amount").getAttribute("aria-describedby"),/receipt-amount-error/);
 await page.locator("#receipt-label").fill("Synthetic corrected entry");await page.locator("#receipt-amount").fill("10");await page.locator("#receipt-fees").fill("0");
 await page.locator("#receipt-date").fill("2026-10-21");await page.locator("#receipt-save").tap();
 assert.equal(await page.locator("#ledger-list .entry").count(),before+1,"corrected entry saved");
 assert.equal(await page.locator("#view-ledger .field-error").count(),0,"errors cleared");assert.ok(await page.locator("#receipt-errors").isHidden());
 assert.equal(await page.locator("#receipt-amount").getAttribute("aria-invalid"),null);
 await page.locator("#ledger-list .entry",{hasText:"Synthetic corrected entry"}).getByRole("button",{name:"Remove"}).tap();
 assert.equal(await page.locator("#ledger-list .entry").count(),before);}
// Focus follows the action: Edit moves to the form; saving or cancelling an edit returns to that record; removing moves to a neighbour.
{const active=()=>page.evaluate(()=>document.activeElement.getAttribute("aria-label")||document.activeElement.id);
 const row=t=>page.locator("#ledger-list .entry",{hasText:t});
 await row("Synthetic study payout").getByRole("button",{name:"Edit"}).click();
 assert.equal(await active(),"receipt-label","Edit moves focus into the form");
 // The form says which record is open, and warns when the current filter hides it.
 assert.equal(await page.locator("#receipt-editing").textContent(),"Editing: Synthetic study payout, 2026-10-15, $150.00");
 await page.locator("#ledger-filter").selectOption("pending");
 assert.match(await page.locator("#receipt-editing").textContent(),/not shown in the list under the current year or filter\.$/);
 await page.locator("#ledger-filter").selectOption("all");
 assert.equal(await page.locator("#receipt-editing").textContent(),"Editing: Synthetic study payout, 2026-10-15, $150.00");
 await page.locator("#receipt-cancel").click();
 assert.match(await active(),/^Edit Synthetic study payout,/,"Cancel returns to the record");
 assert.ok(await page.locator("#receipt-editing").isHidden(),"note cleared after cancel");
 await row("Synthetic study payout").getByRole("button",{name:"Edit"}).click();await page.locator("#receipt-save").click();
 assert.match(await active(),/^Edit Synthetic study payout,/,"saving an edit returns to the record");
 await page.locator("#receipt-label").fill("Synthetic focus probe");await page.locator("#receipt-amount").fill("1");await page.locator("#receipt-date").fill("2026-10-15");
 await page.locator("#receipt-save").click();
 assert.equal(await active(),"receipt-label","after a new entry focus stays in the form for the next one");
 const rows=await page.evaluate(()=>[...document.querySelectorAll("#ledger-list .entry")].map(n=>[n.getAttribute("data-entry-id"),n.textContent]));
 const at=rows.findIndex(r=>/Synthetic focus probe/.test(r[1])),neighbour=(rows[at+1]||rows[at-1])[0];
 await row("Synthetic focus probe").getByRole("button",{name:"Remove"}).click();
 assert.equal(await row("Synthetic focus probe").count(),0);
 assert.match(await active(),/^Edit /);
 assert.equal(await page.evaluate(()=>document.activeElement.closest(".entry")?.getAttribute("data-entry-id")),neighbour,"focus lands on the neighbouring record");}
// Duplicate guard: an entry matching an existing record's kind, date, amount and payer asks first; refusing saves nothing,
// confirming keeps a deliberate second charge, and editing a record never matches itself.
{const row=t=>page.locator("#ledger-list .entry",{hasText:t});
 const addCost=async(label,payee)=>{await page.locator("#cost-label").fill(label);await page.locator("#cost-payee").fill(payee);
   await page.locator("#cost-amount").fill("9.99");await page.locator("#cost-date").fill("2026-10-24");await page.locator("#cost-save").click();};
 await addCost("Synthetic dup first","Synthetic Shop");
 const n0=dialogs.length;await row("Synthetic dup first").getByRole("button",{name:"Edit"}).click();await page.locator("#cost-save").click();
 assert.equal(dialogs.length,n0,"editing a record does not match itself");
 await page.evaluate(()=>{window.__realConfirm=window.confirm;window.confirm=()=>false;});
 await addCost("Synthetic dup second","synthetic shop ");
 assert.equal(await row("Synthetic dup second").count(),0,"refused duplicate not saved");
 await page.evaluate(()=>{window.confirm=window.__realConfirm;});
 await page.locator("#cost-save").click();
 assert.match(dialogs.at(-1),/^Possible duplicate: "Synthetic dup first" on 2026-10-24 for \$9\.99 from Synthetic Shop is already recorded\./);
 assert.equal(await row("Synthetic dup second").count(),1,"confirmed second charge saved");
 const n1=dialogs.length;await addCost("Synthetic other payee","Another Shop");
 assert.ok(!dialogs.slice(n1).some(m=>/^Possible duplicate/.test(m)),"a different payee is not a duplicate");
 for(const t of ["Synthetic dup first","Synthetic dup second","Synthetic other payee"])await row(t).getByRole("button",{name:"Remove"}).click();}
// Accessibility basics for the ledger view (automated checks only, not an accessibility certification).
{const a11y=await page.evaluate(()=>{const v=document.getElementById("view-ledger"),out={unlabelled:[],unnamed:[],positiveTab:[],rowNames:[]};
   const vis=e=>!!(e.offsetWidth||e.offsetHeight||e.getClientRects().length);
   v.querySelectorAll("input,select,textarea").forEach(e=>{if(e.type!=="hidden"&&vis(e)&&!((e.labels&&e.labels.length)||e.getAttribute("aria-label")||e.getAttribute("aria-labelledby")))out.unlabelled.push(e.id||e.name);});
   v.querySelectorAll("button").forEach(e=>{if(vis(e)&&!(e.getAttribute("aria-label")||e.textContent).trim())out.unnamed.push(e.id||e.outerHTML.slice(0,60));});
   document.querySelectorAll("[tabindex]").forEach(e=>{if(+e.getAttribute("tabindex")>0)out.positiveTab.push(e.id);});
   v.querySelectorAll("#ledger-list .entry button").forEach(e=>out.rowNames.push(e.getAttribute("aria-label")||e.textContent));
   return out;});
 assert.deepEqual([a11y.unlabelled,a11y.unnamed,a11y.positiveTab],[[],[],[]],"every field labelled, every button named, no forced tab order");
 assert.ok(a11y.rowNames.length>=4);assert.equal(new Set(a11y.rowNames).size,a11y.rowNames.length,"each row's Edit and Remove buttons name their record");
 assert.ok(a11y.rowNames.some(n=>/^Edit Synthetic study payout, 2026-10-15, \$150\.00$/.test(n)),"names give description, date and amount");
 // Keyboard: Tab moves through the income form in document order, and the focused field shows an outline.
 const order=await page.evaluate(()=>[...document.querySelectorAll("#receipt-form input,#receipt-form select,#receipt-form textarea,#receipt-form button")].filter(e=>!e.disabled&&!e.hidden&&(e.offsetWidth||e.offsetHeight)).map(e=>e.id));
 await page.locator("#"+order[0]).focus();const seen=[order[0]];
 // A date field takes one Tab per part (month, day, year), so repeats of the same field are collapsed.
 for(let i=0;i<order.length*4&&seen.at(-1)!==order.at(-1);i++){await page.keyboard.press("Tab");const id=await page.evaluate(()=>document.activeElement.id);if(id!==seen.at(-1))seen.push(id);}
 assert.deepEqual(seen,order,"tab order follows the form");
 // The expense form too, and its help notes are read with their fields.
 const corder=await page.evaluate(()=>[...document.querySelectorAll("#cost-form input,#cost-form select,#cost-form textarea,#cost-form button")].filter(e=>!e.disabled&&!e.hidden&&(e.offsetWidth||e.offsetHeight)).map(e=>e.id));
 await page.locator("#"+corder[0]).focus();const cseen=[corder[0]];
 for(let i=0;i<corder.length*4&&cseen.at(-1)!==corder.at(-1);i++){await page.keyboard.press("Tab");const id=await page.evaluate(()=>document.activeElement.id);if(id!==cseen.at(-1))cseen.push(id);}
 assert.deepEqual(cseen,corder,"tab order follows the expense form");
 const help=await page.evaluate(()=>["cost-business-use","cost-payment-account"].map(id=>{const d=document.getElementById(id).getAttribute("aria-describedby");return d&&document.getElementById(d)?document.getElementById(d).textContent:"";}));
 assert.match(help[0],/A blank is unknown, not 0%/);assert.match(help[1],/Never enter a full card or account number/);
 const orphanHelp=await page.evaluate(()=>[...document.querySelectorAll("#view-ledger form p.muted")].filter(p=>!p.id||!document.querySelector('[aria-describedby~="'+p.id+'"]')).map(p=>p.textContent.slice(0,40)));
 assert.deepEqual(orphanHelp,[],"every help note in a ledger form is linked to its field");
 await page.locator("#receipt-label").focus();await page.keyboard.press("Shift+Tab");await page.keyboard.press("Tab");
 const ring=await page.evaluate(()=>{const c=getComputedStyle(document.activeElement);return [document.activeElement.id,c.outlineStyle,parseFloat(c.outlineWidth)];});
 assert.equal(ring[0],"receipt-label");assert.notEqual(ring[1],"none","keyboard focus is visible");assert.ok(ring[2]>=2);}
// The populated ledger view, including the long category and reconciliation labels, fits 320, 375 and 430 px widths.
for(const width of [320,375,430]){
  await page.setViewportSize({width,height:800});
  assert.match(await page.locator("#report-preview").textContent(),/Reconciliation evidence/);
  // Compare with the set width: phone emulation widens window.innerWidth to fit overflowing content.
  const bad=await page.evaluate(w=>{const out=[];
    if(window.innerWidth>w+1)out.push("layout viewport widened to "+window.innerWidth);
    if(document.documentElement.scrollWidth>w+1)out.push("page scrolls sideways: "+document.documentElement.scrollWidth);
    document.querySelectorAll("#view-ledger .accountant-line, #view-ledger .accountant-line > *, #view-ledger td, #view-ledger .entry, #view-ledger input, #view-ledger select, #view-ledger button, #view-ledger textarea").forEach(el=>{
      const r=el.getBoundingClientRect();if(r.width&&(r.right>w+1||r.left<-1))out.push((el.id||el.className||el.tagName)+" right="+Math.round(r.right));});
    return out;},width);
  assert.deepEqual(bad,[],"ledger view overflows at "+width+"px");
}
assert.equal(await page.evaluate(()=>localStorage.length+sessionStorage.length),0);
assert.deepEqual(errors,[]);
await browser.close();server.close();
console.log("IncomeOS accounting editor workspace-mode browser QA passed: locked without workspace, add/edit/delete, encrypted save, reload, reopen, no browser storage.");
