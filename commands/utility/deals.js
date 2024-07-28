import {
  EmbedBuilder,
  SlashCommandBuilder,
  ButtonBuilder,
  ActionRowBuilder,
} from "discord.js";

import { groupBy } from "../../assets/helpers.js";

import axios from "axios";

const BASE_URL = "https://www.cheapshark.com/api/1.0/deals?";

export default {
  data: new SlashCommandBuilder()
    .setName("deals")
    .setDescription(
      "Replies with the best game deals, searching in over 30 websites"
    )
    .addIntegerOption((option) =>
      option
        .setName("count")
        .setDescription("Number of games to display. Max is 50, default is 10")
        .setMinValue(1)
        .setMaxValue(50)
        .setRequired(false)
    )
    .addIntegerOption((option) =>
      option
        .setName("steam_rating")
        .setDescription("Minimum Steam reviews rating for a game")
        .setMinValue(0)
        .setMaxValue(100)
        .setRequired(false)
    )
    .addIntegerOption((option) =>
      option
        .setName("metacritic")
        .setDescription("Minimum Metacritic rating for a game")
        .setMinValue(0)
        .setMaxValue(100)
        .setRequired(false)
    )
    .addStringOption((option) =>
      option
        .setName("title")
        .setDescription("Find deals by game title")
        .setRequired(false)
    )
    .addIntegerOption((option) =>
      option
        .setName("maximum_price")
        .setDescription(
          "Returns deals with a price less than or equal to this value (50 acts the same as no limit)."
        )
        .setMinValue(1)
        .setMaxValue(50)
        .setRequired(false)
    )
    .addIntegerOption((option) =>
      option
        .setName("minimum_price")
        .setDescription("returns deals with a price greater than this value")
        .setMinValue(0)
        .setRequired(false)
    )
    .addBooleanOption((option) =>
      option
        .setName("descending")
        .setDescription("Determines sort direction")
        .setRequired(false)
    )
    .addStringOption((option) =>
      option
        .setName("store")
        .setDescription("Store to search for deals")
        .addChoices([
          { name: "Steam", value: "1" },
          { name: "GamersGate", value: "2" },
          { name: "GreenManGaming", value: "3" },
          { name: "Amazon", value: "4" },
          { name: "GOG", value: "7" },
          { name: "Origin", value: "8" },
          { name: "Humble Store", value: "11" },
          { name: "Uplay", value: "13" },
          { name: "Fanatical", value: "15" },
          { name: "Epic Games Store", value: "25" },
          { name: "Gamesplanet", value: "27" },
          { name: "Gamesload", value: "28" },
          { name: "2Game", value: "29" },
          { name: "IndieGala", value: "30" },
          { name: "Blizzard Shop", value: "31" },
          { name: "DLGamer", value: "33" },
          { name: "Noctre", value: "34" },
          { name: "DreamGame", value: "35" },
          { name: "GameStop", value: "5" },
          { name: "Direct2Drive", value: "6" },
          { name: "Playfield", value: "19" },
          { name: "WinGameStore", value: "21" },
          { name: "GameBillet", value: "23" },
          { name: "Voidu", value: "24" },
          { name: "Razer Game Store", value: "26" },
        ])
        .setRequired(false)
    )
    .addStringOption((option) =>
      option
        .setName("sort")
        .setDescription(
          "Sort deals by various criteria. The default is Metacritic score."
        )
        .addChoices([
          {
            name: 'Deal Rating. Quick way to compare how "good" a deal is. It is normalized on a scale from 0 to 10',
            value: "dealRating",
          },
          {
            name: "Savings. It's calculated based on the difference between the normal price and the sale price",
            value: "savings",
          },
          { name: "Price", value: "Price" },
          { name: "Metacritic", value: "Metacritic" },
          { name: "Reviews", value: "Reviews" },
          { name: "Release", value: "Release" },
          { name: "Recent", value: "Recent" },
        ])
        .setRequired(false)
    ),
  async execute(interaction) {
    await interaction.deferReply();

    const count = interaction.options.getInteger("count") || 10;

    const steamRating = interaction.options.getInteger("steam_rating") || 0;
    const upperPrice = interaction.options.getInteger("maximum_price") || 50;
    const lowerPrice = interaction.options.getInteger("minimum_price") || 0;
    const metacritic = interaction.options.getInteger("metacritic") || 0;

    const sortBy = interaction.options.getString("sort") || "Metacritic";
    const title = interaction.options.getString("title") || "";
    const storeID = interaction.options.getString("store");

    const desc = interaction.options.getBoolean("descending") || 0;

    try {
      const deals = await axios.get(
        `${BASE_URL}${
          storeID ? `storeID=${storeID}` : ""
        }&sortBy=${sortBy}&desc=${desc}&lowerPrice=${lowerPrice}&upperPrice=${upperPrice}&steamRating=${steamRating}&title=${title}&metacritic=${metacritic}`
      );

      const groupedDeals = groupBy(
        deals.data,
        ({ internalName }) => internalName
      );

      const bestDeals = Object.keys(groupedDeals).map((key) => {
        let lowestPriceDeal = null;
        let lowestPrice = Number.MAX_VALUE;

        groupedDeals[key].map((deal) => {
          const salePrice = parseFloat(deal.salePrice);

          if (salePrice < lowestPrice) {
            lowestPrice = salePrice;
            lowestPriceDeal = deal;
          }
        });

        return lowestPriceDeal;
      });

      if (!bestDeals || bestDeals.length === 0) {
        await interaction.editReply(
          "No deals found within the specified criteria."
        );
        return;
      }

      const components = await Promise.all(
        bestDeals.slice(0, count).map(async (deal) => {
          const date = new Date(deal.releaseDate * 1000);

          const fields = [
            {
              name: "**SALE PRICE**",
              value: `${
                deal.salePrice === "0.00" ? "Free" : `$${deal.salePrice}`
              }`,
              inline: true,
            },
            {
              name: "**METACRITIC SCORE**",
              value:
                deal.metacriticScore === "0" ? "No data" : deal.metacriticScore,
            },
            {
              name: "**STEAM RATING**",
              value:
                deal.steamRatingText === null
                  ? "No data"
                  : deal.steamRatingText,
              inline: true,
            },
            {
              name: "**RELEASE DATE**",
              value: date.toLocaleDateString(),
            },
          ];

          if (deal.isOnSale === "1") {
            fields.push({
              name: "**NORMAL PRICE**",
              value: `$${deal.normalPrice}`,
            });
          }

          const embed = new EmbedBuilder()
            .setTitle(`**${deal.title.toUpperCase()}**`)
            .setURL(`https://www.cheapshark.com/redirect?dealID=${deal.dealID}`)
            .setThumbnail(deal.thumb)
            .addFields(fields)
            .setImage(
              `https://www.cheapshark.com/img/stores/banners/${Number(
                deal.storeID - 1
              )}.png`
            )
            .setTimestamp();

          const addToWishlistButton = new ButtonBuilder()
            .setCustomId(
              `wishlist_${deal.steamAppID}_${deal.salePrice}_${deal.title}`
            )
            .setLabel("Add to Wishlist")
            .setStyle("Primary");

          const actionRow = new ActionRowBuilder().addComponents(
            addToWishlistButton
          );

          return {
            embeds: [embed],
            components: [actionRow],
          };
        })
      );

      await interaction.editReply(components[0]);

      for (let i = 1; i < components.length; i++) {
        await interaction.followUp(components[i]);
      }
    } catch (error) {
      console.error("Error fetching deals:", error);
      await interaction.editReply(
        "There was an error. Please try again later."
      );
    }
  },
};
