// Browser-executed check-link click attribution and privacy regression.
// Executes only the literal public click handler in a synthetic VM. No remote
// telemetry service, cookies, actual visitor data or UI navigation is used.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const html=readFileSync(new URL('../check.html',import.meta.url),'utf8');
const script=html.match(/<script>\s*(\/\* Best-effort path-only click telemetry:[\s\S]*?)<\/script>/);
assert.ok(script,'Browser link-click handler is required');
let listener=null;
const captured=[];
const sandbox={
  window:{location:{
    href:'https://www.jrsstandard.com/check.html?src=resources&record=never-send',
    origin:'https://www.jrsstandard.com',pathname:'/check.html'
  }},
  document:{addEventListener:(type,callback,capture)=>{
    assert.equal(type,'click');
    assert.equal(capture,true);
    listener=callback;
  }},
  navigator:{sendBeacon:(route,body)=>{captured.push({route,body});return true;}},
  URL,Blob,Date
};
runInNewContext(script[1],sandbox,{timeout:1000});
assert.equal(typeof listener,'function');
function click(href,download=false){
  listener({target:{closest:(selector)=>{
    assert.equal(selector,'a[href]');
    return {hasAttribute:(attr)=>attr==='download'&&download,
      getAttribute:(attr)=>attr==='href'?href:null};
  }}});
}
click('/resources.html?case_id=confidential#resource-catalog');
click('training.html#training-modules');
click('https://www.jrsstandard.com/investigator-guides.html?token=not-stored');
const count=captured.length;
assert.equal(count,3,'only first-party regular links are counted');
for(const href of [
  'https://elsewhere.example/resources.html?private=1',
  'http://www.jrsstandard.com/resources.html',
  '//elsewhere.example/training.html',
  'mailto:user@example.org','#record',
  '/api/dl?e=card&src=check','/api/support?ref=check',
  'javascript:alert(1)','data:text/plain,private'
])click(href);
click('/resources.html',true);
assert.equal(captured.length,count,
  'offsite, direct downloads, anchors, non-http and server-tracked links must not be counted');
const wanted=['/resources.html','/training.html','/investigator-guides.html'];
for(let i=0;i<captured.length;i++){
 const item=captured[i];
 assert.equal(item.route,'/api/telemetry');
 const body=JSON.parse(await item.body.text());
 assert.equal(body.origin_url,'/check.html','origin must exclude URL search parameters');
 assert.equal(body.target_url,wanted[i],'internal target must omit query and hash');
 assert.deepEqual(body.meta,{event:'link-click',src:'check'},
   'record-check click must use the source field accepted by the telemetry API');
 assert.doesNotMatch(JSON.stringify(body),/confidential|never-send|not-stored|token=|case_id=/);
 assert.ok(!('answer' in body)&&!('score' in body)&&!('checkboxes' in body));
}
const api=readFileSync(new URL('../api/telemetry.js',import.meta.url),'utf8');
assert.match(api,/const src = tag\(meta\.src, 40\)\.toLowerCase\(\)/,
  'API must continue reading the exact source field sent by the check page');
console.log('PASS: seven-point check navigational click events carry a valid source, exclude cross-origin links, and reveal no query, fragment or record-answer data.');
