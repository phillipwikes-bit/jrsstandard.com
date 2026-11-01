"use strict";
(function () {
  var exportButton=document.getElementById("vault-export");
  var importButton=document.getElementById("vault-import");
  var pass=document.getElementById("vault-passphrase");
  var file=document.getElementById("vault-file");
  var status=document.getElementById("vault-status");
  if(!exportButton||!importButton||!pass||!file||!status||!window.IncomeOSVault)return;
  function setState(msg){status.textContent=msg;}
  function download(text,name){
    var url=URL.createObjectURL(new Blob([text],{type:"application/json"}));
    var a=document.createElement("a");a.href=url;a.download=name;
    document.body.appendChild(a);a.click();a.remove();
    setTimeout(function(){URL.revokeObjectURL(url);},1500);
  }
  exportButton.addEventListener("click",async function(){
    exportButton.disabled=true;
    try {
      var envelope=await window.IncomeOSVault.encrypt(pass.value,window.IncomeOSVault.capture(localStorage));
      download(envelope,"IncomeOS-private-backup-"+new Date().toISOString().slice(0,10)+".encrypted.json");
      setState("Encrypted backup generated on this device. Store it securely. The browser's live data remains unencrypted.");
    } catch(e){setState(e.message||"Unable to encrypt backup.");}
    finally{pass.value="";exportButton.disabled=false;}
  });
  importButton.addEventListener("click",async function(){
    if(!file.files||file.files.length!==1){setState("Select one encrypted backup file.");return;}
    if(file.files[0].size>8000000){setState("Backup exceeds the 8 MB file limit.");return;}
    importButton.disabled=true;
    try{
      var clear=await window.IncomeOSVault.decrypt(pass.value,await file.files[0].text());
      var keys=Object.keys(clear.values).length;
      if(!confirm("Replace existing IncomeOS device records with "+keys+" data sets from this encrypted backup? This cannot be undone without another backup.")){setState("Restore canceled; records unchanged.");return;}
      window.IncomeOSVault.restore(localStorage,clear);
      setState("Encrypted backup restored. Refreshing local records.");
      location.reload();
    }catch(e){setState("Restore failed: backup invalid, unsupported, or passphrase incorrect. Existing records were not changed.");}
    finally{pass.value="";file.value="";importButton.disabled=false;}
  });
}());