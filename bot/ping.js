import client from "../client.js";
import config from "../config.js";

client.on("messageCreate", async message => {
    if (message.content == "!ping") {
        try {
            await message.channel.send("pong!");
        } catch (err) {

        }
    }
    if (message.channelId == config.dev.logChannelId && message.embeds[0]?.description == "```js\nlogin successful!```") {
        await client.destroy();
    }
})