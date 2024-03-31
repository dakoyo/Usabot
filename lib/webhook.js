
import Discord from "discord.js";

class Webhook {
	#cache = new Map();
	/**
	 * @param {Discord.Channel} channel
	 * @param {string | Discord.WebhookMessageCreateOptions} options 
     * @returns {Promise<Discord.Message>}
	 */
	async send(channel, options) {
		const webhook = await this.#get(channel);
		return await webhook.send(options);
	}
	/**
	 * 
	 * @param {Discord.TextChannel} channel 
	 * @returns {Promise<Discord.Webhook>}
	 */
	async #getAll(channel) {
		const webhooks = await channel.fetchWebhooks();
		const webhook = webhooks?.find((v) => v.token) ?? await channel.createWebhook({name: `webhook`});
		if (webhook) this.#cache.set(channel.id, webhook);
		return webhook;
	}
	/**
	 * 
	 * @param {Discord.Channel} channel
	 * @returns {Promise<Discord.Webhook>}
	 */
	async #get(channel) {
		return this.#cache.get(channel.id) ?? await this.#getAll(channel)
	}
}

export default new Webhook();
