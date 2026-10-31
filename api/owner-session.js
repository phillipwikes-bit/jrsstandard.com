export const config={runtime:'edge'};
import {ownerAccess,ownerAccessConfigured,ownerSecretMatches,createOwnerCookie,revokeOwnerCookie} from './_owner-auth.js';
function json(o,status=200,extra={}){
 return new Response(JSON.stringify(o),{status,headers:{
  'Content-Type':'application/json; charset=utf-8',
  'Cache-Control':'no-store, private','X-Robots-Tag':'noindex,nofollow',
  'Referrer-Policy':'no-referrer',...extra
 }});
}
export default async function handler(req){
 if(req.method==='GET'){
   const gate=await ownerAccess(req);
   if(gate)return gate;
   return json({authenticated:true});
 }
 if(req.method==='DELETE')return json({signed_out:true},200,{'Set-Cookie':revokeOwnerCookie()});
 if(req.method!=='POST')return json({error:'method_not_allowed'},405);
 const origin=req.headers.get('origin');
 if(!origin || origin!==new URL(req.url).origin)return json({error:'origin_not_allowed'},403);
 if(!(req.headers.get('content-type')||'').toLowerCase().startsWith('application/json'))
   return json({error:'json_required'},415);
 let body={};
 try{
   const raw=await req.text();
   if(raw.length>1200)return json({error:'request_too_large'},413);
   body=JSON.parse(raw);
 }catch{return json({error:'bad_input'},400)}
 // Service unavailable must not be misreported as an incorrect access code.
 if(!ownerAccessConfigured())return json({error:'owner_access_unavailable'},503);
 const secret=typeof body.token==='string'?body.token:'';
 if(!await ownerSecretMatches(secret))return json({error:'unauthorized'},401);
 const cookie=await createOwnerCookie();
 return json({authenticated:true},200,{'Set-Cookie':cookie});
}
