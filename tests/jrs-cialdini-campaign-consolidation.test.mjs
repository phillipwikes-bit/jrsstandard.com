// Static integration contract. This verifies source shape only, not hosted behavior or influence effectiveness.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve, join} from 'node:path';

const root=resolve(fileURLToPath(new URL('..', import.meta.url)));
const read=path=>readFileSync(join(root,path),'utf8');
const rights=read('right-to-know-why.html');
const professional=read('decisions-you-can-defend.html');
const home=read('index.html');
const resources=read('resources.html');
const privacy=read('privacy-notice.html');
const engagement=read('assets/jrs-engagement.js');
const sitemap=read('sitemap.xml');
const config=JSON.parse(read('vercel.json'));
const campaigns=[['public interest',rights],['professional',professional]];

test('campaigns are included in the complete rendered mobile audit',()=>{
  const source=read('tests/jrs-sitewide-mobile-browser-audit.html');
  const match=source.match(/const paths=(\[[^\n;]*\]);/);
  assert.ok(match,'audited route array missing');
  const paths=JSON.parse(match[1]);
  for(const page of ['right-to-know-why.html','decisions-you-can-defend.html']){
    assert.equal(paths.filter(path=>path===page).length,1,'missing or duplicated campaign browser route: '+page);
  }
});

test('one website maintains two named and different educational campaigns',()=>{
  assert.match(home,/The Right to Know Why/);
  assert.match(home,/The Decisions You Can Defend/);
  assert.match(rights,/The Right to Know Why Initiative/);
  assert.match(professional,/The Decisions You Can Defend Initiative/);
  assert.match(rights,/H-118/);
  assert.match(professional,/TR-204/);
  assert.match(rights,/hiring decision/i);
  assert.match(professional,/Termination approved/);
});

test('both campaigns make the reader examine fictional sources before interpretation',()=>{
  for(const [label,source] of campaigns){
    assert.equal((source.match(/class="jrs-reconstruction-step"/g)||[]).length,3,label);
    assert.ok(source.indexOf('Examine the retained sources')>=0,label);
    assert.ok(source.indexOf('Examine the retained sources')<source.indexOf('Compare your interpretation'),label);
    assert.equal((source.match(/<details\b/g)||[]).length,(source.match(/<\/details>/g)||[]).length,label+' nested details');
    assert.match(source,/fictional/i,label);
    assert.match(source,/has not been independently validated/i,label);
    assert.doesNotMatch(source,/jrs-scenario-(?:hiring|termination|benefits|medical|ai)\.svg/,label);
  }
});

test('truthful relevant professional authority with no institutional endorsement',()=>{
  for(const [label,source] of campaigns){
    assert.match(source,/Phillip Wikes/);
    assert.match(source,/former Lead Civil Rights Officer at the Maryland Commission on Civil Rights/);
    assert.match(source,/not agency endorsement|not an agency standard or government endorsement/,label);
    assert.doesNotMatch(source,/approved by the Maryland Commission on Civil Rights|official Maryland Commission standard/i,label);
  }
});

test('free-first access is not conditional on supporting either campaign',()=>{
  for(const [label,source] of campaigns){
    assert.match(source,/href="resources\.html"/,label);
    assert.match(source,/No account, payment, response or expression of support is required/,label);
    assert.match(source,/method="post" action="\/api\/support\?c=(?:rtkw|defend)&amp;src=campaign_page&amp;next=confirmation"/,label);
    assert.match(source,/not an institutional endorsement|not proof of organizational authorization/i,label);
  }
  for(const path of ['investigator-guides.html','training.html','check.html']){
    assert.ok(existsSync(join(root,path)),path+' missing');
  }
  assert.match(resources,/No purchase, account, or registration is required/i);
});

test('passive campaign navigation cannot be routed to support-event writer',()=>{
  const expected={
    '/right-to-know-why':'/right-to-know-why.html',
    '/rtkw':'/right-to-know-why.html',
    '/decisions-you-can-defend':'/decisions-you-can-defend.html',
    '/defend':'/decisions-you-can-defend.html'
  };
  for(const [source,target] of Object.entries(expected)){
    const rows=config.redirects.filter(r=>r.source===source);
    assert.equal(rows.length,1,'ambiguous redirect '+source);
    assert.equal(rows[0].destination,target,'non-educational redirect '+source);
  }
});

test('discontinued public email-builder is absent, with safe historical redirects',()=>{
  assert.equal(existsSync(join(root,'outreach-email-builder.html')),false);
  for(const [label,source] of [['public campaign',rights],['professional campaign',professional],['privacy',privacy],['sitemap',sitemap],['analytics',engagement]]){
    assert.doesNotMatch(source,/outreach-email-builder|draft_builder_open|jrs_draft_builder_open/i,label);
  }
  for(const source of ['/outreach-email-builder','/outreach-email-builder.html']){
    const rows=config.redirects.filter(r=>r.source===source);
    assert.equal(rows.length,1,source+' historical route');
    assert.equal(rows[0].destination,'/resources.html',source+' should lead to free resources');
  }
});

test('do not claim behavioral validation, endorsements or field effectiveness',()=>{
  for(const [label,source] of campaigns){
    assert.doesNotMatch(source,/scientifically proven by Cialdini|Cialdini-certified|adopted by leading agencies/i,label);
    assert.match(source,/not.*(?:adoption|endorsement|effectiveness|validated)/i,label);
  }
  assert.match(privacy,/Aggregate endorsement totals must not be described as unique people/i);
});
