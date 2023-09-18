// ==UserScript==
// @name        Mudae Script - discord
// @namespace   Violentmonkey Scripts
// @match       https://discord.com/channels/*
// @match       http://127.0.0.1:5500/*
// @version     1.0
// @author      rodaguJ
// @description Auto Claim desired mudae characters as soon as they show up
// @grant       GM.getResourceText
// @require     http://ajax.googleapis.com/ajax/libs/jquery/1.8.3/jquery.min.js
// @resource    guihtml https://raw.githubusercontent.com/rodaguJDev/mudae-discord-files/main/gui.html
// @resource    guicss https://raw.githubusercontent.com/rodaguJDev/mudae-discord-files/main/gui-style.css
// ==/UserScript==

class Page {
  static waitForElement(selector, timeout=10000) {
    return new Promise((resolve, reject) => {
      const observer = new MutationObserver((mutationsList, observer) => {
        const element = document.querySelector(selector);
        if (element) {
          observer.disconnect();
          resolve(element);
        }
      });

      observer.observe(document.body, { childList: true, subtree: true });

      setTimeout(() => {
        observer.disconnect();
        reject(new Error(`Element with selector '${selector}' not found within ${timeout} ms.`));
      }, timeout);
    });
  }

  constructor(pageOptions) {
    this.haltRefresh = false;
    this.TOKEN = pageOptions.TOKEN;
    this.GUI_HTML = pageOptions.GUI_HTML;
    this.GUI_CSS = pageOptions.GUI_CSS;
    this.DEBUG_MODE = pageOptions.DEBUG_MODE;
    this.CONFIG = {
      DEBUG_CONSOLE: false,
      COMMAND: '$m', // This will 100% become a part of MudaeAutomation once that class exists
      SERVER_ID: '968552066165395496',
      CHANNEL_ID: '1009238449217347634'
    }
    this.WHITELIST = [
      "uzi",
      // "mudae-chan",
      "doll (md)",
      "serial designation n",
      "serial designation v",
      "sinon",
      "spider-gwen (gwen stacy)",
      "aqua",
      "jujutsu kaisen",
      "jonathan joestar",
      "paimon",
      "sans",
      "mari",
      "boingo",
      "kyoujurou rengoku",
      "amelie florence",
      "ken kaneki",
      "konan",
      "shinobu kochou",
      "alucard",
      "kazutora hanemiya",
      "satoru gojou",
      "lírio tellini",
      "xande",
      "guilherme santos",
      "francisco albuquerque",
      "theodore bagwell (opc)",
      "olivier florence",
      "doge",
      "sabito",
      "saul goodman",
      "jesse pinkman",
      "diavolo",
      "shin seyoung"
    ]

    if (this.GUI_CSS) {
      this.importStyle(this.GUI_CSS);
    }
    else {
      throw new Error("No CSS found");
    }

    if (!this.DEBUG_MODE) {
      // This will be here while we do not have MudaeAUtoMessage, that will complicate things since we don't want to refresh while sending messages, and at the same time if it's off, it should refresh after some time.
      setInterval(this.attemptRefresh, 1800);

      // Ensuring we are at the correct URL
      const titleObserve = new MutationObserver(this.correctCurrentUrl.bind(this));
      titleObserve.observe(document.querySelector("head title"), {childList: true})
      this.correctCurrentUrl();

      // Start the message listener
      Discord.setupMessageListener();
    }

    // Ask for notifications since MudaeAutoClaim uses them.
    if (typeof Notification != "undefined") {
      Notification.requestPermission();
    }

    const marker = document.createElement("div");
    marker.classList.add("mudae-gui-marker");
    document.head.appendChild(marker);
  }

  setStorageItem(key, value) {
    const iframe = document.createElement("iframe");
    document.head.append(iframe);

    const lsdescriptor = Object.getOwnPropertyDescriptor(iframe.contentWindow, "localStorage");
    const LS = lsdescriptor.get.call(iframe.contentWindow);
    let result = LS.setItem(key, value);
    iframe.remove();

    return result;
  }

  getStorageItem(key) {
    const ifr = document.createElement("iframe");
    document.head.append(ifr);

    const lstorageDescriptor = Object.getOwnPropertyDescriptor(ifr.contentWindow, "localStorage");
    const LS = lstorageDescriptor.get.call(ifr.contentwindow);
    let item = LS.getItem(key);
    ifr.remove();

    return item;
  }

  attemptRefresh() {
    // TODO: Rewrite: get page delay and wait it, after that check a variable that is false when something is stopping the page from refreshing (page.allowRefresh). Use a setInterval that will be checkijg that variable after the intiial delay, if it is true, run window.location.reload. That way, we just need to run scheduleRefresh[rename func] as an async.
    const hourToMSCoefficient = 60*60*1000;
    const currentPageTime = document.timeline.currentTime
    const minimumDelayMS = 3 * hourToMSCoefficient;

    if (currentPageTime > minimumDelayMS) {
      window.location.reload();
    }
    /* const MIN = 90*60*1000; // 1 Hour 30 Minutes to MS
    const MAX = MIN * 2;

    return setInterval(function() {
      window.location.reload();
    }, randomWithinRange(MIN, MAX)) */
  }

  correctCurrentUrl() {
    const urlPathSegments = window.location.pathname.split('/');

    if ( urlPathSegments[1] !== "channels"
    || urlPathSegments[2] !== this.CONFIG.SERVER_ID
    || urlPathSegments[3] !== this.CONFIG.CHANNEL_ID)
    {
      window.location.href =
      `https://discord.com/channels/${this.CONFIG.SERVER_ID}/${this.CONFIG.CHANNEL_ID}`;
    }
  }

  importStyle(style) {
    const currentStyle = document.head.querySelector("#mudae-custom-style")

    if (currentStyle) {
      // document.head.removeChild(currentStyle);
      currentStyle.innerHTML = style;
      return;
    }

    const customStyle = document.createElement("style");
    customStyle.id = "mudae-custom-style";
    customStyle.innerHTML = style;
    document.head.appendChild(customStyle);
  }
}

class Discord {
  static messageListeners = [];
  static getMessageId(msgElement) {
    return msgElement?.id?.split("-")[3];
  }

  static sendMessage(message) {
    //TODO: DO NOT complete this function before addressing the missing features of scheduleMessages
    mudaelogs.createDebugLog(`Sending ${message}...`);
    let url = `https://discord.com/api/v9/channels/${page.CONFIG.CHANNEL_ID}/messages`;
    let headers = {
      'Authorization': TOKEN,
      'Content-Type': "application/json",
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
    }
    let payload = {
      'content': message
    }

    fetch(url, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(payload)
    })
    mudaelogs.add(`[DISCORD] Message sent with response status '${response.status}'`, "blue")
  }

  static reactToMessage(msgId) {
    if (!msgId) {
      mudaelogs.createLog(`Error: ${msgId} is not a valid ID}`)
    }

    const api = 'https://discord.com/api/v9/channels/'
    const emoji = "%F0%9F%A4%97/%40me";
    const url =
    `${api}${page.CONFIG.CHANNEL_ID}/messages/${msgId}/reactions/${emoji}`
    const headers = {
      'Authorization': TOKEN,
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
    }

    fetch(url, {
      method: 'PUT',
      headers: headers
    })
    .then(response => {
      mudaelogs.addConsoleLog(`[DISCORD] Message reaction sent with response status '${response.status}'`, "blue")
    })
  }

  static onNewMessage(method) {
    this.messageListeners.push(method);
  }

  static async setupMessageListener() {
    const messageObserver = new MutationObserver(function(mutations) {
      for (const mutationRecord of mutations) {
        for (const node of mutationRecord.addedNodes) {
          // I assume addedNodes will return null sometimes. But I need to actually test that
          if (!node) {
            debugger;
            return;
          };

          if (node.nodeName == "LI" && Discord.getMessageId(node)) {
            this.messageListeners.forEach(listener => listener(node));
          }
        }
      }
    }.bind(this));

    const msgContainer = await Page.waitForElement("[class|='scrollerInner']", 30000).catch(() => {
      debugger;
      window.location.reload();
    });

    messageObserver.observe(msgContainer, {
      'childList': true
    });
  }
}

class MudaeGUI {
  constructor() {
    // this.guiDragging = false;
    // this.dragMaxXPos = 0;
    // this.dragMaxYPos = 0;
    // this.dragOffsetX = 0;
    // this.dragOffsetY = 0;
    /*
    TODO: Implement a whitelist system using localstorage instead of a hard coded one
    TODO: Make each function work
    */

    // Basic Loading
    this.guiElement = document.createElement("div");
    this.guiElement.className = "mudae-gui";
    this.guiElement.innerHTML = page.GUI_HTML;
    document.body.appendChild(this.guiElement);

    this.setupGUI();
  }

  setupGUI() {
    // Locating Objects
    const closeButton = this.guiElement.querySelector(".mudae-close-button");
    const minimizeButton = this.guiElement.querySelector(".mudae-minimize-button");
    const categoryList = this.guiElement.querySelector(".mudae-gui-categories");
    const guiElement = this.guiElement;
    /* const categoryDict = {
      "mudae-button-auto-claim": "#mudae-category-auto-claim",
      "mudae-button-auto-command": "#mudae-category-auto-command",
      "mudae-button-whitelist": "#mudae-category-whitelist",
      "mudae-button-utilities": "#mudae-category-utilities",
      "mudae-button-logs": "#mudae-category-logs",
    } */

    // Drag Logic
    guiElement.addEventListener("mousedown", this.startGUIDrag.bind(this));
    guiElement.addEventListener("touchstart", this.startGUIDrag.bind(this));
    window.addEventListener("mousemove", this.updateGUIDrag.bind(this));
    window.addEventListener("touchmove", this.updateGUIDrag.bind(this));
    window.addEventListener("mouseup", this.stopGUIDrag.bind(this));
    window.addEventListener("touchend", this.stopGUIDrag.bind(this));

    // Window Control Logic
    closeButton.addEventListener("click", this.closeGUI.bind(this));
    minimizeButton.addEventListener("click", this.toggleGUI.bind(this));
    document.addEventListener("keydown", (event) => {
      if (event.shiftKey && event.code === "ShiftRight") {
        this.toggleGUI();
      }
    });

    // Category Logic
    for (const button of categoryList.children) {
      button.addEventListener("click", () => {
        const categorySelector = button.id.replace("button", "category");
        const category = this.guiElement.querySelector("#" + categorySelector);
        this.changeCategory(button, category);
      });
    }

    // Create GUI Modules
    this.mudaelogs = new MudaeLogs(this);
    this.mudaeautoclaim = new MudaeAutoClaim(this);
    this.mudaelogs.createLog("Console Logic V1.1 Loaded");

    // Debug Mode
    if (page.DEBUG_MODE) {
      window.guiclass = this;
      console.customLog = this.mudaelogs.createLog.bind(this.mudaelogs); // Evaluate if you need this bind statemnt
    }
  }

  configLogic() {
    // Logic that verifies the checkmarks and runs the functions acording to them
    return;
  }

  changeCategory(button, newCategory) {
    const currentCategoryButton = this.guiElement.querySelector(".mudae-selected-button");
    const currentCategory = document.querySelector(".mudae-current-category");

    currentCategory?.classList.remove("mudae-current-category");
    currentCategoryButton?.classList.remove("mudae-selected-button");
    newCategory.classList.add("mudae-current-category");
    button.classList.add("mudae-selected-button");
  }


  // GUI Controls
  closeGUI() {
    this.guiElement.remove();
    this.guiElement = undefined;
  }

  toggleGUI() {
    this.guiElement.classList.toggle("mudae-minimized");
  }

  // GUI Drag
  startGUIDrag(event) {
    // Prevent the dragging from happening if we're on the Content (In the future when we do the GUI revamp, we'll limit the header to the draggable area)
    // the .closest function is basically a "FindParentElement"
    if (event.target?.closest(".mudae-options")) {
      return;
    }

    if (event.target?.closest(".mudae-button-category")) {
      return;
    }

    let clientX;
    let clientY;
    if (event.type == "touchstart") {
      clientX = event.touches[0].clientX;
      clientY = event.touches[0].clientY;
    }
    else {
      clientX = event.clientX;
      clientY = event.clientY;
    }

    this.guiDragging = true;
    this.dragMaxXPos = window.innerWidth - this.guiElement.offsetWidth;
    this.dragMaxYPos = window.innerHeight - this.guiElement.offsetHeight;

    // Matematically, this.dragOffset is "canceling out" the distance of the mouse and the gui from the edge of the screen and getting the difference between the top-left corner of the GUI and the mouse position
    this.dragOffsetX = clientX - this.guiElement.getBoundingClientRect().left;
    this.dragOffsetY = clientY - this.guiElement.getBoundingClientRect().top;
  }

  updateGUIDrag(event) {
    if (this.guiElement && this.guiDragging) {
      let clientX;
      let clientY;

      if (event.type == "touchmove") {
        clientX = event.touches[0].clientX;
        clientY = event.touches[0].clientY;
      }
      else {
        clientX = event.clientX;
        clientY = event.clientY;
      }

      let x = clientX - this.dragOffsetX;
      let y = clientY - this.dragOffsetY;

      x = Math.min(Math.max(0, x), this.dragMaxXPos);
      y = Math.min(Math.max(0, y), this.dragMaxYPos);

      this.guiElement.style.left = x + "px";
      this.guiElement.style.top = y + "px";
    }
  }

  stopGUIDrag() {
    this.guiDragging = false;
  }
}

class MudaeLogs {
  constructor(parentgui) {
    this.parentgui = parentgui;
    this.guiElement = parentgui.guiElement;
  }

  addConsoleLog(log, color) {
    //TODO: Split the console into 2, the debug console, and the regular console
    if (!this.guiElement) {
      debugger;
      return;
    }

    const consoleLogs = this.guiElement.querySelector("#mudae-console");
    const consoleContainer = consoleLogs.parentNode
    const consoleLimit = 150;

    if (!consoleLogs) {
      debugger;
      return;
    }

    if (consoleLogs.childNodes.length > consoleLimit) {
      consoleLogs.removeChild(consoleLogs.childNodes[0]);
    }

    const logElement = document.createElement("li");
    logElement.innerHTML = log;

    if (color) {
      logElement.style.color = color;
    }
    consoleLogs.appendChild(logElement);

    consoleContainer.scrollTo(0, consoleContainer.scrollHeight)
  }

  createLog(msg) {
    return this.addConsoleLog(`~ [MUDAE] ${msg}`)
  }

  createDebugLog(msg) {
    if (page.CONFIG.DEBUG_CONSOLE) {
      return this.addConsoleLog(`~ [MUDAE DEBUG] ${msg}`, "orange");
    }
  }
}

class MudaeWhitelist {
  // Whitelist Functions here
  constructor() {
    return;
  }
}

class MudaeAutoMessage {
  async startMessageInterval(message) {
    const forbiddenHourMin = 4;
    const forbiddenHourMax = 12;
    let now;
    let nextHourWait = 0;
    let minutesDelay = 0;
    let finalDelay = 0;
    let nowUTCHours = 0;

    while (true) {
      now = new Date();
      nextHourWait = 60 - now.getUTCMinutes();
      minutesDelay = randomWithinRange(0, 35);
      finalDelay = (nextHourWait + minutesDelay);

      now.setMinutes(now.getMinutes() + finalDelay);

      mudaelogs.createDebugLog(`Waiting ${finalDelay} minutes until we'll send messages`);
      mudaelogs.createLog(`Messages will be sent at ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`);

      await new Promise(resolve => setTimeout(resolve, finalDelay * 60 * 1000));

      nowUTCHours = now.getUTCHours();
      if (nowUTCHours >= forbiddenHourMin && nowUTCHours <= forbiddenHourMax) {
        mudaelogs.createDebugLog("We couldn't run the code: it is too late at night")
        continue;
      }

      mudaelogs.createDebugLog("Message wait finished, sending messages");
      for (let i = 0; i < 8; i++) {
        await this.sendMessageWithDelay();
      }
      page.attemptRefresh();
    }
  }

  async sendMessageWithDelay(message) {
    return new Promise(resolve => {
      setTimeout(() => {
        Discord.sendMessage(message);
        resolve();
      }, randomWithinRange(1000, 2000));
    })
  }
}
// Holy shit this worked first try how tf-
class MudaeAutoClaim {
  constructor(parentgui) {
    if (page.DEBUG_MODE) {
      return;
    }

    this.parentgui = parentgui;
    this.mudaelogs = parentgui.mudaelogs;

    Discord.onNewMessage(this.verifyNode.bind(this));
  }
/*
  messageListener(mutations) {
    for (const mutationRecord of mutations) {
      for (const node of mutationRecord.addedNodes) {
        // I assume addedNodes will return null sometimes. But I need to actually test that
        if (!node) {
          debugger;
          return;
        };
        this.verifyNode(node);
      }
    }
  }
 */
  verifyNode(msgElement) {
    if (msgElement?.nodeName !== 'LI') {
      return;
    }

    const msg = msgElement.querySelector("[id|='message-content']")?.innerText;
    const haremName = this.getHaremName(msgElement);
    const msgId = Discord.getMessageId(msgElement);

    // TODO: Consider either putting the 2 checks below inside isMudaeClaimable or pulling the checks from isMudaeClaimable to this verifyNode function.
    if (!haremName || !msgId) {
      this.mudaelogs.createDebugLog(`The element/message of ID/CLASS '${msgId || msgElement.id || msgElement.classList[0]}' does not have a haremName (or msgId)`);
      return;
    };

    this.mudaelogs.createDebugLog(`Message of id ${msgId} has msg=${msg}; haremName=${haremName}`)
    if (msg && msg[0] === "$") {
      this.mudaelogs.createDebugLog(`${msg} was a command statement`);
      debugger; // haremName is catching this situation before this if. I will keep an eye on it in case something unexpected happens
      return;
    };

    if (!this.isMudaeClaimable(msgElement)) {
      this.mudaelogs.createDebugLog(`${msg || haremName} is NOT a valid harem`);
      return;
    };


    if (page.WHITELIST.includes(haremName.toLowerCase())) {
      this.claimHarem(msgElement);
      return;
    }

    this.mudaelogs.createLog(`${haremName} is NOT in your whitelist`);
  }

  isMudaeClaimable(msgElement) {
    /* In order to validate the message you must do the following:
    * Assert the message contains an article element
    //  Assert the message contains a haremName
    * Assert the message contains an image from the domain mudae.net or imgur.com
    * Assert the message button count is lesser than 1
    //  Check the sidebar color (if there are any), if it is red it usually means the harem is claimed or that someone ran "$mmi" REPLACED WITH CHECKING BUTTON COUNT
    */
    const msgId = Discord.getMessageId(msgElement);
    if (!msgElement.querySelector('article')) { //* Check for obsoleteness later (since it stops any message that does not have an embedAuthorName, it would, by proxy, stop anything without an article)
      this.mudaelogs.createDebugLog(`Message of ID ${msgId} does not have an article.`);
      debugger;
      return false;
    }

    const haremName = this.getHaremName(msgElement)
    const imageURL = msgElement.querySelector("[class^='originalLink']")?.href;
    //* is this necessary? Like, if it has an article with an image, but does not have an image from imgur or mudae.net, a false negative could occour
    if (!(imageURL?.includes('https://mudae.net')
    || imageURL?.includes("https://imgur.com")))
    {
      this.mudaelogs.createDebugLog(`Message of ID ${msgId} does not have a valid img link.`);
      return false;
    }

    let buttons = msgElement.querySelector('button')?.parentNode?.children;
    if (buttons?.length > 1) { // Just FYI, I removed the double check that ensure buttons existed.
      // this.mudaelogs.createDebugLog(`Message of ID ${msgId} contains too many buttons`);
      this.mudaelogs.createLog(`Stopped claimimg ${haremName} because it had too many buttons`)
      return false;
    }

    // this.mudaelogs.createDebugLog(`Validating Message ${msgId}`);
    return true;
  }

  claimHarem(msgElement) {
    const buttons = msgElement.querySelector('button')?.parentNode?.children;
    const messageId = Discord.getMessageId(msgElement);
    const haremName = this.getHaremName(msgElement);

    this.mudaelogs.createLog(`Claiming ${this.getHaremName(msgElement)}...`);

    if (buttons?.length >= 1) {
      this.mudaelogs.createDebugLog(`Pressing ${messageId} button`);
      buttons[0].click();
    }

    Discord.reactToMessage(messageId);

    if (typeof Notification != "undefined" && Notification.permission != "denied") {
      new Notification(`[MUDAE GUI] Hey! We just caught '${haremName}'`,
      {
        body: "We recommend you check out to see if it was indeed successful",
        icon: "https://cdn.discordapp.com/attachments/1046111237966151772/1149569488526778389/templogo.png"
      })
    }
    this.mudaelogs.createDebugLog(`Finished claiming ${messageId} (${haremName})`);
  }

  getHaremName(msgElement) {
    return msgElement?.querySelector("[class|='embedAuthorName']")?.innerText;
  }
}

function isValidEnviroment() {
  const ALREADY_RAN = document.head.querySelector(".mudae-gui-marker");
  const ON_DISCORD = window.location.hostname === "discord.com";
  const VIOLENTMONKEY = typeof GM !== 'undefined' && typeof GM.getResourceText !== 'undefined';
  const VENCORD_EXISTS = typeof Vencord === "undefined";

  if (ALREADY_RAN) {
    return false;
  }

  if (ON_DISCORD) {
    if (!VIOLENTMONKEY) {
      alert("[MUDAE GUI] Invalid UserScript enviroment.");
      return false
    }
    if (VENCORD_EXISTS) {
      alert("[MUDAE GUI] Install the VENCORD extension to prevent discord detection.");
      return false;
    }
  }

  return true;
}

function getDiscordToken() {
  try {
    webpackChunkdiscord_app.push([
      [''],
      {},
      e => {
        m=[];
        for(let c in e.c) m.push(e.c[c])
      }
    ]);
  }
  catch (e) {
    return "";
  }
  return m.find(m => m?.exports?.default?.getToken !== void 0)
  .exports.default.getToken();
}

function randomWithinRange(min, max) {
  return Math.floor(Math.random()*(max-min+1)) + min;
}

async function fetchUrl(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`Error fetching url ${url}: ${response.status} ${response.statusText}`);
      return '';
    }

    return response.text();
  }
  catch {
    console.error(`Error fetching ${url}: ${error}`);
    return '';
  }
}

let page, mudaegui, mudaelogs;
(async function() {
  'use strict';

  if (!isValidEnviroment()) {
    return;
  }

  let GUI_HTML;
  let GUI_CSS;
  const BRANCH = "changing-gui-buttons"; // TODO!: CHANGE BACK
  const DEBUG_MODE = window.location.hostname !== "discord.com";
  const TOKEN = DEBUG_MODE ? "" : getDiscordToken();
  const HTML_URL = `https://raw.githubusercontent.com/rodaguJDev/mudae-discord-files/${BRANCH}/gui.html`;
  const CSS_URL = `https://raw.githubusercontent.com/rodaguJDev/mudae-discord-files/${BRANCH}/gui-style.css`;

  // We cannot run discord if we're not on the main branch
  if (BRANCH != "main" && !DEBUG_MODE) {
    debugger;
    return;
  }

  // GUI_HTML can be read either from GreaseMonkey or from a normal fetch
  if (typeof GM !== 'undefined' && typeof GM.getResourceText !== 'undefined') {
    GUI_CSS = GM.getResourceText("guicss");
    GUI_HTML = GM.getResourceText("guihtml");
  }
  else if (DEBUG_MODE) {
    GUI_HTML = await fetchUrl(HTML_URL);
    GUI_CSS = await fetchUrl(CSS_URL);
  }
  else {
    throw new Error("Unable to get GUI resources");
  }

  page = new Page({
    TOKEN: TOKEN,
    GUI_HTML: GUI_HTML,
    GUI_CSS: GUI_CSS,
    DEBUG_MODE: DEBUG_MODE
  });
  mudaegui = new MudaeGUI();
  mudaelogs = mudaegui.mudaelogs;
  // const mudaeautomessage = new MudaeAutoMessage();

  mudaelogs.createDebugLog("Debug logs enabled");
  // ! TODO: Fix the GUI
  // ! TODO: After that, start working on MudaeAutoRoll
  // TODO: See if you can make this modular using @require from a github page. Not really, you require on public variables a lot
  // TODO: Maybe save every event listener to a list, and once Close is pressed disconnect them.
  // TODO: Look for the response message of mudae before sending another $m scratch that maybe, at leastcheck if mudae is sending the "dude you have no rolls left". With that, the message listener should be readly available to every class through the Discord class. (Right now only MudaeAutoClaim has it)
  // TODO: Remove OPTIONROW system, we already have flex
  // TODO: Store the configs in Local Storage so that we don't lose it, that will be the defining factor as to how we'll link the GUI control panel to the rest of the code.
  // TODO: I just had the best idea, instead of struggling to react to a message we could make the GUI have a category called "previous harem" which will list the last 10 harem that were sent, we will display the Name of the harem, the kakera count and the image (scaled obviously). It will be in the format of a card and if you click on the image you react to the message (msgId is stored obviously). DO NOT forget to consider the option of making the card available for 45 seconds before deleting it, instead of using the 10 harem limit.
  // TODO: If you really cannot improve the current GUI format, then copy Orion Library's model
  // TODO: After creating the other functions, make the console prettier, maybe allow for colors to be used, separate debugConsole from normalConsole. Maybe scratch those 2 terms and make it so Console is DebugConsole, and anything that would come from normalConsole is sent to the autoclaimcard idea above and just make claiming as another debug feature
})();


// TODO: Claim anything that is wished by someone (make it optional)
// TODO: create a "Series" wishlist filter so that if it is from a specific series it claims
// TODO: Finish the "GUI" element so you don't have to edit the code to modify configs
// TODO: Fix Indentation

//? GUI Elements:
//* Automation
// h3 Claims
//? Claim using Character Whitelist (checkbox);
//? Claim using Series Whitelist (checkbox);
//? Claim using minimum Kakera (checkbox);
//? Claim Whishlisted (by anyone) (checkbox);
// h3 Rolls
//? AutoRoll(checkbox)
//? RollCommand (text)
//? RollCommandCount (default: 8)
//? Roll Will be sent at: (readonly span);
//* Whitelist
//? Whitelisted Characters(textbox with values saved to localStorage)
//? Whitelisted Series(textbox with values saved to localStorage)
//? Minimum Kakera (number)
//* Utilities
// h3 Rolls
//? Roll (button)
//? Recharge Rolls (button, sends $daily $rolls $dk);
// h3 Page
//? Enforce URL (checkbox)
//? Page will be refreshed at: (readonly span);
//* Claimable
//? [A list of available harems to claim in the moment]
//* Logs
//? Console (UL)
