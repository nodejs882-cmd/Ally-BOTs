const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Show all available commands and features'),

  async execute(interaction, client) {
    const embed = new EmbedBuilder()
      .setTitle(`🤖 ${client.user.tag} - Command List`)
      .setColor(0x5865F2)
      .setThumbnail(client.user.displayAvatarURL())
      .setDescription('Here are all the available commands and features:')
      .addFields(
        {
          name: '🛠️ Moderation',
          value: '`/mod kick` - Kick a member\n`/mod ban` - Ban a member\n`/mod timeout` - Timeout a member\n`/mod purge` - Delete messages',
          inline: true
        },
        {
          name: '📊 Information',
          value: '`/serverinfo` - Server information\n`/userinfo` - User information\n`/ping` - Bot latency',
          inline: true
        },
        {
          name: '🔧 Utility',
          value: '`/help` - Show this menu\n`/invite` - Get bot invite link',
          inline: true
        },
        {
          name: '🛡️ Auto Features',
          value: '• Anti-Spam Protection\n• Auto Moderation\n• Auto Role Assignment\n• Welcome Messages\n• Activity Logging',
          inline: false
        }
      )
      .setFooter({ 
        text: `${client.commands.size} commands loaded • Requested by ${interaction.user.tag}`, 
        iconURL: interaction.user.displayAvatarURL() 
      })
      .setTimestamp();

    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setLabel('🔗 Invite Bot')
          .setURL(`https://discord.com/api/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot%20applications.commands`)
          .setStyle(ButtonStyle.Link)
      );

    await interaction.reply({ embeds: [embed], components: [row] });
  }
};