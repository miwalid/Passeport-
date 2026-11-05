import fs from 'node:fs';import ts from 'typescript';import assert from 'node:assert/strict';
const js=ts.transpileModule(fs.readFileSync('lib/compass.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.ES2022}}).outputText;const {compassHeading:h}=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
const abs=(alpha,beta=0,gamma=0)=>({absolute:true,alpha,beta,gamma});
assert.equal(h({alpha:90,absolute:false}),null);assert.equal(h({alpha:null,absolute:true}),null);
for(const [alpha,expected] of [[0,0],[90,270],[180,180],[270,90]])assert(Math.abs(h(abs(alpha))-expected)<1e-6);
assert.equal(h(abs(0),90),90);assert.equal(h(abs(0),270),270);assert(Math.abs(h(abs(270,30,15))-90)<1e-6);assert.equal(h(abs(0,90)),null);
assert.equal(h({webkitCompassHeading:350},90),80);assert.equal(h({type:'deviceorientationabsolute',alpha:270}),90);assert.equal(h({webkitCompassHeading:10,webkitCompassAccuracy:-1}),null);
console.log('PASS compass: absolute north, relative/null rejection, tilt, screen rotation, WebKit, vertical rejection');
