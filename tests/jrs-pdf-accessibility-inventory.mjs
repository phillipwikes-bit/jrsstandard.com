// Evidence inventory only. PDF bytes remain frozen and published versions unchanged.
// Structural-marker absence is a blocker, never a substitute for PDF/UA testing.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';

const read = p => readFileSync(new URL('../'+p, import.meta.url));
const manifest = JSON.parse(read('docs/JRS_Published_PDF_Identity_Manifest.json').toString('utf8'));
assert.equal(manifest.schema, 'jrs-published-pdf-identity.v1');
assert.equal(manifest.assets.length,9);
const statuses = manifest.assets.map(asset=>{
  const bytes=read(asset.file), latin1=bytes.toString('latin1');
  const checksum=createHash('sha1').update('blob '+bytes.length+'\0').update(bytes).digest('hex');
  assert.equal(checksum,asset.blob_sha,'edited published PDF identity: '+asset.file);
  const tags= /\/StructTreeRoot\b/.test(latin1);
  const markInfo=/\/MarkInfo\s*<</.test(latin1);
  const language=/\/Lang\s*(?:\(|<)/.test(latin1);
  return {
    file:asset.file,
    edition:asset.edition || 'edition recorded in source manifest',
    structuralTagMarker:tags,
    markedContentDeclaration:markInfo,
    catalogLanguageMarker:language,
    screenReaderOrderVerified:false,
    PDFUAConformanceVerified:false,
    manualVerification:'NOT ASSESSED',
    status:tags&&markInfo?'STRUCTURE_REVIEW_REQUIRED':'TAGGING_NOT_EVIDENCED'
  };
});
const editions=read('editions.html').toString('utf8');
assert.match(editions,/Published PDF tagging and reading order have not been independently certified/i);
assert.match(editions,/Request an accessible format/i);
for (const row of statuses) console.log('PDF-ACCESSIBILITY-INVENTORY '+JSON.stringify(row));
const blockers=statuses.filter(x=>x.status==='TAGGING_NOT_EVIDENCED');
console.log('RESULT: '+statuses.length+' published editions inventoried; '+blockers.length+
  ' lack visible tagging markers. FULL PDF ACCESSIBILITY: NOT CERTIFIED.');
console.log('This inventory does not test semantic tag order, alternative text, reading order, form controls, device VoiceOver or independent PDF/UA conformance.');
