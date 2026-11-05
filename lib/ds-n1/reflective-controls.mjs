// DS-N1 experimental SP-13/SP-14 guidance. Pure advisory functions, never state transitions.
// No case content is retained, learned from, or used to update rules.
export const REFLECTIVE_SCHEMA='ds-n1.reflective-review/0.1';
const CONDITION_EXPLANATIONS=Object.freeze({
 RC1:'Identify the statement and its location so an independent reviewer can reconstruct what was asserted.',
 RC2:'Identify the attributable source and distinguish quoted text from support for the assertion.',
 RC3:'Identify event dates and roles, including conflicts and missing chronology.',
 RC4:'Show how documented facts connect to the stated conclusion.',
 RC5:'Preserve qualifications, contrary evidence and unresolved limitations for human sufficiency review.'
});
const NEXT=Object.freeze({
 SOURCE_MISSING:'Locate the cited document in the source inventory before relying on the claim.',
 QUOTE_NOT_FOUND:'Check the source version and locate the quoted passage.',
 NEGATION_CONFLICT:'Compare the claim and the complete source clause, including negation.',
 SUBJECT_MISMATCH:'Verify whether the source identifies the same actor as the claim.',
 QUALIFICATION_OMITTED:'Review the source qualification and decide whether the claim requires revision.',
 CONTRARY_CLAUSE_OMITTED:'Read the full cited sentence and address the contrary clause.',
 REASONING_NOT_TRACED:'Document the reasoning connecting established facts to the conclusion.',
 UNSUPPORTED_CLAIM:'Identify attributable supporting evidence or record the unresolved gap.',
 DATE_MISMATCH:'Verify the event date against the source record.'
});
const ACTIVE=new Set(['OPEN','AWAITING_EVIDENCE','ESCALATED']);
export function learningGuidance(finding,{codebookVersion=null,ruleVersion=null}={}){
 if(!finding||typeof finding!=='object'||typeof finding.finding_id!=='string')throw new TypeError('valid finding required');
 const condition=finding.condition??null;
 return {schema:REFLECTIVE_SCHEMA,feature:'SP-13',finding_id:finding.finding_id,condition,
  codebook_version:codebookVersion,rule_version:ruleVersion,
  documentary_issue:finding.explanation??'Review the documented finding and its evidence.',
  why_it_matters:CONDITION_EXPLANATIONS[condition]??'The applicable condition requires source-specific human review.',
  next_review:NEXT[finding.code]??'Examine the cited passage, relevant evidence, and unresolved limitations.',
  limitation:'Guidance is deterministic and educational. It is not validated training, independent sufficiency assessment, or an adaptive learning system.'};
}
export function reflectiveGuidance(finding){
 if(!finding||typeof finding!=='object'||typeof finding.finding_id!=='string')throw new TypeError('valid finding required');
 const active=ACTIVE.has(finding.status);
 return {schema:REFLECTIVE_SCHEMA,feature:'SP-14',finding_id:finding.finding_id,
  source_rule:finding.code??null,condition:finding.condition??null,
  steps:[
   {name:'Restrain',guidance:'Do not treat the questioned statement as established solely because it is confidently expressed.'},
   {name:'Reframe',guidance:finding.question??'Which identified evidence establishes this statement?'},
   {name:'Recalibrate',guidance:'Compare available supporting and contrary evidence; preserve missing information and uncertainty.'},
   {name:'Release',guidance:active?'Record an authorized reviewer action through the existing event log; unresolved findings remain visible.':'Preserve the recorded disposition and its limitations.'}
  ],
  unresolved:active,can_finalize:false,
  limitation:'This advisory sequence does not change findings, release holds, reviewer identity, evidence, or authorization.'};
}
