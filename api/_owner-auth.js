// JRS owner-only read authentication. This module must run on the server.
// The public repository and hard-to-guess paths DO NOT provide access control.
// OWNER_DASHBOARD_TOKEN must be a unique, high-entropy secret (at least 32
// characters) configured on the server. Do not reuse Gmail, provider, or model
// API credentials. Browser sign-in exchanges the secret for an HttpOnly cookie.
const COOKIE='__Host-jrs-owner';
const MAX_AGE=8*60*60;

const encoder=new TextEncoder();
function envSecret(){return ((typeof process!=='undefined' && process.env) || {}).OWNER_DASHBOARD_TOKEN || '';}
export function ownerAccessConfigured(){return envSecret().length>=32;}
function denied(error,status){
  return new Response(JSON.stringify({error}),{status,headers:{
    'Content-Type':'application/json; charset=utf-8',
    'Cache-Control':'no-store, private',
    'X-Robots-Tag':'noindex, nofollow',
    'Referrer-Policy':'no-referrer'
  }});
}
function bytesToUrl(bytes){
  let t='';for(let i=0;i<bytes.length;i++)t+=String.fromCharCode(bytes[i]);
  return btoa(t).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}
function urlToBytes(value){
  if(!/^[A-Za-z0-9_-]{20,200}$/.test(value))return null;
  const s=value.replace(/-/g,'+').replace(/_/g,'/');
  let raw;try{raw=atob(s+'='.repeat((4-s.length%4)%4));}catch{return null;}
  const out=new Uint8Array(raw.length);
  for(let i=0;i<raw.length;i++)out[i]=raw.charCodeAt(i);
  // Reject noncanonical base64url encodings, including signatures with
  // changed pad bits that decode to identical bytes.
  if(bytesToUrl(out)!==value)return null;
  return out;
}
async function key(secret){
  return crypto.subtle.importKey('raw',encoder.encode(secret),
    {name:'HMAC',hash:'SHA-256'},false,['sign','verify']);
}
export async function ownerSecretMatches(given){
  const secret=envSecret();
  if(secret.length<32 || typeof given!=='string')return false;
  // Comparing digests avoids timing dependence on early characters.
  const a=new Uint8Array(await crypto.subtle.digest('SHA-256',encoder.encode(given)));
  const b=new Uint8Array(await crypto.subtle.digest('SHA-256',encoder.encode(secret)));
  let bad=given.length===secret.length?0:1;
  for(let i=0;i<a.length;i++)bad|=a[i]^b[i];
  return bad===0;
}
export async function createOwnerCookie(){
  const secret=envSecret();
  if(secret.length<32)throw Error('owner_secret_unconfigured');
  const nonce=new Uint8Array(16);crypto.getRandomValues(nonce);
  const payload='v1.'+Math.floor(Date.now()/1000+MAX_AGE)+'.'+bytesToUrl(nonce);
  const signature=bytesToUrl(new Uint8Array(await crypto.subtle.sign('HMAC',await key(secret),encoder.encode(payload))));
  return COOKIE+'='+payload+'.'+signature+'; Path=/; Max-Age='+MAX_AGE+
    '; HttpOnly; Secure; SameSite=Strict';
}
function cookieValue(req){
  const all=req.headers.get('cookie')||'';
  for(const pair of all.split(';')){
    const p=pair.trim();
    if(p.startsWith(COOKIE+'='))return p.slice(COOKIE.length+1);
  }
  return '';
}
async function validCookie(value,secret){
  const m=/^(v1\.\d{10}\.([A-Za-z0-9_-]{20,50}))\.([A-Za-z0-9_-]{40,60})$/.exec(value);
  if(!m)return false;
  const pieces=m[1].split('.');
  const expiry=Number(pieces[1]);
  const now=Math.floor(Date.now()/1000);
  if(!Number.isSafeInteger(expiry) || expiry<=now || expiry-now>MAX_AGE)return false;
  const signature=urlToBytes(m[3]);
  if(!signature||signature.length!==32)return false;
  return crypto.subtle.verify('HMAC',await key(secret),signature,encoder.encode(m[1]));
}
export async function ownerAccess(req){
  const secret=envSecret();
  if(secret.length<32)return denied('owner_access_unavailable',503);
  const authorization=req.headers.get('authorization')||'';
  if(/^Bearer [^\s]+$/i.test(authorization) && await ownerSecretMatches(authorization.slice(7)))return null;
  if(await validCookie(cookieValue(req),secret))return null;
  return denied('unauthorized',401);
}
export function revokeOwnerCookie(){
  return COOKIE+'=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict';
}
