export function register(client) {
  const logChannelId = process.env.LOG_CHANNEL_ID;

  client.on('messageDelete', (message) => {
    if (!message.author || message.author.bot) return;
    const logChannel = message.guild.channels.cache.get(logChannelId);
    logChannel?.send(`🗑️ **Message deleted** in ${message.channel}\n**Author:** ${message.author.tag}\n**Content:** ${message.content || 'No content'}`);
  });

  client.on('channelCreate', (channel) => {
    const logChannel = channel.guild.channels.cache.get(logChannelId);
    logChannel?.send(`📂 **Channel created:** ${channel.name} (${channel.type})`);
  });

  client.on('channelDelete', (channel) => {
    const logChannel = channel.guild.channels.cache.get(logChannelId);
    logChannel?.send(`🗑️ **Channel deleted:** ${channel.name} (${channel.type})`);
  });

  client.on('guildBanAdd', (ban) => {
    const logChannel = ban.guild.channels.cache.get(logChannelId);
    logChannel?.send(`🔨 **User banned:** ${ban.user.tag} (${ban.user.id})`);
  });
}