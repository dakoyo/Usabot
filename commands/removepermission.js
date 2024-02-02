import Discord from "discord.js";
import fs from "fs";

export const command =  {
    data: new Discord.SlashCommandBuilder()
    .setName("removepermission")
    .setDescription("権限を手放す"),

    /**
     * 
     * @param {Discord.CommandInteraction} interaction 
     */
    async execute(interaction, client, db) {
        const developers = await db.get("developers")
        if (developers.includes(interaction.user.id)) {
            await db.set("developers",developers.filter(d => d !== interaction.user.id));
            await interaction.reply({
                ephemeral: true,
                content: "権限を削除しました"
            })
        } else {
            await interaction.reply({
                ephemeral: true,
                content: "権限を保有していません"
            })
        }
    }
}