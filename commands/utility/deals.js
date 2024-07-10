import {
  EmbedBuilder,
  SlashCommandBuilder,
  ButtonBuilder,
  ActionRowBuilder,
  AttachmentBuilder,
} from "discord.js";
import { CheapShark } from "cheapshark-ts";

import { groupBy, resizeImage } from "../../assets/helpers.js";

const cheapshark = new CheapShark();

export default {
  data: new SlashCommandBuilder()
    .setName("deals")
    .setDescription("Find the best game deals in over 30 websites")
    .addIntegerOption((option) =>
      option
        .setName("count")
        .setDescription("Number of games to display, max is 50, default is 10")
        .setMinValue(1)
        .setMaxValue(50)
        .setRequired(false)
    )
    .addNumberOption((option) =>
      option
        .setName("maximum_price")
        .setDescription(
          "Returns deals with a price less than or equal to this value (50 acts the same as no limit)."
        )
        .setMinValue(1)
        .setMaxValue(50)
        .setRequired(false)
    )
    .addStringOption((option) =>
      option
        .setName("sort")
        .setDescription(
          "Sort by Deal Rating | Savings | Price | Metacritic | Steam Rating | Reviews | Release"
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
          { name: "Price", value: "price" },
          { name: "Metacritic", value: "metacritic" },
          { name: "Steam Rating", value: "steamRating" },
          { name: "Reviews", value: "reviews" },
          { name: "Release", value: "release" },
        ])
        .setRequired(false)
    )
    .addBooleanOption((option) =>
      option
        .setName("triple_a")
        .setDescription("Only returns AAA games")
        .setRequired(false)
    ),
  async execute(interaction) {
    await interaction.deferReply();

    const count = interaction.options.getInteger("count") || 10;
    const upperPrice = interaction.options.getNumber("maximum_price") || 15;
    const sortBy = interaction.options.getString("sort") || "metacritic";
    const tripleA = interaction.options.getBoolean("triple_a");

    try {
      const params = {
        upperPrice,
        sortBy,
        AAA: tripleA,
      };

      const deals = await cheapshark.getDeals(params);

      const groupedDeals = groupBy(deals, ({ internalName }) => internalName);

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

      if (!deals || deals.length === 0) {
        await interaction.editReply(
          "No deals found within the specified criteria."
        );
        return;
      }

      const components = await Promise.all(
        bestDeals.slice(0, count).map(async (deal, index) => {
          const resizedImageBuffer = await resizeImage(deal.thumb, 200, 100); // Resize image to 200x200 pixels
          const attachment = new AttachmentBuilder(resizedImageBuffer, {
            name: `image_${index}.png`,
          });

          const embed = new EmbedBuilder()
            .setTitle(`**${deal.title.toUpperCase()}**`)
            .setURL(`https://www.cheapshark.com/redirect?dealID=${deal.dealID}`)
            .setThumbnail(
              `https://www.cheapshark.com/img/stores/banners/${Number(
                deal.storeID - 1
              )}.png`
            )
            .addFields(
              {
                name: "**NORMAL PRICE**",
                value: `$${deal.normalPrice}`,
              },
              {
                name: "**SALE PRICE**",
                value: `$${deal.salePrice}`,
                inline: true,
              },
              {
                name: "**METACRITIC SCORE**",
                value: deal.metacriticScore,
              },
              {
                name: "**STEAM RATING PERCENT**",
                value: deal.steamRatingPercent,
                inline: true,
              }
            )
            .setImage(`attachment://image_${index}.png`)
            .setTimestamp();

          const button = new ButtonBuilder()
            .setCustomId(`wishlist_${index}`)
            .setLabel("Add to Wishlist")
            .setStyle("Primary");

          const actionRow = new ActionRowBuilder().addComponents(button);

          return {
            embeds: [embed],
            components: [actionRow],
            files: [attachment],
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

// storeID?: string;
// pageNumber?: number;
// pageSize?: number;

// sortBy?: string;
// | "Deal Rating"
// | "Title"
// | "Savings"
// | "Price"
// | "Metacritic"
// | "Reviews"
// | "Release"
// | "Store"
// | "recent";

// desc?: boolean;
// lowerPrice?: number;
// upperPrice?: number;
// metacritic?: number;
// steamRating?: number;
// streamAppID?: string;
// title?: string;
// exact?: boolean;
// AAA?: boolean;
// steamworks?: boolean;
// onSale?: boolean;
// output?: string;
