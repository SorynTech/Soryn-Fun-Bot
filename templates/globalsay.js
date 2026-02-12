const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('globalsay')
        .setDescription('🦈 Make the shark speak in ALL servers (Owner only)')
        .addStringOption(option =>
            option
                .setName('message')
                .setDescription('What should the shark say globally?')
                .setRequired(true)
        ),
    
    async execute(interaction, client, OWNER_ID) {
        // Check if user is the owner
        if (interaction.user.id !== OWNER_ID) {
            return await interaction.reply({
                content: '🦈 Only the shark master can use this command!',
                ephemeral: true
            });
        }
        
        const message = interaction.options.getString('message');
        
        await interaction.deferReply({ ephemeral: true });
        
        let successCount = 0;
        let failCount = 0;
        
        // Send message to all servers
        for (const guild of client.guilds.cache.values()) {
            try {
                // Try to find a suitable channel (first text channel the bot can send to)
                const channel = guild.channels.cache.find(ch => 
                    ch.isTextBased() && 
                    ch.permissionsFor(guild.members.me).has(['SendMessages', 'ViewChannel'])
                );
                
                if (channel) {
                    await channel.send(message);
                    successCount++;
                } else {
                    failCount++;
                }
            } catch (error) {
                console.error(`Failed to send to ${guild.name}:`, error);
                failCount++;
            }
        }
        
        await interaction.editReply({
            content: `🦈 **Global Broadcast Complete!**\n` +
                     `✅ Sent to ${successCount} ocean(s)\n` +
                     `❌ Failed in ${failCount} ocean(s)`
        });
    },
};
