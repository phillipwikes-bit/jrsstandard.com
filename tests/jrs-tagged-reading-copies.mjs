// Technical checks only. PDF tags and text extraction do not establish PDF/UA,
// WCAG, screen-reader usability, or the reading order experienced by a person.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';

const root=fileURLToPath(new URL('../',import.meta.url));
const resources=readFileSync(join(root,'resources.html'),'utf8');
const research=readFileSync(join(root,'research.html'),'utf8');
const entries=[
 ['DRR_Article.pdf','accessible/DRR_Article_Tagged_Reading_Copy.pdf'],
 ['JRS_Research_Paper.pdf','accessible/JRS_Research_Paper_Tagged_Reading_Copy.pdf']
];
const run=(name,args)=>execFileSync(name,args,{encoding:'utf8',maxBuffer:20_000_000,timeout:60_000});
const tokenized=(str)=>str.toLowerCase().normalize('NFKC').replace(/\u00ad/g,'').replace(/[\u2010-\u2015\u2212]/g,'-').match(/[a-z0-9]+/g)||[];
// Approximate a monotone word alignment; recurring page headers and pagination
// in the original published PDF should not count as missing manuscript text.
function alignmentCoverage(original,copy){
 const prior=new Uint16Array(copy.length+1);
 const next=new Uint16Array(copy.length+1);
 for(const word of original){
  for(let j=1;j<=copy.length;j++) next[j]=word===copy[j-1]?prior[j-1]+1:Math.max(next[j-1],prior[j]);
  prior.set(next);
 }
 return prior[copy.length]/copy.length;
}
for(const [original,readingCopy] of entries){
 const path=join(root,readingCopy);
 const signature=readFileSync(path).subarray(0,5).toString('ascii');
 assert.equal(signature,'%PDF-',readingCopy+' is not a PDF');
 assert.ok(resources.includes('href="'+readingCopy+'"'),'Missing Resources link: '+readingCopy);
 assert.ok(research.includes('href="'+readingCopy+'"'),'Missing Research link: '+readingCopy);
 const info=run('pdfinfo',[path]);
 assert.match(info,/^Tagged:\s+yes\s*$/m,'Reading copy lacks PDF tags: '+readingCopy);
 assert.match(info,/^Pages:\s+[1-9][0-9]*\s*$/m,'No pages: '+readingCopy);
 const sourceTokens=tokenized(run('pdftotext',[join(root,original),'-']));
 const copyTokens=tokenized(run('pdftotext',[path,'-']));
 assert.ok(copyTokens.length>500,'Reading copy is missing extractable document text: '+readingCopy);
 const coverage=alignmentCoverage(sourceTokens,copyTokens);
 assert.ok(coverage>=0.99,readingCopy+' text coverage below 99%: '+coverage);
 console.log('PASS '+readingCopy+': tagged PDF; '+copyTokens.length+' extractable tokens; '+(coverage*100).toFixed(2)+'% text alignment to published PDF. Not accessibility certification.');
}
