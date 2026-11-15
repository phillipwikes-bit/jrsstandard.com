/*
 * Automated, browser-rendered WCAG rule diagnostic. Does not constitute a
 * complete WCAG-EM evaluation, screen-reader test, or accessibility certificate.
 * Produces criterion-linked findings for human triage and remediation.
 */
import {readdirSync, writeFileSync, mkdirSync} from 'node:fs';
import {dirname,join} from 'node:path';
import {createRequire} from 'node:module';

const require=createRequire(import.meta.url);
const {chromium}=require('playwright-core');
const axeScript=require.resolve('axe-core/axe.min.js');
const browserExecutable=process.env.JRS_BROWSER;
if(!browserExecutable)throw new Error('JRS_BROWSER is required');
const root=process.cwd();
const base=process.env.JRS_LOCAL_BASE||'http://127.0.0.1:8791';
const report=process.env.JRS_A11Y_REPORT||'/tmp/jrs-browser-axe-report.json';
const exclusions=new Set(['research','tests','templates','scripts','node_modules','.git','.vercel']);
const routeExclusions=/^(?:owner-|programme-status-|acquisition-)/;
const publicRoutes=[];

function inventory(directory,relative=''){
  for(const entry of readdirSync(directory,{withFileTypes:true})){
    const name=relative?`${relative}/${entry.name}`:entry.name;
    if(entry.isDirectory()&&!entry.name.startsWith('.')&&!exclusions.has(entry.name))inventory(join(directory,entry.name),name);
    if(entry.isFile()&&entry.name.endsWith('.html')&&!routeExclusions.test(entry.name))publicRoutes.push('/'+name);
  }
}
inventory(root);
publicRoutes.sort();

// The complete public route inventory is evaluated on a narrow phone viewport.
// High-traffic journeys also receive a desktop-width diagnostic.
const desktopRoutes=new Set([
  '/index.html','/resources.html','/research.html','/check.html','/training.html',
  '/investigator-guides.html','/jrsstandard.html','/right-to-know-why.html',
  '/decisions-you-can-defend.html','/contact.html','/about.html','/editions.html',
  '/privacy.html','/organization.html','/methodology.html','/evidence-ledger.html',
]);
const tasks=publicRoutes.flatMap(route=>[
  {route,width:390},
  ...(desktopRoutes.has(route)?[{route,width:1440}]:[]),
]);

const browser=await chromium.launch({executablePath:browserExecutable,headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
const findings=[];
let next=0;
async function worker(){
  const context=await browser.newContext({viewport:{width:390,height:844}});
  const page=await context.newPage();
  page.setDefaultTimeout(15000);
  while(next<tasks.length){
    const task=tasks[next++];
    try{
      await page.setViewportSize({width:task.width,height:900});
      const response=await page.goto(base+task.route,{waitUntil:'domcontentloaded',timeout:15000});
      if(!response?.ok())throw new Error(`HTTP ${response?.status()}`);
      await page.addScriptTag({path:axeScript});
      const results=await page.evaluate(async()=>{
        const evaluated=await window.axe.run(document,{
          runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']},
        });
        return {
          violations:evaluated.violations.map(v=>({
            id:v.id,impact:v.impact,help:v.help,helpUrl:v.helpUrl,tags:v.tags,
            nodes:v.nodes.map(n=>({target:n.target,failureSummary:n.failureSummary,html:n.html.slice(0,300)})),
          })),
          incomplete:evaluated.incomplete.map(v=>({id:v.id,nodes:v.nodes.length})),
          passes:evaluated.passes.length,
        };
      });
      findings.push({...task,...results});
      console.log(`${task.width}px ${task.route}: ${results.violations.length} failing rules; ${results.violations.reduce((sum,v)=>sum+v.nodes.length,0)} affected nodes`);
    }catch(error){
      findings.push({...task,error:String(error.message||error).slice(0,500)});
      console.error(`${task.width}px ${task.route}: DIAGNOSTIC ERROR ${String(error.message||error).slice(0,140)}`);
    }
  }
  await context.close();
}
await Promise.all([worker(),worker(),worker()]);
await browser.close();
findings.sort((a,b)=>a.route.localeCompare(b.route)||a.width-b.width);
const totals={
  routes:publicRoutes.length,evaluations:findings.length,
  errors:findings.filter(x=>x.error).length,
  violatingEvaluations:findings.filter(x=>x.violations?.length).length,
  violationNodes:findings.reduce((total,f)=>total+(f.violations||[]).reduce((sum,v)=>sum+v.nodes.length,0),0),
};
mkdirSync(dirname(report),{recursive:true});
writeFileSync(report,JSON.stringify({
  title:'JRS browser-rendered automated accessibility diagnostic',
  limits:'Not independent WCAG 2.2 AA conformance, PDF/UA, physical-device, or assistive-technology acceptance.',
  browser:'Chromium',tags:['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa'],
  totals,findings,
},null,2)+'\n');
console.log('TOTALS '+JSON.stringify(totals));
if(totals.errors)process.exitCode=1;
