import Discord, { Embed, EmbedBuilder } from "discord.js";
import Model from "../util/model.js";
import Logger from "../util/logger.js";

const logger = new Logger("model command")

export const command = {
    data: new Discord.SlashCommandBuilder()
        .setName("models")
        .setDescription("モデルを変更します"),
    /**
     * 
     * @param {Discord.ChatInputCommandInteraction} interaction 
     */
    async execute(interaction) {
        await interaction.deferReply();
        setTimeout(async () => {
            const modelCommandOptionName = interaction.options.getString("modelname");
            try {
                await Model.change(modelCommandOptionName);
            } catch (error) {
                logger.error(error)
                try {
                    const errorEmbed = new EmbedBuilder()
                    .setTitle("ERROR")
                    .setDescription("モデルの読み込みに失敗しました\n\n" + "```js\n" + error + "```");
                    return await interaction.editReply({embeds: [errorEmbed]})
                } catch {}
            }
            const model = Model.models.get(modelCommandOptionName);
            const embed = new EmbedBuilder()
                .setTitle(model.name + "-" + model.mode)
                .setDescription(model.description)
                .setColor("White")
                .setThumbnail(model.avatarURL)
            await interaction.editReply({ embeds: [embed] });
        }, 1000)
    }
}

command.data.addStringOption(option => {
    const models = Model.models.values();
    const choices = [];
    for (const model of models) {
        choices.push({ name: model.commandOptionName, value: model.commandOptionName })
    }
    return option.setName("modelname")
        .setChoices(...choices)
        .setDescription("モデルを選ぶ")
        .setRequired(true)
})