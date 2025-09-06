const { SlashCommandBuilder, PermissionsBitField, EmbedBuilder } = require('discord.js');
const config = require('../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('mod')
    .setDescription('Advanced moderation commands')
    .addSubcommand(sub => sub
      .setName('kick')
      .setDescription('Kick a user')
      .addUserOption(o => o.setName('user').setDescription('User to kick').setRequired(true))
      .addStringOption(o => o.setName('reason').setDescription('Reason for kick')))
    .addSubcommand(sub => sub
      .setName('ban')
      .setDescription('Ban a user')
      .addUserOption(o => o.setName('user').setDescription('User to ban').setRequired(true))
      .addStringOption(o => o.setName('reason').setDescription('Reason for ban')))
    .addSubcommand(sub => sub
      .setName('timeout')
      .setDescription('Timeout a user')
      .addUserOption(o => o.setName('user').setDescription('User to timeout').setRequired(true))
      .addIntegerOption(o => o.setName('minutes').setDescription('Minutes to timeout').setRequired(true))
      .addStringOption(o => o.setName('reason').setDescription('Reason for timeout')))
    .addSubcommand(sub => sub
      .setName('purge')
      .setDescription('Delete messages')
      .addIntegerOption(o => o.setName('amount').setDescription('Messages to delete (1-100)').setRequired(true))),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    
    // Check permissions
    const requiredPermissions = {
      kick: PermissionsBitField.Flags.KickMembers,
      ban: PermissionsBitField.Flags.BanMembers,
      timeout: PermissionsBitField.Flags.ModerateMembers,
      purge: PermissionsBitField.Flags.ManageMessages
    };

    if (!interaction.member.permissions.has(requiredPermissions[subcommand])) {
      return interaction.reply({ content: '❌ You lack the required permissions.', ephemeral: true });
    }

    const logChannel = interaction.guild.channels.cache.get(config.LOG_CHANNEL_ID);

    switch (subcommand) {
      case 'kick': {
        const user = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason') || 'No reason provided';
        
        try {
          const member = await interaction.guild.members.fetch(user.id);
          await member.kick(reason);
          
          const embed = new EmbedBuilder()
            .setTitle('👢 User Kicked')
            .addFields(
              { name: 'User', value: `${user.tag} (${user.id})`, inline: true },
              { name: 'Moderator', value: interaction.user.tag, inline: true },
              { name: 'Reason', value: reason, inline: false }
            )
            .setColor(0xff9500)
            .setTimestamp();
          
          await interaction.reply({ embeds: [embed] });
          logChannel?.send({ embeds: [embed] });
        } catch (error) {
          await interaction.reply({ content: '❌ Failed to kick user.', ephemeral: true });
        }
        break;
      }
      
      case 'ban': {
        const user = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason') || 'No reason provided';
        
        try {
          await interaction.guild.members.ban(user.id, { reason });
          
          const embed = new EmbedBuilder()
            .setTitle('🔨 User Banned')
            .addFields(
              { name: 'User', value: `${user.tag} (${user.id})`, inline: true },
              { name: 'Moderator', value: interaction.user.tag, inline: true },
              { name: 'Reason', value: reason, inline: false }
            )
            .setColor(0xff0000)
            .setTimestamp();
          
          await interaction.reply({ embeds: [embed] });
          logChannel?.send({ embeds: [embed] });
        } catch (error) {
          await interaction.reply({ content: '❌ Failed to ban user.', ephemeral: true });
        }
        break;
      }
      
      case 'timeout': {
        const user = interaction.options.getUser('user');
        const minutes = interaction.options.getInteger('minutes');
        const reason = interaction.options.getString('reason') || 'No reason provided';
        
        if (minutes < 1 || minutes > 40320) {
          return interaction.reply({ content: '❌ Timeout must be between 1-40320 minutes (28 days).', ephemeral: true });
        }
        
        try {
          const member = await interaction.guild.members.fetch(user.id);
          await member.timeout(minutes * 60 * 1000, reason);
          
          const embed = new EmbedBuilder()
            .setTitle('⏳ User Timed Out')
            .addFields(
              { name: 'User', value: `${user.tag} (${user.id})`, inline: true },
              { name: 'Duration', value: `${minutes} minutes`, inline: true },
              { name: 'Moderator', value: interaction.user.tag, inline: true },
              { name: 'Reason', value: reason, inline: false }
            )
            .setColor(0xffaa00)
            .setTimestamp();
          
          await interaction.reply({ embeds: [embed] });
          logChannel?.send({ embeds: [embed] });
        } catch (error) {
          await interaction.reply({ content: '❌ Failed to timeout user.', ephemeral: true });
        }
        break;
      }
      
      case 'purge': {
        const amount = interaction.options.getInteger('amount');
        
        if (amount < 1 || amount > 100) {
          return interaction.reply({ content: '❌ Amount must be between 1-100.', ephemeral: true });
        }
        
        try {
          const messages = await interaction.channel.bulkDelete(amount, true);
          await interaction.reply({ content: `🧹 Deleted ${messages.size} messages.`, ephemeral: true });
          
          logChannel?.send(`🧹 ${interaction.user.tag} purged ${messages.size} messages in ${interaction.channel}`);
        } catch (error) {
          await interaction.reply({ content: '❌ Failed to delete messages.', ephemeral: true });
        }
        break;
      }
    }
  }
};