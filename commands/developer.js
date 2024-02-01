import Discord, { ActionRowBuilder, EmbedBuilder, ModalBuilder, TextInputBuilder } from "discord.js";
import fs from "fs";

export const command = {
    data: new Discord.SlashCommandBuilder()
        .setName("developers")
        .setDescription("開発者リストを確認"),
    /**
     * 
     * @param {Discord.CommandInteraction} interaction 
     * @param {Discord.Client} client
     */
    async execute(interaction, client) {
        const developers = JSON.parse(fs.readFileSync("./developers.json", "utf8"));
        const embed = new EmbedBuilder()
        .setTitle("開発者リスト")
        .setDescription(developers.length > 0 ? developers.map(d => `<@${d}>`).join("\n") : "開発者はいません")
        .setColor(Discord.Colors.Blue)
        await interaction.reply({embeds: [embed]});
    }
}