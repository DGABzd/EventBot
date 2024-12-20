const { loadJSON } = require('../utils/jsonUtils.js');
const { EmbedBuilder } = require('discord.js');

  module.exports = {
    name: 'inventory',
    description: 'Configura el canal para enviar entidades.',
    async execute(message) {
      const guildId = message.guild.id;
      const userId = message.author.id;
      const userData = loadJSON('./data/userData.json');
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

    },
};