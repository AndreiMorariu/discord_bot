import {
  SlashCommandBuilder,
  EmbedBuilder,
  ButtonBuilder,
  ActionRowBuilder,
} from "discord.js";

import getGames from "../../assets/steamScraper.js";
import axios from "axios";

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
    const count = interaction.options.getInteger("count") || 10;

    try {
      const games = await getGames();

      const steamIDs = games.map((game) => game.steamID);

      const componentsPromises = steamIDs
        .slice(0, count)
        .map(async (steamID, index) => {
          const response = await axios.get(
            `https://store.steampowered.com/api/appdetails?appids=${steamID}`
          );

          const gameData = response.data[`${steamID}`].data;

          const embed = new EmbedBuilder()
            .setColor("#0099ff")
            .setTitle(`${gameData.name} #${index + 1}` || "Unknown Title")
            .setURL(
              `https://store.steampowered.com/app/${gameData.steam_appid}`
            )
            .setDescription(
              gameData.short_description || "No description available."
            )
            .setThumbnail(gameData.header_image)
            .addFields(
              {
                name: "Developers",
                value: gameData.developers
                  ? gameData.developers.join(", ")
                  : "Unknown",
                inline: true,
              },
              {
                name: "Publishers",
                value: gameData.publishers
                  ? gameData.publishers.join(", ")
                  : "Unknown",
                inline: true,
              },
              {
                name: "Metacritic Score",
                value: gameData.metacritic
                  ? gameData.metacritic.score.toString()
                  : "N/A",
                inline: true,
              },
              {
                name: "Release Date",
                value: gameData.release_date
                  ? gameData.release_date.date
                  : "Unknown",
                inline: true,
              },
              {
                name: "Price",
                value: gameData.price_overview
                  ? gameData.price_overview.final_formatted
                  : "Unknown",
                inline: true,
              },
              {
                name: "Genres",
                value: gameData.genres
                  ? gameData.genres.map((g) => g.description).join(", ")
                  : "Unknown",
                inline: true,
              },
              {
                name: "Platforms",
                value: gameData.platforms
                  ? Object.keys(gameData.platforms)
                      .filter((platform) => gameData.platforms[platform])
                      .join(", ")
                  : "Unknown",
                inline: true,
              },
              {
                name: "Minimum Requirements",
                value:
                  gameData.pc_requirements && gameData.pc_requirements.minimum
                    ? gameData.pc_requirements.minimum.replace(
                        /<\/?[^>]+(>|$)/g,
                        ""
                      )
                    : "No information available.",
                inline: false,
              },
              {
                name: "Recommended Requirements",
                value:
                  gameData.pc_requirements &&
                  gameData.pc_requirements.recommended
                    ? gameData.pc_requirements.recommended.replace(
                        /<\/?[^>]+(>|$)/g,
                        ""
                      )
                    : "No information available.",
                inline: false,
              }
            )
            .setImage(gameData.background_raw || "");

          const addToWishlistButton = new ButtonBuilder()
            .setCustomId(
              `wishlist_${steamID}_${
                gameData.price_overview
                  ? gameData.price_overview.final_formatted
                  : 0
              }_${gameData.name}`
            )
            .setLabel("Add to Wishlist")
            .setStyle("Primary");

          const actionRow = new ActionRowBuilder().addComponents(
            addToWishlistButton
          );

          return { embeds: [embed], components: [actionRow] };
        });

      const components = await Promise.all(componentsPromises);

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
