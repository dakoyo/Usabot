import Discord, { ActionRowBuilder, ModalBuilder, TextInputBuilder } from "discord.js";
import util from "util";
import fs from "fs";
import { system } from "../bot.js";

export const command = {
    data: new Discord.SlashCommandBuilder()
        .setName("plugins")
        .setDescription("プラグインの確認/編集"),

    /**
     * 
     * @param {Discord.CommandInteraction} interaction 
     * @param {Discord.Client} client
     */
    async execute(interaction, client, db) {
        const developers = await db.get("developers")
        if (!developers.includes(interaction.user.id)) return interaction.reply({ ephemeral: true, content: "権限が足りません" });
        const plugins = await db.get("plugins");
        const modal = new ModalBuilder();
        for (let i = 0; i < 5; i++) {
            const pluginInput = new ActionRowBuilder()
                .addComponents(
                    new TextInputBuilder()
                        .setCustomId(`plugininput${i}`)
                        .setLabel(`PLUGIN${i + 1}`)
                        .setRequired(false)
                        .setStyle(Discord.TextInputStyle.Short)
                        .setValue(plugins[i] ?? "")
                )
            modal.addComponents(pluginInput);
        }
        modal.setTitle("Plugins");
        modal.setCustomId("plugins");
        await interaction.showModal(modal);
        client.once("interactionCreate", async interaction => {
            if (!interaction.isModalSubmit()) return;
            if (interaction.customId !== "plugins") return;
            try {
                const plugins = [];
                for (let i = 0; i < 5; i++) {
                    plugins.push(interaction.fields.getTextInputValue(`plugininput${i}`));
                }
                await db.set("plugins", plugins);
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