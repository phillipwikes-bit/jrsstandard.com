import test from 'node:test';
import assert from 'node:assert/strict';
import { cognitiveSourceTrace } from '../../lib/ds-n1/cognitive-source-trace.mjs';
import { buildCognitiveControls } from '../../lib/ds-n1/cognitive-controls.mjs';
import { buildReflectiveGuidance } from '../../lib/ds-n1/reflective-guidance.mjs';
const fixture=()=>({
 status:'HOLD', record:{sources:[{source_id:'S1',version:'v4',digest:'ab'.repeat(32), text:'Supplier access was not approved.'}]},
 claims:[{claim_id:'C1',text:'Supplier access is approved.',citations:[
 {source_id:'S1',source_found:true,source_version:'v4',quote_match:'exact',
  relevance:'NOT_ESTABLISHED',source_span:{start:0,end:15},
  source_sentence:{start:0,end:33,text:'Supplier access was not approved.'}},
 {source_id:'S2',source_found:false,quote_match:'none',relevance:'NOT_ESTABLISHED'}]}],
 findings:[{finding_id:'F1',code:'NEGATION_CONFLICT',claim_id:'C1',condition:'RC2',
  explanation:'The cited clause contradicts the claim.',record_span:{start:0,end:22},status:'OPEN'}],
 events:[{type:'open'}],
});
test('quoted source has traceable version, digest, span and explicit unsupported relevance',()=>{
 const s=fixture(), before=structuredClone(s), items=buildCognitiveControls(s);
 assert.equal(items.length,1);
 assert.equal(items[0].source_refs.length,2);
 assert.equal(items[0].source_refs[0].inventory_status,'LISTED');
 assert.equal(items[0].source_refs[0].version,'v4');
 assert.equal(items[0].source_refs[0].digest,'ab'.repeat(32));
 assert.deepEqual(items[0].source_refs[0].source_span,{start:0,end:15});
 assert.equal(items[0].source_refs[0].source_excerpt,'Supplier access was not approved.');
 assert.equal(items[0].source_refs[0].relevance,'NOT_ESTABLISHED');
 assert.equal(items[0].source_refs[0].support_not_determined,true);
 assert.deepEqual(s,before);
});
test('missing source is visible but never misrepresented as located or supporting',()=>{
 const refs=cognitiveSourceTrace(fixture().record,fixture().claims[0]);
 assert.equal(refs[1].source_id,'S2');
 assert.equal(refs[1].inventory_status,'NOT_LISTED');
 assert.equal(refs[1].quote_match,'NOT_VERIFIED');
 assert.equal(refs[1].source_excerpt,null);
 assert.equal(refs[1].source_span,null);
});
test('unverified citation quote cannot be presented as a confirmed source passage',()=>{
 const s=fixture(); s.claims[0].citations[0].quote_match='none';
 assert.equal(buildCognitiveControls(s)[0].source_refs[0].source_excerpt,null);
 assert.equal(buildCognitiveControls(s)[0].source_refs[0].quote_match,'NOT_VERIFIED');
});
test('untrusted instruction-like markup remains data, no HTML generation or injection',()=>{
 const s=fixture(); s.record.sources[0].text='<img src=x onerror="window.pwned=1">';
 s.claims[0].citations[0].source_sentence.text=s.record.sources[0].text;
 s.claims[0].citations[0].source_sentence.end=[...s.record.sources[0].text].length;
 s.claims[0].citations[0].source_span.end=12;
 const refs=buildCognitiveControls(s)[0].source_refs;
 assert.equal(refs[0].source_excerpt,'<img src=x onerror="window.pwned=1">');
 assert.equal(typeof refs[0].source_excerpt,'string');
});
test('learning note includes case-specific documented reason, not an invented conclusion',()=>{
 const s=fixture(); const item=buildCognitiveControls(s)[0],g=buildReflectiveGuidance(item);
 assert.equal(g.learning.case_specific_issue,'The cited clause contradicts the claim.');
 assert.equal(g.changes_review_status,false);
 assert.equal(s.status,'HOLD');
});
test('source trace has safe empty behavior for missing sources or claims',()=>{
 assert.deepEqual(cognitiveSourceTrace(null,null),[]);
 assert.deepEqual(cognitiveSourceTrace({sources:[]},null),[]);
});
test('tampered citation sentence cannot masquerade as a verified source excerpt',()=>{
 const s=fixture(); s.claims[0].citations[0].source_sentence.text='COMPLETED';
 const r=buildCognitiveControls(s)[0].source_refs[0];
 assert.equal(r.quote_match,'NOT_VERIFIED');
 assert.equal(r.source_excerpt,null);
});
