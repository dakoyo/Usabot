import fs from "fs";
import Bard from "bard-ai";
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
        info: new UsabotPrompt("info")
    }
    /**@type {Bard} */
    #bard
    #usabotIds
    async init(cookie) {
        this.#bard = new Bard(cookie);
        const res = await this.#bard.ask(this.prompts.info.content, {
            format: Bard.JSON
        })
        this.#usabotIds = res.ids;
        return true;
    }
    async ask(message, ids, imageURL) {
        let imageBuffer;
        if (imageURL) {
            try {
                const res = await fetch(imageURL);
                imageBuffer = await res.arrayBuffer();
            } catch {}
        }
        const res = await this.#bard.ask(this.prompts.main.content + message.split(`<@1065829601194033262>`).join("うさぼっと"), {
            ids: ids ?? this.#usabotIds,
            image: imageBuffer,
            format: Bard.JSON
        });
        /**@type {String} */
        let answer = res.content;
        for(const word in config.replaceWords) {
            answer = answer.split(word).join(config.replaceWords[word]);
        }
        answer = answer.split("\n").filter(a => 
            !a.startsWith("![Image") &&
            a !== "うさぼっと"
            
        ).join("\n");
        res.content = answer;
        return res;
    }
}

export default Usabot;
