import { 
  Client, GatewayIntentBits, Events, Partials, Message, 
  REST, Routes, SlashCommandBuilder, ChatInputCommandInteraction 
} from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel]
});

// ✅ 定义斜杠指令，/events 下面有两个子指令
const commands = [
  new SlashCommandBuilder()
    .setName('events')
    .setDescription('View hidden event locations')
    .addSubcommand(sub =>
      sub.setName('map')
         .setDescription('Find the hidden map')
    )
    .addSubcommand(sub =>
      sub.setName('hub')
         .setDescription('Find the hidden hub')
    ),
];

// ✅ Bot 上线时注册指令
client.once(Events.ClientReady, async (c) => {
  console.log(`✅ Bot is online! Logged in as ${c.user.tag}`);

  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_BOT_TOKEN!);
  try {
    await rest.put(
      Routes.applicationCommands(c.user.id),
      { body: commands.map(cmd => cmd.toJSON()) }
    );
    console.log('✅ Slash commands registered!');
  } catch (error) {
    console.error('❌ Failed to register commands:', error);
  }
});

// ✅ 处理斜杠指令
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'events') {
    const sub = interaction.options.getSubcommand();

    if (sub === 'map') {
      await interaction.reply({
        content: 'dear user, congratulations you found out the hidden map',
        ephemeral: true
      });
    }

    if (sub === 'hub') {
      await interaction.reply({
        content: 'dear user, congratulations you found out the hidden hub',
        ephemeral: true
      });
    }
  }
});

// ✅ 保留原来的私信和@提及功能
client.on(Events.MessageCreate, async (message: Message) => {
  if (message.author.bot) return;

  if (message.channel.isDMBased()) {
    console.log(`📩 Received DM from ${message.author.tag}: ${message.content}`);
    try {
      const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL;
      if (N8N_WEBHOOK_URL) {
        const body = {
          type: 'direct_message',
          userId: message.author.id,
          message: message.content
        };
        await fetch(N8N_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
      }
    } catch (error) {
      console.error('❌ Error handling DM:', error);
    }

  } else if (message.mentions.has(client.user!.id)) {
    console.log(`💬 Mentioned by ${message.author.tag}: ${message.content}`);
    const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL;
    if (N8N_WEBHOOK_URL) {
      const body = {
        type: 'channel_mention',
        userId: message.author.id,
        message: message.content,
        channelId: message.channel.id,
      };
      await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
    }
  }
});

const token = process.env.DISCORD_BOT_TOKEN;
if (!token) {
  console.error('❌ Error: DISCORD_BOT_TOKEN is not defined');
  process.exit(1);
}

client.login(token);
