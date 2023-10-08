// ==UserScript==
// @name        Mudae Script V2 INDEV - discord
// @namespace   Violentmonkey Scripts
// @match       https://discord.com/channels/*
// @version     2.0
// @author      rodaguJ
// @description GUI with utilities for the MUDAE bot
// @require     http://ajax.googleapis.com/ajax/libs/jquery/1.8.3/jquery.min.js
// @require     https://raw.githubusercontent.com/rodaguJDev/mudae-discord-files/refactoring-code-base/modules/page/script.js
// @require     https://raw.githubusercontent.com/rodaguJDev/mudae-discord-files/refactoring-code-base/modules/discord/script.js
// @require     https://raw.githubusercontent.com/rodaguJDev/mudae-discord-files/refactoring-code-base/modules/mudae-gui/script.js
// @require     https://raw.githubusercontent.com/rodaguJDev/mudae-discord-files/refactoring-code-base/modules/mudae-modules/script.js
// @resource    guihtml https://raw.githubusercontent.com/rodaguJDev/mudae-discord-files/refactoring-code-base/modules/mudae-gui/gui.html
// @resource    guicss https://raw.githubusercontent.com/rodaguJDev/mudae-discord-files/refactoring-code-base/modules/mudae-gui/guiStyle.css
// @grant       GM.addStyle
// @grant       GM.notification
// @grant       GM.getResourceText
// @grant       GM.getValue
// @grant       GM.setValue
// @grant       GM.deleteValue
// @grant       GM.listValues
// ==/UserScript==
// ! TODO: CHANGE refactoring-code-base TO main
class RequestUtils {
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

  static getRelativeURL(relativePath) {
    return new URL(relativePath, window.location.href);
  }
}

class MockViolentMonkey {
  async loadRequires() {
    /*
    ? HOW THIS WORKS
    * | 1st COL  | 2nd COL  | 3rd COL  | 4th COL  | *
    * | 00000011 | 00000001 | 00000010 | 00000000 | *
    * |    AND   |   AND    |   AND    |   AND    | *
    * | 00000001 | 00000001 | 00000001 | 00000001 | *
    * | -------- | -------- | -------- | -------- | *
    * | 00000001 | 00000001 | 00000000 | 00000000 | *
    * |   TRUE   |   TRUE   |   FALSE  |   FALSE  | *
    ? The AND operator is making any digit that is not being search be 0 all the time, while only making the one we are only be 1
    ? if it was already 1.
    */

    if (this.internalLoadStatus & 0b0001 > 0) {
      return;
    }

    for (const resource of this.requires) {
      const code = await RequestUtils.fetchPageText(resource);
      const script = document.createElement("script");
      script.innerHTML = code;
      document.head.append(script);
    }

    this.internalLoadStatus += 0b0001;
  }

  async loadResources() {
    if (this.internalLoadStatus & 0b0010 > 0) {
      return;
    }
    for (const key in this.resourcesURL) {
      this.resources[key] = await RequestUtils.fetchPageText(this.resourcesURL[key]);
    }

    this.internalLoadStatus += 0b0010;
  }

  isReady(timeout=30000) {
    if (this.loaded) {
      return true;
    }

    return new Promise((resolve, reject) => {
      setInterval(()=>{
        if (this.internalLoadStatus === 0b0011) {
          this.loaded = true;
          resolve();
        }
      }, 100)
      setTimeout(reject, timeout)
    });
  }

  constructor() {
    // Assert we're not mocking out on discord
    if (window.location.hostname === "discord.com") {
      debugger;
      throw "Invalid Enviroment Exception: Tried using mock GM on Discord.";
    }

    // Emmulating the Metadata
    const ASSETS_ROOT = USE_LOCAL_ASSETS ? RequestUtils.getRelativeURL("/") : `https://raw.githubusercontent.com/rodaguJDev/mudae-discord-files/${BRANCH}/`;
    this.requires = [
      `${ASSETS_ROOT}modules/page/script.js`,
      `${ASSETS_ROOT}modules/discord/script.js`,
      `${ASSETS_ROOT}modules/mudae-gui/script.js`,
      `${ASSETS_ROOT}modules/mudae-modules/script.js`,
    ]
    this.resourcesURL = {
      guihtml: `${ASSETS_ROOT}modules/mudae-gui/gui.html`,
      guicss: `${ASSETS_ROOT}modules/mudae-gui/guiStyle.css`
    }

    // Declaring internal variables
    this.resources = {};
    this.loaded = false;
    this.internalLoadStatus = 0b0000;

    // Running @require and @resource
    this.loadRequires();
    this.loadResources();
  }

  addStyle(css) {
    const style = document.createElement("style");
    style.innerHTML = css;
    document.head.append(style);
  }

  notification(options) {
    /*
    options: object
    text: string
    title?: string
    image?: string
    silent?: boolean = false- since VM2.15.2, Chrome 70
    tag?: string
    An ID for the tag, two notifications with the same ID won't exist.
    zombieTimeout?: number = 0
    onclick?: () => void
    Callback when the notification is clicked by user. As of VM2.15.2 it also forces the notification to be visible until clicked in Chrome which by default hides the notification after a few seconds.
    ondone?: () => void
    Callback when the notification is closed, either by user or by system.
    https://violentmonkey.github.io/api/gm/#gm_notification
    */
    throw "Implementation Error: Function is not implemented.";
  }

  getResourceURL(name) {
    return this.resourcesURL[name];
  }

  getResourceText(name) {
    return this.resources[name];
  }

  getValue(key, defaultValue) {
    throw "Implementation Error: Function is not implemented.";
  }

  setValue(key, value) {
    throw "Implementation Error: Function is not implemented.";
  }

  deleteValue(key) {
    throw "Implementation Error: Function is not implemented.";
  }

  listValues() {
    throw "Implementation Error: Class was not implemented.";
  }
}

const USE_LOCAL_ASSETS = true;
const BRANCH = "refactoring-code-base";

if (typeof GM === "undefined") {
  GM = new MockViolentMonkey();
}

(async function() {
  if (GM instanceof MockViolentMonkey){
    debugger;
    await GM.isReady();
  }

  // Actual Code here, at first will just be debugging for discord and such.
})();