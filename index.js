const { Client, Collection, GatewayIntentBits, REST, Routes } = require('discord.js');
const { fileURLToPath, pathToFileURL } = require('url');
const { dirname, join } = require('path');
const { readdirSync, statSync, existsSync } = require('fs');
const express = require('express');
const { App } = require("@slack/bolt");
const config = require("./config");

const __dirname = process.cwd();

// Express server for uptime
const app = express();
app.use(express.static('.'));

app.get('/', (req, res) => {
  res.send(`
    <html>
      <head><title>Ally Bot Status</title></head>
      <body style="font-family: Arial; text-align: center; padding: 50px;">
        <h1>🤖 Ally Bot is Online!</h1>
        <p>Discord bot is running successfully.</p>
        <a href="https://discord.com/api/oauth2/authorize?client_id=${config.CLIENT_ID}&permissions=8&scope=bot%20applications.commands" target="_blank">
          <button style="padding: 10px 20px; font-size: 16px; background: #5865F2; color: white; border: none; border-radius: 5px; cursor: pointer;">
            Invite Bot to Server
          </button>
        </a>
      </body>
    </html>
  `);
});

app.get('/ping', (req, res) => res.send('Pong! 🏓'));

// Slack Bot Setup
const slackApp = new App({
  token: config.SLACK_BOT_TOKEN,
  signingSecret: config.SLACK_SIGNING_SECRET,
});

slackApp.message("hi", async ({ message, say }) => {
  await say(`Hey <@${message.user}> 👋`);
});

slackApp.message("hello", async ({ message, say }) => {
  await say(`Hello there <@${message.user}> 😊`);
});

slackApp.command('/ping', async ({ command, ack, respond }) => {
  await ack();
  await respond('Pong! 🏓');
});

// Start Slack app
(async () => {
  try {
    await slackApp.start(config.PORT + 1); // Use different port for Slack
    console.log("⚡️ Slack Bolt app is running on port", config.PORT + 1);
  } catch (error) {
    console.log("⚠️ Slack app failed to start:", error.message);
  }
})();

// Start Express server
app.listen(config.PORT, () => {
  console.log(`🌐 Web server running on port ${config.PORT}`);
});

// Discord client setup
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildModeration
  ]
});

client.commands = new Collection();

// Load slash commands
async function loadCommands() {
  const commands = [];
  const commandsPath = join(__dirname, 'commands');
  
  try {
    if (existsSync(commandsPath)) {
      const commandFiles = readdirSync(commandsPath).filter(file => file.endsWith('.js'));
      
      for (const file of commandFiles) {
        const filePath = join(commandsPath, file);
        const command = require(filePath);
        
        if (command && command.data && command.execute) {
          client.commands.set(command.data.name, command);
          commands.push(command.data.toJSON());
          console.log(`✅ Loaded command: ${command.data.name}`);
        }
      }
    }
  } catch (error) {
    console.log('📁 Commands directory not found, creating basic commands...');
  }
  
  return commands;
}

// Load event handlers
async function loadEventHandlers() {
  const handlersPath = join(__dirname, 'handlers');
  
  try {
    if (existsSync(handlersPath)) {
      const handlerFiles = readdirSync(handlersPath).filter(file => file.endsWith('.js'));
      
      for (const file of handlerFiles) {
        const filePath = join(handlersPath, file);
        const handler = require(filePath);
        
        if (handler && handler.register) {
          handler.register(client);
          console.log(`✅ Loaded handler: ${file}`);
        }
      }
    }
  } catch (error) {
    console.log('📁 Handlers directory not found, skipping...');
  }
}

// Register slash commands
async function registerCommands(commands) {
  if (!config.TOKEN || !config.CLIENT_ID) {
    console.log('⚠️ Missing TOKEN or CLIENT_ID in config.js');
    return;
  }

  const rest = new REST({ version: '10' }).setToken(config.TOKEN);

  try {
    console.log('🔄 Refreshing application (/) commands...');
    
    if (config.GUILD_ID) {
      // Guild commands (faster for development)
      await rest.put(
        Routes.applicationGuildCommands(config.CLIENT_ID, config.GUILD_ID),
        { body: commands }
      );
    } else {
      // Global commands
      await rest.put(
        Routes.applicationCommands(config.CLIENT_ID),
        { body: commands }
      );
    }
    
    console.log('✅ Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error('❌ Error registering commands:', error);
  }
}

// Event handlers
client.once('ready', async () => {
  console.log(`🚀 ${client.user.tag} is online!`);
  console.log(`📊 Serving ${client.guilds.cache.size} servers`);
  
  // Set bot status
  client.user.setActivity('with Discord.js | /help', { type: 'PLAYING' });
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction, client);
  } catch (error) {
    console.error('❌ Command execution error:', error);
    const reply = { content: '❌ There was an error executing this command!', ephemeral: true };
    
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(reply);
    } else {
      await interaction.reply(reply);
    }
  }
});

// Auto-moderation system
const spamMap = new Map();
const warnings = new Map();

client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.guild) return;
  
  const member = message.member;
  const logChannel = message.guild.channels.cache.get(config.LOG_CHANNEL_ID);
  
  // Skip if user has manage messages permission
  if (member.permissions.has('ManageMessages')) return;

  // Anti-spam detection
  const userId = message.author.id;
  const now = Date.now();
  
  if (!spamMap.has(userId)) {
    spamMap.set(userId, []);
  }
  
  const userMessages = spamMap.get(userId);
  userMessages.push(now);
  
  // Keep only messages from last 5 seconds
  const recentMessages = userMessages.filter(time => now - time < 5000);
  spamMap.set(userId, recentMessages);
  
  // If 5+ messages in 5 seconds = spam
  if (recentMessages.length >= 5) {
    try {
      await member.timeout(300000, 'Auto-mod: Spam detected'); // 5 min timeout
      await message.channel.bulkDelete(recentMessages.length);
      logChannel?.send(`🤖 **AutoMod**: Timed out ${message.author.tag} for spam (5+ messages in 5s)`);
      spamMap.delete(userId);
      return;
    } catch (e) { /* ignore */ }
  }

  // Bad words filter
  const badWords = ['badword1', 'badword2', 'toxic', 'spam'];
  const content = message.content.toLowerCase();
  const hasBadWord = badWords.some(word => content.includes(word));
  
  if (hasBadWord) {
    await message.delete().catch(() => {});
    
    const userWarnings = warnings.get(userId) || 0;
    warnings.set(userId, userWarnings + 1);
    
    if (userWarnings >= 3) {
      await member.timeout(600000, 'Auto-mod: Multiple bad word violations');
      logChannel?.send(`🤖 **AutoMod**: Timed out ${message.author.tag} for repeated bad language`);
      warnings.delete(userId);
    } else {
      await message.channel.send(`⚠️ ${message.author}, please watch your language! Warning ${userWarnings + 1}/3`);
      logChannel?.send(`🤖 **AutoMod**: Warned ${message.author.tag} for bad language (${userWarnings + 1}/3)`);
    }
  }
});

// Welcome system
client.on('guildMemberAdd', (member) => {
  const channel = member.guild.channels.cache.get(config.WELCOME_CHANNEL_ID);
  if (channel) {
    channel.send(`👋 Welcome **${member.user.tag}** to **${member.guild.name}**! We're glad to have you here.`);
  }
  
  // Auto role
  if (config.AUTOROLE_ID) {
    member.roles.add(config.AUTOROLE_ID).catch(() => {});
  }
});

// Logging system
client.on('messageDelete', (message) => {
  if (!message.author || message.author.bot) return;
  const logChannel = message.guild.channels.cache.get(config.LOG_CHANNEL_ID);
  logChannel?.send(`🗑️ **Message deleted** in ${message.channel}\n**Author:** ${message.author.tag}\n**Content:** ${message.content || 'No content'}`);
});

client.on('channelCreate', (channel) => {
  const logChannel = channel.guild.channels.cache.get(config.LOG_CHANNEL_ID);
  logChannel?.send(`📂 **Channel created:** ${channel.name} (${channel.type})`);
});

client.on('guildBanAdd', (ban) => {
  const logChannel = ban.guild.channels.cache.get(config.LOG_CHANNEL_ID);
  logChannel?.send(`🔨 **User banned:** ${ban.user.tag} (${ban.user.id})`);
});

// Error handling
client.on('error', console.error);
client.on('warn', console.warn);

process.on('unhandledRejection', (reason, promise) => {
  console.log('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Initialize bot
async function init() {
  try {
    const commands = await loadCommands();
    await loadEventHandlers();
    await registerCommands(commands);
    
    if (!config.TOKEN) {
      console.log('❌ No TOKEN found in config.js!');
      console.log('🔧 Please set your bot token in config.js');
      return;
    }
    
    await client.login(config.TOKEN);
  } catch (error) {
    console.error('❌ Failed to initialize bot:', error);
  }
}

init();