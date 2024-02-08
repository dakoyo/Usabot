import Discord from "discord.js";
import fs from "fs";
import Bard from "bard-ai";
import { translate } from '@vitalets/google-translate-api';


export const command =  {
    data: new Discord.SlashCommandBuilder()
    .setName("generateimage")
    .setDescription("画像を生成する（Imagen 2モデルを使用）")
    .addStringOption(option => option.setName("input").setDescription("input")),

    /**
     * 
     * @param {Discord.CommandInteraction} interaction 
     */
    async execute(interaction, client, db) {
        const bard = new Bard(process.env.BARD_COOKIE);
        const { text } = await translate(interaction.options.get("input").value, { to: 'en' });
        console.log(text);
        const res = await bard.ask(`Please generate an image of "${text}".`, {
            format: Bard.JSON
        });
        console.log(res);
    }
}