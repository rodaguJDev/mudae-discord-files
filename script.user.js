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
// @require     https://gist.github.com/raw/2625891/waitForKeyElements.js
// @resource    guihtml https://raw.githubusercontent.com/rodaguJDev/mudae-discord-files/main/gui.html
// @resource    guicss https://raw.githubusercontent.com/rodaguJDev/mudae-discord-files/main/gui-style.css
// ==/UserScript==

// do it
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

(async function() {
  'use strict';

  //const DEBUGGING_UI = window.location.href.includes("debugger.html")
  // const isValidVMEnviroment = typeof GM !== 'undefined' && typeof GM.getResourceText !== 'undefined';
  // const DEBUGGING_UI = window.location.hostname !== "discord.com";
  // const LOCALHOST = window.location.hostname === "127.0.0.1"

  // if (!DEBUGGING_UI && typeof Vencord === "undefined") {
  //   alert(
  //     "[MUDAE GUI] Install the VENCORD extension to prevent discord detection.");
  //   return;
  // }
  // if (LOCALHOST && !isValidVMEnviroment) {
  //   alert(
  //     "[MUDAE GUI] Script Error: GM.getResourceText does not exist");
  // }

  if (!isValidEnviroment()) {
    return;
  }

  const marker = document.createElement("div");
  marker.classList.add("mudae-gui-marker");
  document.head.appendChild(marker);

  let GUI_HTML;
  let GUI_CSS;

  const DEBUG_MODE = window.location.hostname !== "discord.com";
  const BRANCH = "main";
  const HTML_URL = `https://raw.githubusercontent.com/rodaguJDev/mudae-discord-files/${BRANCH}/gui.html`;
  const CSS_URL = `https://raw.githubusercontent.com/rodaguJDev/mudae-discord-files/${BRANCH}/gui-style.css`;

  if (typeof GM !== 'undefined' && typeof GM.getResourceText !== 'undefined') {
    GUI_CSS = GM.getResourceText("guicss");
    GUI_HTML = GM.getResourceText("guihtml");
  }
  else {
    GUI_HTML = await fetchUrl(HTML_URL);
    GUI_CSS = await fetchUrl(CSS_URL);
  }
  // Move this to the future Page class
  const TOKEN = getDiscordToken();
  // TODO: Config & whitelist will be within the Page class
  const CONFIG = {
      //? GUI Elements:
      //* Auto Claim
      //? Claim using Character Whitelist (checkbox);
      //? Claim using Series Whitelist (checkbox);
      //? Claim using minimum Kakera (checkbox);
      //? Claim Whishlisted (by anyone) (checkbox);
      //* Auto Command
      //? AutoSendCommand(checkbox)
      //? Send Command (button)
      //? CommandToSend (text)
      //? CommandSendCount (default: 8)
      //* Whitelist Settings
      //? Whitelisted Characters(textbox with values saved to localStorage)
      //? Whitelisted Series(textbox with values saved to localStorage)
      //? Minimum Kakera (number)
      //* Utilities
      //? Recharge Rolls (button, sends $daily $rolls $dk);
      //? NextMessageSendAt(readonly span);
      //? Next Restart at (readonly span);
      //* Logs
      //? Console (UL)

      //! Hover Effect of blue 3px outline; blue #000AF5

      // TODO: Look for the response message of mudae before sending another $m scratch that maybe, at least check if mudae is sending the "dude you have no rolls left"
      // TODO: Store the configs in Local Storage so that we don't lose it

      DEBUG_CONSOLE: false,
      COMMAND: '$m',
      SERVER_ID: '968552066165395496',
      CHANNEL_ID: '1009238449217347634',
  }
  const WHITELIST = [
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

  class PageHandler {
    // make this class not static
    /*static noTrack() {
      // No more global processors
      window.__SENTRY__.globalEventProcessors?.splice(0, window.__SENTRY__.globalEventProcessors.length);

      // Kill sentry logs
      window.__SENTRY__.logger.disable();

      const SentryHub = window.DiscordSentry.getCurrentHub();
      SentryHub.getClient().close(0); // Kill reporting
      SentryHub.getScope().clear(); // Delete PII
    }*/

    static handle() {
      // Load Style
      this.importStyle(GUI_CSS)

      // DebugMode
      if (DEBUG_MODE) {
        return;
      }

      // This will be here while we do not have MudaeAUtoMessage, that will complicate things since we don't want to refresh while sending messages, and at the same time if it's off, it should refresh after some time.
      setInterval(PageHandler.attemptRefresh, 1800);

      // Ensuring we are at the correct URL
      const titleObserve = new MutationObserver(this.correctCurrentUrl);
      titleObserve.observe(document.querySelector("head title"), {childList: true})
      this.correctCurrentUrl();
    }

    static attemptRefresh() {
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

    static correctCurrentUrl() {
      const urlPathSegments = window.location.pathname.split('/');

      if ( urlPathSegments[1] !== "channels"
        || urlPathSegments[2] !== CONFIG.SERVER_ID
        || urlPathSegments[3] !== CONFIG.CHANNEL_ID)
      {
        window.location.href =
        `https://discord.com/channels/${CONFIG.SERVER_ID}/${CONFIG.CHANNEL_ID}`;
      }
    }

    static importStyle(style) {
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
    static getMessageId(msgElement) {
      return msgElement?.id?.split("-")[3];
    }

    static sendMessage(message) {
      //TODO: DO NOT complete this function before addressing the missing features of scheduleMessages
      mudaelogs.createDebugLog(`Sending ${message}...`);
      let url = `https://discord.com/api/v9/channels/${CONFIG.CHANNEL_ID}/messages`;
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
    }

    static reactToMessage(msgId) {
      if (!msgId) {
        mudaelogs.createLog(`Error: ${msgId} is not a valid ID}`)
      }

      const api = 'https://discord.com/api/v9/channels/'
      const emoji = "%F0%9F%A4%97/%40me";
      const url =
      `${api}${CONFIG.CHANNEL_ID}/messages/${msgId}/reactions/${emoji}`
      const headers = {
        'Authorization': TOKEN,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
      }

      fetch(url, {
        method: 'PUT',
        headers: headers
      })
      .then(response => {
        mudaelogs.createDebugLog(`Message reaction sent with ${response.status}`)
      })
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
        this.guiElement.innerHTML = GUI_HTML;
        document.body.appendChild(this.guiElement);

        this.setupGUI();
      }

      setupGUI() {
        // Locating Objects
        const closeButton = this.guiElement.querySelector(".mudae-close-button");
        const minimizeButton = this.guiElement.querySelector(".mudae-minimize-button");
        const categoryList = this.guiElement.querySelector(".mudae-gui-categories");
        const guiElement = this.guiElement;
        const categoryDict = {
          "mudae-button-auto-claim": "#mudae-category-auto-claim",
          "mudae-button-auto-command": "#mudae-category-auto-command",
          "mudae-button-whitelist": "#mudae-category-whitelist",
          "mudae-button-utilities": "#mudae-category-utilities",
          "mudae-button-logs": "#mudae-category-logs",
        }

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
            this.changeCategory(button, categoryDict[button.id]);
          });
        }

        // Create GUI Modules
        this.mudaelogs = new MudaeLogs(this);
        if (DEBUG_MODE) console.customLog = this.mudaelogs.createLog.bind(this.mudaelogs);
        // this.mudaeautoclaim = new MudaeAutoClaim(); //! TODO: TAKE A LOOK HERE Work on this functioning later
        this.mudaelogs.createLog("Console Logic V1.1 Loaded");

        /*
        const draggableDiv = document.getElementById('draggableDiv');
        let offsetX, offsetY, isDragging = false;

        // Function to start dragging
        function startDragging(event) {
          if (event.type === 'touchstart') {
            offsetX = event.touches[0].clientX - draggableDiv.getBoundingClientRect().left;
            offsetY = event.touches[0].clientY - draggableDiv.getBoundingClientRect().top;
          } else {
            offsetX = event.clientX - draggableDiv.getBoundingClientRect().left;
            offsetY = event.clientY - draggableDiv.getBoundingClientRect().top;
          }

          draggableDiv.style.cursor = 'grabbing';
          isDragging = true;

          // Prevent default dragging behavior on mobile devices
          if (event.type === 'touchstart') {
            event.preventDefault();
          }
        }

        // Function to stop dragging
        function stopDragging() {
          isDragging = false;
          draggableDiv.style.cursor = 'grab';
        }

        // Function to update the position of the div
        function dragDiv(event) {
          if (isDragging) {
            let x, y;
            if (event.type === 'touchmove') {
              x = event.touches[0].clientX - offsetX;
              y = event.touches[0].clientY - offsetY;
            } else {
              x = event.clientX - offsetX;
              y = event.clientY - offsetY;
            }

            draggableDiv.style.left = x + 'px';
            draggableDiv.style.top = y + 'px';
          }
        }

        // Add event listeners for both desktop and mobile
        draggableDiv.addEventListener('mousedown', startDragging);
        draggableDiv.addEventListener('touchstart', startDragging);
        window.addEventListener('mouseup', stopDragging);
        window.addEventListener('touchend', stopDragging);
        window.addEventListener('mousemove', dragDiv);
        window.addEventListener('touchmove', dragDiv);
        */
      }

      configLogic() {
        // Logic that verifies the checkmarks and runs the functions acording to them
        return;
      }

      changeCategory(button, newCategorySelector) {
        const currentCategoryButton = this.guiElement.querySelector(".mudae-selected-button");
        const currentCategory = document.querySelector(".mudae-current-category");
        const newCategory = this.guiElement.querySelector(newCategorySelector);

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

      const consoleLogs = this.guiElement?.querySelector("#mudae-console-logs");
      const consoleOption = consoleLogs.parentNode.parentNode
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

      consoleOption.scrollTo(0, consoleOption.scrollHeight)
    }

    createLog(msg) {
      return this.addConsoleLog(`~ [MUDAE] ${msg}`)
    }

    createDebugLog(msg) {
      if (CONFIG.DEBUG_CONSOLE) {
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
    static async startMessageInterval(message) {
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
        mudaelogs.createLog(`Messages will be sent at ${now.getHours().toString()
          .padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`)

        await new Promise(resolve => setTimeout(resolve, finalDelay * 60 * 1000));

        nowUTCHours = now.getUTCHours();
        if (nowUTCHours >= forbiddenHourMin && nowUTCHours <= forbiddenHourMax) {
            mudaelogs.createDebugLog("We couldn't run the code: it is too late at night")
            continue;
        }

        mudaelogs.createDebugLog("Message wait finished, sending messages");
        for (let i = 0; i < 8; i++) {
          await new Promise(resolve =>
            setTimeout(() => {
                Discord.sendMessage(message);
                resolve();
            }, randomWithinRange(1000, 2000)));
          }

          PageHandler.attemptRefresh();
      }
    }
  }

  class MudaeAutoClaim {
    messageListener(mutations) {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (!node) continue;
          this.verifyMessage(node);
        }
      }
    }

    verifyMessage(msgElement) {
      if (msgElement?.nodeName !== 'LI') {return};

      const msg = msgElement.querySelector("[id|='message-content']")?.innerText;
      const haremName = this.getHaremName(msgElement);
      const msgId = Discord.getMessageId(msgElement);

      mudaelogs.createDebugLog(`Element of id ${msgId} has msg=${msg}; haremName=${haremName}`)

      if (!haremName || !msgId) {return};
      mudaelogs.createDebugLog(`${msg || haremName} is a valid message`)
      if (msg && msg[0] === "$") {return};
      mudaelogs.createDebugLog(`${msg || haremName} is not a command`)
      if (!this.isMudaeClaimable(msgElement)) {return};
      mudaelogs.createDebugLog(`${msg || haremName} is a valid harem`)
      if (!WHITELIST.includes(haremName.toLowerCase())) {
        mudaelogs.createLog(`${haremName} is NOT in your whitelist`)
        return;
      }

      this.claimHarem(msgElement);
    }

    isMudaeClaimable(msgElement) {
      /* In order to validate the message you must do the following:
      * Assert the message contains an article element
      * Assert the message contains a haremName
      * Assert the message contains an image from the domain mudae.net or imgur.com
      * Assert the message button count is lesser than 1
      //  Check the sidebar color (if there are any), if it is red it usually means the harem is claimed or that someone ran "$mmi" REPLACED WITH CHECKING BUTTON COUNT
      */
      const msgId = Discord.getMessageId(msgElement);
      if (!msgElement.querySelector('article')) {
        mudaelogs.createDebugLog(`Message of ID ${msgId} does not have an article.`);
        return false;
      }

      const haremName = this.getHaremName(msgElement)
      if (!haremName) {
        mudaelogs.createDebugLog(`Message of ID ${msgId} does not have a harem name.`);
        return false;
      }

      const imageURL = msgElement.querySelector("[class^='originalLink']")?.href;
      if (!(imageURL?.includes('https://mudae.net')
      || imageURL?.includes("https://imgur.com")))
      {
        mudaelogs.createDebugLog(`Message of ID ${msgId} does not have a valid img link.`);
        return false
      }

      let buttons = msgElement.querySelector('button')?.parentNode?.children;
      if (buttons?.length && buttons.length > 1) {
        mudaelogs.createDebugLog(`Message of ID ${msgId} contains too many buttons`);
        return false
      }

      mudaelogs.createDebugLog(`Validating Message ${msgId}`);
      return true;
    }

    claimHarem(msgElement) {
      mudaelogs.createLog(`Claiming ${this.getHaremName(msgElement)}`);
      const buttons = msgElement.querySelector('button')?.parentNode?.children;
      const messageId = Discord.getMessageId(msgElement);

      if (buttons?.length >= 1) {
        mudaelogs.createDebugLog(`Pressing ${messageId} button`);
        buttons[0].click();
      }

      Discord.reactToMessage(messageId);
      mudaelogs.createDebugLog(`Finished claiming ${messageId}`);
    }

    getHaremName(msgElement) {
      return msgElement?.querySelector("[class|='embedAuthorName']")?.innerText;
    }
  }

  // Before Anything Loads Load
  // TODO: Transform this code into a constructor for pagehandler
  // TODO: Rename PageHandler to Page; make it where it is stored localstorage, settings, etc. Then it'll make sense to create a new Page()
  PageHandler.handle();
  const mudaegui = new MudaeGUI();
  const mudaelogs = mudaegui.mudaelogs;
  const mudaeautoclaim = new MudaeAutoClaim(); // make subclass to mudaegui
  // const mudaeautomessage = new MudaeAutoMessage();
  mudaelogs.createDebugLog("Debug logs enabled");


  if (DEBUG_MODE) {
    console.warn("[MUDAE GUI] DEBUG MODE ENABLED!")
    return;
  }

  // Delete the code below this once you move waitForKeyElements (the replacement of that function) to Page class
  // const urlUpdateChecker = new MutationObserver(PageHandler.correctCurrentUrl);
  const messageObserver = new MutationObserver(mudaeautoclaim.messageListener.bind(mudaeautoclaim));
  // ! TODO: Create a method to prevent the script from running more than once.
  // TODO: You should really create a single document just for TODO list because there is a lot of stuff.
  //  TODO: LOOK FOR AN ALTERNATIVE METHOD use; mutation observers on the body. You do need to move this to the mudaeAutoClaim class constructor
  // TODO: Copy Orion library's design lol
  // TODO: I just had the best idea, instead of struggling to react to a message we could make the GUI have a category called "previous harem" which will list the last 10 harem that were sent, we will display the Name of the harem, the kakera count and the image (scaled obviously). It will be in the format of a card and if you click on the image you react to the message (msgId is stored obviously). DO NOT forget to consider the option of making the card available for 45 seconds before deleting it, instead of using the 10 harem limit.
  waitForKeyElements("[class|='scrollerInner']", () => {
    const msgsElementSelector = "[class|='scrollerInner']"
    /* urlUpdateChecker.observe(
      document.head.querySelector("title"),
        {
          childList: true
        }
    ) */

    messageObserver.observe(
        document.querySelector(msgsElementSelector),
        {childList: true}
    )

    // mudaeautomessage.startMessageInterval(CONFIG.COMMAND);
    mudaelogs.createDebugLog("Mutation Observers online")
  }, true)

  /*
  TODO: implement this in MudaeAutoClaim
  function waitForElement(selector) {
    return new Promise((resolve) => {
      const observer = new MutationObserver((mutationsList, observer) => {
        const element = document.querySelector(selector);
        if (element) {
          observer.disconnect();
          resolve(element);
        }
      });

      observer.observe(document.body, { childList: true, subtree: true });
    });
  } */

})();

function getDiscordToken() {
  try {
    webpackChunkdiscord_app.push(
      [
        [''],
        {},
        e => {
          m=[];
          for(let c in e.c)
          m.push(e.c[c])
        }
      ]
      );
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


// TODO: Claim anything that is wished by someone (make it optional)
// TODO: create a "Series" wishlist filter so that if it is from a specific series it claims
// TODO: Finish the "GUI" element so you don't have to edit the code to modify configs
// TODO: Fix Indentation