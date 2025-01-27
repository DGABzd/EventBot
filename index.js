const { Client, GatewayIntentBits, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle, Collection } = require('discord.js');
const { token } = require('./config/config.json');
const fs = require('fs');

// Archivos de datos
const serverDataFile = './data/serverData.json';
const itemsFile = './data/items.json';
const imagesFile = './data/images.json';
const userDataFile = './data/userData.json';

// Funciones para manejo de JSON
const { loadJSON, saveJSON } = require('./utils/jsonUtils');

// Datos en memoria
const lastActivity = {};
const intervals = {};
const serverData = loadJSON(serverDataFile);
const userData = loadJSON(userDataFile);
const items = loadJSON(itemsFile);
const images = loadJSON(imagesFile);

// Crear cliente
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

// Función para iniciar un intervalo
function startInterval(guildId, channelId, intervalMinutes) {
  if (intervals[guildId]) clearInterval(intervals[guildId]);

  intervals[guildId] = setInterval(() => {
    const channel = client.channels.cache.get(channelId);
    if (channel) spawnEntity(channel, guildId);
  }, intervalMinutes * 60 * 1000);
}

// Función para generar una rareza aleatoria
function getRandomRarity() {
  const rarities = ['Común', 'Poco Común', 'Raro', 'Épico', 'Legendario', 'Mítico', 'Exótico'];
  const weights = [50, 25, 15, 5, 3, 2, 1];

  const totalWeight = weights.reduce((a, b) => a + b, 0);
  const random = Math.random() * totalWeight;
  let cumulative = 0;

  for (let i = 0; i < rarities.length; i++) {
    cumulative += weights[i];
    if (random < cumulative) return rarities[i];
  }
}

// Función para generar un color basado en rareza
function getRarityColor(rarity) {
  switch (rarity) {
    case 'Común': return '#808080'; // Gris
    case 'Poco Común': return '#00FF00'; // Verde
    case 'Raro': return '#0000FF'; // Azul
    case 'Épico': return '#800080'; // Morado
    case 'Legendario': return '#FFA500'; // Naranja
    case 'Mítico': return '#FFD700'; // Amarillo oro
    case 'Exótico': return '#40E0D0'; // Verde turquesa
    default: return '#FFFFFF'; // Blanco
  }
}

// Función para enviar la entidad
function spawnEntity(channel, guildId) {
    const channelId = channel.id;
    const lastMessageTime = lastActivity[channelId] || 0;
    const currentTime = Date.now();

    if (currentTime - lastMessageTime > 60000) { // Más de 1 minuto de inactividad
        console.log(`No hubo actividad reciente en el canal ${channelId}. No se enviará la entidad.`);
        return;
    }

    const action = Math.random() < 0.5 ? 'adora' : 'detesta';
    const imageArray = images.spawn || [];
    const image = imageArray[Math.floor(Math.random() * imageArray.length)];

    if (!image || typeof image !== 'string' || !image.startsWith('http')) {
        console.error('URL de imagen inválida:', image);
        return;
    }

    const embed = new EmbedBuilder()
        .setTitle('¡Ha aparecido una entidad!')
        .setDescription(`Esta entidad solo dará un regalo al que **${action} San Valentin**. ¿Qué eliges?`)
        .setImage(image)
        .setColor('#FF0000');

    const adoreButton = new ButtonBuilder()
        .setCustomId('adora')
        .setLabel('Adoro San Valentin')
        .setStyle(ButtonStyle.Success);

    const detestButton = new ButtonBuilder()
        .setCustomId('detesta')
        .setLabel('Detesto San Valentin')
        .setStyle(ButtonStyle.Danger);

    const row = new ActionRowBuilder().addComponents(adoreButton, detestButton);

    channel.send({ embeds: [embed], components: [row] }).then((message) => {
        const timeout = setTimeout(() => {
            const timeoutImageArray = images.bored || [];
            const timeoutImage = timeoutImageArray[Math.floor(Math.random() * timeoutImageArray.length)];

            const timeoutEmbed = EmbedBuilder.from(message.embeds[0])
                .setDescription('La entidad se aburrió y se fue por falta de espíritu navideño.')
                .setImage(timeoutImage || '');

            message.edit({ embeds: [timeoutEmbed], components: [] });
        }, 30000);

        message.timeout = timeout;
    });
}


// Manejo de interacciones
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isButton()) return;

  const { guildId } = interaction;
  const userId = interaction.user.id;
  const action = interaction.customId;

  if (!userData[guildId]) userData[guildId] = {};
  if (!userData[guildId][userId]) userData[guildId][userId] = { gifts: 0, inventory: [] };

  const message = interaction.message;
  if (message.timeout) clearTimeout(message.timeout);

  const isCorrect = message.embeds[0].description.includes(`**${action} la Navidad**`);

  if (isCorrect) {
    const rarity = getRandomRarity();
    const item = items[rarity][Math.floor(Math.random() * items[rarity].length)];

    userData[guildId][userId].gifts++;
    const existingItem = userData[guildId][userId].inventory.find(i => i.item === item && i.rarity === rarity);
    if (existingItem) {
      existingItem.count++;
    } else {
      userData[guildId][userId].inventory.push({ item, rarity, count: 1 });
    }
    saveJSON(userDataFile, userData);

    const rewardImageArray = images.reward || [];
    const rewardImage = rewardImageArray[Math.floor(Math.random() * rewardImageArray.length)];

    const rewardEmbed = new EmbedBuilder()
      .setTitle('¡Regalo recibido!')
      .setDescription(`${interaction.user} ha recibido un regalo **${rarity}**: **${item}**.`)
      .setImage(rewardImage || '')
      .setColor(getRarityColor(rarity));

    await interaction.reply({ embeds: [rewardEmbed] });

    const updatedEmbed = EmbedBuilder.from(message.embeds[0])
      .setDescription('La entidad ha entregado un regalo y se ha ido.');
    message.edit({ embeds: [updatedEmbed], components: [] });
  } else {
    const failImageArray = images.scared || [];
    const failImage = failImageArray[Math.floor(Math.random() * failImageArray.length)];

    const failEmbed = EmbedBuilder.from(message.embeds[0])
      .setDescription('La entidad se asustó y se fue al ver que nadie tenía el espíritu de san valentin adecuado.')
      .setImage(failImage || '');

    message.edit({ embeds: [failEmbed], components: [] });
    await interaction.reply({ content: '¡Te equivocaste! La entidad se ha ido.', ephemeral: true });
  }
});

client.on('messageCreate', (message) => {
    if (message.author.bot) return;

    const channelId = message.channel.id;
    lastActivity[channelId] = Date.now();
});


// Crear colección de comandos
client.commands = new Collection();

// Cargar comandos
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.name, command);
}

// Manejo de comandos
client.on('messageCreate', (message) => {
  if (!message.content.startsWith('!') || message.author.bot) return;

  const args = message.content.slice(1).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();

  const command = client.commands.get(commandName);
  if (!command) return;

  try {
    command.execute(message, args);
  } catch (error) {
    console.error(error);
    message.reply('Hubo un error ejecutando este comando.');
  }
});


// Comando para configurar el intervalo
client.on('messageCreate', (message) => {
  if (!message.content.startsWith('!setinterval') || !message.member.permissions.has('ADMINISTRATOR')) return;

  const args = message.content.split(' ');
  const interval = parseInt(args[1]);
  if (isNaN(interval) || interval < 1) {
    return message.reply('Por favor, proporciona un intervalo válido en minutos (mínimo 1).');
  }

  const guildId = message.guild.id;
  if (!serverData[guildId]) serverData[guildId] = {};

  serverData[guildId].interval = interval;
  saveJSON(serverDataFile, serverData);

  if (serverData[guildId].channelId) {
    startInterval(guildId, serverData[guildId].channelId, interval);
  }

  message.reply(`Intervalo configurado a ${interval} minutos para este servidor.`);
});

// Iniciar el cliente
client.once('ready', () => {
  console.log('Bot iniciado correctamente.');
});

client.login(token);
