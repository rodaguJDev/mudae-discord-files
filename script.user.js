// TODO: See if you can make it run both through a script tag on any website, or userscript

class FetchRequests {
  static async importCode(url) {
    if (window.location.hostname === "discord.com") {
      debugger;
      return;
    }

    // Rewrite without .then
    return await fetch(url)
    .then(response => {
      if (!response.ok) {
        throw Error(`Mudae GUI - Could not fetch from URL ${url}`);
      }
      return response;
    })
    .then(data => {
      return data.text();
    })
    .catch(error => {
      throw Error(`Mudae GUI - An error occurred: ${error.message}`);
    });
  }
}
class Assets {
  constructor() {
    // Yeah, this will be ran to import the assets and such.
  }
}
// (function() {
//   'use strict';
//   const userscriptEnviroment = typeof GM !== "undefined"
//   && typeof GM.getResourceText === "function";
//   if (userscriptEnviroment) {
//     return; // Assume everything is in GM.get...
//   }
//   // Get rest of the stuff.
// })();