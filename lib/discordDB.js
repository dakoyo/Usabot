
import Discord from "discord.js";
class DiscordDB {
    #client;
    #dataMessageId;
    #channelId;
    #cache = new Map();
    #initialized = false;
    size = 0;
    static version = "1.0.0";
    /**
     * Create DB
     * @param {Discord.Client} client 
     * @param {string | undefined} channelId 
     */
    constructor(client, channelId) {
        if (!client instanceof Discord.Client) throw new Error("Please specify the appropriate client");
        if (channelId) {
            if (client.isReady()) {
                this.init(channelId);
            } else {
                client.once("ready", () => {
                    this.init(channelId);
                })
            }
        }
        this.#client = client;
    }
    #getObject(message) {
        let lines = message.embeds[0].description.split("\n");
        lines = lines.slice(1, -1);
        const json = lines.join("\n");
        return JSON.parse(json);
    }
    #createMessageOption(obj) {
        const embed = new Discord.EmbedBuilder();
        embed.setTitle("DiscordDB");
        embed.setDescription("```json\n" + JSON.stringify(obj, null, 2) + "\n```");
        embed.setColor(Discord.Colors.Purple);;
        const buttons = new Discord.ActionRowBuilder();

        const button_edit = new Discord.ButtonBuilder();
        button_edit.setCustomId("discord-db-button-edit");
        button_edit.setStyle(Discord.ButtonStyle.Primary);
        button_edit.setLabel("EDIT");

        const button_delete = new Discord.ButtonBuilder();
        button_delete.setCustomId("discord-db-button-delete");
        button_delete.setStyle(Discord.ButtonStyle.Danger);
        button_delete.setLabel("DELETE");

        buttons.addComponents(button_edit, button_delete);
        return { embeds: [embed], components: [buttons] };
    }
    /**
     * Read database by specifying channelId
     * - Error if client was not ready
     * @param {string} channelId 
     */
    async init(channelId) {
        if (!this.#client.isReady()) throw new Error("Client is not ready");
        if (typeof channelId !== "string") throw new Error("Channel Id must be a string");
        let channel
        try {
            channel = this.#client.channels.cache.get(channelId);
        } catch (error) {
            throw new Error("Channel cannnot be retrieved. Please check if it is a valid client", error);
        }
        let message;
        if (!channel) throw new Error("Channel not found. Please specify a valid channelId");
        try {
            const messages = await channel.messages.fetch({ limit: 100 });
            message = messages.find(message => message?.author?.id == this.#client.user.id && message.embeds[0]?.title == "DiscordDB");
        } catch (error) {
            throw new Error("Cannot read messages. Please check specify a valid channelId", error);
        }
        if (!message) {
            try {
                const sentMessage = await channel.send(this.#createMessageOption({}));
                this.#dataMessageId = sentMessage.id;
            } catch (error) {
                throw new Error("Cannot send the message.", error);
            }
        } else {
            this.#dataMessageId = message.id
        }
        this.#cache = message ? this.#convertMap(this.#getObject(message)) : new Map();
        this.size = this.#cache.size;
        this.#client.on("interactionCreate", async interaction => {
            if (interaction.isButton()) {
                if (interaction?.message?.id == this.#dataMessageId) {
                    if (interaction.customId == "discord-db-button-edit") {
                        const modal = new Discord.ModalBuilder();
                        modal.setCustomId("discord-db-modal-edit");
                        modal.setTitle("EDIT");

                        const keyInput = new Discord.TextInputBuilder();
                        keyInput.setLabel("KEY");
                        keyInput.setCustomId("discord-db-input-key-edit");
                        keyInput.setRequired(true);
                        keyInput.setStyle(Discord.TextInputStyle.Short);

                        const valueInput = new Discord.TextInputBuilder();
                        valueInput.setLabel("VALUE");
                        valueInput.setCustomId("discord-db-input-value-edit");
                        valueInput.setRequired(true);
                        valueInput.setStyle(Discord.TextInputStyle.Paragraph);

                        const firstActionRow = new Discord.ActionRowBuilder();
                        firstActionRow.addComponents(keyInput);

                        const secondActionRow = new Discord.ActionRowBuilder();
                        secondActionRow.addComponents(valueInput);

                        modal.addComponents(firstActionRow, secondActionRow);
                        await interaction.showModal(modal);
                    } else if (interaction.customId == "discord-db-button-delete") {
                        const modal = new Discord.ModalBuilder();
                        modal.setCustomId("discord-db-modal-delete");
                        modal.setTitle("DELETE");

                        const keyInput = new Discord.TextInputBuilder();
                        keyInput.setLabel("KEY");
                        keyInput.setCustomId("discord-db-input-key-delete");
                        keyInput.setRequired(true);
                        keyInput.setStyle(Discord.TextInputStyle.Short);

                        const ActionRow = new Discord.ActionRowBuilder();
                        ActionRow.addComponents(keyInput);

                        modal.addComponents(ActionRow);

                        await interaction.showModal(modal);
                    }
                }
            }
            if (interaction.isModalSubmit()) {
                if (interaction.customId == "discord-db-modal-edit") {
                    const key = interaction.fields.getTextInputValue("discord-db-input-key-edit");
                    const value = interaction.fields.getTextInputValue("discord-db-input-value-edit");
                    this.#cache.set(key, value);
                    this.#editData(this.#convertObject(this.#cache));

                    await interaction.reply({ ephemeral: true, content: `Changes reflected ✓` });
                } else if (interaction.customId == "discord-db-modal-delete") {
                    const key = interaction.fields.getTextInputValue("discord-db-input-key-delete");

                    this.#cache.delete(key);
                    this.#editData(this.#convertObject(this.#cache));
                    await interaction.reply({ ephemeral: true, content: `Changes reflected ✓` });
                }
            }
        })
        this.#channelId = channelId;
        this.#initialized = true;
        return true;
    }
    
    /**
     * Obtains the value corresponding to the specified key
     * @param {string} key 
     * @returns {*}
     */
    get(key) {
        if (!this.#client.isReady()) throw new Error("Client is not ready");
        if (!this.#initialized) throw new Error("DiscordDB is not initialized");
        return this.#cache.get(key);
    }
    /**
     * This function is not async function
     * @param {string} key 
     * @param {*} value 
     * @returns {Promise<DiscordDB>}
     */
    async set(key, value) {
        if (!this.#client.isReady()) throw new Error("Client is not ready");
        if (!this.#initialized) throw new Error("DiscordDB is not initialized");
        if (typeof key !== "string") throw new Error("Key must be a string");
        this.#cache.set(key, value);
        await this.#editData(this.#convertObject(this.#cache));
        return this;
    }
    /**
     * Deletes the specified key and its corresponding value
     * @param {*} key 
     * @returns {boolean}
     */
    async delete(key) {
        if (!this.#client.isReady()) throw new Error("Client is not ready");
        if (!this.#initialized) throw new Error("DiscordDB is not initialized");
        if (typeof key !== "string") throw new Error("Key must be a string");
        const has = this.has(key);
        this.#cache.delete(key);
        await this.#editData(this.#convertObject(this.#cache));
        return has;
    }
    /**
     * Delete all keys and values
     * @returns {Promise<Map>}
     */
    async clear() {
        if (!this.#client.isReady()) throw new Error("Client is not ready");
        if (!this.#initialized) throw new Error("DiscordDB is not initialized");
        this.#cache.clear();
        await this.#editData(this.#convertObject(this.#cache));
        return this.#cache;
    }
    /**
     * Returns a boolean value whether the key has a value or not
     * @param {string} key
     * @returns {boolean} 
     */
    has(key) {
        if (!this.#client.isReady()) throw new Error("Client is not ready");
        if (!this.#initialized) throw new Error("DiscordDB is not initialized");
        return this.#cache.has(key);
    }
    /**
     * Get all keys with IterableIterator
     * @returns {IterableIterator<string>}
     */
    keys() {
        if (!this.#client.isReady()) throw new Error("Client is not ready");
        if (!this.#initialized) throw new Error("DiscordDB is not initialized");
        return this.#cache.keys();
    }
    /**
     * Executes a provided function once per each key/value pair in the Map, in insertion order.
     * @param {(value: any, key: string, map: Map<string, any>, thisArg?: any)} callbackfn 
     */
    forEach(callbackfn) {
        if (!this.#client.isReady()) throw new Error("Client is not ready");
        if (!this.#initialized) throw new Error("DiscordDB is not initialized");
        return this.#cache.forEach(callbackfn);
    }
    /**
     * Returns an iterable of key, value pairs for every entry in the map.
     * @returns {IterableIterator<[string, any]>}
     */
    entries() {
        if (!this.#client.isReady()) throw new Error("Client is not ready");
        if (!this.#initialized) throw new Error("DiscordDB is not initialized");
        return this.#cache.entries();
    }
    /**
     * Returns an iterable of values in the map
     * @returns {IterableIterator<any>}
     */
    values() {
        return this.#cache.values()
    }

    /**
     * Returns a boolean value indicating whether it has been initialized or not.
     * @returns {boolean}
     */
    isInitialized() {
        return this.#initialized;
    }


    async #getMessage() {
        try {
            return this.#client.channels.cache.get(this.#channelId).messages.fetch(this.#dataMessageId);
        } catch (error) {
            throw new Error("Could not retrieve the message", error);
        }
    }
    async #editData(obj) {
        const message = await this.#getMessage()
        await message.edit(this.#createMessageOption(obj));
        this.#cache = this.#convertMap(obj);
        this.size = this.#cache.size;
    }
    #convertMap(obj) {
        const map = new Map();
        Object.keys(obj).forEach(key => {
            map.set(key, obj[key]);
        });
        return map;
    }
    /**
     * @param {Map<string, any>} map
     * @returns {Object}
     */
    #convertObject(map) {
        const obj = {};
        map.forEach((value, key) => {
            obj[key] = value;
        });
        return obj;
    }
}

export default DiscordDB
