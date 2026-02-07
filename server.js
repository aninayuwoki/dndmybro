const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'data.json');

// Base characters from original version
const baseCharacters = [
    {
        id: 'heimer',
        name: 'Heimerdinger',
        class: 'Artífice/Inventor',
        race: 'Gnomo',
        level: 10,
        color: '#4a90e2',
        hp: 75,
        maxHp: 75,
        owner: 'dm',
        stats: { str: 8, dex: 14, con: 12, int: 20, wis: 16, cha: 13 }
    },
    {
        id: 'goku',
        name: 'Goku',
        class: 'Monje/Guerrero',
        race: 'Saiyajin',
        level: 10,
        color: '#ff6b35',
        hp: 120,
        maxHp: 120,
        owner: 'dm',
        stats: { str: 20, dex: 18, con: 18, int: 10, wis: 14, cha: 12 },
        resource: { type: 'Ki', value: 15, max: 15, color: '#00d2ff' }
    },
    {
        id: 'star',
        name: 'Star Butterfly',
        class: 'Hechicera/Princesa',
        race: 'Mewmana',
        level: 10,
        color: '#ff69b4',
        hp: 90,
        maxHp: 90,
        owner: 'dm',
        stats: { str: 12, dex: 16, con: 14, int: 13, wis: 15, cha: 18 },
        resource: { type: 'Mana', value: 20, max: 20, color: '#3498db' }
    }
];

// Game state with persistence
let gameState = {
    characters: [...baseCharacters],
    narrative: [
        {
            msg: "¡Bienvenidos, valientes aventureros! Una extraña convergencia dimensional ha unido vuestros mundos.",
            owner: "System"
        }
    ],
    users: {} // { username: { passwordHash, role, token } }
};

const saltRounds = 10;

function loadData() {
    try {
        if (fs.existsSync(DATA_FILE)) {
            const data = fs.readFileSync(DATA_FILE, 'utf8');
            const parsed = JSON.parse(data);
            gameState = { ...gameState, ...parsed };

            // Ensure base characters exist if migration happened
            baseCharacters.forEach(bc => {
                if (!gameState.characters.find(c => c.id === bc.id)) {
                    gameState.characters.push(bc);
                }
            });
        }
    } catch (err) {
        console.error("Error loading data:", err);
    }
}

function saveData() {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(gameState, null, 2));
    } catch (err) {
        console.error("Error saving data:", err);
    }
}

loadData();

app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', (socket) => {
    console.log('Usuario conectado:', socket.id);

    // Initial sync
    socket.emit('init', {
        characters: gameState.characters,
        narrative: gameState.narrative
    });

    socket.on('register', async (data) => {
        const { username, password } = data;
        if (!username || !password) return socket.emit('auth-error', 'Datos incompletos');
        if (gameState.users[username]) return socket.emit('auth-error', 'El usuario ya existe');

        try {
            const passwordHash = await bcrypt.hash(password, saltRounds);
            const token = crypto.randomBytes(32).toString('hex');
            // First user or "dm" user gets DM role
            const role = (username.toLowerCase() === 'dm' || Object.keys(gameState.users).length === 0) ? 'dm' : 'player';

            gameState.users[username] = { passwordHash, role, token };
            saveData();
            socket.emit('auth-success', { username, role, token });
        } catch (err) {
            socket.emit('auth-error', 'Error en el registro');
        }
    });

    socket.on('login', async (data) => {
        const { username, password } = data;
        const user = gameState.users[username];
        if (!user) return socket.emit('auth-error', 'Usuario no encontrado');

        try {
            const match = await bcrypt.compare(password, user.passwordHash);
            if (match) {
                user.token = crypto.randomBytes(32).toString('hex');
                saveData();
                socket.emit('auth-success', { username, role: user.role, token: user.token });
            } else {
                socket.emit('auth-error', 'Contraseña incorrecta');
            }
        } catch (err) {
            socket.emit('auth-error', 'Error en el inicio de sesión');
        }
    });

    socket.on('restore-session', (data) => {
        const { username, token } = data;
        const user = gameState.users[username];
        if (user && user.token === token) {
            socket.emit('auth-success', { username, role: user.role, token: user.token });
        } else {
            socket.emit('auth-expired');
        }
    });

    socket.on('new-character', (character) => {
        gameState.characters.push(character);
        saveData();
        io.emit('character-update', gameState.characters);

        const entry = {
            msg: `Nuevo personaje: ${character.name} (${character.class})`,
            owner: character.owner
        };
        gameState.narrative.push(entry);
        io.emit('narrative-update', entry);
        saveData();
    });

    socket.on('update-hp', (data) => {
        const { id, change, user } = data;
        const char = gameState.characters.find(c => c.id === id);
        if (char) {
            const currentUser = gameState.users[user];
            if (char.owner === user || (currentUser && currentUser.role === 'dm')) {
                char.hp = Math.min(char.maxHp, Math.max(0, char.hp + change));
                saveData();
                io.emit('character-update', gameState.characters);

                const entry = {
                    msg: `${char.name} ${change > 0 ? 'recuperó' : 'perdió'} ${Math.abs(change)} HP`,
                    owner: 'System'
                };
                gameState.narrative.push(entry);
                io.emit('narrative-update', entry);
                saveData();
            }
        }
    });

    socket.on('update-resource', (data) => {
        const { id, change, user } = data;
        const char = gameState.characters.find(c => c.id === id);
        if (char && char.resource) {
            const currentUser = gameState.users[user];
            if (char.owner === user || (currentUser && currentUser.role === 'dm')) {
                char.resource.value = Math.min(char.resource.max, Math.max(0, char.resource.value + change));
                saveData();
                io.emit('character-update', gameState.characters);
            }
        }
    });

    socket.on('delete-character', (data) => {
        const { id, user } = data;
        const char = gameState.characters.find(c => c.id === id);
        if (char) {
            const currentUser = gameState.users[user];
            if (char.owner === user || (currentUser && currentUser.role === 'dm')) {
                gameState.characters = gameState.characters.filter(c => c.id !== id);
                saveData();
                io.emit('character-update', gameState.characters);
            }
        }
    });

    socket.on('reset-game', (user) => {
        const currentUser = gameState.users[user];
        if (currentUser && currentUser.role === 'dm') {
            gameState.characters = [...baseCharacters];
            gameState.narrative = [];
            saveData();
            io.emit('character-update', gameState.characters);
            io.emit('narrative-reset');
        }
    });

    socket.on('disconnect', () => {
        console.log('Usuario desconectado');
    });
});

server.listen(PORT, () => {
    console.log(`Servidor D&D corriendo en http://localhost:${PORT}`);
});
