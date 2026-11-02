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
assert.ok(training.includes('<button type="button" id="poll-submit-btn" onclick="submitPoll()" disabled style='),'Poll action must be natively disabled before a choice');
assert.ok(training.includes('submitBtn.disabled=false'),'Answer selection must enable the native control');
assert.equal((training.match(/class="poll-btn" aria-pressed="false"/g)||[]).length,5,'All five answer buttons must expose pressed state');
assert.ok(training.includes("btn.setAttribute('aria-pressed','true')"),'Selection must update pressed state');
assert.match(training,/<div id="poll-result" role="region" tabindex="-1" aria-label="Illustrative reviewer analysis"/,'Revealed analysis must receive a screen reader target');
assert.ok(training.includes('result.focus({preventScroll:true})'),'Move focus to revealed analysis');
assert.match(training,/The observation field is not submitted, retained or analyzed by JRS/,'Do not imply remote submission');
assert.ok(training.includes('>Reveal reviewer analysis</button>'),'Action label must match local behavior');
assert.doesNotMatch(training,/Every reviewer who has started this training has finished it/,'Remove unsupported 100 percent training completion claim');

// Optional completion must not solicit email from free-training visitors,
// claim a server record after a non-2xx response, or block local PNG creation.
assert.ok(training.includes("if (localStorage.getItem('jrs-training-enrolled') !== '1') return;"),
 'Only an already-successful opt-in enrollment may transmit a named completion');
assert.ok(training.includes("if (!response.ok) throw new Error('Completion service did not accept the request');"),
 'Non-success HTTP response must not mark named completion as sent');
assert.ok(training.includes("result.ok !== true"),
 'Completion receipt must affirmatively confirm acceptance');
assert.ok(training.includes("jrsCompletionPending")&&training.includes("finally(function(){ jrsCompletionPending = false; })"),
 'Concurrent completion requests must be deduplicated and retryable');
assert.ok(!training.includes("recordCompletion(true)")&&!training.includes("window.prompt('Enter the email you registered with"),
 'Unregistered training must not prompt for a completion email');
assert.ok(training.includes("recordCompletion(); // when named enrollment follows six already-completed modules"),
 'Late named registration may record a legitimately enrolled completer');
assert.ok(training.includes('The PNG is generated locally without enrollment'),
 'Describe local PNG accurately');
const privacy=read('privacy-notice.html');
assert.ok(privacy.includes('Training progress and completion.')&&privacy.includes('optional survey responses'),
 'Privacy notice must disclose browser storage and unregistered training telemetry');

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
