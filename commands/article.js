import Discord, { ActionRowBuilder, EmbedBuilder, ModalBuilder, TextInputBuilder } from "discord.js";
import fs from "fs";
import DiscordDB from "../util/discordDB.js";

export const command = {
    data: new Discord.SlashCommandBuilder()
        .setName("day")
        .setDescription("何日目か設定する")
        .addNumberOption(option => option.setName("daynumber").setDescription("日にち")),
    /**
     * 
     * @param {Discord.CommandInteraction} interaction 
     * @param {Discord.Client} client
     * @param {DiscordDB} db
     */
    async execute(interaction, client, db) {
        const developers = await db.get("developers");
        if (!developers.includes(interaction.user.id)) 
        return interaction.reply({ephemeral: true, content: "権限が足りません"});
        const day = interaction.options.get("daynumber").value;
        await db.set("day", day);
        await interaction.reply({
            ephemeral: true,
            content: `${day}日目にしました`
        })
    }
}
