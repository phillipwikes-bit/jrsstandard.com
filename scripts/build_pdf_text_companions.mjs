// Reproducible, explicitly qualified text companions for eight published PDFs
// that have no verified editable production master. Never overwrite originals.
// These are not tagged PDF replacements or accessibility certifications.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url));
const check=process.argv.includes('--check');
const manifest=JSON.parse(readFileSync(join(root,'docs/JRS_Published_PDF_Identity_Manifest.json'),'utf8'));
const entries=[
 ['JRS-Standard.pdf','standard-v2-text-reading.html','JRS Standard, version 2.0'],
 ['JRS_Rapid_Review_Card.pdf','rapid-review-card-text-reading.html','JRS Rapid Review Card'],
 ['JRS_Investigator_Field_Guide_Employment.pdf','employment-investigator-guide-text-reading.html','Employment and EEO Investigator Field Guide'],
 ['JRS_Investigator_Field_Guide_FairHousing.pdf','fair-housing-investigator-guide-text-reading.html','Fair Housing and HUD Investigator Field Guide'],
 ['JRS_Investigator_Field_Guide_International.pdf','international-investigator-guide-text-reading.html','International Investigator Field Guide'],
 ['JRS-Reference-9d4f2a7c.pdf','reviewer-reference-text-reading.html','JRS Reviewer Reference'],
 ['JRS_Reliability_Accuracy.pdf','reliability-accuracy-text-reading.html','JRS Reliability and Accuracy Report'],
 ['JRS_Investigator_Field_Guide.pdf','general-investigator-guide-text-reading.html','JRS General Investigator Field Guide']
];
assert.equal(entries.length,8);
const esc=(s)=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
const decode=(s)=>s.replaceAll('&amp;','&').replaceAll('&lt;','<').replaceAll('&gt;','>').replaceAll('&quot;','"').replaceAll('&#39;',"'");
const extractedBlocks=(html)=>[...html.matchAll(/<(?:p|pre) class="source-block">([\s\S]*?)<\/(?:p|pre)>/g)].map(m=>decode(m[1])).join(' ');
const words=(s)=>s.normalize('NFKC').toLowerCase().replace(/\u00ad/g,'').match(/[\p{L}\p{N}]+/gu)||[];
// Poppler versions may reorder positioned columns in the Reviewer Reference.
// Check the full word multiset, rather than byte-equality of those columns,
// so omissions/additions still fail while line-placement differences do not.
const tokenAgreement=(a,b)=>{
 const x=words(extractedBlocks(a)),y=words(extractedBlocks(b));
 if(!x.length||!y.length)return 0;
 const counts=new Map();
 for(const word of x)counts.set(word,(counts.get(word)||0)+1);
 let overlap=0;
 for(const word of y){const n=counts.get(word)||0;if(n>0){overlap++;counts.set(word,n-1);}}
 return (2*overlap)/(x.length+y.length);
};
const encodeBlock=(block)=>{
 const lines=block.split('\n').map(s=>s.trimEnd()).filter(s=>s.trim());
 // Structured/tabular-looking material must retain the original line spacing.
 // Do not pretend this transcription reconstructs inaccessible source tables.
 if(lines.some(s=>/\S {3,}\S/.test(s)) || lines.some(s=>/^\s*[•●▪]\s/.test(s))){
  return `<pre class="source-block">${esc(lines.join('\n'))}</pre>`;
 }
 return `<p class="source-block">${esc(lines.map(s=>s.trim()).join(' '))}</p>`;
};
const render=(file,out,title)=>{
 const meta=manifest.assets.find(a=>a.file===file);
 assert.ok(meta,'Not in controlled published-PDF manifest: '+file);
 const raw=execFileSync('pdftotext',['-enc','UTF-8','-layout',join(root,file),'-'],{encoding:'utf8',maxBuffer:30_000_000});
 const pages=raw.replaceAll('\r\n','\n').split('\f').filter(s=>s.trim());
 assert.ok(pages.length>0,'No text pages extracted for '+file);
 const sections=pages.map((s,i)=>{
  const blocks=s.trim().split(/\n[ \t]*\n+/).filter(x=>x.trim());
  return `<section class="source-page" id="page-${i+1}" aria-labelledby="page-heading-${i+1}">\n<h2 id="page-heading-${i+1}">Original page ${i+1}</h2>\n${blocks.map(encodeBlock).join('\n')}\n</section>`;
 }).join('\n');
 const pageLinks=pages.map((_,i)=>`<li><a href="#page-${i+1}">${i+1}</a></li>`).join('');
 return `<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n<meta name="robots" content="noindex,follow">\n<meta name="color-scheme" content="light">\n<title>${esc(title)} | Text-reading companion | JRS</title>\n<style>\n:root{color-scheme:light}*{box-sizing:border-box}body{margin:0;background:#f5f7f8;color:#193148;font:1rem/1.7 system-ui,-apple-system,Segoe UI,Arial,sans-serif}main{max-width:880px;margin:auto;padding:24px 18px 72px}a{color:#174c75;text-decoration:underline;text-underline-offset:3px}a:focus-visible{outline:3px solid #8d6521;outline-offset:4px}h1{font:700 clamp(1.75rem,3vw,2.4rem)/1.2 Georgia,serif}h2{font-size:1.25rem;margin:0 0 1rem}.notice{border-left:5px solid #7f5e26;padding:16px;background:#fff}.source-page{background:#fff;border:1px solid #c5d0d8;border-radius:6px;padding:24px;margin:26px 0;overflow-wrap:anywhere}.source-block{margin:0 0 1rem}.source-page pre{white-space:pre-wrap;overflow-wrap:anywhere;font:inherit;tab-size:4}.page-nav{padding:0 16px}.page-nav ol{display:flex;flex-wrap:wrap;gap:10px 18px;padding:0;list-style:none}.top{display:inline-block;margin-top:1rem}@media print{body{background:#fff}.source-page{break-before:page;border:0;padding:0}.page-nav{display:none}}\n</style>\n</head>\n<body>\n<main id="top">\n<p><a href="../resources.html">JRS free resources</a></p>\n<h1>${esc(title)}</h1>\n<div class="notice" role="note"><strong>Text-reading companion, not a replacement publication.</strong> This page transcribes selectable text from the separately published <a href="../${esc(file)}">original PDF</a>, which remains the publication of record. Source layout, images, tables, typography, and reading order may not be fully conveyed by automated text extraction. The text has not received independent assistive-technology review or accessibility certification. For help obtaining an alternative format, <a href="../contact.html?category=accessibility">contact JRS</a>. Do not submit confidential case material.</div>\n<nav class="page-nav" aria-label="Original PDF page navigation"><details><summary>Jump to original page (${pages.length} pages)</summary><ol>${pageLinks}</ol></details></nav>\n${sections}\n<p><a class="top" href="#top">Return to top</a> · <a href="../${esc(file)}">View original published PDF</a></p>\n</main>\n</body>\n</html>\n`;
};
for(const [file,name,title] of entries){
 const relative='accessible/'+name;
 const destination=join(root,relative);
 const output=render(file,name,title);
 if(check){
  assert.ok(existsSync(destination),'Missing generated text companion: '+relative);
  const actual=readFileSync(destination,'utf8');
  const expectedPages=(output.match(/class="source-page"/g)||[]).length;
  assert.equal((actual.match(/class="source-page"/g)||[]).length,expectedPages,'Page inventory changed: '+relative);
  assert.ok(actual.includes('not a replacement publication'),'Missing transcription limitation notice: '+relative);
  const agreement=actual===output?1:tokenAgreement(actual,output);
  assert.ok(agreement>=0.99,'Published text content drift in '+relative+': '+agreement);
  console.log('Text content agreement: '+(agreement*100).toFixed(2)+'%');
 }
 else{mkdirSync(dirname(destination),{recursive:true});writeFileSync(destination,output);}
 console.log(`${check?'PASS':'WROTE'} ${relative}`);
}
console.log('These text transcriptions are not PDF/UA, WCAG, or screen-reader certifications.');
