import Discord from "discord.js";
import fs from "fs";
import * as dotenv from "dotenv";
dotenv.config();

export const client = new Discord.Client({
    intents: Object.values(Discord.GatewayIntentBits)
});

const commands = new Map();
client.once("ready", async () => {
    // get commands
    async function searchLayer(path) {
        for (const d of fs.readdirSync(path)) {
            if (!d.includes(".")) {
                searchLayer(`${path}/${d}`);
            } else {
                if (d.endsWith(".js")) {
                    const { command } = await import(`${path}/${d}`);
                    if (command) commands.set(command?.data?.name, command);
                }
            }
        }
    }
    await searchLayer("./commands");
    client.application.commands.set(Array.from(commands.values()).map(cmd => cmd.data));
    console.log("login successful!");
    for (const d of fs.readdirSync("./bot")) {
        if (d.endsWith(".js")) await import(`./bot/${d}`);
    }
})

client.on("interactionCreate", async interaction => {
    if (!interaction.isChatInputCommand()) return;
    try {
        if (commands.has(interaction.commandName)) {
            await commands.get(interaction.commandName)?.execute(interaction);
        } else {
            await interaction.reply({content: "Old command.", ephemeral: true});
        }
    } catch (error) {
        console.error(error);
    }
})

client.login(process.env.DISCORD_TOKEN);