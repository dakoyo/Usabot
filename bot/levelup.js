import { EmbedBuilder } from "discord.js";
import client from "../client.js";
import config from "../config.js";
import Logger from "../util/logger.js";
import Model from "../util/model.js";

const logger = new Logger("levelup");

client.on("messageCreate", async message => {
    if (message.channelId == config.probot.levelupChannel) {
        try {
            const userId = message.content.split(":")[0].match(/(?<=@).*?(?=>)/)[0];
            const user = await client.users.fetch(userId);
            const userName = config.users[userId] ?? (user.displayName ?? "生徒");
            const level = Number(message.content.split(":")[1]);
            const usabot_stu = Model.current
            let blessingMessage = {
                content: "おめでとうございます！"
            }
            if (usabot_stu.ready) blessingMessage = await usabot_stu.ask(`「${userName}」という人物のDiscordのレベルが${level - 1}から${level}に上がったみたいです！祝ってください`)
            const color = (Math.random() * 0xFFFFFF | 0).toString(16);
            const randomColor = "#" + ("000000" + color).slice(-6);
            const channel = client.channels.cache.get(config.levelNoticeChannelId);
            await channel.send({
                embeds: [
                    new EmbedBuilder()
                    .setTitle(`🌟❯❯❯LEVEL UP[ ${level} ]`)
                    .setDescription(blessingMessage || "うさぼっと")
                    .setColor(randomColor)
                    .setThumbnail(user.avatarURL())
                ]
            })
        } catch (error) {
            logger.error("Failed to send levelup message", error);
        }
        
    }
})