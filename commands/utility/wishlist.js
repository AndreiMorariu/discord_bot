import {
  EmbedBuilder,
  SlashCommandBuilder,
  ButtonBuilder,
  ActionRowBuilder,
} from "discord.js";

import axios from "axios";

import supabase from "../../config/supabase.js";

export default {
  data: new SlashCommandBuilder()
    .setName("wishlist")
    .setDescription("Replies with your wishlisted games"),
  async execute(interaction) {
    await interaction.deferReply();

    try {
      const userID = interaction.user.id;

      let { data: wishlistedGames, error } = await supabase
        .from("wishlists")
        .select("steam_id")
        .eq("user_id", userID);

      if (error) {
        console.log(error);
        await interaction.editReply(
          "There was an error. Please try again later."
        );
        return;
      }

      if (!wishlistedGames || wishlistedGames.length === 0) {
        await interaction.editReply("Your wishlist is empty.");
        return;
      }

      const componentsPromises = wishlistedGames.map(async (wishlistedGame) => {
        const response = await axios.get(
          `https://store.steampowered.com/api/appdetails?appids=${wishlistedGame.steam_id}`
        );

        const gameData = response.data[`${wishlistedGame.steam_id}`].data;

        const embed = new EmbedBuilder()
          .setColor("#0099ff")
          .setTitle(`${gameData.name} (Steam Info)` || "Unknown Title")
          .setURL(`https://store.steampowered.com/app/${gameData.steam_appid}`)
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
                gameData.pc_requirements && gameData.pc_requirements.recommended
                  ? gameData.pc_requirements.recommended.replace(
                      /<\/?[^>]+(>|$)/g,
                      ""
                    )
                  : "No information available.",
              inline: false,
            }
          )
          .setImage(gameData.background_raw || "");

        const removeFromWishlistButton = new ButtonBuilder()
          .setCustomId(`remove_${wishlistedGame.steam_id}`)
          .setLabel("Remove from wishlist")
          .setStyle("Danger");

        const searchDealsButton = new ButtonBuilder()
          .setCustomId(
            `search_${wishlistedGame.steam_id}_${
              gameData.price_overview
                ? gameData.price_overview.final_formatted
                : 0
            }_${gameData.name}`
          )
          .setLabel("Search deals")
          .setStyle("Secondary");

        const actionRow = new ActionRowBuilder().addComponents(
          removeFromWishlistButton,
          searchDealsButton
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
