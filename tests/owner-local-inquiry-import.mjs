// Pure, synthetic local CSV imports for owner fallback. No contacts or network calls.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parseCsv,normalizeInquiries,exportInquiries} from '../assets/jrs-owner-local-inquiries.mjs';
let checked=0;
function check(name,fn){fn();checked++;console.log('PASS '+name);}
const csv='date,category,name,email,organization,message,consent_to_contact,_id\n'
  +'2026-11-01,method,"Test, A",test-a@example.test,Test Org,"Message with commas, and ""quotes""",true,test_12345678\n'
  +'2026-11-02,general,Test B,test-b@example.test,,"Multi-line\nmessage",false,test_23456789';
check('quoted commas, double-quotes and multiline fields',()=>{
  const d=parseCsv('\uFEFF'+csv);
  assert.equal(d.records.length,2);
  assert.equal(d.records[0][2],'Test, A');
  assert.equal(d.records[0][5],'Message with commas, and "quotes"');
  assert.equal(d.records[1][5],'Multi-line\nmessage');
});
check('normalization never promotes self-declared contact consent to transfer rights',()=>{
  const rows=normalizeInquiries(csv);
  assert.equal(rows.length,2);
  assert.equal(rows[0].contact,'self-declared yes');
  assert.equal(rows[1].contact,'self-declared no');
  assert.equal(rows[0].status,'not_recorded');
  assert.ok(!('transfer_permission' in rows[0]));
});
check('missing required headers and inconsistent row lengths are rejected',()=>{
  assert.throws(()=>normalizeInquiries('email,name\nx@example.test,A'),/csv_missing_required_headers/);
  assert.throws(()=>parseCsv('email,message\nx@example.test'),/csv_column_mismatch/);
  assert.throws(()=>parseCsv('email,message\nx@example.test,Okay,extra'),/csv_column_mismatch/);
  assert.throws(()=>parseCsv('email,message,email\nx@example.test,Hi,x@example.test'),/csv_duplicate_header/);
});
check('malformed and oversize content cannot silently truncate evidence',()=>{
  assert.throws(()=>parseCsv('email,message\n"unclosed,body'),/csv_unclosed_quote/);
  assert.throws(()=>parseCsv('email,message\nx@example.test,'+'z'.repeat(5001)),/csv_field_limit/);
  assert.throws(()=>parseCsv('email,message\nx@example.test,Body\n'.repeat(2002)),/csv_row_limit/);
  assert.throws(()=>parseCsv('x'.repeat(1024*1024+1)),/csv_size_limit/);
});
check('CSV export neutralizes spreadsheet formulas without stripping original records',()=>{
  const entries=normalizeInquiries('email,message,name\nx@example.test,Valid,=1+1');
  entries[0].status='needs_review';
  const out=exportInquiries(entries);
  assert.ok(out.startsWith('\uFEFF'));
  assert.ok(out.includes('"\'=1+1"'));
  assert.ok(out.includes('"needs_review"'));
  assert.equal(entries[0].name,'=1+1');
});
check('local preview is isolated from verified inbox and page analytics',()=>{
  const dashboard=readFileSync(new URL('../programme-status-9872fb93cc94.html',import.meta.url),'utf8');
  const script=readFileSync(new URL('../assets/jrs-owner-local-inquiries.mjs',import.meta.url),'utf8');
  for(const id of ['local-inquiry-review','current-inquiry-local-csv','current-inquiry-local-rows','current-inquiry-local-status']){
    assert.ok(dashboard.includes('id="'+id+'"'),id);
  }
  assert.ok(dashboard.includes('type="module" src="/assets/jrs-owner-local-inquiries.mjs"'));
  assert.ok(dashboard.includes('No CSV data is uploaded'));
  for(const forbidden of ['fetch(', 'XMLHttpRequest','navigator.sendBeacon','localStorage','sessionStorage','gtag(', 'postMessage(','indexedDB']){
    assert.ok(!script.includes(forbidden),'unexpected data channel: '+forbidden);
  }
  assert.ok(script.includes("document.createElement('td')"));
  assert.ok(script.includes('td.textContent='));
  assert.ok(script.includes('input.files?.[0]'));
  assert.ok(script.includes('window.confirm'));
  assert.ok(!dashboard.includes('googletagmanager.com/gtag/js'));
});
console.log('PASS '+checked+' locally held, non-tracking CSV review assertions');
