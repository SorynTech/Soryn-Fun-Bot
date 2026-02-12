require('dotenv').config();
const { Client, GatewayIntentBits, Collection, REST, Routes } = require('discord.js');
const express = require('express');
const http = require('http');
const crypto = require('crypto');

// Configuration
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const OWNER_ID = process.env.OWNER_ID;
const PORT = process.env.PORT || 3000;
const WEB_USERNAME = process.env.WEB_USERNAME || 'admin';
const WEB_PASSWORD = process.env.WEB_PASSWORD || 'changeme';

// Initialize Discord Client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
    ]
});

client.commands = new Collection();

// Command Logger
const commandLogger = [];

function logCommand(userId, username, guildId, guildName, commandName) {
    const timestamp = new Date().toISOString();
    const logEntry = {
        timestamp,
        userId,
        username,
        guildId,
        guildName,
        commandName
    };
    commandLogger.push(logEntry);
    // Keep only last 100 entries
    if (commandLogger.length > 100) {
        commandLogger.shift();
    }
    console.log(`[COMMAND] ${username} (${userId}) used /${commandName} in ${guildName || 'DM'}`);
}

// Load commands from templates
function loadCommands() {
    const fs = require('fs');
    const path = require('path');
    const commandsPath = path.join(__dirname, 'templates');
    
    if (!fs.existsSync(commandsPath)) {
        console.log('No templates folder found. Commands will be loaded when templates are created.');
        return [];
    }
    
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    const commands = [];
    
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        
        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
            commands.push(command.data.toJSON());
            console.log(`[LOADED] Command: ${command.data.name}`);
        }
    }
    
    return commands;
}

// Register commands with Discord
async function registerCommands() {
    const commands = loadCommands();
    
    if (commands.length === 0) {
        console.log('No commands to register.');
        return;
    }
    
    const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);
    
    try {
        console.log(`Started refreshing ${commands.length} application (/) commands.`);
        
        const data = await rest.put(
            Routes.applicationCommands(CLIENT_ID),
            { body: commands },
        );
        
        console.log(`Successfully reloaded ${data.length} application (/) commands.`);
    } catch (error) {
        console.error('Error registering commands:', error);
    }
}

// Discord Bot Events
client.once('ready', () => {
    console.log(`🦈 Shark Bot is swimming! Logged in as ${client.user.tag}`);
    console.log(`🦈 Watching over ${client.guilds.cache.size} ocean(s)`);
    registerCommands();
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;
    
    const command = client.commands.get(interaction.commandName);
    
    if (!command) return;
    
    // Log the command usage
    logCommand(
        interaction.user.id,
        interaction.user.tag,
        interaction.guildId,
        interaction.guild?.name,
        interaction.commandName
    );
    
    try {
        await command.execute(interaction, client, OWNER_ID);
    } catch (error) {
        console.error('Error executing command:', error);
        const errorMessage = '🦈 The shark encountered a problem with this command!';
        
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: errorMessage, ephemeral: true });
        } else {
            await interaction.reply({ content: errorMessage, ephemeral: true });
        }
    }
});

// Express Webserver
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session storage (in-memory for simplicity)
const sessions = new Map();
const SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Clean up expired sessions periodically
setInterval(() => {
    const now = Date.now();
    for (const [token, session] of sessions.entries()) {
        if (now - session.loginTime.getTime() > SESSION_TIMEOUT) {
            sessions.delete(token);
        }
    }
}, 60 * 60 * 1000); // Check every hour

// Middleware to check authentication
function requireAuth(req, res, next) {
    const sessionToken = req.headers['x-session-token'] || req.query.token;
    
    if (sessions.has(sessionToken)) {
        const session = sessions.get(sessionToken);
        // Check if session is expired
        if (Date.now() - session.loginTime.getTime() > SESSION_TIMEOUT) {
            sessions.delete(sessionToken);
            res.status(401).json({ error: 'Session expired' });
            return;
        }
        next();
    } else {
        res.status(401).json({ error: 'Unauthorized' });
    }
}

// Login endpoint
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    
    if (username === WEB_USERNAME && password === WEB_PASSWORD) {
        const token = crypto.randomBytes(32).toString('hex');
        sessions.set(token, { username, loginTime: new Date() });
        
        res.json({ success: true, token });
    } else {
        res.status(401).json({ success: false, error: 'Invalid credentials' });
    }
});

// Logout endpoint
app.post('/api/logout', (req, res) => {
    const sessionToken = req.headers['x-session-token'] || req.query.token;
    sessions.delete(sessionToken);
    res.json({ success: true });
});

// Command logs endpoint
app.get('/api/logs', requireAuth, (req, res) => {
    res.json({ logs: commandLogger });
});

// Bot status endpoint
app.get('/api/status', requireAuth, (req, res) => {
    const status = {
        botUsername: client.user?.tag || 'Not connected',
        guilds: client.guilds.cache.size,
        uptime: process.uptime(),
        commands: client.commands.size
    };
    res.json(status);
});

// Main HTML page with underwater shark theme
app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🦈 Shark Bot Dashboard</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Arial', sans-serif;
            background: linear-gradient(180deg, #001f3f 0%, #003d5c 50%, #004d73 100%);
            color: #e0f7ff;
            min-height: 100vh;
            overflow-x: hidden;
        }
        
        /* Animated bubbles */
        .bubble {
            position: fixed;
            bottom: -100px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 50%;
            animation: rise 10s infinite ease-in;
            z-index: 0;
        }
        
        @keyframes rise {
            to {
                bottom: 110%;
                opacity: 0;
            }
        }
        
        .container {
            position: relative;
            z-index: 1;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        
        header {
            text-align: center;
            padding: 40px 0;
            background: rgba(0, 31, 63, 0.8);
            border-radius: 15px;
            margin-bottom: 30px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        }
        
        h1 {
            font-size: 3em;
            margin-bottom: 10px;
            text-shadow: 0 0 20px rgba(0, 191, 255, 0.7);
        }
        
        .shark-emoji {
            font-size: 4em;
            animation: swim 3s ease-in-out infinite;
        }
        
        @keyframes swim {
            0%, 100% { transform: translateX(0) rotate(0deg); }
            50% { transform: translateX(20px) rotate(5deg); }
        }
        
        .login-modal {
            background: rgba(0, 31, 63, 0.95);
            border-radius: 15px;
            padding: 40px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
            border: 2px solid rgba(0, 191, 255, 0.3);
        }
        
        .login-modal h2 {
            text-align: center;
            margin-bottom: 30px;
            color: #00bfff;
        }
        
        .form-group {
            margin-bottom: 20px;
        }
        
        label {
            display: block;
            margin-bottom: 8px;
            color: #7dd3fc;
        }
        
        input {
            width: 100%;
            padding: 12px;
            border: 2px solid rgba(0, 191, 255, 0.3);
            background: rgba(0, 31, 63, 0.6);
            border-radius: 8px;
            color: #e0f7ff;
            font-size: 16px;
            transition: all 0.3s;
        }
        
        input:focus {
            outline: none;
            border-color: #00bfff;
            box-shadow: 0 0 15px rgba(0, 191, 255, 0.4);
        }
        
        button {
            width: 100%;
            padding: 12px;
            background: linear-gradient(135deg, #0066cc 0%, #00bfff 100%);
            border: none;
            border-radius: 8px;
            color: white;
            font-size: 18px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s;
            box-shadow: 0 4px 15px rgba(0, 191, 255, 0.3);
        }
        
        button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(0, 191, 255, 0.5);
        }
        
        .dashboard {
            display: none;
        }
        
        .dashboard.active {
            display: block;
        }
        
        .card {
            background: rgba(0, 31, 63, 0.8);
            border-radius: 15px;
            padding: 25px;
            margin-bottom: 20px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            border: 2px solid rgba(0, 191, 255, 0.2);
        }
        
        .card h3 {
            color: #00bfff;
            margin-bottom: 15px;
            font-size: 1.5em;
        }
        
        .stat {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid rgba(0, 191, 255, 0.2);
        }
        
        .stat:last-child {
            border-bottom: none;
        }
        
        .log-entry {
            padding: 10px;
            background: rgba(0, 61, 92, 0.5);
            border-radius: 8px;
            margin-bottom: 10px;
            font-size: 0.9em;
            border-left: 3px solid #00bfff;
        }
        
        .log-entry .time {
            color: #7dd3fc;
            font-size: 0.85em;
        }
        
        .logout-btn {
            background: linear-gradient(135deg, #cc0000 0%, #ff6666 100%);
            margin-top: 20px;
        }
        
        .error {
            color: #ff6666;
            text-align: center;
            margin-top: 10px;
        }
    </style>
</head>
<body>
    <!-- Animated bubbles -->
    <script>
        for (let i = 0; i < 15; i++) {
            const bubble = document.createElement('div');
            bubble.className = 'bubble';
            const size = Math.random() * 60 + 20;
            bubble.style.width = size + 'px';
            bubble.style.height = size + 'px';
            bubble.style.left = Math.random() * 100 + '%';
            bubble.style.animationDuration = (Math.random() * 5 + 8) + 's';
            bubble.style.animationDelay = Math.random() * 5 + 's';
            document.body.appendChild(bubble);
        }
    </script>
    
    <div class="container">
        <header>
            <div class="shark-emoji">🦈</div>
            <h1>Shark Bot Dashboard</h1>
            <p>Deep Sea Command Center</p>
        </header>
        
        <!-- Login Modal -->
        <div id="loginModal" class="login-modal">
            <h2>🔒 Dive Into the Dashboard</h2>
            <form id="loginForm">
                <div class="form-group">
                    <label for="username">Username:</label>
                    <input type="text" id="username" required autocomplete="username">
                </div>
                <div class="form-group">
                    <label for="password">Password:</label>
                    <input type="password" id="password" required autocomplete="current-password">
                </div>
                <button type="submit">🦈 Dive In</button>
                <div id="loginError" class="error"></div>
            </form>
        </div>
        
        <!-- Dashboard -->
        <div id="dashboard" class="dashboard">
            <div class="card">
                <h3>🦈 Bot Status</h3>
                <div id="botStatus">
                    <div class="stat">
                        <span>Bot Username:</span>
                        <span id="botUsername">Loading...</span>
                    </div>
                    <div class="stat">
                        <span>Servers (Oceans):</span>
                        <span id="guilds">-</span>
                    </div>
                    <div class="stat">
                        <span>Commands Loaded:</span>
                        <span id="commands">-</span>
                    </div>
                    <div class="stat">
                        <span>Uptime:</span>
                        <span id="uptime">-</span>
                    </div>
                </div>
            </div>
            
            <div class="card">
                <h3>📊 Recent Command Usage</h3>
                <div id="commandLogs">
                    <p style="text-align: center; opacity: 0.6;">Loading logs...</p>
                </div>
            </div>
            
            <button class="logout-btn" onclick="logout()">🚪 Surface (Logout)</button>
        </div>
    </div>
    
    <script>
        let sessionToken = localStorage.getItem('sessionToken');
        
        if (sessionToken) {
            checkSession();
        }
        
        document.getElementById('loginForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            
            try {
                const response = await fetch('/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    sessionToken = data.token;
                    localStorage.setItem('sessionToken', sessionToken);
                    showDashboard();
                } else {
                    document.getElementById('loginError').textContent = 'Invalid credentials!';
                }
            } catch (error) {
                document.getElementById('loginError').textContent = 'Connection error!';
            }
        });
        
        async function checkSession() {
            try {
                const response = await fetch('/api/status', {
                    headers: { 'X-Session-Token': sessionToken }
                });
                
                if (response.ok) {
                    showDashboard();
                } else {
                    localStorage.removeItem('sessionToken');
                }
            } catch (error) {
                localStorage.removeItem('sessionToken');
            }
        }
        
        function showDashboard() {
            document.getElementById('loginModal').style.display = 'none';
            document.getElementById('dashboard').classList.add('active');
            loadStatus();
            loadLogs();
            setInterval(loadStatus, 5000);
            setInterval(loadLogs, 3000);
        }
        
        async function loadStatus() {
            try {
                const response = await fetch('/api/status', {
                    headers: { 'X-Session-Token': sessionToken }
                });
                const data = await response.json();
                
                document.getElementById('botUsername').textContent = data.botUsername;
                document.getElementById('guilds').textContent = data.guilds;
                document.getElementById('commands').textContent = data.commands;
                document.getElementById('uptime').textContent = formatUptime(data.uptime);
            } catch (error) {
                console.error('Error loading status:', error);
            }
        }
        
        async function loadLogs() {
            try {
                const response = await fetch('/api/logs', {
                    headers: { 'X-Session-Token': sessionToken }
                });
                const data = await response.json();
                
                const logsContainer = document.getElementById('commandLogs');
                
                if (data.logs.length === 0) {
                    logsContainer.innerHTML = '<p style="text-align: center; opacity: 0.6;">No commands executed yet</p>';
                    return;
                }
                
                logsContainer.innerHTML = data.logs.slice(-10).reverse().map(log => \`
                    <div class="log-entry">
                        <div class="time">\${new Date(log.timestamp).toLocaleString()}</div>
                        <div><strong>\${log.username}</strong> used <strong>/\${log.commandName}</strong> in \${log.guildName || 'DM'}</div>
                    </div>
                \`).join('');
            } catch (error) {
                console.error('Error loading logs:', error);
            }
        }
        
        async function logout() {
            try {
                await fetch('/api/logout', {
                    method: 'POST',
                    headers: { 'X-Session-Token': sessionToken }
                });
            } catch (error) {
                console.error('Logout error:', error);
            }
            
            localStorage.removeItem('sessionToken');
            location.reload();
        }
        
        function formatUptime(seconds) {
            const days = Math.floor(seconds / 86400);
            const hours = Math.floor((seconds % 86400) / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            
            if (days > 0) return \`\${days}d \${hours}h \${minutes}m\`;
            if (hours > 0) return \`\${hours}h \${minutes}m\`;
            return \`\${minutes}m\`;
        }
    </script>
</body>
</html>
    `);
});

// Start the webserver
const server = http.createServer(app);
server.listen(PORT, () => {
    console.log(`🌊 Webserver is live at http://localhost:${PORT}`);
    console.log(`🔐 Login with credentials from .env file`);
});

// Login to Discord
if (!DISCORD_TOKEN) {
    console.error('❌ DISCORD_TOKEN is not set in .env file!');
    process.exit(1);
}

client.login(DISCORD_TOKEN).catch(error => {
    console.error('❌ Failed to login to Discord:', error);
    process.exit(1);
});
