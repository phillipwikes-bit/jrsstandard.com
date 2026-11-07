// Research-only deterministic synthetic fixture evaluator.
// No model/API calls, no case ingestion, no live JRS grading or automated finalization.
// Source-referenced documentation review metrics require independent human annotation.
import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";

const CONDITIONS=new Set([
  "reconstructability","identifiable_basis","chronology","reasoning_trace","sufficiency"
]);
const requireThat=(ok,message)=>{if(!ok)throw Error("EVALUATION REFUSED: "+message)};
const rate=(a,b)=>b===0?null:Math.round((a/b)*10000)/10000;
const id=(s)=>typeof s==="string"&&/^[A-Za-z0-9_-]{1,80}$/.test(s);
function unique(items,what){
  requireThat(new Set(items).size===items.length,"duplicate "+what);
}
export function scoreSynthetic(gold,reviews){
  requireThat(gold?.schema==="jrs-synthetic-gold.v1","wrong gold schema");
  requireThat(reviews?.schema==="jrs-synthetic-reviewed.v1","wrong reviewed schema");
  requireThat(gold.data_classification==="SYNTHETIC_ONLY"&&
    reviews.data_classification==="SYNTHETIC_ONLY","only synthetic data permitted");
  requireThat(gold.dataset_id===reviews.dataset_id&&id(gold.dataset_id),"dataset mismatch");
  requireThat(reviews.model_id==="SYNTHETIC_EVALUATOR_UNIT_TEST","not an actual model run");
  requireThat(Array.isArray(gold.cases)&&gold.cases.length>0,"empty gold cases");
  requireThat(Array.isArray(reviews.cases),"missing human-annotated cases");
  unique(gold.cases.map(c=>c.id),"gold case IDs");
  unique(reviews.cases.map(c=>c.id),"reviewed case IDs");
  requireThat(gold.cases.length===reviews.cases.length,"incomplete case coverage");
  const goldMap=new Map(gold.cases.map(c=>[c.id,c]));
  let tp=0,fp=0,fn=0,checked=0,valid=0,criticalEvents=0;
  const byCondition=Object.fromEntries([...CONDITIONS].map(c=>[c,{tp:0,fp:0,fn:0}]));
  const caseResults=[];
  for(const review of reviews.cases){
    requireThat(id(review.id)&&goldMap.has(review.id),"unrecognized reviewed case ID");
    const original=goldMap.get(review.id);
    requireThat(Array.isArray(original.gaps)&&Array.isArray(review.findings),"invalid gaps/findings");
    requireThat(review.data_classification===undefined,"unexpected per-case content/classification");
    const gaps=new Map();
    for(const gap of original.gaps){
      requireThat(id(gap.id)&&CONDITIONS.has(gap.condition),"invalid gold gap");
      requireThat(!gaps.has(gap.id),"duplicate gold gap ID in case");
      gaps.set(gap.id,gap);
    }
    requireThat(Array.isArray(original.source_spans),"source span manifest missing");
    const allowed=new Map();
    for(const source of original.source_spans){
      requireThat(id(source.source_id)&&Array.isArray(source.spans),"invalid source manifest");
      requireThat(!allowed.has(source.source_id),"duplicate source in manifest");
      unique(source.spans,"source span identifiers");
      requireThat(source.spans.every(id),"invalid span identifier");
      allowed.set(source.source_id,new Set(source.spans));
    }
    let caseTP=0,caseFP=0,caseChecked=0,caseValid=0;
    const matched=new Set();
    unique(review.findings.map(x=>x.id),"finding IDs");
    for(const f of review.findings){
      requireThat(id(f.id)&&CONDITIONS.has(f.condition),"invalid finding ID/condition");
      requireThat(Array.isArray(f.citations),"missing citation review");
      for(const c of f.citations){
        requireThat(id(c.source_id)&&id(c.span_id),"citation source/span identifier absent");
        requireThat(allowed.get(c.source_id)?.has(c.span_id)===true,
          "citation source or span outside this case manifest");
        // Do not let the evaluated model self-attest citation truth.
        requireThat(c.independently_verified===true||
          c.independently_verified===false||
          c.independently_verified===null,"human citation status must be true, false or null");
        if(c.independently_verified!==null){checked++;caseChecked++;}
        if(c.independently_verified===true){valid++;caseValid++;}
      }
      const match=f.adjudicated_gold_gap_id;
      if(match===null){
        fp++;caseFP++;byCondition[f.condition].fp++;
      }else{
        requireThat(id(match)&&gaps.has(match),"nonexistent adjudicated gold gap");
        requireThat(gaps.get(match).condition===f.condition,"finding assigned to wrong condition");
        requireThat(!matched.has(match),"duplicate true-positive assignment");
        matched.add(match);tp++;caseTP++;byCondition[f.condition].tp++;
      }
    }
    let caseFN=0;
    for(const gap of original.gaps){
      if(!matched.has(gap.id)){fn++;caseFN++;byCondition[gap.condition].fn++;}
    }
    requireThat(Number.isInteger(review.critical_privacy_incidents)&&
      review.critical_privacy_incidents>=0&&
      Number.isInteger(review.unauthorized_actions)&&review.unauthorized_actions>=0,
      "missing independent critical security count");
    criticalEvents+=review.critical_privacy_incidents+review.unauthorized_actions;
    caseResults.push({id:review.id,tp:caseTP,fp:caseFP,fn:caseFN,
      citation_reviewed:caseChecked,citation_verified:caseValid});
  }
  const conditionMetrics=Object.fromEntries(Object.entries(byCondition).map(([k,x])=>[
    k,{...x,precision:rate(x.tp,x.tp+x.fp),recall:rate(x.tp,x.tp+x.fn)}
  ]));
  return {
    status:"SYNTHETIC_UNIT_TEST_ONLY_NOT_JRS_MODEL_VALIDATION",
    dataset_id:gold.dataset_id,
    n_cases:gold.cases.length,tp,fp,fn,
    gap_precision:rate(tp,tp+fp),gap_recall:rate(tp,tp+fn),
    independently_checked_citations:checked,
    independently_verified_citations:valid,
    citation_validity:rate(valid,checked),
    critical_security_events:criticalEvents,
    stop_required:criticalEvents>0,
    per_condition:conditionMetrics,cases:caseResults,
    non_measurements:["real JRS accuracy","enterprise suitability","model response latency",
      "actual API cost","human reviewer time","legal correctness","accessibility conformance"]
  };
}

if(process.argv[1]&&fileURLToPath(import.meta.url)===process.argv[1]){
  requireThat(process.argv.length===4,"usage: node score.mjs GOLD.json REVIEWED.json");
  const parse=path=>JSON.parse(readFileSync(path,"utf8"));
  const result=scoreSynthetic(parse(process.argv[2]),parse(process.argv[3]));
  process.stdout.write(JSON.stringify(result,null,2)+"\n");
  if(result.stop_required)process.exitCode=2;
}
