import Discord, { ActionRowBuilder, EmbedBuilder, ModalBuilder, TextInputBuilder } from "discord.js";
import fs from "fs";
import DiscordDB from "../util/discordDB.js";
import { createArticle } from "../bot.js";
import Usabot from "../util/Usabot.js";

export const command = {
    data: new Discord.SlashCommandBuilder()
        .setName("article")
        .setDescription("記事を書く"),
    /**
     * 
     * @param {Discord.CommandInteraction} interaction 
     * @param {Discord.Client} client
     * @param {DiscordDB} db
     */
    async execute(interaction, client, db, usabot) {
        const developers = await db.get("developers");
        if (!developers.includes(interaction.user.id)) 
        return interaction.reply({ephemeral: true, content: "権限が足りません"});
        await interaction.reply({
            ephemeral: true,
            content: `記事を書きます`
        })
        const embeds = await createArticle(usabot, db);
        await interaction.channel.send({ content: "# USABOTNEWS\n# <@&1203237149663830036>", embeds })        
    }
}
