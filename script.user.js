// TODO: See if you can make it run both through a script tag on any website, or userscript

class FetchRequests {
  static async importCode(url) {
    if (window.location.hostname === "discord.com") {
      debugger;
      return;
    }

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw Error(`Fetching code from ${url} failed.`)
      }
      const code = await response.text();
    } 
    catch {
      throw Error(`Fetching code from ${url} failed.`)
    }
    
    console.log(code)
  }
}

class Assets {
  constructor() {
    // Yeah, this will be ran to import the assets and such.
  }
}

FetchRequests.importCode("yest");
// (function() {
//   'use strict';
//   const userscriptEnviroment = typeof GM !== "undefined"
//   && typeof GM.getResourceText === "function";
//   if (userscriptEnviroment) {
//     return; // Assume everything is in GM.get...
//   }
//   // Get rest of the stuff.
// })();