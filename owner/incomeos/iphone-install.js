"use strict";
(function(){
  function init(){
    var panel=document.getElementById("iphone-install");
    var dismiss=document.getElementById("iphone-install-dismiss");
    if(!panel||!dismiss)return;
    var ua=navigator.userAgent||"";
    var ios=/iPhone|iPad|iPod/.test(ua);
    var standalone=window.navigator.standalone===true||window.matchMedia("(display-mode: standalone)").matches;
    // Show instructions only in the Safari browser, never inside the installed app.
    var safari=/Safari/.test(ua)&&!/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);
    if(!ios||standalone||!safari)return;
    panel.hidden=false;
    dismiss.addEventListener("click",function(){panel.hidden=true;});
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);
  else init();
}());
