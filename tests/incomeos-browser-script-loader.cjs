"use strict";
// Load legacy browser IIFEs in the calling Node realm. The repository uses
// "type": "module", so require(".../*.js") does not expose their browser globals.
const {readFileSync}=require("node:fs");
const {resolve}=require("node:path");
const {runInThisContext}=require("node:vm");
module.exports=function loadIncomeOSScript(filename,globalName){
  if(!/^[a-z0-9-]+\.js$/.test(filename)||!/^IncomeOS[A-Za-z0-9]+$/.test(globalName))
    throw Error("Invalid script fixture");
  const pathname=resolve(__dirname,"../owner/incomeos",filename);
  runInThisContext(readFileSync(pathname,"utf8"),{filename:pathname});
  const api=globalThis[globalName];
  if(!api||typeof api!=="object")throw Error("Browser script did not register "+globalName);
  return api;
};
