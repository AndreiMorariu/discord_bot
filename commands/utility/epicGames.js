const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { EpicFreeGames } = require("epic-free-games");

const epicGamesFree = new EpicFreeGames({ includeAll: true });

async function getGames() {
  const games = await epicGamesFree.getGames();
  return games;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("epicgames")
    .setDescription(
      "Replies with the current and next free games in the Epic Games Store"
    ),
  async execute(interaction) {
    const { currentGames, nextGames } = await getGames();

    const currentEmbeds = currentGames.map((game) => {
      return new EmbedBuilder()
        .setColor(0x0099ff)
        .setTitle(`**FREE NOW: ${game.title}**`)
        .setURL(`https://store.epicgames.com/en-US/p/${game.urlSlug}`)
        .setDescription(`**${game.description}**`)
        .addFields({
          name: "ORIGINAL PRICE",
          value: game.price.totalPrice.fmtPrice.originalPrice,
        })
        .setImage(game.keyImages[0].url);
    });

    const nextEmbeds = nextGames.map((game) => {
      return new EmbedBuilder()
        .setColor(0x0099ff)
        .setTitle(`**COMMING SOON: ${game.title}**`)
        .setURL(`https://store.epicgames.com/en-US/p/${game.urlSlug}`)
        .setDescription(`**${game.description}**`)
        .addFields({
          name: "ORIGINAL PRICE",
          value: game.price.totalPrice.fmtPrice.originalPrice,
        })
        .setImage(game.keyImages[0].url);
    });

    const allEmbeds = [...currentEmbeds, ...nextEmbeds];

    await interaction.reply({ embeds: allEmbeds });
  },
};
