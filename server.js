const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');

// Middleware
app.use(express.static('public'));
app.use(express.json());

// Game state con personajes base
let gameState = {
    characters: {
        heimer: {
            name: 'Heimerdinger',
            class: 'Artífice/Inventor',
            level: 10,
            emoji: '🔧',
            hp: 75,
            maxHp: 75,
            resourceType: 'none',
            resource: 0,
            maxResource: 0,
            stats: { str: 8, dex: 14, con: 12, int: 20, wis: 16, cha: 13 },
            color: '#4a90e2',
            isBase: true
        },
        goku: {
            name: 'Goku',
            class: 'Monje/Guerrero',
            level: 10,
            emoji: '🥋',
            hp: 120,
            maxHp: 120,
            resourceType: 'ki',
            resource: 15,
            maxResource: 15,
            stats: { str: 20, dex: 18, con: 18, int: 10, wis: 14, cha: 12 },
            color: '#ff6b35',
            isBase: true
        },
        star: {
            name: 'Star Butterfly',
            class: 'Hechicera/Princesa',
            level: 10,
            emoji: '🦋',
            hp: 90,
            maxHp: 90,
            resourceType: 'mana',
            resource: 20,
            maxResource: 20,
            stats: { str: 12, dex: 16, con: 14, int: 13, wis: 15, cha: 18 },
            color: '#ff69b4',
            isBase: true
        }
    },
    narrative: [
        {
            type: 'dm',
            text: '¡Bienvenidos, valientes aventureros! Una extraña convergencia dimensional ha unido vuestros mundos. Heimerdinger, el brillante inventor de Piltover; Goku, el poderoso guerrero Saiyajin; y Star Butterfly, la princesa mágica de Mewni, se encuentran en un bosque místico desconocido. A lo lejos, veis las ruinas de un antiguo templo que brilla con una energía familiar pero extraña. ¿Qué haréis?',
            timestamp: Date.now()
        }
    ],
    lastDiceRoll: null,
    connectedPlayers: 0
};

// Socket.io connection
io.on('connection', (socket) => {
    gameState.connectedPlayers++;
    console.log(`Jugador conectado. Total: ${gameState.connectedPlayers}`);
    
    // Enviar estado actual al nuevo jugador
    socket.emit('initial-state', gameState);
    
    // Notificar a todos sobre el número de jugadores
    io.emit('players-update', gameState.connectedPlayers);

    // Actualizar personajes
    socket.on('update-character', (data) => {
        if (gameState.characters[data.char]) {
            gameState.characters[data.char] = data.characterData;
            io.emit('character-updated', data);
        }
    });

    // Añadir nuevo personaje
    socket.on('add-character', (data) => {
        gameState.characters[data.charId] = data.characterData;
        io.emit('character-added', data);
        console.log(`Nuevo personaje creado: ${data.characterData.name}`);
    });

    // Eliminar personaje
    socket.on('delete-character', (data) => {
        // Solo permitir eliminar personajes no base
        if (gameState.characters[data.charId] && !gameState.characters[data.charId].isBase) {
            delete gameState.characters[data.charId];
            io.emit('character-deleted', data);
            console.log(`Personaje eliminado: ${data.charId}`);
        }
    });

    // Tirada de dados
    socket.on('dice-roll', (data) => {
        gameState.lastDiceRoll = data;
        io.emit('dice-rolled', data);
    });

    // Añadir narrativa
    socket.on('add-narrative', (data) => {
        gameState.narrative.push(data);
        io.emit('narrative-added', data);
    });

    // Reset del juego
    socket.on('reset-game', () => {
        // Resetear solo los personajes base, eliminar los personalizados
        const baseCharacters = {};
        Object.keys(gameState.characters).forEach(charId => {
            if (gameState.characters[charId].isBase) {
                const char = gameState.characters[charId];
                baseCharacters[charId] = {
                    ...char,
                    hp: char.maxHp,
                    resource: char.maxResource
                };
            }
        });
        
        gameState.characters = baseCharacters;
        gameState.narrative = [
            {
                type: 'dm',
                text: '¡El juego ha sido reiniciado! Una nueva aventura comienza...',
                timestamp: Date.now()
            }
        ];
        
        io.emit('game-reset', gameState);
        console.log('Juego reiniciado');
    });

    // Desconexión
    socket.on('disconnect', () => {
        gameState.connectedPlayers--;
        console.log(`Jugador desconectado. Total: ${gameState.connectedPlayers}`);
        io.emit('players-update', gameState.connectedPlayers);
    });
});

// Ruta principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Puerto
const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`🎲 Servidor D&D corriendo en http://localhost:${PORT}`);
    console.log(`📡 Para usar con ngrok: ngrok http ${PORT}`);
});
