import Discord, { ActionRowBuilder, ModalBuilder, TextInputBuilder } from "discord.js";
import util from "util";
import fs from "fs";
import { system } from "../bot.js";

export const command = {
    data: new Discord.SlashCommandBuilder()
        .setName("reload")
        .setDescription("botの再読み込み"),

    /**
     * 
     * @param {Discord.CommandInteraction} interaction 
     * @param {Discord.Client} client
     */
    async execute(interaction, client, db) {
        const developers = await db.get("developers")
        if (!developers.includes(interaction.user.id)) 
        return interaction.reply({ephemeral: true, content: "権限が足りません"});
        await interaction.reply({
            ephemeral: true,
            content: "再起動します..."
        })
        await client.destroy();
        system()
    }
}