const { loadJSON, saveJSON } = require('../utils/jsonUtils.js');

module.exports = {
  name: 'setchannel',
  description: 'Configura el canal para enviar entidades.',
  async execute(message) {
    if (!message.member.permissions.has('ADMINISTRATOR')) return;
    const guildId = message.guild.id;
    const channelId = message.channel.id;

    const serverData = loadJSON('./data/serverData.json');
    if (!serverData[guildId]) serverData[guildId] = {};
    serverData[guildId].channelId = channelId;

    saveJSON('./data/serverData.json', serverData);
    message.reply(`Canal configurado para enviar entidades.`);
  },
};