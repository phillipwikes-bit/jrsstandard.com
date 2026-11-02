// Source-level contrast and UI-state regression on institutional light pages.
// This is not a computed-style, screenshot or screen-reader certification.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const css=read('assets/jrs-institutional-reference.css');
const standard=read('jrsstandard.html');
const training=read('training.html');
const safeguards=[
  ['body.jrs-institutional.jrs-standard-page .failure-bad','#8b4444'],
  ['body.jrs-institutional.jrs-standard-page [style*="color:#5DBF82"]','#1d6745'],
  ['body.jrs-institutional.jrs-training-page .severity-level.high','#925c16'],
  ['body.jrs-institutional.jrs-training-page .rt-btn.rt-high','#925c16'],
  ['body.jrs-institutional.jrs-training-page p a','text-decoration:underline!important'],
  ['body.jrs-institutional.jrs-training-page #poll-submit-btn:disabled','pointer-events:none!important'],
];
for(const [selector,value] of safeguards){
  assert.ok(css.includes(selector),'Missing scope: '+selector);
  assert.ok(css.includes(value),'Missing safeguard value: '+value);
}
assert.ok(standard.includes('class="failure-bad"'),'Expected documented-as-written example');
assert.ok(standard.includes('color:#5DBF82'),'Expected legacy status labels');
assert.ok(training.includes('class="severity-level high"'),'Expected High severity label');
assert.ok(training.includes('class="rt-btn rt-high"')||training.includes('.rt-btn.rt-high'),'Expected high-rating control');
// Exact UI-state semantics, not a loose check for "disabled" elsewhere in a large file.
assert.match(training,/<button\\b[^>]*\\bid="poll-submit-btn"[^>]*\\bdisabled(?:\\s|>)/i,'Poll action must be natively disabled before a choice');
assert.match(training,/submitBtn\\.disabled=false/,'Answer selection must enable the native control');
assert.equal((training.match(/class="poll-btn" aria-pressed="false"/g)||[]).length,5,'All five answer buttons must expose pressed state');
assert.match(training,/btn\\.setAttribute\\('aria-pressed','true'\\)/,'Selection must update pressed state');
assert.match(training,/<div id="poll-result" role="region" tabindex="-1" aria-label="Illustrative reviewer analysis"/,'Revealed analysis must receive a screen reader target');
assert.match(training,/result\\.focus\\(\\{preventScroll:true\\}\\)/,'Move focus to revealed analysis');
assert.match(training,/The observation field is not submitted, retained or analyzed by JRS/,'Do not imply remote submission');
assert.match(training,/>Reveal reviewer analysis<\\/button>/,'Action label must match local behavior');
assert.doesNotMatch(training,/Every reviewer who has started this training has finished it/,'Remove unsupported 100 percent training completion claim');
// Contrast measured against white and light institutional panel background, not
// every possible browser-computed background. Visually confirm before release.
function srgb(v){const t=v/255;return t<=.04045?t/12.92:((t+.055)/1.055)**2.4}
function luminance(hex){const rgb=hex.match(/[0-9a-f]{2}/ig).map(v=>srgb(parseInt(v,16)));return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722}
function contrast(a,b){const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)}
for(const foreground of ['#8b4444','#1d6745','#925c16','#294456']){
 for(const background of ['#ffffff','#e7eef3']){
  assert.ok(contrast(foreground,background)>=4.5,foreground+' contrast below 4.5:1 on '+background);
 }
}
assert.ok(css.includes('#poll-submit-btn:disabled')&&css.includes('opacity:1!important'),'Disabled control must remain legible');
console.log('PASS: scoped Standard/Training text contrast >=4.5:1 on representative light surfaces; visibly disabled poll and underlined training links.');
