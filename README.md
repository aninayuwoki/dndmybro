# 🎲 D&D Multiplayer - Heimerdinger, Goku & Star Butterfly

Aplicación web multiplayer en tiempo real para jugar D&D con sincronización entre todos los jugadores.

## 🎮 Personajes Jugables

- **Heimerdinger** 🔧 (Artífice/Inventor) - El genio inventor de Piltover
- **Goku** 🥋 (Monje/Guerrero) - El poderoso guerrero Saiyajin (Saga Majin Buu)
- **Star Butterfly** 🦋 (Hechicera/Princesa) - La princesa mágica de Mewni

## 📋 Requisitos

- Node.js (versión 14 o superior)
- npm (viene con Node.js)
- ngrok (para hostear públicamente)

## 🚀 Instalación

### 1. Instalar Node.js
Si no tienes Node.js instalado:

**Windows/Mac:**
- Descarga desde: https://nodejs.org/
- Instala la versión LTS (recomendada)

**Linux:**
```bash
sudo apt update
sudo apt install nodejs npm
```

### 2. Instalar ngrok
Descarga ngrok desde: https://ngrok.com/download

O instala con:
```bash
# Windows (con Chocolatey)
choco install ngrok

# Mac (con Homebrew)
brew install ngrok

# Linux
sudo snap install ngrok
```

### 3. Instalar dependencias del proyecto
```bash
cd dnd-server
npm install
```

## ▶️ Cómo usar

### Paso 1: Iniciar el servidor
```bash
npm start
```

Verás un mensaje como:
```
🎲 Servidor D&D corriendo en http://localhost:3000
📡 Para usar con ngrok: ngrok http 3000
```

### Paso 2: Exponer con ngrok (para que otros se conecten)
En otra terminal, ejecuta:
```bash
ngrok http 3000
```

Verás algo como:
```
Forwarding    https://abc123.ngrok-free.app -> http://localhost:3000
```

### Paso 3: Compartir el link
Copia el link HTTPS que te da ngrok (ejemplo: `https://abc123.ngrok-free.app`) y compártelo con tus amigos.

**IMPORTANTE:** Cada vez que reinicies ngrok, el link cambiará. Si quieres un link permanente, puedes crear una cuenta gratis en ngrok.

### Paso 4: ¡Jugar!
1. Todos abren el link en su navegador
2. Verán cuántos jugadores están conectados
3. Todos los cambios se sincronizan automáticamente:
   - HP y Ki
   - Tiradas de dados
   - Uso de habilidades
   - Registro de aventura

## 🎮 Cómo funciona

### Controles de Heimerdinger:
- Click en habilidades para usarlas (consume usos limitados)
- Botón `-HP` para recibir daño
- Botón `+HP` para curarse
- Botón `Reset` para restaurar habilidades

### Controles de Goku:
- Click en habilidades para usarlas (consume Ki)
- Botón `-HP` para recibir daño
- Botón `+HP` para curarse
- Botón `-Ki` para consumir Ki manualmente

### Controles de Star Butterfly:
- Click en habilidades para usarlas (consume usos limitados)
- Botón `-HP` para recibir daño
- Botón `+HP` para curarse
- Botón `-Maná` para consumir Maná manualmente
- Botón `Reset` para restaurar habilidades y maná

### Dados:
- Click en cualquier dado (d4, d6, d8, d10, d12, d20)
- El resultado se muestra a TODOS los jugadores
- Se registra automáticamente en la aventura

## 🛠️ Scripts disponibles

```bash
# Iniciar servidor
npm start

# Iniciar con auto-reload (para desarrollo)
npm run dev
```

## 📱 Consejos

1. **Conexión estable:** Asegúrate de tener buena conexión a internet
2. **Múltiples dispositivos:** Funciona en PC, tablets y móviles
3. **Privacidad:** El link de ngrok es público, solo compártelo con tus amigos
4. **Guardar estado:** El servidor mantiene el estado mientras esté corriendo

## 🐛 Solución de problemas

### "Cannot find module 'express'"
```bash
npm install
```

### Puerto 3000 ocupado
Edita `server.js` y cambia:
```javascript
const PORT = 3001; // Cambiar a otro puerto
```

### ngrok no funciona
Asegúrate de que:
1. ngrok esté instalado
2. El servidor esté corriendo en otra terminal
3. Uses el puerto correcto (3000 por defecto)

## 📞 Soporte

Si tienes problemas, verifica:
1. Node.js está instalado: `node --version`
2. npm está instalado: `npm --version`
3. El servidor está corriendo sin errores
4. ngrok está apuntando al puerto correcto

## 🎉 ¡Diviértete!

¡Ya tienes todo listo para tu aventura épica con Heimerdinger y Goku!
# dndmybro
