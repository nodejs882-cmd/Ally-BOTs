const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('invite')
    .setDescription('Get the bot invite link'),

  async execute(interaction, client) {
    const inviteUrl = `https://discord.com/api/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot%20applications.commands`;
    
    const embed = new EmbedBuilder()
      .setTitle('🤖 Invite Ally-Bot to Your Server!')
      .setColor(0x5865F2)
      .setDescription(`Click the link below to add **${client.user.tag}** to your server!`)
      .addFields(
        {
          name: '🔗 Invite Link',
          value: `[Click here to invite!](${inviteUrl})`,
          inline: false
        },
        {
          name: '✨ Features',
          value: '• Moderation Commands\n• Auto Moderation\n• Welcome Messages\n• Activity Logging\n• Slack Integration',
          inline: false
        }
      )
      .setThumbnail(client.user.displayAvatarURL())
      .setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};