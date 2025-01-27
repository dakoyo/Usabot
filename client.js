import Discord from "discord.js";
const client = new Discord.Client({
    intents: Object.values(Discord.GatewayIntentBits)
})
import Logger from "./util/logger.js";

import fs from "fs";
import Model from "./util/model.js";

const commands = new Map();
client.once("ready", async () => {
    const logger = new Logger("client");

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
    await logger.log("login successful!");
    for (const d of fs.readdirSync("./bot")) {
        if (d.endsWith(".js")) await import(`./bot/${d}`);
    }
    try {
        await Model.change("usabot5");
        logger.log("succeed in loadin model:usabot3")
    } catch (error) {
        logger.error(error);
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
export default client;