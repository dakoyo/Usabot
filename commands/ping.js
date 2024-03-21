import Discord from "discord.js";
import { client } from "../bot.js";

export const command = {
    data: new Discord.SlashCommandBuilder()
    .setName("ping")
    .setDescription("ping"),

    /**
     * 
     * @param {import("discord.js").Interaction} interaction 
     */
    execute(interaction) {
        interaction.reply("pong!");
    }
}