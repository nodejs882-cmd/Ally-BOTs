export function register(client) {
  const autoRoleId = process.env.AUTOROLE_ID;

  client.on('guildMemberAdd', async (member) => {
    if (autoRoleId) {
      try {
        await member.roles.add(autoRoleId);
        console.log(`✅ Added auto role to ${member.user.tag}`);
      } catch (error) {
        console.log(`❌ Failed to add auto role to ${member.user.tag}:`, error.message);
      }
    }
  });
}