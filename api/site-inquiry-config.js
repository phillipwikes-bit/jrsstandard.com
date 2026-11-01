export const config={runtime:'edge'};
import {contactAlertsConfigured} from './_contact-notify.js';
export default function handler(req){
 if(req.method!=='GET')return new Response(JSON.stringify({error:'method_not_allowed'}),{status:405,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
 const E=(typeof process!=='undefined'&&process.env)||{};
 const enabled=E.JRS_PUBLIC_CONTACT_CAPTURE_ENABLED==='true'
  && !!(E.SUPABASE_SERVICE_ROLE_KEY && E.TURNSTILE_SITE_KEY && E.TURNSTILE_SECRET_KEY)
  && contactAlertsConfigured();
 return new Response(JSON.stringify({enabled,site_key:enabled?E.TURNSTILE_SITE_KEY:null}),{
  status:200,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Robots-Tag':'noindex, nofollow'}
 });
}
