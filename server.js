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
            isBase: true,
            abilities: [
                { name: 'Infusión Mágica', description: 'Puede infundir objetos mágicos con propiedades especiales', type: 'feature' },
                { name: 'Torretas Arcanas', description: 'Invoca torretas que atacan automáticamente (3d6 daño)', type: 'action' },
                { name: 'Granada Hextech', description: 'Lanza una granada explosiva (4d8 daño en área)', type: 'action' },
                { name: 'Maestro Artífice', description: 'Ventaja en todas las tiradas de Arcano e Investigación', type: 'passive' },
                { name: 'Reparación Rápida', description: 'Repara constructos y objetos como acción bonus', type: 'bonus' }
            ]
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
            isBase: true,
            abilities: [
                { name: 'Kamehameha', description: 'Onda de energía devastadora (8d10 daño de fuerza). Costo: 4 Ki', type: 'action' },
                { name: 'Puño Meteoro', description: 'Ataque múltiple desarmado (4 golpes). Costo: 2 Ki', type: 'action' },
                { name: 'Transmisión Instantánea', description: 'Teletransportación hasta 120 pies. Costo: 3 Ki', type: 'bonus' },
                { name: 'Ultra Instinto (Menor)', description: 'Reacción: suma +5 a CA contra 1 ataque. Costo: 2 Ki', type: 'reaction' },
                { name: 'Defensa sin armadura', description: 'CA = 10 + DES + SAB cuando no lleva armadura', type: 'passive' },
                { name: 'Golpe Aturdidor', description: 'El objetivo debe salvarse (CD 17) o queda aturdido. Costo: 1 Ki', type: 'feature' }
            ]
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
            isBase: true,
            abilities: [
                { name: 'Explosión de Arcoíris', description: 'Rayo mágico multicolor (6d6 daño radiante). Costo: 3 Maná', type: 'action' },
                { name: 'Salto Dimensional', description: 'Crea un portal a otro plano o ubicación. Costo: 5 Maná', type: 'action' },
                { name: 'Súper Puñetazo Narval', description: 'Invoca un narval mágico (5d8 daño perforante). Costo: 4 Maná', type: 'action' },
                { name: 'Escudo de Mariposas', description: 'Escudo que absorbe 3d10 de daño. Costo: 2 Maná', type: 'reaction' },
                { name: 'Transformación Mewberty', description: 'Ventaja en ataques, +2d6 daño extra. Dura 1 minuto. Costo: 6 Maná', type: 'bonus' },
                { name: 'Varita Real', description: 'Puede lanzar hechizos sin componentes materiales', type: 'passive' }
            ]
        },
        link: {
            name: 'Link (Ocarina of Time)',
            class: 'Guerrero / Héroe del Tiempo',
            level: 10,
            emoji: '⚔️',
            hp: 110,
            maxHp: 110,
            resourceType: 'energy',
            resource: 15,
            maxResource: 15,
            stats: { str: 16, dex: 18, con: 16, int: 14, wis: 16, cha: 12 },
            color: '#27ae60',
            isBase: true,
            abilities: [
                { name: 'Ataque Giratorio', description: 'Ataque en área 360° (4d8 daño cortante). Costo: 3 Energía', type: 'action' },
                { name: 'Flecha de Luz', description: 'Disparo mágico (5d6 daño radiante) que ignora cobertura. Costo: 2 Energía', type: 'action' },
                { name: 'Escudo Hyliano', description: 'Reacción: Bloquea completamente 1 ataque. Costo: 2 Energía', type: 'reaction' },
                { name: 'Bomba', description: 'Explosivo (3d10 daño de fuego en radio de 15 pies). 3 usos', type: 'action' },
                { name: 'Canción del Tiempo', description: 'Retrocede el tiempo 6 segundos (revierte 1 turno). Costo: 5 Energía', type: 'action' },
                { name: 'Maestro Espadachín', description: '+2 a todas las tiradas de ataque con espadas', type: 'passive' }
            ]
        },
        abdul: {
            name: 'Muhammad Abdul',
            class: 'Usuario de Stand - Magician\'s Red',
            level: 10,
            emoji: '🔥',
            hp: 95,
            maxHp: 95,
            resourceType: 'mana',
            resource: 25,
            maxResource: 25,
            stats: { str: 14, dex: 14, con: 15, int: 16, wis: 18, cha: 15 },
            color: '#e74c3c',
            isBase: true,
            abilities: [
                { name: 'Llamarada Cruzada', description: 'Magician\'s Red dispara ráfaga de fuego (6d8 daño de fuego). Costo: 4 Maná', type: 'action' },
                { name: 'Detector de Vida', description: 'Crea llamas rastreadoras que detectan enemigos ocultos. Costo: 2 Maná', type: 'action' },
                { name: 'Ankh Rojo', description: 'Invocación de gran poder (8d6 daño de fuego en área). Costo: 6 Maná', type: 'action' },
                { name: 'Barrera de Fuego', description: 'Crea muro de llamas (3d6 daño a quien lo cruce). Costo: 3 Maná', type: 'bonus' },
                { name: '¡YES, I AM!', description: 'Intimida a enemigos (CD 16 Sabiduría o quedan asustados). Costo: 1 Maná', type: 'bonus' },
                { name: 'Resistencia al Fuego', description: 'Inmunidad al daño de fuego', type: 'passive' },
                { name: 'Visión del Stand', description: 'Puede ver espíritus y seres invisibles', type: 'passive' }
            ]
        },
        omega: {
            name: 'Sam (SPD Omega Ranger)',
            class: 'Ranger Temporal / Guardián del Futuro',
            level: 12,
            emoji: '⚪',
            hp: 105,
            maxHp: 105,
            resourceType: 'energy',
            resource: 30,
            maxResource: 30,
            stats: { str: 17, dex: 20, con: 16, int: 15, wis: 14, cha: 13 },
            color: '#ffffff',
            isBase: true,
            abilities: [
                { name: 'Supervelocidad', description: 'Movimiento ultrarrápido, 2 ataques extra por turno. Costo: 3 Energía', type: 'action' },
                { name: 'Interceptar Láser', description: 'Reacción: Bloquea un ataque a distancia con velocidad. Costo: 2 Energía', type: 'reaction' },
                { name: 'Forma de Luz', description: 'Se transforma en esfera de luz, inmune a ataques físicos por 1 turno. Costo: 5 Energía', type: 'bonus' },
                { name: 'Golpe Omega', description: 'Ataque potenciado del futuro (7d8 daño de fuerza). Costo: 4 Energía', type: 'action' },
                { name: 'Invocación: Omegamax Megazord', description: 'Invoca megazord (10d10 daño, área masiva). 1 uso por combate. Costo: 10 Energía', type: 'action' },
                { name: 'Viajero Temporal', description: 'Ventaja en tiradas de Iniciativa y Percepción', type: 'passive' },
                { name: 'Inestabilidad Temporal', description: 'Puede reaparecer en otra ubicación cercana como acción bonus. Costo: 2 Energía', type: 'bonus' },
                { name: 'Juicio SPD', description: 'Ordena detener enemigo (CD 17 Carisma o paralizado 1 turno). Costo: 6 Energía', type: 'action' }
            ]
        }
    },
    narrative: [
        {
            type: 'dm',
            text: '¡Bienvenidos, valientes aventureros! Una extraña convergencia dimensional ha unido vuestros mundos. Heimerdinger, el brillante inventor de Piltover; Goku, el poderoso guerrero Saiyajin; Star Butterfly, la princesa mágica de Mewni; Link, el héroe del tiempo de Hyrule; Muhammad Abdul, el usuario del stand Magician\'s Red; y Sam, el Omega Ranger del futuro, se encuentran en un bosque místico desconocido. Una grieta temporal brilla en el cielo mientras las ruinas de un antiguo templo resplandecen con energía familiar pero extraña. ¿Qué haréis?',
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
