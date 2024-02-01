import Discord, { ActionRowBuilder, EmbedBuilder, ModalBuilder, TextInputBuilder } from "discord.js";
import fs from "fs";

export const command = {
    data: new Discord.SlashCommandBuilder()
        .setName("destroy")
        .setDescription("クライアントを停止する"),
    /**
     * 
     * @param {Discord.CommandInteraction} interaction 
     * @param {Discord.Client} client
     */
    async execute(interaction, client) {
        const developers = JSON.parse(fs.readFileSync("./developers.json", "utf8"));
        if (!developers.includes(interaction.user.id)) 
        return interaction.reply({ephemeral: true, content: "権限が足りません"});
        await client.destroy();
        await interaction.reply({
          content: "クライアントを停止しました",
          ephemeral: true
        })
    }
}
