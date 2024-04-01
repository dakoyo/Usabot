import * as dotenv from "dotenv";
import Discord from "discord.js";
const client = new Discord.Client({intents: Object.values(Discord.GatewayIntentBits)})
dotenv.config();

client.on("messageCreate", message => {
    console.log(message.mentions);
})

client.login(process.env.DISCORD_TOKEN)