// Legacy paid Enterprise inquiry intake retired under Issue 3.6.
// Historic stored records are preserved in their original data system.
// Public inquiries now use a voluntary visitor-initiated email link on /contact.html.
export const config={runtime:'edge'};
export default function handler(request){
 return new Response(JSON.stringify({error:'legacy_inquiry_retired',contact:'/contact.html'}),{status:410,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Robots-Tag':'noindex, nofollow'}});
}
