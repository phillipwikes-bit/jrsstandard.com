// Extract and audit text in JRS's published PDF inventory.
// This does not replace a visual page-by-page editorial review.
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const files=[
'JRS-Standard.pdf','JRS_Rapid_Review_Card.pdf',
'JRS_Investigator_Field_Guide_Employment.pdf',
'JRS_Investigator_Field_Guide_FairHousing.pdf',
'JRS_Investigator_Field_Guide_International.pdf',
'JRS_Research_Paper.pdf','JRS_Reliability_Accuracy.pdf','DRR_Article.pdf',
'JRS_Investigator_Field_Guide.pdf','JRS-Reference-9d4f2a7c.pdf'
];
const results=[];
for(const f of files){
 const path=join(root,f);
 assert.ok(existsSync(path),'missing downloadable PDF '+f);
 let text;
 try{text=execFileSync('pdftotext',['-layout',path,'-'],{encoding:'utf8',maxBuffer:20000000,timeout:30000});}
 catch(e){throw Error('PDF extraction failed for '+f+': '+e.message);}
 const plain=text.replace(/\s+/g,' ').trim();
 assert.ok(plain.length>=100,'PDF content is too short to verify: '+f);
 assert.ok(/JRS|Justification Review Standard|Decision Reconstruction Risk|Investigat|Record/i.test(plain),
 'PDF title/content appears unrelated to JRS: '+f);
 const first=plain.slice(0,300);
 const matches=[...plain.matchAll(/\b(?:Version|Edition|Rev(?:ision)?\.?|v)\s*[:.]?\s*(\d+\.\d+(?:\.\d+)?)/gi)]
  .slice(0,8).map(x=>x[0]);
 let pages=null;
 try{const info=execFileSync('pdfinfo',[path],{encoding:'utf8',timeout:30000});
 pages=Number((info.match(/^Pages:\s*(\d+)/m)||[])[1]||0);}
 catch(e){pages=null;}
 if(/Investigator_Field_Guide_(Employment|FairHousing|International)|Reliability_Accuracy/.test(f))
  console.log('PDF-CONTENT-CHECK '+JSON.stringify({file:f,excerpt:plain.slice(0,6500),
  terms:['Reconstructability','Reconstruction','Basis Identification','Chronology','Decision-Process Traceability','Evidentiary Sufficiency','83.9','accuracy','preliminary','ongoing'].filter(x=>new RegExp(x,'i').test(plain))}));
 results.push({file:f,pages,chars:plain.length,versions:matches,head:first});
}
for(const d of results)console.log('PDF-AUDIT '+JSON.stringify(d));
const pdf=results.find(x=>x.file==='JRS-Standard.pdf');
assert.ok(/Version\s+2\.0/i.test(pdf.head)||/\bVersion\s+2\.0\b/i.test(
 execFileSync('pdftotext',['-layout',join(root,'JRS-Standard.pdf'),'-'],{encoding:'utf8',maxBuffer:20000000})),
 'published JRS Standard PDF must self-identify as Version 2.0');
const guidePaths=['JRS_Investigator_Field_Guide_Employment.pdf',
 'JRS_Investigator_Field_Guide_FairHousing.pdf',
 'JRS_Investigator_Field_Guide_International.pdf'];
for(const name of guidePaths){
 const text=execFileSync('pdftotext',['-layout',join(root,name),'-'],{encoding:'utf8',maxBuffer:20000000});
 for(const c of ['Reconstructability','Chronology'])assert.ok(
  new RegExp(c,'i').test(text),name+' missing core requirement '+c);
}
const ref=results.find(x=>x.file==='JRS-Reference-9d4f2a7c.pdf');
console.log('REFERENCE-PAGE-COUNT '+ref.pages+
 ' (site labels it a 19-page reference; investigate if different).');
console.log('PASS: '+results.length+
 ' published PDFs are machine-readable; Standard identity and core guide terms checked.');
