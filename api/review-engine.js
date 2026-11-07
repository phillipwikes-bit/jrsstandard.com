// Historical compatibility boundary. No record is parsed, retained, transmitted or evaluated.
const gates=["independent_labeled_and_adjudicated_holdout_evaluation","operator_control_evidence","counsel_review_of_real_data_flows_and_claims","recorded_owner_release_authorization","independent_production_quality_assurance"];
export default async function handler(request){
 const method=(request?.method||'GET').toUpperCase();
 const common={implementation_status:'controlled_local_development',public_access:false,record_submission_accepted:false,human_review_required:true,release_gates:gates};
 const body=method==='GET'||method==='HEAD'?{error:'method_not_allowed',detail:'This service is closed to public submissions.',...common}:{error:'controlled_review_unavailable',...common};
 return new Response(method==='HEAD'?null:JSON.stringify(body),{status:method==='GET'||method==='HEAD'?405:503,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','Allow':'GET, HEAD, OPTIONS'}});
}
