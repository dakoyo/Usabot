import express from "express";
const app = express();
import * as dotenv from "dotenv"
import config from "./config.js";
import client from "./client.js";
dotenv.config();

app.get("/", (req, res) => {
    res.send("Hello, world");
});

app.get("/files/*", async (req, res) => {
    const param = req.params[0];
    if (!param) {
        res.send("無効なId指定です");
        return;
    }
    const splitedParam = param.split("/");
    const guildId = splitedParam[0];
    const channelId = splitedParam[1];
    const messageId = splitedParam[2];
    const attachmentNumber = splitedParam[3];
    if (guildId && channelId && messageId) {
        res.send("Idが欠損しています");
        return;
    }
    const channel = client.channels.cache.get(channelId);
    /**
     * @type {Message}
     */
    const message = channel.messages.fetch(messageId);
    const attachment = Array.from(message.attachments.values())?.[attachmentNumber];
    if (attachment) {
        const url = attachment.url();
        const html = await fetch(url).then(r => r.text());
        res.send(html);
    }
})

if (!config.dev.debugMode) app.listen(3000)