// JRS published PDF accessibility technical preflight.
// Not a PDF/UA, WCAG, Section 508, VoiceOver, reading-order or screen-reader
// certification. Never silently rewrite versioned publication binaries.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url));
const manifest=JSON.parse(readFileSync(join(root,'docs/JRS_Published_PDF_Identity_Manifest.json'),'utf8'));
assert.equal(manifest.schema,'jrs-published-pdf-identity.v1');
const listed=manifest.assets.map(a=>a.file);
assert.equal(listed.length,9,'Published identity inventory must have nine assets');
assert.equal(new Set(listed).size,9,'Duplicated published PDF identity');
const files=[...listed,'DRR_Article.pdf'];
assert.equal(new Set(files).size,10,'PDF technical preflight requires ten unique PDFs');

const output=[];
const get=(text,label)=>{
 const escaped=label.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
 const m=text.match(new RegExp('^'+escaped+':\\s*(.+)$','mi'));
 return m?.[1]?.trim()||null;
};
const run=(command,args)=>{
 try {return execFileSync(command,args,{cwd:root,encoding:'utf8',timeout:60000,maxBuffer:25_000_000});}
 catch(error){throw Error(command+' failed for '+String(args.at(-1)||'PDF')+': '+(error?.status??'unknown'));}
};
for(const file of files){
 const bytes=readFileSync(join(root,file));
 assert.equal(bytes.subarray(0,5).toString('ascii'),'%PDF-','Unexpected file signature: '+file);
 const identity=manifest.assets.find(a=>a.file===file);
 if(identity){
  assert.equal(bytes.length,identity.bytes,'Published size mismatch: '+file);
  const hash=createHash('sha1').update('blob '+bytes.length+'\\0').update(bytes).digest('hex');
  assert.equal(hash,identity.blob_sha,'Controlled publication identity mismatch: '+file);
 }
 const info=run('pdfinfo',['-isodates',join(root,file)]);
 const pages=Number(get(info,'Pages'));
 const tagged=(get(info,'Tagged')||'').toLowerCase();
 const encrypted=get(info,'Encrypted');
 assert.ok(Number.isInteger(pages)&&pages>0,'Unparseable PDF page count: '+file);
 assert.ok(['yes','no'].includes(tagged),'Missing PDF tagging result from Poppler: '+file);
 assert.ok(encrypted,'Missing PDF encryption result from Poppler: '+file);
 const text=run('pdftotext',['-enc','UTF-8',join(root,file),'-']);
 const visible=text.replace(/\\s+/g,' ').trim();
 const textExtractable=visible.length>=100;
 // Text extraction is useful evidence of selectable text, NOT reading order.
 const record={
  file,pages,bytes:bytes.length,pdf_version:get(info,'PDF version'),
  tagged,encrypted:encrypted.toLowerCase().startsWith('no')?'no':'yes_or_other',
  extracted_text_characters:visible.length,text_extractable:textExtractable,
  source_locked:!!identity,accessibility_certified:false,
  outstanding_human_checks:[
   'semantic structure and heading hierarchy','reading order','tables and lists',
   'links and purpose','document language','graphics and alternative text',
   'contrast and reflow','assistive technology and PDF/UA checks'
  ]
 };
 output.push(record);
 console.log('PDF-A11Y-PREFLIGHT '+JSON.stringify({
  file:record.file,pages:record.pages,tagged:record.tagged,
  text_extractable:record.text_extractable,extracted_text_characters:record.extracted_text_characters
 }));
 if(tagged==='no') console.log('::warning file='+file+'::Untagged published PDF; requires controlled source-based remediation or documented release disposition.');
 if(!textExtractable) console.log('::warning file='+file+'::Insufficient extractable PDF text; manual assessment required.');
}
const report={
 schema:'jrs-pdf-accessibility-technical-preflight.v1',
 scope:'published JRS PDF binaries on the checked-out commit',
 tool:'Poppler pdfinfo and pdftotext',
 result:'technical inventory only; not accessibility acceptance',
 approved_to_reissue_pdfs:false,
 publication_binaries_modified:false,
 documents:output,
 totals:{
  files:output.length,tagged:output.filter(x=>x.tagged==='yes').length,
  untagged:output.filter(x=>x.tagged==='no').length,
  text_extractable:output.filter(x=>x.text_extractable).length,
  pending_full_accessibility_review:output.length
 }
};
const out=join(root,'.jrs-ci','pdf-accessibility-preflight.json');
mkdirSync(join(root,'.jrs-ci'),{recursive:true});
writeFileSync(out,JSON.stringify(report,null,2)+'\\n');
console.log('PRECHECK INVENTORY '+JSON.stringify(report.totals));
console.log('REPORT: .jrs-ci/pdf-accessibility-preflight.json');
console.log('NOT CERTIFIED: PDF/UA, WCAG, Section 508, reading order, tagging quality, VoiceOver or physical iPhone Safari.');
