import Discord, { EmbedBuilder, TextChannel } from "discord.js"

import { client } from "../../bot.js";

import { gemini, loadUsabot, usabotChatIds } from "../setup.js";
import { tango } from "../../data/tango.js";
import Logger from "../../util/logger.js";

import schedule from "node-schedule";
import DiscordDB from "../../lib/discordDB.js";
import config from "../../config.js";

const db = new DiscordDB(client)
const logger = new Logger("article");

schedule.scheduleJob("name", {
    hour: 14,
    minute: 55
}, async () => {
    console.log("記事の執筆を開始")
    try {
        await loadUsabot();
        const embeds = await writeArticle();
        //const channel = client.channels.cache.get("1197025456814313513")
        /**@type {TextChannel} */
        const channel = client.channels.cache.get("1102471031081418804");
        const thread = await channel.threads.create({
            name: "うさぼっとNEWS " + new Date().toISOString().slice(0,10) + "号"
        })
        await thread.send({
            content: "# うさぼっとNEWS\n" + new Date().toISOString().slice(0,10) + "号",
            embeds
        })
    } catch (error){
        logger.warn("Failed to write article", error)

    }
})

async function writeArticle() {
    const embeds = []
    await db.init(config.db.settings);
    const res_newsAPI = await fetch(`https://newsapi.org/v2/top-headlines?country=jp&apiKey=${process.env.NEWS_API_KEY}`)
        .then(r => r.json());
    for (let i = 1; i <= 6; i++) {
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
            if (article.title) embed.setTitle(article.title);
            if (article.description) embed.setDescription(article.description)
            if (article.image) embed.setImage(article.image);
            embed.setColor("Blue");
            if (article.url) embed.setURL(article.url)
            if (article.author) embed.setAuthor({
                name: article.author
            });
            embeds.push(embed);
        }
    }
    const res_weather = await fetch("https://weather.tsukumijima.net/api/forecast/city/240010")
        .then(r => r.json());
    const todayWeather = res_weather.forecasts[0];
    const res = await gemini.ask(`
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
    `, {
        ids: usabotChatIds
    })
    const embed = new Discord.EmbedBuilder()
    .setTitle("天気予報")
    .setDescription(res.content ?? "天気予報")
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
        const answer = await gemini.ask([
            `Generate a single 3-5 word example sentence in English using the English word "${tangoName}".`,
            `The response should be written in JSON as `,
            `{"english": "example sentences using the specified words", "japanese": "Japanese translation of the example sentences"}`,
            "No need to write any unnecessary explanations."
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
    embeds.push(new Discord.EmbedBuilder().setTitle("本日の単語（システム英単語より）").setColor("Red").setDescription(tangoDescription.join("\n")));
    const learnedTango = [];
    let count = 0;
    for (const t in tango) {
        if (count > (day - 1) * 10 + 9) continue;
        learnedTango.push(t)
        count++
    }
    const cloneArray = [...learnedTango]

    for (let i = cloneArray.length - 1; i >= 0; i--) {
      let rand = Math.floor(Math.random() * (i + 1))
      let tmpStorage = cloneArray[i]
      cloneArray[i] = cloneArray[rand]
      cloneArray[rand] = tmpStorage
    }
    count = 0;
    const tikaradamesi = [];
    for (const t of cloneArray) {
        if (count > 9) continue;
        const answer = await gemini.ask(([
            `Generate a single 3-5 word example sentence in English using the English word "${t}".`,
            `The response should be written in JSON as `,
            `{"english": "example sentences using the specified words", "japanese": "Japanese translation of the example sentences"}`,
            "No need to write any unnecessary explanations."
        ]).join("\n"));
        const match = answer.match(/```json\s*({[^`]*})\s*```/);
        if (match) {
            try {
                const text = JSON.parse(match[1])
                tikaradamesi.push(`> ### ${text.english} : (||${text.japanese}||)\n`);
            } catch {}
        }
        count++
    }
    embeds.push(new Discord.EmbedBuilder().setTitle("力試し").setDescription("今までの単語から出題しています\n" + tikaradamesi.join("\n")).setColor("Orange"));
    await db.set("day", day + 1);
    const randomTango = learnedTango[Math.floor(Math.random() * learnedTango.length)];
    const longSentence = await gemini.ask(`Generate long English sentences using the word "${randomTango}". Please generate it using English words at a high school level. Please create a new line for each sentence and insert the Japanese translation between each sentence.Please enclose the Japanese translation in ||（Example: ||日本語訳||)`)
    embeds.push(new Discord.EmbedBuilder().setTitle("今日の長文").setDescription(longSentence).setColor("LuminousVividPink"))
    return embeds
}