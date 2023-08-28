// ==UserScript==
// @name        Mudae Script - discord
// @namespace   Violentmonkey Scripts
// @match       https://discord.com/channels/*
// @match       http://127.0.0.1:5500/*
// @grant       GM_getResourceText
// @version     1.0
// @author      rodaguJ
// @description Auto Claim desired mudae characters as soon as they show up
// @require     http://ajax.googleapis.com/ajax/libs/jquery/1.8.3/jquery.min.js
// @require     https://gist.github.com/raw/2625891/waitForKeyElements.js
// @resource    guihtml https://raw.githubusercontent.com/rodaguJDev/mudae-discord-files/main/gui.html
// @resource    guicss https://raw.githubusercontent.com/rodaguJDev/mudae-discord-files/main/gui-style.css
// ==/UserScript==

(async function() {
  'use strict';

  const DEBUGGING_UI = window.location.href.includes("debugger.html")
  if (!DEBUGGING_UI && typeof Vencord === 'undefined') {
    alert(
      "[MUDAE GUI] Install the VENCORD extension to prevent discord detection.");
    return;
  }

  const GUI_HTML = GM_getResourceText("guihtml")
  const GUI_CSS = GM_getResourceText("guicss")
  const TOKEN = getDiscordToken();
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

      // TODO: Look for the response message of mudae before sending another $m
      // TODO: Also, don't forget to FIX YOUR BOOKMARK BAR, it's so scuffed lmao, don't even think 'bout going to linux without it fixed
      // TODO: Store the configs in Local Storage so that we don't lose it

      DEBUG_MODE: false,
      NORMAL_LOGS: true,
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
      "josuke higashikata",
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
      "senhor veríssimo",
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

  class MudaeGUI {
      constructor() {
        this.guiDragging = false;
        this.dragMaxXPos = 0;
        this.dragMaxYPos = 0;
        this.dragOffsetX = 0;
        this.dragOffsetY = 0;

        this.loadGUI();
      }

      loadGUI() {
        /*
        TODO: Switch back from using a dynamic approach to adding the html when we select a category to always loading every category and hiding non used ones. Required because otherwise the console won't render
        TODO: Then, make each category actually function
        TODO: Then you can actually look at each function individually
        */
        // Basic Loading
        this.guiElement = document.createElement("div");
        this.guiElement.className = "mudae-gui";
        this.guiElement.innerHTML = GUI_HTML;
        document.body.appendChild(this.guiElement);

        // Declaring
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
        window.addEventListener("mousemove", this.updateGUIDrag.bind(this));
        window.addEventListener("mouseup", this.stopGUIDrag.bind(this));

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
        this.addConsoleLog("~ [MUDAE] Console Logic Loaded");
      }

      configLogic() {
        // Logic that verifies the checkmarks and runs the functions acording to them
        return;
      }

      changeCategory(button, newCategorySelector) {
        const currentCategoryButton = this.guiElement.querySelector(".mudae-selected-button");
        const currentCategory = document.querySelector(".mudae-current-category");
        const newCategory = this.guiElement.querySelector(newCategorySelector);

        // categoryElement.innerHTML = html; TODO: Look at the first item of the TODO list from the constructor to seewhy this is commented out
        // Add logic so that when we select a button, it will hide every category display at mudae-options and display only the one selected.
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
          if (event.target?.closest(".mudae-options")) {return;}

          this.guiDragging = true;

          this.dragOffsetX = event.clientX - this.guiElement.getBoundingClientRect().left;
          this.dragOffsetY = event.clientY - this.guiElement.getBoundingClientRect().top;

          this.dragMaxXPos = window.innerWidth - this.guiElement.offsetWidth;
          this.dragMaxYPos = window.innerHeight - this.guiElement.offsetHeight;
      }

      updateGUIDrag(event) {
          if (this.guiElement && this.guiDragging) {
            let x = event.clientX - this.dragOffsetX;
            let y = event.clientY - this.dragOffsetY;

            x = Math.min(Math.max(0, x), this.dragMaxXPos);
            y = Math.min(Math.max(0, y), this.dragMaxYPos);

            this.guiElement.style.left = x + "px";
            this.guiElement.style.top = y + "px";
          }
      }

      stopGUIDrag() {
          this.guiDragging = false;
      }

      // GUI Console
      addConsoleLog(log) {
        if (!this.guiElement) return;

        const consoleLogs = this.guiElement?.querySelector("#mudae-console-logs");
        const consoleLimit = 150;

        if (!consoleLogs) {
          return;
        }

        if (consoleLogs.childNodes.length > consoleLimit) {
            consoleLogs.removeChild(consoleLogs.childNodes[0]);
        }

        const logElement = document.createElement("li");
        logElement.innerHTML = log;
        consoleLogs.appendChild(logElement);
        consoleLogs.parentElement.scrollTop = consoleLogs.parentElement.scrollHeight;
      }
  }

  class Logger {
        static createLog(msg) {
          if (CONFIG.NORMAL_LOGS) {
            return mudaegui.addConsoleLog(`~ [MUDAE] ${msg}`)
          }
        }

        static createDebugLog(msg) {
          if (CONFIG.DEBUG_MODE) {
            return mudaegui.addConsoleLog(`~ [MUDAE DEBUG] ${msg}`);
          }
        }
  }

  class PageHandler {
        /*static noTrack() {
          // No more global processors
          window.__SENTRY__.globalEventProcessors?.splice(0, window.__SENTRY__.globalEventProcessors.length);

          // Kill sentry logs
          window.__SENTRY__.logger.disable();

          const SentryHub = window.DiscordSentry.getCurrentHub();
          SentryHub.getClient().close(0); // Kill reporting
          SentryHub.getScope().clear(); // Delete PII
        }*/

        static attemptRefresh() {
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
          if (window.location.href.includes("debugger.html")) {
            return;
          }

          let urlPathSegments = window.location.pathname.split('/');

          if ( urlPathSegments[1] !== "channels"
          || urlPathSegments[2] !== CONFIG.SERVER_ID
          || urlPathSegments[3] !== CONFIG.CHANNEL_ID
          ) {
            window.location.href =
            `https://discord.com/channels/${CONFIG.SERVER_ID}/${CONFIG.CHANNEL_ID}`;
          }
        }

        static loadCustomStyle() {
          const style = GUI_CSS;
          const currentStyle = document.head.querySelector("#mudae-custom-style")

          if (currentStyle) {
            // document.head.removeChild(currentStyle);
            currentStyle.innerHTML = style;
            return;
          }

          const customStyle = document.createElement("style");
          customStyle.id = "mudae-custom-style";
          document.head.appendChild(customStyle);
        }
  }

  class Discord {
        static getMessageId(msgElement) {
          return msgElement?.id?.split("-")[3];
        }

        static sendMessage(message) {
          //TODO: DO NOT complete this function before addressing the missing features of scheduleMessages
          Logger.createDebugLog(`Sending ${message}...`);
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
            Logger.createLog(`Error: ${msgId} is not a valid ID}`)
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
            Logger.createDebugLog(`Message reaction sent with ${response.status}`)
          })
        }
  }

  class Mudae {
        getHaremName(msgElement) {
          return msgElement?.querySelector("[class|='embedAuthorName']")?.innerText;
        }
  }

  class MudaeAutoMessage extends Mudae {
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

        Logger.createDebugLog(`Waiting ${finalDelay} minutes until we'll send messages`);
        Logger.createLog(`Messages will be sent at ${now.getHours().toString()
          .padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`)

          await new Promise(resolve => setTimeout(resolve, finalDelay * 60 * 1000));

          nowUTCHours = now.getUTCHours();
          if (nowUTCHours >= forbiddenHourMin && nowUTCHours <= forbiddenHourMax) {
            Logger.createDebugLog("We couldn't run the code: it is too late at night")
            continue;
          }

          Logger.createDebugLog("Message wait finished, sending messages");
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

  class MudaeAutoClaim extends Mudae {
            messageListener(mutations) {
              for (const mutation of mutations) {
                for (const node of mutation.addedNodes) {
                  if (!node) continue;
                  mudaeautoclaim.verifyMessage(node);
                }
              }
            }

            verifyMessage(msgElement) {
              if (msgElement.nodeName !== 'LI') {return};

              const msg = msgElement.querySelector("[id|='message-content']")?.innerText;
              const haremName = this.getHaremName(msgElement);
              const msgId = Discord.getMessageId(msgElement);

              Logger.createDebugLog(`Element of id ${msgId} has msg=${msg}; haremName=${haremName}`)

              if (!haremName || !msgId) {return};
              Logger.createDebugLog(`${msg || haremName} is a valid message`)
              if (msg && msg[0] === "$") {return};
              Logger.createDebugLog(`${msg || haremName} is not a command`)
              if (!this.isMudaeClaimable(msgElement)) {return};
              Logger.createDebugLog(`${msg || haremName} is a valid harem`)
              if (!WHITELIST.includes(haremName.toLowerCase())) {
                Logger.createLog(`${haremName} is NOT in your whitelist`)
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
                Logger.createDebugLog(`Message of ID ${msgId} does not have an article.`);
                return false;
              }

              const haremName = this.getHaremName(msgElement)
              if (!haremName) {
                Logger.createDebugLog(`Message of ID ${msgId} does not have a harem name.`);
                return false;
              }

              const imageURL = msgElement.querySelector("[class^='originalLink']")?.href;
              if (!(imageURL?.includes('https://mudae.net')
              || imageURL?.includes("https://imgur.com")))
              {
                Logger.createDebugLog(`Message of ID ${msgId} does not have a valid img link.`);
                return false
              }

              let buttons = msgElement.querySelector('button')?.parentNode?.children;
              if (buttons?.length && buttons.length > 1) {
                Logger.createDebugLog(`Message of ID ${msgId} contains too many buttons`);
                return false
              }

              Logger.createDebugLog(`Validating Message ${msgId}`);
              return true;
            }

            claimHarem(msgElement) {
              Logger.createLog(`Claiming ${this.getHaremName(msgElement)}`);
              const buttons = msgElement.querySelector('button')?.parentNode?.children;
              const messageId = Discord.getMessageId(msgElement);

              if (buttons.length >= 1) {
                Logger.createDebugLog(`Pressing ${messageId} button`);
                buttons[0].click();
              }

              Discord.reactToMessage(messageId);
              Logger.createDebugLog(`Finished claiming ${messageId}`);
            }
  }

  // Before Anything Loads Load
  setInterval(PageHandler.attemptRefresh, 1800); // temporary while we don't have mudaeautomessage
  PageHandler.correctCurrentUrl();
  PageHandler.loadCustomStyle();
  const mudaegui = new MudaeGUI();
  const mudaeautoclaim = new MudaeAutoClaim();
  // const mudaeautomessage = new MudaeAutoMessage();


  if (DEBUGGING_UI) {
    return;
  }

  const urlUpdateChecker = new MutationObserver(PageHandler.correctCurrentUrl);
  const messageObserver = new MutationObserver(mudaeautoclaim.messageListener);


  // OnMessagesLoad
  waitForKeyElements("[class|='scrollerInner']", () => {
    const msgsElementSelector = "[class|='scrollerInner']"
    urlUpdateChecker.observe(
      document.head.querySelector("title"),
        {
          childList: true
        }
      )

      messageObserver.observe(
        document.querySelector(msgsElementSelector),
        {
          childList: true
        }
        )

        // mudaeautomessage.startMessageInterval(CONFIG.COMMAND);
        Logger.createDebugLog("Mutation Observers online")
      }, true)

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
      return false;
    }
    return m.find(m => m?.exports?.default?.getToken !== void 0)
    .exports.default.getToken();
  }
function randomWithinRange(min, max) {
  return Math.floor(Math.random()*(max-min+1)) + min;
}


// TODO: Claim anything that is wished by someone (make it optional)
// TODO: create a "Series" wishlist filter so that if it is from a specific series it claims
// TODO: Finish the "GUI" element so you don't have to edit the code to modify configs
// TODO: Fix Indentation