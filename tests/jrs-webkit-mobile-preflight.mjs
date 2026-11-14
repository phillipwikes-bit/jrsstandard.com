// Controlled cross-engine source preflight. WebKit on Linux is not Safari on
// an iPhone and does not prove Safari toolbar, Home Screen or VoiceOver behavior.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile, mkdir, writeFile} from 'node:fs/promises';
import {resolve, dirname, extname, sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {webkit} from 'playwright';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
// Reuse the same independently-guarded route inventory as the 68-route
// Chromium audit and protected hosted-source verifier. This avoids a small,
// stale hand-curated WebKit sample silently passing after public routes grow.
const audit=await readFile(resolve(root,'tests/jrs-sitewide-mobile-browser-audit.html'),'utf8');
const match=audit.match(/const paths=(\[[^\n;]*\]);/);
assert.ok(match,'Source route fixture missing');
const sourceRoutes=JSON.parse(match[1]);
assert.equal(sourceRoutes.length,68,'WebKit must cover all 68 institutional routes');
assert.equal(new Set(sourceRoutes).size,68,'Duplicate institutional source routes');
for(const route of sourceRoutes){
 assert.match(route,/^(?:[a-z0-9-]+\/)*[a-z0-9-]+\.html$/,'Invalid source route '+route);
}
// Two additional contact routes exercise actual category preselection from
// the public PDF accessibility and archived security-question CTAs. These
// are read-only browser tests: no contact inquiry is submitted.
const routes=[...sourceRoutes,'contact.html?category=accessibility','contact.html?category=organization'];
assert.equal(routes.length,70);
const widths=[320,390,430];
// Representative public, research, campaign, reference and archived routes.
// Unlike the sitewide initial-state audit, these exercise real pointer and
// keyboard navigation. The 68-page baseline remains independently required.
const navInteractionRoutes=new Set([
 'index.html','resources.html','training.html','jrsstandard.html',
 'right-to-know-why.html','decisions-you-can-defend.html',
 'reference/index.html','reviewer/evaluation.html','security.html',
 'contact.html?category=organization'
]);
const mime={
 '.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8',
 '.js':'application/javascript; charset=utf-8','.json':'application/json',
 '.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg',
 '.jpeg':'image/jpeg','.webp':'image/webp','.woff2':'font/woff2'
};
const server=createServer(async(req,res)=>{
 try{
  const u=new URL(req.url,'http://127.0.0.1');
  const name=decodeURIComponent(u.pathname);
  const full=resolve(root,'.'+name);
  if(full!==root&&!full.startsWith(root+sep)){res.writeHead(403);res.end();return;}
  const file=full===root?resolve(root,'index.html'):full;
  const data=await readFile(file);
  res.writeHead(200,{'content-type':mime[extname(file)]||'application/octet-stream','cache-control':'no-store'});
  res.end(data);
 }catch(error){res.writeHead(404,{'content-type':'text/plain'});res.end('Not Found');}
});
await new Promise((done,fail)=>{server.once('error',fail);server.listen(0,'127.0.0.1',done);});
const port=server.address().port;
const rows=[];
await mkdir(resolve(root,'.jrs-ci'),{recursive:true});
let browser;
try{
 browser=await webkit.launch({headless:true});
 for(const width of widths){
  const ctx=await browser.newContext({
   viewport:{width,height:900},deviceScaleFactor:2,isMobile:true,hasTouch:true,
   locale:'en-US',colorScheme:'light'
  });
  const page=await ctx.newPage();
  // Do not call public analytics or other third-party services from CI.
  await page.route(/^https?:\/\//,route=>{
   const url=route.request().url();
   if(url.startsWith('http://127.0.0.1:'+port+'/'))return route.continue();
   return route.abort();
  });
  for(const path of routes){
   const response=await page.goto('http://127.0.0.1:'+port+'/'+path,{
    waitUntil:'domcontentloaded',timeout:20000
   });
   await page.waitForTimeout(180);
   const details=await page.evaluate(()=>{
    const root=document.documentElement;
    const body=document.body;
    const theme=document.head.querySelector('meta[name="theme-color"]');
    const el=body?.firstElementChild;
    const top=el?getComputedStyle(el):null;
    const bodyStyle=body?getComputedStyle(body):null;
    const iosRuleActive=CSS.supports('(-webkit-touch-callout: none)');
    // Capture the actual offending elements when an engine detects overflow.
    // No content leaves CI except these bounded diagnostic descriptions.
    const overflowCandidates=root.scrollWidth>innerWidth+1
      ? [...document.body.querySelectorAll('*')].flatMap(el=>{
          const rect=el.getBoundingClientRect(),style=getComputedStyle(el);
          if(rect.width<=0||rect.left>=innerWidth||rect.right<=innerWidth+1||
             style.display==='none'||style.visibility==='hidden')return [];
          return [{tag:el.tagName.toLowerCase(),
            className:String(el.className||'').slice(0,70),
            text:(el.textContent||'').replace(/\\s+/g,' ').trim().slice(0,60),
            left:Math.round(rect.left),right:Math.round(rect.right),
            width:Math.round(rect.width),whiteSpace:style.whiteSpace,
            overflowX:style.overflowX}];
        }).slice(0,12):[];
    const nav=document.querySelector('nav.jrs-sitenav');
    const button=document.querySelector('.jrs-global-nav-toggle');
    return {
     title:document.title,lang:root.lang,hasViewport:!!document.querySelector('meta[name="viewport"]'),
     bodyInstitutional:body?.classList.contains('jrs-institutional')||false,
     theme:theme?.getAttribute('content')||null,
     firstChild:el?.className||null,
     width:innerWidth,scrollWidth:root.scrollWidth,overflowCandidates,
     iosRuleActive,bodyPaddingTop:bodyStyle?.paddingTop||null,
     edgePosition:top?.position||null,edgeTop:top?.top||null,
     edgeHeight:top?.height||null,edgeBackground:top?.backgroundColor||null,
     edgeBackdrop:top?.webkitBackdropFilter||null,
     navPresent:!!nav,togglePresent:!!button,
     toggleExpanded:button?.getAttribute('aria-expanded')||null,
     navToggleControls:button?.getAttribute('aria-controls')||null,
     navId:nav?.id||null,
     accessibilityCategory:document.querySelector('#contact-category')?.value||null,
     contactFallback:!!document.querySelector('a[href^="mailto:info@jrsstandard.com"]')
    };
   });
   const failures=[];
   if(response?.status()!==200)failures.push('page-http-'+response?.status());
   if(!details.title)failures.push('missing-title');
   if(details.lang.toLowerCase()!=='en')failures.push('html-language');
   if(!details.hasViewport)failures.push('viewport');
   if(!details.bodyInstitutional)failures.push('institutional-class');
   if(details.theme?.toLowerCase()!=='#f5f7f8')failures.push('mismatched-browser-theme');
   if(details.firstChild!=='jrs-ios-status-surface')failures.push('first-paint-status-surface');
   if(details.scrollWidth>details.width+1)failures.push('horizontal-overflow-'+details.scrollWidth);
   if(details.navPresent&&(!details.togglePresent||details.navToggleControls!==details.navId||
      details.toggleExpanded!=='false'))failures.push('mobile-navigation-semantics');
   if(path==='contact.html?category=accessibility'){
    if(details.accessibilityCategory!=='accessibility')failures.push('accessible-format-category-not-prefilled');
    if(!details.contactFallback)failures.push('accessible-format-contact-fallback-missing');
   }
   if(path==='contact.html?category=organization'){
    if(details.accessibilityCategory!=='organization')failures.push('organization-inquiry-category-not-prefilled');
    if(!details.contactFallback)failures.push('organization-inquiry-contact-fallback-missing');
   }
   if(details.iosRuleActive){
    if(details.bodyPaddingTop!=='14px')failures.push('ios-status-gap-'+details.bodyPaddingTop);
    if(details.edgePosition!=='fixed'||details.edgeTop!=='0px'||details.edgeHeight!=='10px')
     failures.push('edge-geometry');
    if(details.edgeBackground!=='rgb(245, 247, 248)')failures.push('edge-not-opaque-pale');
    if(details.edgeBackdrop&&details.edgeBackdrop!=='none')failures.push('edge-backdrop-filter');
   }
   let navInteraction=null;
   if(navInteractionRoutes.has(path)){
    if(!details.navPresent){
     failures.push('interaction-nav-missing');
    }else{
     const toggle=page.locator('.jrs-global-nav-toggle');
     const links=page.locator('nav.jrs-sitenav');
     try{
      const toggleVisible=await toggle.isVisible();
      if(!toggleVisible)failures.push('mobile-navigation-toggle-not-visible');
      else{
       await toggle.click({timeout:4000});
       const opened=await toggle.getAttribute('aria-expanded')==='true' &&
        await links.getAttribute('data-open')==='true' && await links.isVisible() &&
        await toggle.getAttribute('aria-label')==='Close site navigation';
       const openScrollWidth=await page.evaluate(()=>document.documentElement.scrollWidth);
       if(!opened)failures.push('mobile-navigation-did-not-open');
       if(openScrollWidth>width+1)failures.push('mobile-navigation-open-overflow-'+openScrollWidth);
       await page.keyboard.press('Escape');
       const closed=await toggle.getAttribute('aria-expanded')==='false' &&
        await links.getAttribute('data-open')==='false' && !(await links.isVisible()) &&
        await toggle.getAttribute('aria-label')==='Open site navigation';
       const focusReturned=await toggle.evaluate(el=>document.activeElement===el);
       if(!closed)failures.push('mobile-navigation-escape-did-not-close');
       if(!focusReturned)failures.push('mobile-navigation-escape-focus-not-restored');
       navInteraction={opened,closed,focusReturned,openScrollWidth};
      }
     }catch(error){
      failures.push('mobile-navigation-interaction-'+error?.name);
     }
    }
   }
   const row={path,width,pass:failures.length===0,failures,iosRuleActive:details.iosRuleActive,
    ...(navInteraction?{navInteraction}:{}),
    theme:details.theme,scrollWidth:details.scrollWidth,bodyPaddingTop:details.bodyPaddingTop,
    edgeBackground:details.edgeBackground,
    ...(failures.length?{overflowCandidates:details.overflowCandidates}: {})};
   rows.push(row);
   if(width===390&&['resources.html','jrsstandard.html','reference/index.html'].includes(path)){
    const name=path.replaceAll('/','-').replace(/\.html$/,'');
    await page.screenshot({path:resolve(root,'.jrs-ci','webkit-'+name+'-390.png'),fullPage:false});
   }
   console.log('WEBKIT-MOBILE '+JSON.stringify(row));
  }
  await ctx.close();
 }
}finally{
 if(browser)await browser.close();
 await new Promise(done=>server.close(done));
}
const results={
 schema:'jrs-webkit-mobile-source-preflight.v1',
 engine:'Playwright WebKit on GitHub-hosted Linux; NOT branded Safari or a physical iPhone',
 source:'local exact-head checkout, not protected Vercel deployment',
 samples:rows,totals:{
  pages:routes.length,widths:widths.length,samples:rows.length,
  failures:rows.filter(x=>!x.pass).length,
  iosRuleActivatedSamples:rows.filter(x=>x.iosRuleActive).length,
  navInteractionSamples:rows.filter(x=>x.navInteraction).length
 },
 incomplete:[
  'iOS system chrome and Home Screen toolbar pixels',
  'physical iPhone Safari/VoiceOver', 'protected hosted preview identity',
  'PDF/UA and independent accessibility conformance'
 ]
};
await mkdir(resolve(root,'.jrs-ci'),{recursive:true});
await writeFile(resolve(root,'.jrs-ci','webkit-mobile-preflight.json'),JSON.stringify(results,null,2)+'\n');
console.log('WEBKIT-TOTALS '+JSON.stringify(results.totals));
console.log('NOT CERTIFIED: iPhone Safari and Home Screen behavior, protected deployment, WCAG or VoiceOver.');
assert.equal(rows.length,routes.length*widths.length,'Incomplete WebKit route/viewport coverage');
assert.equal(results.totals.navInteractionSamples,navInteractionRoutes.size*widths.length,
 'Missing real WebKit mobile navigation interaction evidence');
assert.equal(results.totals.failures,0,'WebKit mobile regressions: '+rows.filter(x=>!x.pass).map(x=>x.path+'@'+x.width+': '+x.failures.join(',')).join('; '));
