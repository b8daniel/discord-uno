import { Guild } from "discord.js";
import { Guild as DBGuild } from ".prisma/client";
import { ADD_EMBED } from "./embeds";

const guildCache: DBGuild[] = [];

//! only cache guilds the bot is in to make the commands work properly
export async function cacheGuild(guild: Guild) {
  if (guildCache.find(g => g.guildId === guild.id)) return;

  //* The database is not neccesary
  /* 
  let prismaGuild = await prisma.guild.findUnique({
    where: {
      guildId: guild.id
    }
  });

  if (!prismaGuild) {
    prismaGuild = await prisma.guild.create({
      data: {
        guildId: guild.id,
        unoConfig: {
          create: {}
        }
      }
    });
  }
  */

  guildCache.push({
    guildId: guild.id,
    unoConfigId: -1,
  });
}

export function getGuildCache(): readonly DBGuild[] {
  return guildCache;
}

export async function handleNewGuild(guild: Guild) {
  await guild.systemChannel.send({ embeds: [ADD_EMBED] });
  guild.fetchOwner();
}