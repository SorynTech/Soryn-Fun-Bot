# 🦈 Soryn-Fun-Bot

Fun Discord Bot with integrated underwater shark-themed webserver dashboard!

## Features

- 🤖 Discord bot with slash commands
- 🌊 Underwater shark-themed web dashboard
- 🔐 Secure HTTP login system with authentication
- 📊 Real-time command usage tracking
- 🦈 Owner-only commands for bot control

## Commands

- `/ping` - Check bot latency and status
- `/say` - Make the bot speak in a channel (Owner only)
- `/globalsay` - Broadcast a message to all servers (Owner only)

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy the `.env.example` file to `.env`:

```bash
cp .env.example .env
```

Edit the `.env` file with your credentials:

```env
# Get these from Discord Developer Portal (https://discord.com/developers/applications)
DISCORD_TOKEN=your_discord_bot_token_here
CLIENT_ID=your_discord_client_id_here

# Your Discord User ID (right-click your profile with Developer Mode enabled)
OWNER_ID=your_discord_user_id_here

# Webserver settings
PORT=3000
WEB_USERNAME=admin
WEB_PASSWORD=changeme
```

### 3. Start the Bot

```bash
npm start
```

The bot will:
- Connect to Discord
- Start the webserver on `http://localhost:3000`
- Automatically register slash commands

### 4. Access the Dashboard

1. Open your browser to `http://localhost:3000`
2. Login with your configured username and password
3. View real-time bot statistics and command logs!

## Creating New Commands

All commands are stored in the `/templates` directory. To create a new command:

1. Create a new file in `/templates` (e.g., `mycommand.js`)
2. Use this template structure:

```javascript
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('commandname')
        .setDescription('Command description'),
    
    async execute(interaction, client, OWNER_ID) {
        // Your command logic here
        await interaction.reply('Hello from the shark! 🦈');
    },
};
```

3. Restart the bot to load the new command

## Dashboard Features

The underwater shark-themed dashboard includes:

- 🦈 Animated underwater environment with bubbles
- 📊 Real-time bot status (username, server count, uptime)
- 📝 Live command usage logs
- 🔐 Secure session-based authentication
- 📱 Responsive design

## Security Notes

- The `/say` and `/globalsay` commands are restricted to the OWNER_ID
- Web dashboard requires authentication
- Session tokens are stored in browser localStorage
- Never commit your `.env` file to version control

## Requirements

- Node.js v16.9.0 or higher
- A Discord Bot Token
- Discord Developer Mode enabled (to get your User ID)

## License

ISC
