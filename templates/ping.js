const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('🦈 Check if the shark is awake!'),
    
    async execute(interaction, client, OWNER_ID) {
        const sent = await interaction.reply({ 
            content: '🦈 Swimming...', 
            fetchReply: true 
        });
        
        const latency = sent.createdTimestamp - interaction.createdTimestamp;
        const apiLatency = Math.round(client.ws.ping);
        
        await interaction.editReply(
            `🦈 **Shark Sonar Active!**\n` +
            `📡 Response Time: ${latency}ms\n` +
            `💓 Heartbeat: ${apiLatency}ms`
        );
    },
};
