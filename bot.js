import express from "express";
import Discord from "discord.js";

import Usabot from "./util/Usabot.js";
import webhook from "./util/webhook.js";

import util from "util";

import sch from "node-schedule"

import vm from "vm";

import { config } from "./prompts/config.js";

import DiscordDB from "./util/discordDB.js";

import * as dotenv from "dotenv";
dotenv.config();

import fs from "fs";
export async function system() {
    const commands = [];
    const app = express();
    const commandData = new Map();
    let loaded = false;
    const client = new Discord.Client({
        intents: Object.values(Discord.GatewayIntentBits)
    });
    let usabot = new Usabot();
    /**@type {DiscordDB} */
    let db;
    client.once("ready", async () => {
        app.get("/load", async (req, res) => {
            try {
                await client.users.fetch("987876263316295710");
                res.send("Hello, world");
            } catch (err) {
                res.send("reload");
                console.warn(err);
                await client.login(process.env.DISCORD_TOKEN);
            }
        })
        app.listen(process.env.PORT | 3002);
        client.user.setPresence({
            status: "idle",
            activities: [
                {
                    name: "起動中...",
                }
            ]
        })
        db = new DiscordDB(client, "1197044190295625768");
        const developers = await db.get("developers");
        if (!developers) await db.set("developers", []);
        let plugins = await db.get("plugins");
        if (!plugins) {
            await db.set("plugins", []);
            plugins = [];
        }
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
        const status = await db.get("status") ?? "英語コミュニケーション";
        client.user.setPresence({
            status: "online",
            activities: [
                {
                    name: status
                }
            ]
        })
        sch.scheduleJob({
            hour: 6,
            minute: 0,
            second: 0
        }, async () => {
            try {
                const embeds = await createArticle(usabot, db);
                await client.channels.cache.get("1193152456838893568").send({ content: "# USABOTNEWS", embeds })
            } catch (err) {
                console.warn(err);
            }
        })
    });

    client.on("interactionCreate", async interaction => {
        if (interaction.isCommand()) {
            const execute = commandData.get(interaction.commandName);
            if (execute) {
                try {
                    await execute(interaction, client, db, usabot);
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
import { tango } from "./data/tango.js";

export async function createArticle(usabot, db) {
    const embeds = []
    const res_newsAPI = await fetch(`https://newsapi.org/v2/top-headlines?country=jp&apiKey=${process.env.NEWS_API_KEY}`)
        .then(r => r.json());
    for (let i = 1; i <= 8; i++) {
        const articleData = res_newsAPI.articles[i]
        if (articleData) {
            const article = {
                title: articleData.title,
                description: articleData.description,
                url: articleData.url,
                image: articleData.urlToImage,
                publishedAt: articleData.publishedAt,
                author: articleData.author
            }
            const embed = new Discord.EmbedBuilder();
            embed.setTitle(article.title);
            embed.setDescription(article.description)
            embed.setImage(article.image);
            embed.setColor("Blue");
            embed.setURL(article.url)
            if (article.author) embed.setAuthor({
                name: article.author
            });
            embeds.push(embed);
        }
    }
    const res_weather = await fetch("https://weather.tsukumijima.net/api/forecast/city/240010")
        .then(r => r.json());
    const todayWeather = res_weather.forecasts[0];
    const res = await usabot.ask(`
    こちらは今日の津市の天気予報です。まとめてください
    
    天気：${todayWeather.telop ?? "不明"}
    風：${todayWeather.detail.wind ?? "不明"}
    波の高さ：${todayWeather.detail.wave ?? "不明"}
    
    # 気温
    最高気温（摂氏）：${todayWeather.temperature.max.celsius}
    最低気温（摂氏）：${todayWeather.temperature.min.celsius}
    
    # 降水確率
    0時から6時まで：${todayWeather.chanceOfRain.T00_06 == "--%" ? "--" : todayWeather.chanceOfRain.T00_06}
    6時から12時まで：${todayWeather.chanceOfRain.T06_12 == "--%" ? "--" : todayWeather.chanceOfRain.T06_12}
    12時から18時まで：${todayWeather.chanceOfRain.T12_18 == "--%" ? "--" : todayWeather.chanceOfRain.T12_18}
    18時から24時まで：${todayWeather.chanceOfRain.T18_24 == "--%" ? "--" : todayWeather.chanceOfRain.T18_24}
    `)
    const embed = new Discord.EmbedBuilder()
    .setTitle("天気予報")
    .setDescription(res.content)
    .setColor("White");
    switch (todayWeather.telop) {
        case "晴れ":
            embed.setImage("http://flat-icon-design.com/f/f_traffic_7/s256_f_traffic_7_0bg.png")
            break;
        case "曇り":
            embed.setImage("http://flat-icon-design.com/f/f_traffic_4/s512_f_traffic_4_1bg.png")
            break;
        case "雨":
            embed.setImage("http://flat-icon-design.com/f/f_traffic_5/s512_f_traffic_5_0bg.png")
            break;
        
        default:
            break;
    }
    embeds.push(
        embed
    )

    let day = await db.get("day");
    if (!day) {
        day = 1
        await db.set("day", 1);
    }
    const tangoDescription = [
        `システム英単語本冊ではミニマルフレーズとともに暗記できます`
    ];
    for (let i   = (day - 1) * 10; i <= (day - 1) * 10 + 9; i++) {
        const tangoName = Object.keys(tango)[i];
        const tangoMean = tango[tangoName];
        const Bard = (await import("bard-ai")).default
        const bard = new Bard(process.env.BARD_COOKIE);
        const answer = await bard.ask([
            `${tangoName}の英単語を使って英語の3~5語程度の例文を一つだけ生成してください`,
            "レスポンスはJSONで",
            "```json",
            "{",
            '   "english": 英語の3~5語程度の例文,',
            '   "japanese": 上の例文の訳',
            '}',
            "```",
            "のように生成してください"
        ].join("\n"));
        const match = answer.match(/```json\s*({[^`]*})\s*```/);
        tangoDescription.push(`## ${tangoName}: (||${tangoMean}||)`);
        if (match) {
            try {
                const text = JSON.parse(match[1])
                tangoDescription.push(`**${text.english}**: **(||${text.japanese}||)**\n`);
            } catch {}
        }
    }
    embeds.push(new Discord.EmbedBuilder().setTitle("本日の単語（システム英単語より）").setColor("Red").setDescription(tangoDescription.join("\n")))
    await db.set("day", day + 1);
    return embeds
}
