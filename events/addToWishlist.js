import { Events } from "discord.js";

export default {
  name: Events.InteractionCreate,
  async execute(interaction) {
    if (!interaction.isButton()) return;

    const customId = interaction.customId;

    if (customId.startsWith("wishlist_")) {
      await interaction.reply({
        content: "Added to wishlist!",
        ephemeral: true,
      });
    }
  },
};
