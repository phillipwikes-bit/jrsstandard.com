// Behavioral regression of the local Training PNG certificate rendering.
// Runs the actual production drawing function with a fake canvas. No calls
// to participant, certificate issuance, or completion endpoints occur.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const html=readFileSync(new URL('../training.html',import.meta.url),'utf8');
const start=html.indexOf('async function generateCert() {');
const end=html.indexOf('\nfunction downloadCert() {',start);
assert.ok(start>=0 && end>start,'training completion renderer missing');
const code=html.slice(start,end);
function fixture(value,ready=Promise.resolve()){
  const drawn=[],colors=[],alerts=[],actions={style:{display:'none'}};
  const input={value};
  const context={
    font:'normal 16px Georgia,serif',
    fillRect(){},strokeRect(){},beginPath(){},moveTo(){},lineTo(){},stroke(){},
    fillText(text,x,y){drawn.push({text,x,y,font:this.font,color:this.fillStyle})},
    measureText(text){
      const size=Number(this.font.match(/(\d+)px/)?.[1]||16);
      return {width:String(text).length*size*.58};
    },
    set fillStyle(value){this._fillStyle=value;colors.push(value)},
    get fillStyle(){return this._fillStyle},
    lineWidth:0,strokeStyle:'',textAlign:'left'
  };
  const canvas={style:{display:'none'},getContext(){return context}};
  const byId={'cert-name':input,'cert-canvas':canvas,'cert-actions':actions};
  const env=vm.createContext({
    document:{fonts:{ready},getElementById(id){return byId[id]}},
    jrsSanitizeCheck(){return true},
    alert(message){alerts.push(message)},
    Date,Promise
  });
  vm.runInContext(code+'\nthis.generateCert=generateCert;',env,{timeout:500});
  return {drawn,colors,alerts,actions,canvas,run:()=>env.generateCert()};
}

const regular=fixture('  Jordan    Example  ');
await regular.run();
assert.equal(regular.alerts.length,0);
assert.ok(regular.drawn.some(x=>x.text==='Jordan Example'),'name must be normalized, not dropped');
assert.equal(regular.canvas.style.display,'block');
assert.equal(regular.actions.style.display,'flex');
assert.ok(regular.colors.includes('#F5F7F8')&&regular.colors.includes('#17364F'));
assert.ok(regular.drawn.some(x=>/RECORD OF COMPLETION/.test(x.text)));
assert.ok(regular.drawn.some(x=>/not professional certification/i.test(x.text)));
assert.ok(!regular.drawn.some(x=>/internal distribution/i.test(x.text)));

const long='Alexandria Elizabeth-Margaret Jordan-James Montgomery Spencer Alexandra James';
const wrapped=fixture(long);
await wrapped.run();
assert.equal(wrapped.alerts.length,0);
const nameDraws=wrapped.drawn.filter(x=>x.font.includes('Georgia') && x.y>=218&&x.y<=264);
assert.ok(nameDraws.length>=2&&nameDraws.length<=3,'long names must wrap legibly');
assert.equal(nameDraws.map(x=>x.text).join(' '),long,'all name words must appear in order');
assert.ok(nameDraws.every(x=>x.text.length*Number(x.font.match(/(\d+)px/)[1])*.58<=708),
 'name lines must fit canvas content width');

const impossible=fixture('X'.repeat(240));
await impossible.run();
assert.equal(impossible.alerts.length,1,'unrenderable name must be disclosed');
assert.equal(impossible.canvas.style.display,'none');
assert.equal(impossible.actions.style.display,'none');

let releaseFont;
const deferred=new Promise(resolve=>releaseFont=resolve);
const delayed=fixture('Casey Reviewer',deferred);
const drawing=delayed.run();
assert.equal(delayed.drawn.length,0,'must wait for webfonts');
releaseFont();
await drawing;
assert.ok(delayed.drawn.length>0);

console.log('PASS: Training completion PNG uses institutional colors, waits for fonts, preserves wrapped names and fails visibly without clipping.');
