import { Events } from "discord.js";
import supabase from "../config/supabase.js";

import axios from "axios";

// CustomId structure: operation_steamID_gamePrice_gameTitle

export default {
  name: Events.InteractionCreate,
  async execute(interaction) {
    if (!interaction.isButton()) return;
    const interactionID = interaction.customId;

    const userID = interaction.user.id;
    const [operation, steamID, gamePrice, gameTitle] = interactionID.split("_");

    if (operation === "wishlist") {
      const { data: wishlistData, error: wishlistError } = await supabase
        .from("wishlists")
        .select("*")
        .eq("user_id", userID)
        .eq("steam_id", steamID)
        .maybeSingle();

      if (wishlistError) {
        console.log(wishlistError);
        await interaction.reply({
          content: "Error adding game to wishlist",
          ephemeral: true,
        });
        return;
      }

      if (wishlistData) {
        await interaction.reply({
          content: `${gameTitle.toUpperCase()} is already in your wishlist`,
          ephemeral: true,
        });
        return;
      }

      const { _, error } = await supabase.from("wishlists").insert([
        {
          user_id: userID,
          steam_id: steamID,
          price: parseFloat(gamePrice),
        },
      ]);

      if (error) {
        console.log(error);
        await interaction.reply({
          content: "Error adding game to wishlist",
          ephemeral: true,
        });

        return;
      }

      await interaction.reply({
        content: `Game ${gameTitle.toUpperCase()} added to ${interaction.user.tag.toUpperCase()}'s wishlist`,
      });
    }

    if (operation === "remove") {
      const { data: game, error } = await supabase
        .from("wishlists")
        .select("user_id")
        .eq("steam_id", steamID)
        .eq("user_id", userID);

      if (game.length === 0) {
        await interaction.reply({
          content: "Access denied",
          ephemeral: true,
        });

        return;
      }

      const { error: deleteError } = await supabase
        .from("wishlists")
        .delete()
        .eq("steam_id", steamID)
        .eq("user_id", userID);

      if (deleteError) {
        console.log(error);
        await interaction.reply({
          content: "Error removing game from wishlist",
          ephemeral: true,
        });

        return;
      }

      await interaction.reply({
        content: "Game removed from your wishlist",
        ephemeral: true,
      });
    }

    if (operation === "search") {
      const parsedTitle = gameTitle.replace(/\W/g, "").toUpperCase();

      const response = await axios.get(
        `https://www.cheapshark.com/api/1.0/deals?title=${parsedTitle}`
      );

      const deals = response.data;

      const filteredDeals = deals.filter(
        (deal) => deal.internalName === parsedTitle
      );

      const lowestPrice = Math.min(
        ...filteredDeals.map((deal) => parseFloat(deal.salePrice))
      );

      const bestDeal = filteredDeals.find(
        (deal) => parseFloat(deal.salePrice) === lowestPrice
      );

      if (!bestDeal) {
        await interaction.reply({
          content: `No deal found for ${gameTitle.toUpperCase()}`,
        });
        return;
      }

      await interaction.reply({
        content: `Best deal for ${gameTitle.toUpperCase()}: https://www.cheapshark.com/redirect?dealID=${
          bestDeal.dealID
        }`,
      });
    }
  },
};
