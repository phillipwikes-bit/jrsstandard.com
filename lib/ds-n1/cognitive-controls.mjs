// DS-N1 SP-07 experimental increment: deterministic cognitive-review prompts.
// This does not establish bias, intent, AI authorship, sufficiency or original DS-A acceptance.
export const SCHEMA='ds-n1.cognitive-review/0.1';
const MAP={
 UNSUPPORTED_CLAIM:['OBSERVATION_INFERENCE','PREMATURE_CLOSURE'],
 UNTRACEABLE_AUTHORITY:['UNSUPPORTED_CERTAINTY','PREMATURE_CLOSURE'],
 REASONING_NOT_TRACED:['OBSERVATION_INFERENCE','AI_ASSISTED_REASONING'],
 RELEVANCE_NOT_ESTABLISHED:['OBSERVATION_INFERENCE'],
 NEGATION_CONFLICT:['SELECTIVE_EVIDENCE'],
 SUBJECT_MISMATCH:['SELECTIVE_EVIDENCE'],
 QUALIFICATION_OMITTED:['SELECTIVE_EVIDENCE','UNSUPPORTED_CERTAINTY'],
 CONTRARY_CLAUSE_OMITTED:['SELECTIVE_EVIDENCE','ALTERNATIVE_EXPLANATION'],
 DATE_MISMATCH:['PREMATURE_CLOSURE'],
 EVENT_ROLE_CONFUSION:['PREMATURE_CLOSURE'],
 SOURCE_MISSING:['PREMATURE_CLOSURE'],
 QUOTE_NOT_FOUND:['PREMATURE_CLOSURE']
};
const QUESTIONS={
 OBSERVATION_INFERENCE:'Which part of this conclusion is directly established by the cited record?',
 ALTERNATIVE_EXPLANATION:'Could the documented information reasonably support another explanation?',
 SELECTIVE_EVIDENCE:'Does the record explain how this conflicting or qualifying information was considered?',
 PREMATURE_CLOSURE:'What information remains necessary before this conclusion can be finalized?',
 UNSUPPORTED_CERTAINTY:'Does the evidence support the certainty expressed in this statement?',
 AI_ASSISTED_REASONING:'Can the reviewer independently trace this explanation to the underlying record?'
};
const ACTIVE=new Set(['OPEN','AWAITING_EVIDENCE','ESCALATED']);
const RESPONSES=['request_evidence','escalate','leave_pending'];
// Other actions have preconditions and must be offered by the authoritative session engine.
export function cognitiveReview(findings,{includeResolved=false}={}){
 if(!Array.isArray(findings))throw new TypeError('findings must be an array');
 const items=[];
 for(const f of findings){
  if(!f||typeof f.finding_id!=='string'||typeof f.code!=='string')continue;
  if(!includeResolved&&!ACTIVE.has(f.status))continue;
  for(const category of MAP[f.code]||[])items.push({
   id:f.finding_id+':'+category,finding_id:f.finding_id,category,source_rule:f.code,
   condition:f.condition??null,claim_id:f.claim_id??null,claim_revision:f.claim_revision??null,
   record_span:f.record_span??null,source_id:f.source_id??null,source_span:f.source_span??null,
   evidence:f.evidence??{},documentary_concern:f.explanation??'',question:QUESTIONS[category],
   finding_status:f.status,responses:[...RESPONSES],requires_human_review:true
  });
 }
 return {schema:SCHEMA,product_identity:'DS-N1 experimental successor; not authenticated DS-A',
  status:'DEVELOPER_CANDIDATE_NOT_INDEPENDENTLY_ACCEPTED',
  limitation:'Prompts derive from existing findings. No cognitive bias, AI authorship, case fact, sufficiency or reviewer intent is established. Reviewer actions remain in the authoritative event log.',items};
}
