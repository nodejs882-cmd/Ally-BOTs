import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

export default {
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
          value: '`/kick` - Kick a member\n`/ban` - Ban a member\n`/timeout` - Timeout a member\n`/purge` - Delete messages\n`/mod` - Advanced moderation\n`/role` - Role management',
          inline: true
        },
        {
          name: '📊 Information',
          value: '`/serverinfo` - Server information\n`/userinfo` - User information\n`/avatar` - Display avatar\n`/ping` - Bot latency',
          inline: true
        },
        {
          name: '🎫 Support System',
          value: '`/ticketpanel` - Create ticket panel\n`/applypanel` - Create application panel\n`/secretpanel` - Admin secret panel',
          inline: true
        },
        {
          name: '🤖 AI Features',
          value: '`/ai chat` - Chat with AI\n`/ai image` - Generate images\n`/ai code` - Coding help\n`/ai translate` - Translate text',
          inline: true
        },
        {
          name: '🔧 Utility',
          value: '`/invite` - Get bot invite link\n`/help` - Show this menu',
          inline: true
        },
        {
          name: '🛡️ Auto Features',
          value: '• Anti-Nuke Protection\n• Auto Moderation\n• Auto Role Assignment\n• Welcome Messages\n• Activity Logging',
          inline: true
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
          .setURL(`https://discord.com/api/oauth2/authorize?client_id=${process.env.CLIENT_ID || client.user.id}&permissions=8&scope=bot%20applications.commands`)
          .setStyle(ButtonStyle.Link),
        new ButtonBuilder()
          .setLabel('⚙️ Setup Guide')
          .setURL('https://github.com/discord/discord-api-docs')
          .setStyle(ButtonStyle.Link)
      );

    await interaction.reply({ embeds: [embed], components: [row] });
  }
};