// ==UserScript==
// @name        Mudae Script - discord
// @namespace   Violentmonkey Scripts
// @match       https://discord.com/channels/*
// @grant       none
// @version     1.0
// @author      rodaguJ
// @description Auto Claim desired mudae characters as soon as they show up
// @require  http://ajax.googleapis.com/ajax/libs/jquery/1.8.3/jquery.min.js
// @require  https://gist.github.com/raw/2625891/waitForKeyElements.js
// ==/UserScript==

(function() {
    'use strict';
  
    const CONFIG = {
      // TODO: create a "Series" wishlist filter so that if it is from a specific series it claims
      // TODO: if kakera count > 200, claim it (optional)
      // TODO: Create a new "GUI" element so you don't have to edit the code to modify configs
        //? GUI Elements: Auto Kakera Claim (checkbox); AutoSendCommand(checkbox)
        //? Send Command (button); CommandToSend (text); CommandSendCount (default: 8)
        //? Recharge Rolls (button, sends $daily $rolls $dk);
        //? ClaimWithMinimumKakera (checkbox); Minimum Kakera (number)
        //? Whitelisted Characters(textbox with values saved to localStorage)
        //? Whitelisted Series(textbox with values saved to localStorage)
        //? NextMessageSentAt(readonly span); Logs (single category)
        //TODO: Split into multiple categories
      // TODO: Store the configs in Local Storage so that we don't lose it
      // TODO: Auto kakera claim
      // TODO: Claim anything that is wished by someone (make it optional)
      // TODO: Also, don't forget to fix your bookmark bar, it's so scuffed lmao, don't even think 'bout going to linux without it fixed
      // TODO: Look for the response message of mudae before sending another $m
      DEBUG_MODE: false,
      NORMAL_LOGS: true,
      COMMAND: '$m',
      SERVER_ID: '968552066165395496',
      CHANNEL_ID: '1009238449217347634',
    }
    const TOKEN = getDiscordToken();
    const WISHLIST = [
      "uzi",
      // "mudae-chan",
      "doll (md)",
      "serial designation n",
      "serial designation v",
      "mr. poopybutthole",
      "sinon",
      "spider-gwen (gwen stacy)",
      "aqua",
      "jujutsu kaisen"
    ]
  
    class UI {
      //! EVERYTHING here is temporary, you still need a lot of stuff
      //? Categories, draggable, colapsable, actually making each part function, yadda yadda yadda
      static loadInterface() {
        if (document.querySelector('.mudae-ui')) {
          return;
        }
  
        const MudaeUI = document.createElement("div");
        // const ChatContentSection = document.querySelector('[class^="chatContent"]');
        MudaeUI.className = 'mudae-ui';
        MudaeUI.style.cssText = `
          position: absolute;
          top: 0;
          right: 0;
          opacity: 0.5;
          width: 600px;
          height: 400px;
          z-index: 1000;
          background-color: white;
          user-select: text;
        `
        MudaeUI.innerHTML = `
        <div class="mudae-temporary-logs-list", style="overflow: scroll; height: 100%; width: 100%">
          <ul id="mudae-ui-logs" style="height: 100%;">
          </ul>
        </div>
        `
        document.body.appendChild(MudaeUI);
        // Create div and innerhtml for the gui
        // Also you might have to create a new class for everything and all
      }
  
      static addGUILog(message) {
        const MudaeLogs = document.querySelector(".mudae-ui #mudae-ui-logs");
        const logLimit = 150
        if (MudaeLogs.childNodes.length > logLimit) {
          MudaeLogs.removeChild(MudaeLogs.childNodes[1]);
        }
  
        const log = document.createElement("li");
        log.innerHTML = message;
        MudaeLogs.appendChild(log);
        MudaeLogs.parentElement.scrollTop = MudaeLogs.parentElement.scrollHeight;
      }
    }
  
    class Logger {
      // Create a direct connection to UI later
      static createLog(msg) {
        if (CONFIG.NORMAL_LOGS) {
              return UI.addGUILog(`~ [MUDAE] ${msg}`)
        }
      }
  
      static createDebugLog(msg) {
        if (CONFIG.DEBUG_MODE) {
          return UI.addGUILog(`~ [MUDAE DEBUG] ${msg}`);
        }
      }
    }
  
    class PageHandler {
      static noTrack() {
        // No more global processors
        window.__SENTRY__.globalEventProcessors.splice(0, window.__SENTRY__.globalEventProcessors.length);
  
        // Kill sentry logs
        window.__SENTRY__.logger.disable();
  
        const SentryHub = window.DiscordSentry.getCurrentHub();
        SentryHub.getClient().close(0); // Kill reporting
        SentryHub.getScope().clear(); // Delete PII
      }
  
      static attemptRefresh() {
        const hourToMSCoefficient = 60*60*1000;
        const currentPageTime = document.timeline.currentTime
        const minDelayHours = 3 * hourToMSCoefficient;
  
        if (currentPageTime > minDelayHours) {
          window.location.reload();
        }
        /* const MIN = 90*60*1000; // 1 Hour 30 Minutes to MS
        const MAX = MIN * 2;
  
        return setInterval(function() {
          window.location.reload();
        }, randomWithinRange(MIN, MAX)) */
      }
  
      static correctCurrentUrl() {
        let urlPathSegments = window.location.pathname.split('/');
  
        if ( urlPathSegments[1] !== "channels"
          || urlPathSegments[2] !== CONFIG.SERVER_ID
          || urlPathSegments[3] !== CONFIG.CHANNEL_ID
        ) {
          window.location.href =
          `https://discord.com/channels/${CONFIG.SERVER_ID}/${CONFIG.CHANNEL_ID}`;
        }
      }
    }
  
    class Discord {
      static getMessageId(msgElement) {
        return msgElement.id?.split("-")[3];
      }
  
      static async isValidMessage(element) {
        if (element.nodeName !== 'LI') {
          return false;
        }
  
        if (!this.getMessageId(element)) {
          return false;
        }
  
  
        //TODO: Maybe remove the return promise from here as it does not seem to be helping that much
        return new Promise(resolve => {
          setTimeout(() => {
            resolve(element.parentNode)
          }, 400);
        })
      }
  
      static sendMessage(message) {
        //! DO NOT complete this function before addressing the missing features of scheduleMessages
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
          throw new Error(`MUDAE Error: ${msgId} is not a valid ID}`)
        }
        const api = 'https://discord.com/api/v9/channels/'
        const emoji = "%F0%9F%A4%97/%40me";
        let url =
          `${api}${CONFIG.CHANNEL_ID}/messages/${msgId}/reactions/${emoji}`
        let headers = {
          'Authorization': TOKEN,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
        }
  
        fetch (url, {
          method: 'PUT',
          headers: headers
        })
      }
    }
  
    class Mudae {
      static getHaremName(msgElement) {
        return msgElement.querySelector("[class|='embedAuthorName']")?.innerText;
      }
    }
  
    class MudaeInterface {
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
  
      static claimHarem(msgElement) {
        Logger.createDebugLog(`Claiming ${Mudae.getHaremName(msgElement)}...`);
        console.log(msgElement)
        const buttons = msgElement.querySelector('button')?.parentNode?.children
        || [];
        const messageId = Discord.getMessageId(msgElement);
  
        if (buttons.length >= 1) {
          Logger.createDebugLog(`Pressing ${messageId} button`);
          buttons[0].click();
        }
  
        Discord.reactToMessage(messageId);
        Logger.createDebugLog(`Finished claiming ${messageId}`);
      }
    }
  
    class MudaeListener {
      static handleMessage(msgElement) {
        if (!this.validateMessage(msgElement)) {
          return false;
        }
  
        const haremName = Mudae.getHaremName(msgElement);
        Logger.createLog(`Verifying Whitelist for ${haremName}...`);
        if (WISHLIST.includes(haremName.toLowerCase())) {
          MudaeInterface.claimHarem(msgElement);
        }
        else {
          Logger.createLog(`${haremName} is NOT in your whitelist`)
        }
      }
  
      static async messageListener(mutations) {
        for (const mutation of mutations) {
          for (const node of mutation.addedNodes) {
            let isValid = await Discord.isValidMessage(node)
            if (!isValid) {
              continue;
            }
  
            // Remove mudae command statements
            const msg = node.querySelector("[id|='message-content']")?.innerText
                        || '';
            if (msg[0] === "$") {
              Logger.createDebugLog(`Message ${msg} starts with $`);
              continue;
            }
  
            MudaeListener.handleMessage(node);
          }
        }
      }
  
      static validateMessage(msgElement) {
        /* In order to validate the message you must do the following:
        * Assert the message contains an article element
        * Assert the message contains a haremName
        * Assert the message contains an image from the domain mudae.net
        * Assert the message button count is lesser than 1
        // Check if the message is from Mudae (Unfortunately, the only place the user ID is located in the message is through the profile picture, meaning if the bot sends two messages at once, its profile id will be hidden and we won't be able to check the user, because of that it MIGHT NOT BE USED)
        //  Check the sidebar color (if there are any), if it is red it usually means the harem is claimed or that someone ran "$mmi"
        // "Reaja com qualquer emoji para casar!" is present on most messages, I will add a condition that will check if the message contains this text, but since it can easily be changed, also, it might be that a chance that a desired harem does not have that text (couldn't check that).
        ! YUP, I was right, if someone wishes for the character, it will not show "Reaja com qualquer emoji para casar"
        ! But that also pointed out a problem, if a character is wished for, reacting with an emoji does nothing, you have to click a button, which is a bit of a problem imo...
        */
        const msgId = Discord.getMessageId(msgElement);
        if (!msgElement.querySelector('article')) {
          Logger.createDebugLog(`Message of ID ${msgId} does not have an article.`);
          return false;
        }
  
        const hasHarem = Mudae.getHaremName(msgElement)
        if (!hasHarem) {
          Logger.createDebugLog(`Message of ID ${msgId} does not have a harem name.`);
          return false;
        }
  
        const imageURL = msgElement.querySelector("[class^='originalLink']")?.href;
        if (!(imageURL.includes('https://mudae.net') || imageURL.includes("https://imgur.com"))) {
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
    }
  
    // Before Messages Load
    PageHandler.noTrack();
    PageHandler.correctCurrentUrl();
    UI.loadInterface();
  
    const urlUpdateChecker = new MutationObserver(PageHandler.correctCurrentUrl);
    const messageObserver = new MutationObserver(MudaeListener.messageListener);
    waitForKeyElements("[class|='scrollerInner']", () => { // OnMessagesLoad
      // console.clear();
  
      urlUpdateChecker.observe(
        document.head.querySelector("title"),
        {
          childList: true
        }
      )
  
      messageObserver.observe(
        document.querySelector("[class|='scrollerInner']"),
        {
          childList: true
        }
      )
      MudaeInterface.startMessageInterval(CONFIG.COMMAND);
      Logger.createDebugLog("Mutation Observers online")
    }, true)
  
  })();
  
  function getDiscordToken() {
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
  
    return m.find(m => m?.exports?.default?.getToken !== void 0)
    .exports.default.getToken();
  }
  
  function randomWithinRange(min, max) {
    return Math.floor(Math.random()*(max-min+1)) + min;
  }
  
  
  