/**
 * RochaBot - Robust Mineflayer bot configured for Minecraft Java 1.21.10 (cracked)
 * Features:
 * - Explicit version 1.21.10
 * - Offline auth (cracked servers)
 * - Exponential reconnect backoff
 * - Anti-AFK (delayed start, forward + periodic jump)
 * - Welcome chat message on join
 * - Auto-respawn handling
 * - Minimal Express server with / and /health endpoints for Render port binding
 * - Built-in periodic "wake" HTTP ping to the Aternos host (best-effort)
 */

const mineflayer = require('mineflayer');
const express = require('express');
const https = require('https');

// ====== Configuration (edit or set env vars in Render) ======
const BOT_USERNAME = process.env.BOT_USERNAME || 'RochaBot';
const SERVER_HOST = process.env.SERVER_HOST || 'rochachipamepija.aternos.me';
const SERVER_PORT = parseInt(process.env.SERVER_PORT || '15153', 10);
const MC_VERSION = process.env.MC_VERSION || '1.21.10';

const INITIAL_RECONNECT_DELAY = parseInt(process.env.INITIAL_RECONNECT_DELAY || '3000', 10); // ms
const MAX_RECONNECT_DELAY = parseInt(process.env.MAX_RECONNECT_DELAY || '300000', 10); // 5 min cap
const JUMP_INTERVAL = parseInt(process.env.JUMP_INTERVAL || '12000', 10); // ms between jumps
const JUMP_DURATION = parseInt(process.env.JUMP_DURATION || '500', 10); // ms jump hold
const MOVE_DELAY_AFTER_SPAWN = parseInt(process.env.MOVE_DELAY_AFTER_SPAWN || '3000', 10); // wait before moving

let reconnectDelay = INITIAL_RECONNECT_DELAY;
let currentBot = null;
let antiAfkInterval = null;
let wakeInterval = null;

// Safe interval clear
function safeClearInterval(ref) {
  try { if (ref) clearInterval(ref); } catch (e) {}
}

// Create the bot and attach handlers
function createBot() {
  console.log(`[${new Date().toISOString()}] Attempting connection to ${SERVER_HOST}:${SERVER_PORT} as ${BOT_USERNAME} (version ${MC_VERSION})`);

  try {
    const bot = mineflayer.createBot({
      host: SERVER_HOST,
      port: SERVER_PORT,
      username: BOT_USERNAME,
      version: MC_VERSION,
      auth: 'offline' // cracked server
    });

    currentBot = bot;

    bot.once('login', () => {
      console.log(`[${new Date().toISOString()}] Logged in as ${BOT_USERNAME}`);
      // Reset reconnect delay after a successful login
      reconnectDelay = INITIAL_RECONNECT_DELAY;
    });

    bot.once('spawn', () => {
      console.log(`[${new Date().toISOString()}] Spawned in world. Starting anti-AFK in ${MOVE_DELAY_AFTER_SPAWN}ms...`);

      // clear any previous anti-afk
      safeClearInterval(antiAfkInterval);

      setTimeout(() => {
        try {
          bot.setControlState('forward', true);
        } catch (e) {
          console.log('Warning: could not set forward immediately:', e && e.message ? e.message : e);
        }

        antiAfkInterval = setInterval(() => {
          if (!bot || !bot.player) return;
          try {
            bot.setControlState('jump', true);
            setTimeout(() => {
              try { bot.setControlState('jump', false); } catch (e) {}
            }, JUMP_DURATION);
          } catch (e) {
            console.log('Anti-AFK error:', e && e.message ? e.message : e);
          }
        }, JUMP_INTERVAL);
      }, MOVE_DELAY_AFTER_SPAWN);

      // Welcome chat (only once per spawn)
      try {
        bot.chat('Hola! RochaBot ha entrado al servidor 😊');
      } catch (e) {}
    });

    bot.on('kicked', (reason) => {
      console.log(`[${new Date().toISOString()}] Kicked: ${reason}`);
    });

    bot.on('end', (reason) => {
      console.log(`[${new Date().toISOString()}] Connection ended. Reason: ${reason || 'unknown'}`);
      cleanupAndScheduleReconnect();
    });

    bot.on('error', (err) => {
      console.log(`[${new Date().toISOString()}] Bot error:`, err && err.message ? err.message : err);
      // do not throw - allow end handler to manage reconnection
    });

    bot.on('death', () => {
      console.log(`[${new Date().toISOString()}] Bot died. Will respawn in 5s.`);
      setTimeout(() => {
        try { bot.activateItem(); } catch (e) {}
        try { bot.emit('respawn'); } catch (e) {}
      }, 5000);
    });

    return bot;
  } catch (err) {
    console.log(`[${new Date().toISOString()}] Exception creating bot:`, err && err.message ? err.message : err);
    scheduleReconnect();
  }
}

function cleanupAndScheduleReconnect() {
  try {
    if (currentBot) {
      try { currentBot.removeAllListeners(); } catch (e) {}
      try { currentBot.end(); } catch (e) {}
      currentBot = null;
    }
  } catch (e) {
    console.log('Cleanup error:', e && e.message ? e.message : e);
  }
  safeClearInterval(antiAfkInterval);
  antiAfkInterval = null;
  scheduleReconnect();
}

function scheduleReconnect() {
  const delay = Math.min(reconnectDelay, MAX_RECONNECT_DELAY);
  console.log(`[${new Date().toISOString()}] Scheduling reconnect in ${delay}ms`);
  setTimeout(() => {
    reconnectDelay = Math.min(Math.floor(reconnectDelay * 1.6), MAX_RECONNECT_DELAY);
    createBot();
  }, delay);
}

// Periodic wake/ping to the Aternos host (best-effort)
// Note: This doesn't guarantee Aternos will start, but helps trigger HTTP wake endpoints.
function startWakePings() {
  safeClearInterval(wakeInterval);
  wakeInterval = setInterval(() => {
    const url = `https://${SERVER_HOST}`;
    https.get(url, (res) => {
      console.log(`[${new Date().toISOString()}] Wake ping to ${url} -> ${res.statusCode}`);
      res.resume();
    }).on('error', (e) => {
      // ignore errors; Aternos host may not respond to simple HTTPS GETs
    });
  }, 30000); // every 30s
}

// Global error handlers so the process doesn't exit unexpectedly
process.on('unhandledRejection', (reason, p) => {
  console.log(`[${new Date().toISOString()}] Unhandled Rejection:`, reason);
});
process.on('uncaughtException', (err) => {
  console.log(`[${new Date().toISOString()}] Uncaught Exception:`, err && err.message ? err.message : err);
  try { cleanupAndScheduleReconnect(); } catch (e) {}
});

// Start bot and wake pings
createBot();
startWakePings();

// Minimal express server so Render detects port binding
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('RochaBot activo ✅ - ' + new Date().toISOString());
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', botConnected: !!(currentBot && currentBot.player) });
});

app.listen(PORT, () => console.log(`[${new Date().toISOString()}] Web server listening on port ${PORT}`));
