import client from "../client.js";
import Logger from "../util/logger.js";
import config from "../config.js";

const logger = new Logger("ping");

setTimeout(() => {

    client.on("messageCreate", async message => {
        if (message.content == "!ping") {
            try {
                await message.channel.send("pong!");
            } catch (err) {
    
            }
        }
        if ((message.channelId == config.dev.logChannelId) && (message.embeds[0]?.description == "```js\nlogin successful!```")) {
            await logger.log("client destroy")
            await client.destroy();
        }
    })
},2000)