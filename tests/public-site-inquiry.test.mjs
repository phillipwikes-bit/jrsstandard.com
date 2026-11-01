import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const file=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const ui=file('contact.html'),server=file('api/site-inquiry.js');
const cfg=file('api/site-inquiry-config.js'),mailer=file('api/_contact-notify.js'),privacy=file('privacy-notice.html');
test('on-page form accepts minimal professional inquiry details',()=>{
 assert.match(ui,/id="jrs-inquiry"/);
 for(const name of ['name','email','organization','category','message','consent'])assert.match(ui,new RegExp('name="'+name+'"'));
 for(const value of ['method','research','training','organization','accessibility','general'])assert.match(ui,new RegExp('value="'+value+'"'));
 assert.doesNotMatch(ui,/name="commercial_purpose"|name="scale"|name="timeline"|id="ei-form"/);
});
test('unconfigured service is explicitly email-app fallback, not fake delivery',()=>{
 assert.match(ui,/Prepare email in my email app/);
 assert.match(ui,/mailto:phillipwikes@gmail\.com/);
 assert.match(ui,/press Send in your email app/);
 assert.match(ui,/window\.location\.href=link/);
});
test('server rejects cross-site and unprotected writes',()=>{
 assert.match(server,/origin!==url\.origin/);
 assert.match(server,/content-length/);
 assert.match(server,/E\.JRS_PUBLIC_CONTACT_CAPTURE_ENABLED!=='true'/);
 assert.match(server,/E\.TURNSTILE_SECRET_KEY/);
 assert.match(server,/challenge_host_mismatch/);
 assert.match(server,/source:SOURCE/);
 assert.match(server,/consent_to_transfer:false/);
 assert.match(server,/contactAlertsConfigured\(\)/);
});
test('only declared categories, no software sale funnel',()=>{
 for(const value of ['method','research','training','organization','accessibility','general'])assert.match(server,new RegExp("'"+value+"'"));
 assert.doesNotMatch(server,/COMMERCIAL_PURPOSES|commercial_purpose|asset-acquisition|engine-licence/);
});
test('form only active after source, protection and mail readiness',()=>{
 assert.match(cfg,/E\.JRS_PUBLIC_CONTACT_CAPTURE_ENABLED==='true'/);
 assert.match(cfg,/TURNSTILE_SITE_KEY/);
 assert.match(cfg,/TURNSTILE_SECRET_KEY/);
 assert.match(cfg,/contactAlertsConfigured\(\)/);
 assert.match(cfg,/site_key:enabled\?/);
});
test('private Gmail alerts require explicit opt-in and provider configuration',()=>{
 assert.match(mailer,/JRS_PUBLIC_CONTACT_ALERTS_ENABLED==='true'/);
 assert.match(mailer,/NOTIFY_TO/);
 assert.match(mailer,/NOTIFY_FROM/);
 assert.match(mailer,/RESEND_API_KEY/);
 assert.match(mailer,/SENDGRID_API_KEY/);
 assert.doesNotMatch(mailer,/AIza|sk_[A-Za-z0-9]{20}|re_[A-Za-z0-9]{20}/);
});
test('privacy text separates email fallback from protected storage',()=>{
 assert.match(privacy,/opening that application/);
 assert.match(privacy,/contact details/);
 assert.match(privacy,/research enrollment/);
});
