// Require the necessary discord.js classes
import { PrismaClient } from '.prisma/client';
import { Client, Guild, Intents } from 'discord.js';

import { token } from "./config";
import { cacheGuild } from './guild';

import { handleInteraction, loadInteractions, registerCommands } from './interactions';

export const client = new Client({ intents: [Intents.FLAGS.GUILDS] });
export const prisma = new PrismaClient();

client.on("guildCreate", cacheGuild);

client.on("ready", async () => {

  await Promise.all(
    client.guilds.cache.map(async (guild: Guild) => {
      await cacheGuild(guild);
    })
  ).then(() => console.log("🎉cached all guilds from the db "));

  await loadInteractions();
  await registerCommands();

  // 903747567605665833 | 903747567605665834
  // 903747566875852842 | 903747566875852843

});

client.on("interactionCreate", async interaction => {
  await handleInteraction(interaction);
});

client.login(token);

// https://discord.com/api/oauth2/authorize?client_id=902616076196651058&scope=bot%20applications.commands&permissions=534790925376