// Exact published PDF identity guard. Not a PDF typography or accessibility test.
// The institutional print template is a target for an explicitly versioned reissue;
// it must not be mistaken for permission to silently replace published editions.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';

const load=path=>readFileSync(new URL('../'+path,import.meta.url));
const manifest=JSON.parse(load('docs/JRS_Published_PDF_Identity_Manifest.json').toString('utf8'));
assert.equal(manifest.schema,'jrs-published-pdf-identity.v1');
assert.equal(manifest.assets.length,9,'nine distinct actively linked publication assets expected');
const files=new Set();
for(const asset of manifest.assets){
  assert.ok(!files.has(asset.file),'duplicate publication identity: '+asset.file);
  files.add(asset.file);
  assert.match(asset.blob_sha,/^[a-f0-9]{40}$/);
  const pdf=load(asset.file);
  assert.equal(pdf.length,asset.bytes,'unexpected published PDF size: '+asset.file);
  assert.equal(pdf.subarray(0,5).toString('ascii'),'%PDF-');
  const sha=createHash('sha1').update('blob '+pdf.length+'\0').update(pdf).digest('hex');
  assert.equal(sha,asset.blob_sha,
    'published PDF changed without a documented controlled source-based reissue: '+asset.file);
}
const standard=manifest.assets.find(a=>a.file==='JRS-Standard.pdf');
assert.equal(standard.edition,'Version 2.0 (2026)');
assert.equal(standard.authoritative_editable_master_verified,false,
  'do not claim an authoritative editable Standard master without its verification');
console.log('PASS: exact original binary identities for all nine linked published PDFs, with JRS Standard v2.0 edition guard.');
