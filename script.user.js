// TODO: See if you can make it run both through a script tag on any website, or userscript

(function() {
  'use strict';
  
  const userscriptEnviroment = typeof GM !== "undefined" 
  && typeof GM.getResourceText === "function";
  if (userscriptEnviroment) {
    return; // Assume everything is in GM.get...
  }
  
  // Get rest of the stuff.
})();