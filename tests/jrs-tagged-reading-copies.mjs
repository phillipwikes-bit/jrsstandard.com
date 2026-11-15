// Technical checks only. PDF tags and text extraction do not establish PDF/UA,
// WCAG, screen-reader usability, or the reading order experienced by a person.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';

const root=fileURLToPath(new URL('../',import.meta.url));
const resources=readFileSync(join(root,'resources.html'),'utf8');
const research=readFileSync(join(root,'research.html'),'utf8');
const manifest=JSON.parse(readFileSync(join(root,'docs/JRS_Tagged_Reading_Copy_Manifest_2026-11-15.json'),'utf8'));
assert.equal(manifest.schema,'jrs-tagged-reading-copy-manifest.v1');
assert.equal(manifest.accessibility_certified,false);
assert.equal(manifest.approved_to_replace_original_pdfs,false);
assert.equal(manifest.copies.length,2);
const blobSha=(path)=>{
 const data=readFileSync(join(root,path));
 return createHash('sha1').update('blob '+data.length+'\0').update(data).digest('hex');
};
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
for(const item of manifest.copies){
 const {original,original_blob_sha,source,source_blob_sha,reading_copy:readingCopy,reading_copy_blob_sha,pages}=item;
 const path=join(root,readingCopy);
 assert.equal(blobSha(original),original_blob_sha,'Original published edition changed: '+original);
 assert.equal(blobSha(source),source_blob_sha,'Authoritative source changed: '+source);
 assert.equal(blobSha(readingCopy),reading_copy_blob_sha,'Tagged reading copy changed without manifest update: '+readingCopy);
 const signature=readFileSync(path).subarray(0,5).toString('ascii');
 assert.equal(signature,'%PDF-',readingCopy+' is not a PDF');
 assert.ok(resources.includes('href="'+readingCopy+'"'),'Missing Resources link: '+readingCopy);
 assert.ok(research.includes('href="'+readingCopy+'"'),'Missing Research link: '+readingCopy);
 const info=run('pdfinfo',[path]);
 assert.match(info,/^Tagged:\s+yes\s*$/m,'Reading copy lacks PDF tags: '+readingCopy);
 assert.match(info,new RegExp('^Pages:\\s+'+pages+'\\s*$','m'),'Unexpected page count: '+readingCopy);
 const sourceTokens=tokenized(run('pdftotext',[join(root,original),'-']));
 const copyTokens=tokenized(run('pdftotext',[path,'-']));
 assert.ok(copyTokens.length>500,'Reading copy is missing extractable document text: '+readingCopy);
 const coverage=alignmentCoverage(sourceTokens,copyTokens);
 assert.ok(coverage>=0.99,readingCopy+' text coverage below 99%: '+coverage);
 console.log('PASS '+readingCopy+': tagged PDF; '+copyTokens.length+' extractable tokens; '+(coverage*100).toFixed(2)+'% text alignment to published PDF. Not accessibility certification.');
}
