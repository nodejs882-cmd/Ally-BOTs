export function register(client) {
  const welcomeChannelId = process.env.WELCOME_CHANNEL_ID;

  client.on('guildMemberAdd', (member) => {
    const channel = member.guild.channels.cache.get(welcomeChannelId);
    if (channel) {
      channel.send(`👋 Welcome **${member.user.tag}** to **${member.guild.name}**! We're glad to have you here.`);
    }
  });
}