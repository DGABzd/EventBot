const { loadJSON } = require('../utils/jsonUtils.js');
const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'top',
  description: 'Muestra el top de regalos.',
  execute(message) {
    const guildId = message.guild.id;
    const userData = loadJSON('./data/userData.json');

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
  },
};
