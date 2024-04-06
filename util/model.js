import { Message } from "discord.js";
import Gemini from "../lib/gemini/geminiAPI.js"
import Logger from "./logger.js";
const logger = new Logger("gemini");
import client from "../client.js";

const gemini = new Gemini(process.env.BARD_COOKIE);
gemini.init().catch(error => logger.error(error));

class Model {
    /**
     * @type {Map<string, Model>}
     */
    static models = new Map();
    static chatData = new Map();
    /**@type {string | undefined}*/
    mode
    /**@type {string | undefined} */
    avatarURL
    /**@type {string | undefined} */
    description
    commandOptionName = "model"
    #askCallback = async () => {}
    modelChatIds = {}
    ready = false;
    prompts = [];
    /**@type {Model} */
    static current
    /**
     * 
     * @param {string} name      
     */
    constructor(name) {
        this.name = name;
        return this;
    }

    /**
     * @returns {Model}
     */
    register() {
        Model.models.set(this.commandOptionName, this);
        return this;
    }
    static async change(modelCommandOptionName) {
        const model = Model.models.get(modelCommandOptionName);
        if (!model.ready) await model.load();
        Model.current = model;
        if (client.isReady()) {
            client.user.setActivity(model.mode);
            client.guilds.cache.forEach(async g => {
                const member = await g.members.fetchMe()
                member.setNickname(model.name)
            });
        }
        this.chatData.clear();
    }

    /**
     * 
     * @param {string} description 
     * @returns {Model}
     */
    setDescription(description) {
        this.description = description;
        return this;
    }
    /**
     * 
     * @param {string} commandOptionName 
     * @returns {Model}
     */
    setCommandOptionName(commandOptionName) {
        this.commandOptionName = commandOptionName;
        return this;
    }
    /**
     * 
     * @param {string} mode 
     * @returns {Model}
     */
    setMode(mode) {
        this.mode = mode;
        return this;
    }
    /**
     * 
     * @param {string} avatarURL 
     * @returns {Model}
     */
    setAvatarURL(avatarURL) {
        this.avatarURL = avatarURL;
        return this;
    }
    /**
     * 
     * @param {string} prompt 
     * @returns {Model}
     */
    addPrompt(prompt) {
        this.prompts.push(prompt);
        return this;
    }
    /**
     * 
     * @param  {...string} prompts 
     * @returns {Model}
     */
    addPrompts(...prompts) {
        for (const prompt of prompts) {
            this.prompts.push(prompt)
        }
        return this;
    }
    /**
     * 
     * @param {(event: ModelAskEvent) => Promise<import("../lib/gemini/geminiAPI.js").IAskResponseJSON>} callback 
     */
    onAsk(callback) {
        this.#askCallback = callback;
        return this;
    }
    /**
     * 
     * @param {string} message 
     * @param {string} imageURL 
     * @returns {Promise<import("../lib/gemini/geminiAPI.js").IAskResponseJSON}
     */
    async query(message, imageURL) {
        let imageBuffer;
        try {
            imageBuffer = await fetch(imageURL).then(r => r.arrayBuffer());
        } catch {}
        return await gemini.ask(message, {
            format: "json",
            ids: this.modelChatIds,
            image: imageBuffer
        })
    }
    async load() {
        let chatIds;
        const { prompts } = this;
        if (prompts.length < 1) {
            this.ready = true;
            return;
        }
        async function query(currentIds, index) {
            const res = await gemini.ask(prompts[index], {
                format: "json",
                ids: currentIds
            })
            if (prompts[index + 1]) {
                await query(res.ids, index + 1)
            } else {
                chatIds = res.ids;
            }
        }
        await query(null, 0, this.prompts);
        this.modelChatIds = chatIds;
        this.ready = true;
    }
    /**
     * 
     * @param {string} message 
     * @param {*} ids 
     * @param {string} imageURL 
     * @returns {Promise<import("../lib/gemini/geminiAPI.js").IAskResponseJSON>}
     */
    async ask(message, ids, imageURL) {
        let imageBuffer;
        if (imageURL) {
            try {
                imageBuffer = await fetch(imageURL).then(r => r.arrayBuffer());
            } catch {}
        }
        if (this.#askCallback) {
            return await this.#askCallback(new ModelAskEvent(message, ids, imageBuffer, Model.current));
        }
    }
    /**
     * @returns {Model}
     */
    setCurrent() {
        Model.current = this;
    }
}

class ModelAskEvent {
    /**
     * 
     * @param {Message | string} message 
     * @param {*} ids 
     * @param {Buffer | undefined} imageBuffer 
     * @param {Model} model
     */
    constructor(message, ids, imageBuffer, model) {
        this.message = message;
        this.ids = ids;
        this.imageBuffer = imageBuffer;
        this.model = model;
    }
    gemini = gemini
}

new Model("gemini").onAsk(async ev => {
    const { ids, gemini, message, imageBuffer } = ev;
    const res = await gemini.ask((message instanceof Message) ? message.content : message, {
        format: "json",
        image: imageBuffer,
        ids
    });
    return res;
}).setCurrent()

export default Model;