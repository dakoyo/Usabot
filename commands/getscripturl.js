import Discord, { ActionRowBuilder, ModalBuilder, TextInputBuilder } from "discord.js";
import util from "util";
import fs from "fs";
import crypto from "crypto";

export const command = {
    data: new Discord.SlashCommandBuilder()
        .setName("getscripturl")
        .setDescription("JavaScriptファイルのURLを取得"),

    /**
     * 
     * @param {Discord.CommandInteraction} interaction 
     * @param {Discord.Client} client
     */
    async execute(interaction, client) {
        const modal = new ModalBuilder();
        const script = new ActionRowBuilder()
            .addComponents(
                new TextInputBuilder()
                    .setCustomId("script_content")
                    .setLabel("JavaScript")
                    .setRequired(true)
                    .setStyle(Discord.TextInputStyle.Paragraph)
            )
        modal.addComponents(script);
        modal.setTitle("SCRIPT");
        modal.setCustomId("script");
        await interaction.showModal(modal);
        client.once("interactionCreate", async interaction => {
            if (!interaction.isModalSubmit()) return;
            if (interaction.customId !== "script") return;
            try {
                const content = interaction.fields.getTextInputValue("script_content");
                const randomUUID = crypto.randomUUID();
                const path = `./temp/${randomUUID}.js`;
                await interaction.deferReply({
                    ephemeral: true
                })
                fs.writeFileSync(path, content);
                const message = await interaction.user.send({
                    files: [
                        new Discord.AttachmentBuilder(path)
                    ]
                })
                
                fs.unlinkSync(path);
                await interaction.editReply({
                    ephemeral: true,
                    content: message.url + "```" + message.attachments.first().url + "```"
                })
            } catch (err) {
                try {
                    await interaction.reply({
                        ephemeral: true,
                        embeds: [
                            new EmbedBuilder()
                                .setTitle("ERROR")
                                .setDescription("```js\n" + util.inspect(err) + "```")
                                .setColor("ff0000")
                        ]
                    });
                } catch { }
                console.warn(err);
            }
        })
    }
}