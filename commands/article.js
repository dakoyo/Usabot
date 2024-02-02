import Discord, { ActionRowBuilder, EmbedBuilder, ModalBuilder, TextInputBuilder } from "discord.js";
import DiscordDB from "../util/discordDB.js";
import { createArticle } from "../bot.js";

export const command = {
    data: new Discord.SlashCommandBuilder()
        .setName("article")
        .setDescription("記事を書かせる"),
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
            content: "記事を書きます",
            ephemeral: true
        })
        const embeds = await createArticle(usabot);
        await interaction.channel.send({content: "# USABOTNEWS",embeds})
    }
}
