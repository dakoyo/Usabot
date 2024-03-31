import client from "../client.js";
import webhook from "../lib/webhook.js";
import Logger from "../util/logger.js";
const logger = new Logger("messageURL")

client.on("messageCreate", async message => {
    try {
        const urls = message.content.match(/(https?:\/\/[^\s]+)/g);
        urls?.forEach(async url => {
            if (url.startsWith("https://discord.com/channels")) {
                try {
                    const guildId = url.split("/")[4];
                    const channelId = url.split("/")[5];
                    const messageId = url.split("/")[6];
                    const guild = client.guilds.cache.get(guildId);
                    const channel = guild.channels.cache.get(channelId);
                    const foundMessage = await channel.messages.fetch(messageId);
                    if (message.channel.type == 0)
                        await webhook.send(message.channel, {
                            content: foundMessage.content,
                            files: foundMessage.attachments.map(
                                (attachment) => attachment.url,
                            ),
                            embeds: foundMessage.embeds,
                            avatarURL: foundMessage.author.avatarURL(),
                            username: foundMessage.author.displayName,
                        });
                    if (message.channel.type == 11)
                        await message.channel.send({
                            files: foundMessage.attachments.map(
                                (attachment) => attachment.url,
                            ),
                            embeds: [
                                new Discord.EmbedBuilder()
                                    .setDescription(
                                        `${foundMessage.content == ""
                                            ? "```message is empty```"
                                            : foundMessage.content
                                        }`,
                                    )
                                    .setAuthor({
                                        iconURL: foundMessage.author.avatarURL(),
                                        name: foundMessage.author.displayName,
                                    })
                                    .setColor(Discord.Colors.Purple),
                            ],
                        });
                } catch (err) {
                    logger.warn(err);
                }
            }
        })
    } catch {}
})