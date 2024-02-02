import Discord from "discord.js";

class DiscordDB {
    /**
     * 
     * @param {Discord.Client} client
     * @param {string | Discord.TextChannel} emptyChannel 
     */
    constructor(client, emptyChannel) {
        if (client instanceof Discord.Client) {
            this.client = client;
        } else {
            throw new Error("適切なクライアントを指定してください");
        }
        if (typeof emptyChannel == "string") {
            const channel = client.channels.cache.get(emptyChannel);
            if (channel) {
                if (channel.isTextBased()) {
                    this.channel = channel;
                } else {
                    throw new Error("テキストチャンネルを指定してください");
                }
            } else {
                throw new Error("チャンネルが見つかりません");
            }
        } else {
            if (emptyChannel instanceof Discord.TextChannel) {
                this.channel = emptyChannel;
            } else {
                throw new Error("テキストチャンネルを指定してください");
            }
        }
    }
    async #init() {
        const messages = await this.channel.messages.fetch({limit: 1});
        let isjson = false;
        try {
            JSON.parse(messages.first());
            isjson = true;
        } catch {}
        if (!isjson || !messages || messages?.first()?.author.id !== this.client.user.id) {
            this.#cache = {}
            return await this.channel.send("{}");
        }
        return messages.first();
    }
    #cache = {};
    /**
     * 
     * @param {string} key 
     * @param {boolean | number | string} value 
     */
    async set(key, value) {
        const message = await this.#init();
        const json = JSON.parse(message.content);
        json[key] = value;
        await message.edit(JSON.stringify(json, null, 4));
        this.#cache = json;
    }
    async delete(key) {
        const message = await this.#init();
        const json = JSON.parse(message.content);
        delete(json[key]);
        await message.edit(JSON.stringify(json, null, 4));
        this.#cache = json;
    }
    async get(key) {
        if (this.#cache[key]) {
            return this.#cache[key];
        } else {
            const message = await this.#init();
            const json = JSON.parse(message.content);
            return json[key];
        }
    }
}

export default DiscordDB;