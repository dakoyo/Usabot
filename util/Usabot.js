import fs from "fs";
import Bard from "./geminiAPI.js";
import { config } from "../prompts/config.js";

class UsabotPrompt {
    constructor(name) {
        this.path = `./prompts/${name}.md`;
        this.content = fs.readFileSync(this.path,"utf-8");
    }
    edit(content) {
        fs.writeFileSync(this.path, content);
    }
}

class Usabot {
    prompts = {
        main: new UsabotPrompt("main"),
        info: new UsabotPrompt("info"),
        studentInfo: new UsabotPrompt("studentInfo"),
    }
    /**@type {Bard} */
    #bard
    #usabotIds
    async init(cookie) {
        this.#bard = new Bard(cookie);
        let res = await this.#bard.ask(this.prompts.info.content, {
            format: Bard.JSON
        })
        res = await this.#bard.ask(this.prompts.studentInfo.content, {
            format: Bard.JSON,
            ids: res.ids
        })
        this.#usabotIds = res.ids;
        return true;
    }
    async ask(message, ids, imageURL, name) {
        let imageBuffer;
        if (imageURL) {
            try {
                const res = await fetch(imageURL);
                imageBuffer = await res.arrayBuffer();
            } catch {}
        }
        const res = await this.#bard.ask(this.prompts.main.content.split("{questioner}").join(name) + message.split(`<@1065829601194033262>`).join("うさぼっと"), {
            ids: ids ?? this.#usabotIds,
            image: imageBuffer,
            format: Bard.JSON
        });
        res.content = res.content.split("\n").join("<br>");
        const match = res.content.match(/\{[\s\S]*?\}/)[0];
        console.log(match)
        const responseJSON = JSON.parse(match);
        let answer = responseJSON.content.split("<br>").join("\n");

        for(const word in config.replaceWords) {
            answer = answer.split(word).join(config.replaceWords[word]);
        }
        res.content = answer;
        res.emotions = responseJSON.emotions;
        return res;
    }
}

export default Usabot;
