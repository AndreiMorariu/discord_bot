import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import getGames from "../../assets/steamScraper.js";

export default {
  data: new SlashCommandBuilder()
    .setName("steam")
    .setDescription("Replies with the top whishlisted games"),
  async execute(interaction) {
    await interaction.deferReply();

    const games = await getGames();

    const gameEmbeds = games.slice(0, 9).map((game) => {
      return new EmbedBuilder()
        .setColor(0x0099ff)
        .setTitle(`**${game.title}**`)
        .setURL(game.link)
        .addFields(
          {
            name: "PRICE",
            value: game.price,
          },
          {
            name: "RELEASE DATE",
            value: game.date,
          }
        )
        .setImage(game.image);
    });

    await interaction.editReply({ embeds: gameEmbeds });
  },
};
