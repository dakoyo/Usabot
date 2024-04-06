import client from "../client.js";
import Discord from "discord.js";
import webhook from "../lib/webhook.js";
import Model from "../util/model.js";
import Logger from "../util/logger.js";
const logger = new Logger("ai");    

client.on("messageCreate", async message => {
    if (message.author.bot) return;
    if (message.content.includes(`<@${client.user.id}>`) && (message.content !== `<@${client.user.id}>`)) {
        try {
            if (!Model.current.ready) return await message.channel.send("```モデルは準備中です```")
            message.channel.sendTyping();
            let ids;
            if (message.reference) ids = Model.chatData.get(message.reference?.messageId);
            let image = message.attachments?.first();
            message.content = message.content.split(`<@${client.user.id}>`).join(Model.current.name + "、");
            const res = await Model.current.ask(message, ids ,image?.url);
            res.content = res.content.split("[Image sent]").join("画像");
            const successful = await message.channel.send("✓");
            await successful.delete();
            let repliedMessage
            if (message.channel.type == Discord.ChannelType.GuildText) {
                repliedMessage = await webhook.send(message.channel, {
                    avatarURL: Model.current.avatarURL,
                    username: Model.current.name,
                    content: res.content
                });
            } else {
                repliedMessage = await message.channel.send({
                    embeds: [
                        new Discord.EmbedBuilder()
                        .setDescription(res.content)
                        .setAuthor({
                            name: Model.current.name,
                            iconURL: Model.current.avatarURL
                        })
                    ]
                });
            }
            Model.chatData.set(repliedMessage.id, res.ids);
        } catch (error) {
            logger.error(error);
            try {
                await message.reply({
                    embeds: [new Discord.EmbedBuilder()
                    .setTitle("ERROR")
                    .setDescription("```js\n" + error + "```")]
                });
            } catch {}
        }
    }
})