import Discord, { EmbedBuilder } from "discord.js";

import Usabot from "./util/Usabot.js";
import webhook from "./util/webhook.js";

import util from "util";

import sch from "node-schedule"

import vm from "vm";

import { config } from "./prompts/config.js";

import * as dotenv from "dotenv";
dotenv.config();

import fs from "fs";
export async function system() {
    const commands = [];
    const commandData = new Map();
    let loaded = false;
    const client = new Discord.Client({
        intents: Object.values(Discord.GatewayIntentBits)
    });
    let usabot = new Usabot();
    const plugins = JSON.parse(fs.readFileSync("./plugins.json"));
    client.once("ready", async () => {
        client.user.setPresence({
            status: "idle",
            activities: [
                {
                    name: "起動中...",
                }
            ]
        })
        console.log(`${client.user.username}としてログイン完了`);
        for (const fileName of fs.readdirSync("./commands")) {
            if (!fileName.endsWith(".js")) continue;
            const { command } = await import(`./commands/${fileName}`);
            commands.push(command);
            commandData.set(command.data.name, command.execute);
        }
        await client.application.commands.set(commands.map(cmd => cmd.data));
        console.log("コマンドの登録に成功");
        try {
            await usabot.init(process.env.BARD_COOKIE);
            console.log("うさぼっとの初期化に成功");
            loaded = true;
        } catch (err) {
            console.warn("うさぼっとの初期化に失敗");
            console.warn(err);
        }
        const context = vm.createContext({
            client,
            Discord,
            setTimeout,
            fetch,
            setInterval,
            Math,
            usabot,
            webhook,
            sch,
            console: {
                async log(...content) {
                    for (const c of content) {
                        const channel = client.channels.cache.get(config.outputChannel);
                        try {
                            await channel.send({
                                embeds: [
                                    new Discord.EmbedBuilder()
                                        .setTitle("LOG")
                                        .setDescription("```js\n" + util.inspect(c) + "```")
                                        .setColor(Discord.Colors.Blue)
                                ]
                            })
                        } catch { }
                    }
                },
                async warn(...content) {
                    for (const c of content) {
                        const channel = client.channels.cache.get(config.outputChannel);
                        try {
                            await channel.send({
                                embeds: [
                                    new Discord.EmbedBuilder()
                                        .setTitle("WARN")
                                        .setDescription("```js\n" + util.inspect(c) + "```")
                                        .setColor(Discord.Colors.Yellow)
                                ]
                            })
                        } catch { }
                    }
                },
                async error(...content) {
                    for (const c of content) {
                        const channel = client.channels.cache.get(config.outputChannel);
                        try {
                            await channel.send({
                                embeds: [
                                    new Discord.EmbedBuilder()
                                        .setTitle("ERROR")
                                        .setDescription("```js\n" + util.inspect(c) + "```")
                                        .setColor(Discord.Colors.Red)
                                ]
                            })
                        } catch { }
                    }
                }
            }
        })
        for (const pluginURL of plugins) {
            try {
                const plugin = await fetch(pluginURL).then(r => r.text());
                try {
                    await vm.runInNewContext(plugin, context)
                } catch (err) {
                    const channel = client.channels.cache.get(config.outputChannel);
                    try {
                        await channel.send({
                            embeds: [
                                new Discord.EmbedBuilder()
                                    .setTitle("ERROR")
                                    .setDescription("```js\n" + util.inspect(c) + "```")
                                    .setColor("ff0000")
                            ]
                        })
                    } catch { }
                    console.warn(err);
                }
            } catch { }
        }
        client.user.setPresence({
            status: "online",
            activities: [
                {
                    name: "英語コミュニケーション",
                }
            ]
        })
    });

    client.on("interactionCreate", async interaction => {
        if (interaction.isCommand()) {
            const execute = commandData.get(interaction.commandName);
            if (execute) {
                try {
                    await execute(interaction, client);
                } catch (e) {
                    console.warn(e);
                }
            }
        }
    });

    const AIchatCache = new Map();
    client.on("messageCreate", async (message) => {
        if (message.author.bot) return;
        if (message.content.includes(`<@${client.user.id}>`) || (message.reference && message.mentions.has(client.user.id))) {
            if (loaded) {
                let responseMessage
                try {
                    let embed = new EmbedBuilder()
                        .setTitle("Generating...")
                        .setImage("https://media.discordapp.net/attachments/1193152456838893568/1202055004257792080/ld.gif?ex=65cc0ff6&is=65b99af6&hm=21261db61a1586a1b3512b435517e4d36434ab428fd7d5560d0db176c7a8adc8&=&width=400&height=100")
                        .setColor("00ffff");
                    responseMessage = await message.channel.send({ embeds: [embed] });
                    const imageURL = message.attachments?.first();
                    const ids = AIchatCache.get(message.reference?.messageId);
                    const res = await usabot.ask(message.content, ids, imageURL);
                    const firstLine = res.content.split("\n")[0]
                    embed = new EmbedBuilder()
                        .setTitle(firstLine)
                        .setDescription(res.content.replace(firstLine, ""))
                        .setColor("00ffff");
                    await responseMessage.edit({ embeds: [embed] });
                } catch (err) {
                    try {
                        responseMessage?.edit({
                            embeds: [
                                new EmbedBuilder()
                                    .setTitle("ERROR")
                                    .setDescription("```js\n" + util.inspect(err) + "```")
                                    .setColor("ff0000")]
                        })
                    } catch { }
                    console.warn(err);
                }
            } else {
                try {
                    await message.channel.send("```うさぼっとは初期化中です```");
                } catch (err) {
                    console.warn(err);
                }
            }
        } else {
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
                        console.warn(err);
                    }
                }
            })
        }
    })

    client.login(process.env.DISCORD_TOKEN);
}

system();