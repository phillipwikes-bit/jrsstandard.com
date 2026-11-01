// Transactional notifications for public JRS contact inquiries only.
// Requires an independent email service. The Gmail connector in ChatGPT does not
// provide a credential to a deployed Vercel function.
const valid=v=>/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(String(v||''))?String(v):'';
function env(){return (typeof process!=='undefined'&&process.env)||{}}
export function contactAlertsConfigured(){
 const E=env();
 return E.JRS_PUBLIC_CONTACT_ALERTS_ENABLED==='true' &&
 !!valid(E.NOTIFY_TO) && !!valid(E.NOTIFY_FROM) &&
 !!(E.RESEND_API_KEY||E.SENDGRID_API_KEY);
}
export async function notifyContact(info){
 if(!contactAlertsConfigured())return false;
 const E=env();
 const from=valid(E.NOTIFY_FROM),to=valid(E.NOTIFY_TO),reply=valid(info.email);
 const categories=['method','research','training','organization','accessibility','general'];
 const topic=categories.includes(info.category)?info.category:'general';
 const subject='JRS public inquiry: '+topic;
 const body=['JRS PUBLIC INQUIRY','Topic: '+topic,'Name: '+info.name,
   'Email: '+info.email,'Organization: '+(info.organization||'Not supplied'),
   'Country: '+(info.country||'unknown'),'','Message:',info.note,'',
   'Source: site-inquiry (voluntary response consent only)'].join('\n');
 try {
  if(E.RESEND_API_KEY){
   const r=await fetch('https://api.resend.com/emails',{method:'POST',headers:{
    'Authorization':'Bearer '+E.RESEND_API_KEY,'Content-Type':'application/json'
   },body:JSON.stringify({from,to:[to],reply_to:reply,subject,text:body})});
   return r.ok;
  }
  const r=await fetch('https://api.sendgrid.com/v3/mail/send',{method:'POST',headers:{
    'Authorization':'Bearer '+E.SENDGRID_API_KEY,'Content-Type':'application/json'
  },body:JSON.stringify({personalizations:[{to:[{email:to}]}],from:{email:from},
    reply_to:{email:reply},subject,content:[{type:'text/plain',value:body}]})});
  return r.status===202;
 }catch{return false}
}
