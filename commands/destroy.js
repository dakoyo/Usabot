import client from "../client.js";

export const command = {
    data: new Discord.SlashCommandBuilder()
        .setName("destroy")
        .setDescription("botを停止します"),
    /**
     * 
     * @param {Discord.ChatInputCommandInteraction} interaction 
     */
    async execute(interaction) {
        await interaction.reply("botを停止します");
        process.exit(1);
    }
}
