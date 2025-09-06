module.exports = {
  // Discord Bot Configuration
  TOKEN: "YOUR_DISCORD_BOT_TOKEN_HERE",
  CLIENT_ID: "YOUR_DISCORD_CLIENT_ID_HERE",
  GUILD_ID: "YOUR_GUILD_ID_HERE", // Optional for faster command updates
  
  // Channel IDs
  WELCOME_CHANNEL_ID: "YOUR_WELCOME_CHANNEL_ID",
  LOG_CHANNEL_ID: "YOUR_LOG_CHANNEL_ID",
  APPLICATIONS_CHANNEL: "YOUR_APPLICATIONS_CHANNEL_ID",
  TICKETS_CATEGORY: "YOUR_TICKETS_CATEGORY_ID",
  SECRET_CHANNEL_ID: "YOUR_SECRET_CHANNEL_ID",
  
  // Role Configuration
  AUTOROLE_ID: "YOUR_AUTOROLE_ID",
  
  // Security
  WHITELISTED_IDS: ["user_id_1", "user_id_2", "user_id_3"],
  AUTHORIZED_USER_IDS: ["admin_user_id_1", "admin_user_id_2"],
  
  // Slack Bot Configuration
  SLACK_BOT_TOKEN: "xoxb-your-slack-bot-token-here",
  SLACK_SIGNING_SECRET: "your-slack-signing-secret-here",
  
  // Server Configuration
  PORT: process.env.PORT || 3000
};