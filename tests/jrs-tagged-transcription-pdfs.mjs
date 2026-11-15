// Published source files remain locked. These are qualified tagged-text copies,
// not PDF/UA, WCAG, independent reading-order or assistive-technology acceptance.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url));
const manifest=JSON.parse(readFileSync(join(root,'docs/JRS_Tagged_Transcription_PDF_Manifest_2026-11-15.json'),'utf8'));
const originalManifest=JSON.parse(readFileSync(join(root,'docs/JRS_Published_PDF_Identity_Manifest.json'),'utf8'));
const resources=readFileSync(join(root,'resources.html'),'utf8');
assert.equal(manifest.schema,'jrs-tagged-transcription-pdf-manifest.v1');
assert.equal(manifest.copies.length,8);
assert.equal(manifest.original_publication_binaries_modified,false);
assert.equal(manifest.approved_to_replace_original_pdfs,false);
assert.equal(manifest.accessibility_certified,false);
assert.equal(manifest.physical_screen_reader_acceptance,false);
const sha=(path)=>{const bytes=readFileSync(join(root,path));return createHash('sha1').update('blob '+bytes.length+'\0').update(bytes).digest('hex')};
const run=(name,args)=>execFileSync(name,args,{encoding:'utf8',maxBuffer:30_000_000,timeout:60000});
const words=(str)=>str.toLowerCase().match(/[a-z0-9]{2,}/g)||[];
function coverage(source,copy){
 const counts=new Map();
 for(const term of words(copy))counts.set(term,(counts.get(term)||0)+1);
 let overlap=0;const sourceWords=words(source);
 for(const term of sourceWords){const count=counts.get(term)||0;if(count){overlap++;counts.set(term,count-1)}}
 return overlap/sourceWords.length;
}
for(const item of manifest.copies){
 const locked=originalManifest.assets.find(x=>x.file===item.original);
 assert.ok(locked,'Not a controlled PDF identity: '+item.original);
 assert.equal(locked.blob_sha,item.original_blob_sha);
 assert.equal(sha(item.original),item.original_blob_sha,'Original publication altered: '+item.original);
 assert.equal(sha(item.source),item.source_blob_sha,'HTML transcription drift: '+item.source);
 assert.equal(sha(item.reading_copy),item.reading_copy_blob_sha,'Tagged alternative changed without review: '+item.reading_copy);
 assert.ok(resources.includes('href="'+item.reading_copy+'"'),'Missing resource link: '+item.reading_copy);
 const info=run('pdfinfo',[join(root,item.reading_copy)]);
 assert.match(info,/^Tagged:\s+yes\s*$/m,'Missing structural tags: '+item.reading_copy);
 assert.match(info,/^Encrypted:\s+no\s*$/m,'Unexpected encryption: '+item.reading_copy);
 assert.match(info,new RegExp('^Pages:\\s+'+item.pdf_pages+'\\s*$','m'));
 const sourceText=run('pdftotext',[join(root,item.original),'-']);
 const taggedText=run('pdftotext',[join(root,item.reading_copy),'-']);
 const score=coverage(sourceText,taggedText);
 assert.ok(score>=0.99,'Less than 99% of substantive published tokens found: '+item.reading_copy+' '+score);
 assert.ok(Math.abs(score-item.text_token_coverage)<0.0001,'Manifest text coverage drift: '+item.reading_copy);
 console.log('PASS '+item.reading_copy+': Tagged yes, content recall '+(100*score).toFixed(2)+'%, original unchanged. Not certified.');
}
