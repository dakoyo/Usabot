import Discord, { ActionRowBuilder, ModalBuilder, TextInputBuilder } from "discord.js";
import Usabot from "../util/Usabot.js";
import util from "util";
import fs from "fs";

import { system } from "../bot.js";

export const command = {
    data: new Discord.SlashCommandBuilder()
        .setName("prompts")
        .setDescription("プロンプトの確認/編集"),

    /**
     * 
     * @param {Discord.CommandInteraction} interaction 
     * @param {Discord.Client} client
     */
    async execute(interaction, client, db) {
        const developers = await db.get("developers");
        if (!developers.includes(interaction.user.id)) return interaction.reply({ ephemeral: true, content: "権限が足りません" });
        const usabot = new Usabot()
        const modal = new ModalBuilder();
        const mainPromptText = new ActionRowBuilder()
            .addComponents(
                new TextInputBuilder()
                    .setCustomId("mainprompt")
                    .setLabel("MAIN")
                    .setRequired(true)
                    .setStyle(Discord.TextInputStyle.Paragraph)
                    .setValue(usabot.prompts.main.content)
            )
        const infoPromptText = new ActionRowBuilder()
            .addComponents(
                new TextInputBuilder()
                    .setCustomId("infoprompt")
                    .setLabel("INFO")
                    .setStyle(Discord.TextInputStyle.Paragraph)
                    .setRequired(true)
                    .setValue(usabot.prompts.info.content)
            );
        modal.addComponents(mainPromptText, infoPromptText);
        modal.setTitle("Prompts");
        modal.setCustomId("prompts");
        await interaction.showModal(modal);
        client.once("interactionCreate", async interaction => {
            if (!interaction.isModalSubmit()) return;
            if (interaction.customId !== "prompts") return;
            try {
                const mainPrompt = interaction.fields.getTextInputValue("mainprompt")
                const infoPrompt = interaction.fields.getTextInputValue("infoprompt")
                usabot.prompts.main.edit(mainPrompt);
                usabot.prompts.info.edit(infoPrompt);
                await interaction.reply({
                    ephemeral: true,
                    content: "✅ **SUCCESS**"
                });
                await client.destroy();
                setTimeout(system, 1000)
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