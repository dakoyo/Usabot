import util from "util";
import { client } from "../bot.js";
import config from "../config.js";
import Discord from "discord.js";
class Logger {
    /**
     * 
     * @param {string} name 
     */
    constructor(name) {
        this.name = name;
    }
    colors = {
        black: '\u001b[30m',
        red: '\u001b[31m',
        green: '\u001b[32m',
        yellow: '\u001b[33m',
        blue: '\u001b[34m',
        magenta: '\u001b[35m',
        cyan: '\u001b[36m',
        white: '\u001b[37m',
        reset: '\u001b[0m',
    }
    /**
     * 
     * @param {any} content 
     * @param {string} name 
     * @param {string} colorName 
     */
    #main(content, name, colorName) {
        const e = typeof content == "string" ? content : util.inspect(content);
        console.log(`${this.name}${this.colors[colorName]}[${name}]${this.colors.reset}${e}`)
        client.channels.cache.get(config.logChannelId).send({
            embeds: [
                new Discord.EmbedBuilder()
                    .setTitle(name)
                    .setColor(colorName.charAt(0).toUpperCase() + colorName.slice(1).toLowerCase())
                    .setDescription("```js\n" + e + "```")
            ]
        });
    }
    log(...content) {
        for (const c of content) {
            this.#main(c, "LOG", "blue");
        }
    }
    error(...content) {
        for (const c of content) {
            this.#main(c, "ERROR", "red");
        }
    }
    warn(...content) {
        for (const c of content) {
            this.#main(c, "WARN", "yellow");
        }
    }
}

export default Logger;