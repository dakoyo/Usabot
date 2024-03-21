import Discord from "discord.js";
import { client } from "../bot.js";
import fs from "fs";
import Gemini from "../lib/gemini/geminiAPI.js";
import Logger from "../util/logger.js";
export const gemini = new Gemini(process.env.BARD_COOKIE);
export let usabotChatIds;

const logger = new Logger("setup");
export const prompts = {
    first: process.env.FIRST_PROMPT.split("<br>").join("\n"),
    second: process.env.SECOND_PROMPT.split("<br>").join("\n"),
    third: process.env.THIRD_PROMPT.split("<br>").join("\n"),

};

export async function loadUsabot() {
    try {
        await gemini.init();
        let res = await gemini.ask(prompts.first, {
            format: Gemini.JSON
        });
        res = await gemini.ask(prompts.second, {
            format: Gemini.JSON,
            ids: res.ids
        });
        usabotChatIds = res.ids;
        logger.log("Successful loading of Usabot.");
    } catch (error) {
        logger.error("Failed to load Usabot.", error);
    }
    
}

(async () => {
    await loadUsabot()    
    for (const f of fs.readdirSync("./bot/functions")) {
        if (f.endsWith(".js")) {
            await import("./functions/" + f);
        }
    }
})();
