// Observability only. No personal information and no credentials exposed.
export const config={runtime:'edge'};
export default function handler(req){
 if(req.method!=='GET')return new Response(JSON.stringify({error:'method_not_allowed'}),{status:405,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
 return new Response(JSON.stringify({
  enabled:true,mode:'existing_formspree_relay',last_inbox_smoke_verified:'2026-11-01',
  note:'Configuration status, not a guarantee of later message delivery.'
 }),{status:200,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}});
}
