// Guard seven-point record check selection instructions without changing the method.
// Source-level evidence only; this is not a usability or accessibility certification.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const html=readFileSync(new URL('../check.html',import.meta.url),'utf8');
assert.match(html,/Read it once, then apply the seven prompts\./,
 'instructions must not imply all seven prompts are binary yes\/no questions');
assert.match(html,/Tick an item when the record does not meet the prompt, indicates the weaker of two alternatives, or leaves you unsure\./,
 'instructions must cover both binary and either\/or review questions');
assert.match(html,/Each tick calls for source verification, not a finding or score\./,
 'a selected item must not be presented as a confirmed deficiency');
assert.doesNotMatch(html,/Tick a box only where the answer is no or you are unsure\./,
 'ambiguous binary-selection instructions have returned');
const expected=[
 'Fluent groundlessness','Basis substitution','Chronology collapse',
 'Reasoning elision','Confident underspecification','Evidentiary overreach',
 'Untraceable authority'
];
const actual=[...html.matchAll(/<label class="chk"><input type="checkbox" class="sa" data-mode="([^"]+)"/g)]
 .map(match=>match[1]);
assert.deepEqual(actual,expected,'all seven unchanged check categories must remain available');
assert.match(html,/The count is not a score/,'the check must retain non-scoring disclosure');
console.log('PASS: selection guidance covers mixed question types without changing seven checks or making a diagnostic claim.');
