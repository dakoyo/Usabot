import { Message } from "discord.js";
import Model from "./util/model.js";
import client from "./client.js";

import fs from "fs";
import config from "./config.js";

function getPrompt(promptName) {
    return fs.readFileSync("./bot/prompts/" + promptName + ".md", "utf-8");
}

/**---------------------------うさぼっと2---------------------------- */
const usabotReplaceWords = {
    "はい。": "はーーい！",
    "です。": "でーす！",
    "ます。": "まーす！",
    "私": "僕",
}

const usabot_stu = new Model("うさぼっと2")
    .setMode("STU")
    .setCommandOptionName("usabot2_stu")
    .setAvatarURL("https://ul.h3z.jp/d0wew77m.png")
    .setDescription("生徒の名称、どんな人物かを理解し文章生成するモデル。")
    .addPrompts(
        getPrompt("usabot-conversation-ex-notjson"),
        getPrompt("studentInfo")
    )
    .onAsk(async ev => {
        const { ids, imageBuffer, message, gemini, model } = ev;
        const chatIds = model.modelChatIds;
        const mainPrompt = getPrompt("usabot-stu-main").replace(/{questioner}/g, (message instanceof Message) ? (config.users[message.author.id] ?? "生徒") : "システム");
        const mentionRegExp = new RegExp(`<@${client.user.id}>`,"g");
        const question = mainPrompt + ((message instanceof Message) ? message.content.replace(mentionRegExp, "うさぼっと ") : message);
        const res = await gemini.ask(question, {
            format: "json",
            image: imageBuffer,
            ids: ids ?? chatIds
        })
        for (const word in usabotReplaceWords) {
            const regexp = new RegExp(word, "g");
            res.content = res.content.replace(regexp, usabotReplaceWords[word]);
        }
        return res;
    })
    .register();


const usabot_strict = new Model("うさぼっと3")
    .setMode("英語コミュニケーション")
    .setCommandOptionName("usabot3")
    .setDescription("厳密なうさぼっとのモデル。推論能力が高い。")
    .setAvatarURL("https://ul.h3z.jp/6qItSD8f.png")
    .addPrompts(
        getPrompt("usabot-conversation-ex-notjson"),
    )
    .onAsk(async ev => {
        const { ids, gemini, imageBuffer, message, model } = ev;
        const question = (message instanceof Message) ? message.content : message;
        const res = await gemini.ask(getPrompt("usabot-strict-main") + question, {
            format: "json",
            image: imageBuffer,
            ids: ids ?? model.modelChatIds
        })
        for (const word in usabotReplaceWords) {
            const regexp = new RegExp(word, "g");
            res.content = res.content.replace(regexp, usabotReplaceWords[word]);
        }
        return res;
    })
    .register()
    .setCurrent()

/**---------------------------ずんだもん---------------------------- */
const zunda_replaceWords ={
    "よろしくね！": "よろしくなのだ！",
    "だよ！": "なのだ！",
    "しようね！": "しようなのだ！",
}
new Model("ずんだもん")
.setAvatarURL("http://hijicho.com/wp-content/uploads/073ef612bb10be873f6bea99e854a7a3-260x280.png")
.setCommandOptionName("zundamon")
.setDescription("ずんだアローに変身できそうなずんだ餅の妖精っぽいモデル\n")
.setMode("もちもちずんだ")
.addPrompts(getPrompt("zundamon-Info"))
.onAsk(async ev => {
    const { ids, gemini, imageBuffer, model, message} = ev;
    const question = getPrompt("zundamon-main") + ((message instanceof Message) ? message.content : message);
    const res = await gemini.ask(question, {
        format: "json",
        image: imageBuffer,
        ids: ids ?? model.modelChatIds
    })
    if (res.content.startsWith("「") && res.content.endsWith("」")) {
        res.content = res.content.slice(1).slice(0,-1);
    }
    for (const word in zunda_replaceWords) {
        const regexp = new RegExp(word, "g");
        res.content = res.content.replace(regexp, zunda_replaceWords[word]);
    }
    return res;
})
.register();

/**---------------------------にしぼっと---------------------------- */
new Model("にしぼっと")
.setAvatarURL("https://ul.h3z.jp/Eb0Id061.png")
.setCommandOptionName("nishibot")
.setDescription("Lizzakからの某塚の印象を元に人格を形成したモデル。\n某塚に関する情報が不十分のため、十分な回答が得られない可能性がある")
.setMode("英語コミュニケーション")
.addPrompt(getPrompt("nishibot-info"))
.onAsk(async ev => {
    const { ids, gemini, imageBuffer, model, message} = ev;
    const question = getPrompt("nishibot-main") + ((message instanceof Message) ? message.content : message);
    const res = await gemini.ask(question, {
        format: "json",
        image: imageBuffer,
        ids: ids ?? model.modelChatIds
    })
    if (res.content.startsWith("「") && res.content.endsWith("」")) {
        res.content = res.content.slice(1).slice(0,-1);
    }
    return res;
})
.register();

import("./client.js");