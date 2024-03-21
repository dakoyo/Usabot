import Discord from "discord.js";

export const command = {
    data: new Discord.SlashCommandBuilder()
    .setName("destroy")
    .setDescription("destroy"),

    /**
     * 
     * @param {import("discord.js").Interaction} interaction 
     */
    execute(interaction) {
        process.exit(0);
    }
}