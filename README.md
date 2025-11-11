# RochaBot - Render package (final)

Contenido:
- index.js: bot configurado para Minecraft Java 1.21.10 (cracked)
- package.json: dependencias (mineflayer, express)
- README: instrucciones

## Deployment (Render)
1. Subir el contenido a un repositorio GitHub.
2. Crear un *Web Service* en Render y apuntarlo al repo.
3. Build command: `npm install`
4. Start command: `npm start`
5. (Opcional) Añadir Environment Variables en Render:
   - BOT_USERNAME (default: RochaBot)
   - SERVER_HOST (default: rochachipamepija.aternos.me)
   - SERVER_PORT (default: 15153)
   - MC_VERSION (default: 1.21.10)

## Notas
- Aternos sigue pudiendo apagar el servidor cuando no hay jugadores humanos. Este paquete hace lo máximo posible (reconexiones, wake pings) para minimizar downtime.
- Revisa los logs en Render para ver por qué se desconecta si vuelve a pasar.
