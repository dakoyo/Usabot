import Discord, { ActionRowBuilder, ModalBuilder, TextInputBuilder } from "discord.js";
import fs from "fs";

export const command = {
    data: new Discord.SlashCommandBuilder()
        .setName("getpermission")
        .setDescription("うさぼっと編集権限の取得")
        .addStringOption(option => option.setName("token").setDescription("うさぼっとのToken")),
    /**
     * 
     * @param {Discord.CommandInteraction} interaction 
     * @param {Discord.Client} client
     */
    async execute(interaction, client, db) {
        const token = interaction.options.get("token")?.value;
        const developers = await db.get("developers");
        if (developers.includes(interaction.user.id)) return await interaction.reply({
            ephemeral: true,
            content: "あなたはすでに権限を保有しています。"
        });
        if (process.env.DISCORD_TOKEN == token) {
            developers.push(interaction.user.id);
            await db.set("developers", developers);
            await interaction.reply({
                ephemeral: true,
                content: "権限を取得しました"
            });
        } else await interaction.reply({
            ephemeral: true,
            content: "正しいトークンを入力してください"
        })
    }
}