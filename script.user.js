// TODO: See if you can make it run both through a script tag on any website, or userscript

class FetchRequests {
  static async fetchPageText(url) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw Error(`Fetching code from ${url} failed.`)
      }
      return response.text();
    } 
    catch {
      throw Error(`Fetching code from ${url} failed.`)
    }
  }
  static async importCode(url) {
    if (window.location.hostname === "discord.com") {
      debugger;
      return;
    }
    let code = await this.fetchPageText(url);
    const script = document.createElement("script");
    script.innerHTML = code;
    document.head.append(script);
  }
}

class Assets {
  constructor() {
    // Yeah, this will be ran to import the assets and such.
  }
}

(async function() {
  await FetchRequests.importCode("https://raw.githubusercontent.com/rodaguJDev/mudae-discord-files/refactoring-code-base/modules/page/script.js");
  new Page();
})();

// (function() {
//   'use strict';
//   const userscriptEnviroment = typeof GM !== "undefined"
//   && typeof GM.getResourceText === "function";
//   if (userscriptEnviroment) {
//     return; // Assume everything is in GM.get...
//   }
//   // Get rest of the stuff.
// })();