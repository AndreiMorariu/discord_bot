import {
  SlashCommandBuilder,
  EmbedBuilder,
  ButtonBuilder,
  ActionRowBuilder,
} from "discord.js";

import getGames from "../../assets/steamScraper.js";

export default {
  data: new SlashCommandBuilder()
    .setName("steam")
    .setDescription("Replies with the top wishlisted games on steam")
    .addIntegerOption((option) =>
      option
        .setName("count")
        .setDescription("Number of games to display, max is 50, default is 10")
        .setMinValue(1)
        .setMaxValue(50)
        .setRequired(false)
    ),
  async execute(interaction) {
    await interaction.deferReply();

    try {
      const games = await getGames();

      const count = interaction.options.getInteger("count") || 10;

      const components = games.slice(0, count).map((game, index) => {
        const embed = new EmbedBuilder()
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

        const button = new ButtonBuilder()
          .setCustomId(`wishlist_${index}`)
          .setLabel("Add to Wishlist")
          .setStyle("Primary");

        const actionRow = new ActionRowBuilder().addComponents(button);

        return { embeds: [embed], components: [actionRow] };
      });

      await interaction.editReply(components[0]);
      for (let i = 1; i < components.length; i++) {
        await interaction.followUp(components[i]);
      }
    } catch (error) {
      console.log(error);
      await interaction.editReply(
        "There was an error. Please try again later."
      );
    }
  },
};
