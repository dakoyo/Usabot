import Discord, { ActionRowBuilder, EmbedBuilder, ModalBuilder, TextInputBuilder } from "discord.js";
import fs from "fs";
import DiscordDB from "../util/discordDB.js";

export const command = {
    data: new Discord.SlashCommandBuilder()
        .setName("status")
        .setDescription("ステータスを設定する")
        .addStringOption(option => option.setName("statusname").setDescription("ステータス名")),
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
        const status = interaction.options.get("statusname").value;
        await db.set("status", status);
        client.user.setActivity({
            name: status
        });
        await interaction.reply({
            ephemeral: true,
            content: `ステータスを"${status}"に設定しました`
        })
    }
}
