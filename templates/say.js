const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('say')
        .setDescription('🦈 Make the shark speak (Owner only)')
        .addStringOption(option =>
            option
                .setName('message')
                .setDescription('What should the shark say?')
                .setRequired(true)
        )
        .addChannelOption(option =>
            option
                .setName('channel')
                .setDescription('Which channel to send the message to (optional)')
                .setRequired(false)
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
        const targetChannel = interaction.options.getChannel('channel') || interaction.channel;
        
        try {
            // Send the message to the target channel
            await targetChannel.send(message);
            
            // Confirm to the user
            await interaction.reply({
                content: `🦈 Message sent to ${targetChannel}!`,
                ephemeral: true
            });
        } catch (error) {
            await interaction.reply({
                content: `🦈 Failed to send message: ${error.message}`,
                ephemeral: true
            });
        }
    },
};
