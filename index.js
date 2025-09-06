import { Client, Collection, GatewayIntentBits, REST, Routes } from 'discord.js';
import { fileURLToPath, pathToFileURL } from 'url';
import { dirname, join } from 'path';
import { readdirSync, statSync } from 'fs';
import express from 'express';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
        <a href="https://discord.com/api/oauth2/authorize?client_id=${process.env.CLIENT_ID || 'YOUR_CLIENT_ID'}&permissions=8&scope=bot%20applications.commands" target="_blank">
          <button style="padding: 10px 20px; font-size: 16px; background: #5865F2; color: white; border: none; border-radius: 5px; cursor: pointer;">
            Invite Bot to Server
          </button>
        </a>
      </body>
    </html>
  `);
});

app.get('/ping', (req, res) => res.send('Pong! 🏓'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🌐 Web server running on port ${PORT}`);
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
    const commandFiles = readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    
    for (const file of commandFiles) {
      const filePath = join(commandsPath, file);
      const commandModule = await import(pathToFileURL(filePath).href);
      const command = commandModule.default;
      
      if (command && command.data && command.execute) {
        client.commands.set(command.data.name, command);
        commands.push(command.data.toJSON());
        console.log(`✅ Loaded command: ${command.data.name}`);
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
    const handlerFiles = readdirSync(handlersPath).filter(file => file.endsWith('.js'));
    
    for (const file of handlerFiles) {
      const filePath = join(handlersPath, file);
      const handlerModule = await import(pathToFileURL(filePath).href);
      
      if (handlerModule.register) {
        handlerModule.register(client);
        console.log(`✅ Loaded handler: ${file}`);
      }
    }
  } catch (error) {
    console.log('📁 Handlers directory not found, skipping...');
  }
}

// Register slash commands
async function registerCommands(commands) {
  if (!process.env.TOKEN || !process.env.CLIENT_ID) {
    console.log('⚠️ Missing TOKEN or CLIENT_ID in environment variables');
    return;
  }

  const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

  try {
    console.log('🔄 Refreshing application (/) commands...');
    
    if (process.env.GUILD_ID) {
      // Guild commands (faster for development)
      await rest.put(
        Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
        { body: commands }
      );
    } else {
      // Global commands
      await rest.put(
        Routes.applicationCommands(process.env.CLIENT_ID),
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
    
    if (!process.env.TOKEN) {
      console.log('❌ No TOKEN found in environment variables!');
      console.log('🔧 Please set your bot token in the Secrets tab');
      return;
    }
    
    await client.login(process.env.TOKEN);
  } catch (error) {
    console.error('❌ Failed to initialize bot:', error);
  }
}

init();