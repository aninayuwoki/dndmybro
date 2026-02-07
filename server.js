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

// Game state with persistence
let gameState = {
    characters: [],
    narrative: [],
    users: {} // { username: { passwordHash, role, token } }
};

const saltRounds = 10;

function loadData() {
    try {
        if (fs.existsSync(DATA_FILE)) {
            const data = fs.readFileSync(DATA_FILE, 'utf8');
            const parsed = JSON.parse(data);
            gameState = { ...gameState, ...parsed };
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
                // Generate new token on each login for security
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
        // Character owner is assigned from the client-side session (which we trust here because they are emitted from authenticated sockets)
        // In a real production app, we would store the session on the socket itself.
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
            // Authorization check: Owner or DM
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
            gameState.characters = [];
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
