// index.js - Ultra-stable Mineflayer bot for Render + Aternos
const mineflayer = require('mineflayer');
const express = require('express');

// ================
// Configuration via environment variables
// ================
const BOT_USERNAME = process.env.BOT_USERNAME || 'rochabot';
const SERVER_HOST = process.env.SERVER_HOST || 'rochachipamepija.aternos.me';
const SERVER_PORT = parseInt(process.env.SERVER_PORT || '15153', 10);
const MC_VERSION = process.env.MC_VERSION || '1.21.10';
const INITIAL_RECONNECT_DELAY = parseInt(process.env.INITIAL_RECONNECT_DELAY || '5000', 10); // ms
const MAX_RECONNECT_DELAY = parseInt(process.env.MAX_RECONNECT_DELAY || '600000', 10); // 10 min cap
const ANTI_AFK_INTERVAL = parseInt(process.env.ANTI_AFK_INTERVAL || '10000', 10); // ms
const JUMP_DURATION = parseInt(process.env.JUMP_DURATION || '500', 10); // ms

let reconnectDelay = INITIAL_RECONNECT_DELAY;
let currentBot = null;
let antiAfkIntervalRef = null;

function safeClearInterval(ref) {
  try { if (ref) clearInterval(ref); } catch (e) {}
}

// Create and connect bot
function createBot() {
  console.log(`[${new Date().toISOString()}] Attempting to create bot (delay ${reconnectDelay}ms)...`);

  try {
    const bot = mineflayer.createBot({
      host: SERVER_HOST,
      port: SERVER_PORT,
      username: BOT_USERNAME,
      version: MC_VERSION,
      // Optional: you can add connectTimeout or other options here
    });

    currentBot = bot;

    bot.once('login', () => {
      console.log(`[${new Date().toISOString()}] Bot logged in as ${BOT_USERNAME} -> ${SERVER_HOST}:${SERVER_PORT}`);
      // Reset reconnect delay on successful login
      reconnectDelay = INITIAL_RECONNECT_DELAY;
    });

    bot.once('spawn', () => {
      console.log(`[${new Date().toISOString()}] Bot spawned in world - starting anti-AFK`);

      // Ensure no leftover anti-afk intervals
      safeClearInterval(antiAfkIntervalRef);

      // Start simple anti-AFK behaviour (walk forward + periodic jump)
      try {
        bot.setControlState('forward', true); // walk forward
      } catch (e) {
        console.log('Warning: could not set forward control state immediately:', e);
      }

      antiAfkIntervalRef = setInterval(() => {
        if (!bot || !bot.player) return;
        try {
          bot.setControlState('jump', true);
          setTimeout(() => {
            try { bot.setControlState('jump', false); } catch (e) {}
          }, JUMP_DURATION);
        } catch (e) {
          console.log('Anti-AFK error:', e);
        }
      }, ANTI_AFK_INTERVAL);
    });

    bot.on('kicked', (reason) => {
      console.log(`[${new Date().toISOString()}] Bot was kicked from server. Reason: ${reason}`);
    });

    bot.on('end', (reason) => {
      console.log(`[${new Date().toISOString()}] Connection ended. Reason: ${reason || 'unknown'}`);
      cleanupAndReconnect();
    });

    bot.on('error', (err) => {
      // Common errors: ECONNRESET, ETIMEDOUT, etc.
      console.log(`[${new Date().toISOString()}] Bot encountered error:`, err && err.message ? err.message : err);
      // don't throw here - allow end handler to manage reconnect or call cleanup if needed
    });

    // Catch kick or disconnect events that might pass more info
    bot.on('disconnect', (packet) => {
      console.log(`[${new Date().toISOString()}] Disconnect packet:`, packet);
    });

    return bot;
  } catch (err) {
    console.log(`[${new Date().toISOString()}] Exception while creating bot:`, err);
    scheduleReconnect();
  }
}

function cleanupAndReconnect() {
  try {
    if (currentBot) {
      try { currentBot.removeAllListeners(); } catch (e) {}
      try { currentBot.end(); } catch (e) {}
      currentBot = null;
    }
  } catch (e) {
    console.log('Cleanup error:', e);
  }
  safeClearInterval(antiAfkIntervalRef);
  antiAfkIntervalRef = null;
  scheduleReconnect();
}

function scheduleReconnect() {
  // Exponential backoff up to a max cap
  const delay = Math.min(reconnectDelay, MAX_RECONNECT_DELAY);
  console.log(`[${new Date().toISOString()}] Scheduling reconnect in ${delay}ms`);
  setTimeout(() => {
    // increase delay for next time
    reconnectDelay = Math.min(reconnectDelay * 1.5, MAX_RECONNECT_DELAY);
    createBot();
  }, delay);
}

// Global handlers to avoid process exit on unexpected rejections/exceptions
process.on('unhandledRejection', (reason, p) => {
  console.log(`[${new Date().toISOString()}] Unhandled Rejection at:`, p, 'reason:', reason);
});
process.on('uncaughtException', (err) => {
  console.log(`[${new Date().toISOString()}] Uncaught Exception:`, err);
  // Don't exit - try to cleanup and reconnect
  try { cleanupAndReconnect(); } catch (e) {}
});

// Start initial connection
createBot();

// =========================
// Minimal web server for Render port binding
// =========================
const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Bot activo ✅ - ' + new Date().toISOString());
});

// health endpoint (optional)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', botConnected: !!(currentBot && currentBot.player) });
});

app.listen(port, () => {
  console.log(`[${new Date().toISOString()}] Web server listening on port ${port}`);
});
