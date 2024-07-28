import { SlashCommandBuilder, EmbedBuilder } from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("Replies with information about the bot"),
  async execute(interaction) {
    const helpEmbed = new EmbedBuilder()
      .setColor("#0099ff")
      .setTitle("Bot Commands")
      .setDescription("Here are the available commands for the bot:")
      .addFields(
        {
          name: "/deals",
          value:
            "Replies with the best game deals, searching in over 30 websites. Options include `count`, `steam_rating`, `metacritic`, `title`, `maximum_price`, `minimum_price`, `descending`, `on_sale`, `store`, and `sort`.",
        },
        {
          name: "/steam",
          value: "Displays the most wishlisted games on Steam.",
        },
        {
          name: "/epicgames",
          value: "Displays the weekly free games on Epic Games.",
        },
        {
          name: "/wishlist",
          value:
            "Allows you to see and remove the games that you have added to your wishlist and search for the best deal available for the game.",
        }
      )
      .setTimestamp()
      .setFooter({ text: "Use /command_name to execute a command." });

    await interaction.reply({ embeds: [helpEmbed] });
  },
};
