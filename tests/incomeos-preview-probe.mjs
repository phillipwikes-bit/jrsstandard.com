// Protected IncomeOS preview HTTP gate. Uses ONLY public, unauthenticated GET/HEAD.
// It cannot establish owner-only app authorization, encrypted storage, or financial readiness.
// Provider metadata MUST be read from connected GitHub/Vercel, never from a website claim.
const TEAM="team_Q2KvghlnRA3ePBm4zAiYzbIf";
const PROJECT="prj_eIGgDvJb3LkYmk0NGjoo7bWFEi3n";
const ROUTES=[
  {method:"GET",path:"/"},
  {method:"HEAD",path:"/"},
  {method:"GET",path:"/index.html"},
  {method:"GET",path:"/accounting-controls.js"},
  {method:"GET",path:"/manifest.webmanifest"},
  {method:"GET",path:"/opportunities.json"}
];
function gate(code,reason,checks=[]){
  return {gate:code,reason,anonymousChecks:checks,productionReady:false,
    authenticatedOwnerVerified:false,privateFinancialBackendVerified:false,
    statementSourceComplete:false,canDeployToProduction:false};
}
export async function probeProtectedPreview(meta,fetchFn=globalThis.fetch){
  if(!meta||typeof meta!=="object")return gate("HOLD","No independently sourced deployment metadata");
  if(meta.teamId!==TEAM||meta.projectId!==PROJECT)return gate("HOLD","Project or team does not match isolated IncomeOS staging target");
  const expected=meta.githubHeadSha,actual=meta.providerDeploymentSha;
  if(typeof expected!=="string"||!/^[0-9a-f]{40}$/.test(expected)||
     typeof actual!=="string"||actual!==expected)return gate("HOLD","Provider-reported commit does not match exact GitHub PR head");
  if(meta.previewTarget!=="preview"||meta.deploymentState!=="READY"||
     typeof meta.deploymentId!=="string"||meta.deploymentId.length<4)return gate("HOLD","Exact-commit preview has not reached READY");
  if(meta.projectProtection?.enabled!==true||meta.projectProtection?.deploymentType!=="all")
    return gate("HOLD","Vercel project is not configured to protect all deployment targets");
  let url;
  try{url=new URL(meta.previewUrl);}catch{return gate("HOLD","No valid preview URL");}
  if(url.protocol!=="https:"||!url.hostname.endsWith(".vercel.app")||url.port||url.username||url.password||
     url.search||url.hash||url.pathname!=="/")return gate("HOLD","Preview must use an exact HTTPS Vercel deployment root");
  if(typeof fetchFn!=="function")return gate("HOLD","HTTP inspection is unavailable");
  const checks=[];
  for(const route of ROUTES){
    const target=new URL(route.path,url);
    let response;
    try{
      response=await fetchFn(target.href,{method:route.method,redirect:"manual",
        headers:{"Accept":route.method==="HEAD"?"*/*":"text/html, application/json;q=0.8"},
        signal:AbortSignal.timeout(8000)});
    }catch(_err){checks.push({path:route.path,method:route.method,status:"ERROR"});
      return gate("HOLD","Anonymous access probe could not complete",checks);}
    const status=response?.status;
    checks.push({path:route.path,method:route.method,status});
    if(status!==401&&status!==403){
      return gate("HOLD",status>=200&&status<300
        ?"Anonymous client can read a supposedly protected IncomeOS resource"
        :"Anonymous response was not a definitive 401/403 denial; inspect provider authentication",checks);
    }
  }
  return gate("ANONYMOUS_ACCESS_CHECK_PASSED",
    "Exact-commit preview returned HTTP 401/403 for all sampled anonymous routes. Production and authenticated owner testing remain blocked.",checks);
}
export async function runLiveFromEnvironment(env=process.env){
  const meta={
    teamId:env.INCOMEOS_TEAM_ID,projectId:env.INCOMEOS_PROJECT_ID,
    githubHeadSha:env.INCOMEOS_GITHUB_HEAD_SHA,
    providerDeploymentSha:env.INCOMEOS_PROVIDER_DEPLOYMENT_SHA,
    previewTarget:env.INCOMEOS_PROVIDER_TARGET,
    deploymentState:env.INCOMEOS_PROVIDER_STATE,
    deploymentId:env.INCOMEOS_PROVIDER_DEPLOYMENT_ID,
    previewUrl:env.INCOMEOS_PREVIEW_URL,
    projectProtection:{enabled:env.INCOMEOS_SSO_ENABLED==="true",
      deploymentType:env.INCOMEOS_SSO_SCOPE}
  };
  const outcome=await probeProtectedPreview(meta);
  // Never print auth tokens, HTTP bodies, cookies, or owner data.
  console.log(JSON.stringify(outcome,null,2));
  return outcome.gate==="ANONYMOUS_ACCESS_CHECK_PASSED"?0:1;
}
// CLI is opt-in; ordinary source CI must not report a hosted test as completed.
if(process.argv.includes("--live")){
  const code=await runLiveFromEnvironment();
  process.exitCode=code;
}
