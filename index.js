const { Client, GatewayIntentBits, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');
const { token } = require('./config.json');
const fs = require('fs');

// Archivos de datos
const serverDataFile = './serverData.json';
const itemsFile = './items.json';
const imagesFile = './images.json';
const userDataFile = './userData.json';

// Datos en memoria
const lastActivity = {};
const intervals = {};
const serverData = loadJSON(serverDataFile);
const userData = loadJSON(userDataFile);
const items = loadJSON(itemsFile);
const images = loadJSON(imagesFile);


// ID del administrador con permisos para modificar regalos
const adminId = '1235766090005614705';

// Crear cliente
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

// Funciones para manejo de JSON
function loadJSON(file) {
  if (!fs.existsSync(file)) return {};
  return JSON.parse(fs.readFileSync(file, 'utf-8'));
}

function saveJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

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
  const weights = [50, 25, 15, 5, 3, 2, 1]; // Exótico es el más raro, y Mítico es bastante difícil.

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
        .setDescription(`Esta entidad solo dará un regalo al que **${action} la Navidad**. ¿Qué eliges?`)
        .setImage(image)
        .setColor('#FF0000');

    const adoreButton = new ButtonBuilder()
        .setCustomId('adora')
        .setLabel('Adoro Navidad')
        .setStyle(ButtonStyle.Success);

    const detestButton = new ButtonBuilder()
        .setCustomId('detesta')
        .setLabel('Detesto Navidad')
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
      .setDescription('La entidad se asustó y se fue al ver que nadie tenía el espíritu navideño adecuado.')
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

// Comando para configurar el canal
client.on('messageCreate', (message) => {
  if (!message.content.startsWith('!setchannel') || !message.member.permissions.has('ADMINISTRATOR')) return;

  const guildId = message.guild.id;
  const channelId = message.channel.id;

  if (!serverData[guildId]) serverData[guildId] = {};
  serverData[guildId].channelId = channelId;
  saveJSON(serverDataFile, serverData);

  if (serverData[guildId].interval) {
    startInterval(guildId, channelId, serverData[guildId].interval);
  }

  message.reply(`Canal configurado para enviar las entidades.`);
});

// Comando para ver el top de regalos
client.on('messageCreate', (message) => {
  if (!message.content.startsWith('!top')) return;

  const guildId = message.guild.id;
  if (!userData[guildId]) return message.reply('No hay datos de regalos en este servidor.');

  const sortedUsers = Object.entries(userData[guildId])
    .map(([id, data]) => ({ id, gifts: data.gifts }))
    .sort((a, b) => b.gifts - a.gifts)
    .slice(0, 10);

  if (sortedUsers.length === 0) {
    return message.reply('No hay usuarios con regalos registrados.');
  }

  const topEmbed = new EmbedBuilder()
    .setTitle('<:gifts:1318992821927149639> Top de Regalos <:gifts:1318992821927149639>')
    .setDescription(sortedUsers.map((u, i) => `**${i + 1}.** <@${u.id}>: ${u.gifts} regalos`).join('\n'))
    .setThumbnail('https://cdn.discordapp.com/attachments/1317101011843944513/1317188510431842426/6272910.png')
    .setColor('#FFD700');

  message.reply({ embeds: [topEmbed] });
});

// Comando para ver inventario
client.on('messageCreate', (message) => {
  if (!message.content.startsWith('!inventory')) return;

  const guildId = message.guild.id;
  const userId = message.author.id;
  const userInventory = userData[guildId]?.[userId]?.inventory || [];

  if (userInventory.length === 0) {
    return message.reply('No tienes regalos en tu inventario.');
  }

  const inventoryEmbed = new EmbedBuilder()
    .setTitle('🎄 Tu inventario 🎄')
    .setDescription(
      userInventory
        .map(item => `**${item.item}** (${item.rarity}) x${item.count}`)
        .join('\n')
    )
    .setColor('#00FF00');

  message.reply({ embeds: [inventoryEmbed] });
});

// Comando para añadir regalos (solo admin)
client.on('messageCreate', (message) => {
  if (!message.content.startsWith('!addgifts') || message.author.id !== adminId) return;

  const args = message.content.split(' ');
  const userId = args[1]?.replace(/[<@!>]/g, ''); // Quitar formato de mención
  const amount = parseInt(args[2]);

  if (!userId || isNaN(amount) || amount < 1) {
    return message.reply('Formato incorrecto. Usa: `!addgifts @usuario cantidad`.');
  }

  const guildId = message.guild.id;
  if (!userData[guildId]) userData[guildId] = {};
  if (!userData[guildId][userId]) userData[guildId][userId] = { gifts: 0, inventory: [] };

  userData[guildId][userId].gifts += amount;
  saveJSON(userDataFile, userData);

  message.reply(`Se añadieron ${amount} regalos a <@${userId}>.`);
});

// Iniciar el cliente
client.once('ready', () => {
  console.log('Bot iniciado correctamente.');
});

client.login(token);
