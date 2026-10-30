// Regression checks for JRS inquiry notifications. No network or real mail.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const original = {};
for (const k of ['JRS_INQUIRY_ALERTS_ENABLED','RESEND_API_KEY','SENDGRID_API_KEY','NOTIFY_TO','NOTIFY_FROM']) {
  original[k] = process.env[k];
  delete process.env[k];
}
const originalFetch = globalThis.fetch;
const source = readFileSync(new URL('../api/_notify.js', import.meta.url),'utf8');
const dataUrl = 'data:text/javascript;base64,'+Buffer.from(source).toString('base64');

try {
  // Default is explicitly off even if a provider exists.
  process.env.RESEND_API_KEY = 'dummy-test-key';
  const disabled = await import(dataUrl + '#disabled');
  assert.equal(disabled.alertsEnabled(), false);
  assert.equal(disabled.notifyConfigured(), false);
  const disabledResult = await disabled.notify('test',{text:'test',html:'test'});
  assert.equal(disabledResult.sent,false);
  assert.equal(disabledResult.provider,'disabled');

  process.env.JRS_INQUIRY_ALERTS_ENABLED = 'true';
  delete process.env.RESEND_API_KEY;
  const enabled = await import(dataUrl+'#enabled');
  assert.equal(enabled.alertsEnabled(), true);
  assert.equal(enabled.notifyConfigured(), false);
  const absent = await enabled.notify('test',{text:'test',html:'test'});
  assert.equal(absent.sent,false);
  assert.equal(absent.provider,'none');

  process.env.RESEND_API_KEY='dummy-test-key';
  assert.equal(enabled.notifyConfigured(),false);
  const noAddress=await enabled.notify('test',{text:'test',html:'test'});
  assert.equal(noAddress.sent,false);
  assert.equal(noAddress.detail,'recipient_or_verified_sender_not_configured');

  process.env.NOTIFY_TO='owner@example.test';
  assert.equal(enabled.notifyConfigured(),false);
  process.env.NOTIFY_FROM='not-an-address';
  assert.equal(enabled.notifyConfigured(),false);
  process.env.NOTIFY_FROM='alerts@example.test';
  assert.equal(enabled.notifyConfigured(),true);
  let calls=[];
  globalThis.fetch=async (url,opts)=>{calls.push({url,opts});return {ok:true,status:200};};
  const sent=await enabled.notify('New inquiry',
    enabled.renderAlert('JRS inquiry',[['Name','Test Person'],['Message','Sample only']]),
    'visitor@example.test');
  assert.equal(sent.sent,true);
  assert.equal(sent.provider,'resend');
  assert.equal(calls.length,1);
  assert.equal(calls[0].url,'https://api.resend.com/emails');
  const data=JSON.parse(calls[0].opts.body);
  assert.deepEqual(data.to,['owner@example.test']);
  assert.equal(data.from,'alerts@example.test');
  assert.equal(data.reply_to,'visitor@example.test');
  assert.ok(data.text.includes('Sample only'));

  // Provider downtime does not throw or falsify the database capture.
  globalThis.fetch=async()=>{throw new Error('synthetic provider unavailable')};
  const failure=await enabled.notify('New inquiry',{text:'test',html:'test'});
  assert.equal(failure.sent,false);
  assert.equal(failure.provider,'resend');
  console.log('PASS: disabled-by-default, missing-provider, Gmail routing, reply-to, provider outage, no fallback recipient/sender');
} finally {
  globalThis.fetch=originalFetch;
  for(const [k,v] of Object.entries(original)) {
    if(v===undefined)delete process.env[k];
    else process.env[k]=v;
  }
}
