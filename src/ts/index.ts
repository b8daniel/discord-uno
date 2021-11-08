// Require the necessary discord.js classes
import { PrismaClient } from '.prisma/client';
import { Client, Guild, Intents, MessageEmbed } from 'discord.js';

import { ownerId, token } from "./config";
import { ERR_BASE } from './embeds';
import { removeGame, isGameThread, onGameMembersUpdate } from './games';
import { cacheGuild } from './guild';

import { handleInteraction, loadInteractions, registerCommands } from './interactions';

export const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MEMBERS] });
export const prisma = new PrismaClient();

client.on("guildCreate", cacheGuild);

client.on("ready", async () => {

  await Promise.all(
    client.guilds.cache.map(async (guild: Guild) => {
      await cacheGuild(guild);
    })
  ).then(() => console.log("🎉cached all guilds"));

  await loadInteractions();
  if (!process.env.SKIP_COMMAND_REGISTRATION) await registerCommands();
  else console.log("skipped registering the commands");

  // 903747567605665833 | 903747567605665834
  // 903747566875852842 | 903747566875852843

});

client.on("interactionCreate", async interaction => {
  await handleInteraction(interaction);
});


client.on("threadMembersUpdate", async (oldMembers, newMembers) => {

  const thread = oldMembers.concat(newMembers).first().thread;
  if (isGameThread(thread.id)) await onGameMembersUpdate(thread, newMembers);

});

// execute a callback when a thread is deleted
client.on("threadDelete", (thread) => {
  if (isGameThread(thread.id)) removeGame(thread.id);
});

client.on("error", error => {
  console.error(error);
  client.users.fetch(ownerId).then(user => user.send({
    embeds: [
      new MessageEmbed(ERR_BASE).setDescription(error.message).setTitle(error.name).setTimestamp().addField("stack trace", error.stack || "unknown")
    ]
  })).catch();
});

client.login(token);

// https://discord.com/api/oauth2/authorize?client_id=902616076196651058&scope=bot%20applications.commands&permissions=534790925376