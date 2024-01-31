client.on("messageCreate", async (message) => {
  if (message.channel.id == "1149227014214131752") {
    if (message.author.id == "282859044593598464") {
      const channel = client.channels.cache.get("1149226575603191818");
      const userId = message.content.replace("<@", "").split(">:")[0];
      const level = message.content.split(":")[1];
      if (channel) {
        const user = client.users.cache.get(userId);
        if (user) {
          try {
            webhook.send(channel, {
              avatarURL: user.avatarURL(),
              username: user.displayName,
              content: `🌟❯❯❯❯**LEVEL UP**[ ${level} ]`,
            });
          } catch (e) {
            logger.error(e);
          }
        }
      }
    }
  }
})