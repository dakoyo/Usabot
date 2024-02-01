import Discord from "discord.js";
import fs from "fs";

export const command =  {
    data: new Discord.SlashCommandBuilder()
    .setName("removepermission")
    .setDescription("権限を手放す"),

    /**
     * 
     * @param {Discord.CommandInteraction} interaction 
     */
    async execute(interaction) {
        const developers = JSON.parse(fs.readFileSync("./developers.json", "utf8"));
        if (developers.includes(interaction.user.id)) {
            fs.writeFileSync("./developers.json",JSON.stringify(developers.filter(d => d !== interaction.user.id)));
            await interaction.reply({
                ephemeral: true,
                content: "権限を削除しました"
            })
        } else {
            await interaction.reply({
                ephemeral: true,
                content: "権限を保有していません"
            })
        }
    }
}