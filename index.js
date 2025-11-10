// index.js
const mineflayer = require('mineflayer');
const express = require('express');

// =====================
// Configuración del bot
// =====================
const BOT_USERNAME = process.env.BOT_USERNAME || 'rochabot';
const SERVER_HOST = process.env.SERVER_HOST || 'rochachipamepija.aternos.me';
const SERVER_PORT = parseInt(process.env.SERVER_PORT) || 15153;
const MC_VERSION = process.env.MC_VERSION || '1.21.10';
const RECONNECT_DELAY = 10000; // 10 segundos

// =====================
// Función para crear el bot
// =====================
function createBot() {
  const bot = mineflayer.createBot({
    host: SERVER_HOST,
    port: SERVER_PORT,
    username: BOT_USERNAME,
    version: MC_VERSION
  });

  bot.on('login', () => {
    console.log(`Bot conectado al servidor ${SERVER_HOST}:${SERVER_PORT}`);
  });

  bot.on('spawn', () => {
    console.log('Bot listo, iniciando movimiento anti-AFK');

    // Movimiento anti-AFK
    bot.setControlState('forward', true); // camina hacia adelante

    setInterval(() => {
      bot.setControlState('jump', true); // salta cada 10s
      setTimeout(() => bot.setControlState('jump', false), 500);
    }, 10000);
  });

  bot.on('end', () => {
    console.log(`Bot desconectado. Reintentando en ${RECONNECT_DELAY / 1000}s...`);
    setTimeout(createBot, RECONNECT_DELAY);
  });

  bot.on('error', (err) => {
    console.log('Error del bot:', err);
  });

  return bot;
}

// Inicia el bot
createBot();

// =====================
// Servidor web mínimo para Render
// =====================
const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Bot activo ✅');
});

app.listen(port, () => {
  console.log(`Servidor web escuchando en el puerto ${port}`);
});
