import {readFileSync} from 'node:fs';
// Keep inspection coverage aligned with the current public discovery surface.
// Source-only and non-indexed legacy pages are covered separately by their tests.
export const sitemapPages=[...readFileSync(new URL('../../sitemap.xml',import.meta.url),'utf8')
 .matchAll(/<loc>([^<]+)<\/loc>/g)].map(([,url])=>{
 const path=new URL(url).pathname.replace(/^\//,'');
 return !path?'index.html':path.endsWith('/')?path+'index.html':path;
});
