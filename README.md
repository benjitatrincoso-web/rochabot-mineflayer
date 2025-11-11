# Rochabot - Render-ready Mineflayer bot

## Qué incluye
- `index.js`: Bot preparado para Render con:
  - Reconexión automática con backoff exponencial.
  - Manejo de errores (`error`, `end`, `kicked`).
  - Anti-AFK (caminar hacia adelante y saltos periódicos dentro de `spawn`).
  - Servidor web mínimo (`/` y `/health`) para que Render detecte puerto abierto.
- `package.json`: dependencias (`mineflayer`, `express`).

## Uso local
1. Instala dependencias:
```bash
npm install
```
2. Ejecuta (puedes pasar variables de entorno):
```bash
BOT_USERNAME=rochabot SERVER_HOST=rochachipamepija.aternos.me SERVER_PORT=15153 MC_VERSION=1.21.10 node index.js
```

## Deploy en Render
1. Sube este repo a GitHub.
2. En Render crea un **Web Service** desde GitHub y selecciona este repo.
3. Build Command: `npm install`
4. Start Command: `node index.js`
5. Agrega Environment Variables en Render si quieres (opcional):
   - `BOT_USERNAME` (por defecto `rochabot`)
   - `SERVER_HOST` (por defecto `rochachipamepija.aternos.me`)
   - `SERVER_PORT` (por defecto `15153`)
   - `MC_VERSION` (por defecto `1.21.10`)

## Notas
- **Aternos** apaga servidores gratuitos por inactividad o mantiene políticas que pueden desconectar bots. Este proyecto hace lo máximo posible para reconectar, pero **si Aternos apaga el servidor, el bot no podrá conectarse hasta que el servidor esté encendido**.
- Revisa logs en Render para diagnosticar desconexiones o kicks.
- Personaliza el comportamiento anti-AFK o agrega más manejos de eventos según necesites.
