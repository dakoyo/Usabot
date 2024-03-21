import config from "../../config.js";
import { client } from "../../bot.js";
import Gemini from "../../lib/gemini/geminiAPI.js";
import Logger from "../../util/logger.js";
import { gemini, usabotChatIds } from "../setup.js";

const logger = new Logger("usabot");
const replaceWords = JSON.parse(process.env.REPLACEWORDS.split("<br>").join("\\n"));
client.user.setActivity("英語コミュニケーション")

const chats = new Map();
client.on("messageCreate", async message => {
    if (message.author.bot) return;
    if (message.content.includes(`<@${client.user.id}>`) || (message.reference && message.mentions.has(client.user.id))) {
        try {
            message.channel.sendTyping();
            let image = message.attachments?.first();
            const ids = chats.get(message.reference?.messageId) ?? usabotChatIds;
            if (image) {
                try {
                    image = await fetch(imageURL).then(r => r.arrayBuffer());
                } catch { }
            }
            let question = message.content;
            question = question.split(`<@${client.user.id}>`).join("うさぼっと")
            for (const user in config.users) {
                question = question.split(`<@${user}>`).join(config.users[user]);
            }
            const res = await gemini.ask(process.env.THIRD_PROMPT.replace(/{questioner}/g,message.author.displayName).replace(/<br>/g, "\n") + question, {
                format: Gemini.JSON,
                ids,
                image,
            });
            let stringJSON = res.content.split("\n").join("<br>");
            if (stringJSON.endsWith("<br>")) stringJSON = stringJSON.slice(0, -4)
            res.content = JSON.parse(stringJSON).content
            
            for (const word in replaceWords) {
                res.content = res.content.split(word).join(replaceWords[word]);
            }
            res.content = res.content.replace(/<br>/g,"\n")
            const responseMessage = await message.reply({
                content: res.content,
            });
            chats.set(responseMessage.id, res.ids);
        } catch (err) {
            try {
                await message.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle("ERROR")
                            .setDescription("```js\n" + util.inspect(err) + "```")
                            .setColor("ff0000")]
                })
            } catch { }
            logger.warn(err);
        }
    }

})