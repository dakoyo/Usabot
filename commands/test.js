import Discord from "discord.js";
import fs from "fs";

export const command =  {
    data: new Discord.SlashCommandBuilder()
    .setName("test")
    .setDescription("テスト用のコマンド")
    .addStringOption(option => option.setName("input").setDescription("input")),

    /**
     * 
     * @param {Discord.CommandInteraction} interaction 
     */
    async execute(interaction, client, db) {
        const developers = await db.get("developers");
        if (!developers.includes(interaction.user.id)) 
        return interaction.reply({ephemeral: true, content: "権限が足りません"});
        await interaction.reply({
            content: "TEST",
            ephemeral: true
        });
        interaction.channel.send(interaction.options.get("input").value)
    }
}