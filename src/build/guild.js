"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleNewGuild = exports.getGuildCache = exports.cacheGuild = void 0;
const embeds_1 = require("./embeds");
const guildCache = [];
//! only cache guilds the bot is in to make the commands work properly
async function cacheGuild(guild) {
    if (guildCache.find(g => g.guildId === guild.id))
        return;
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
    });
}
exports.cacheGuild = cacheGuild;
function getGuildCache() {
    return guildCache;
}
exports.getGuildCache = getGuildCache;
async function handleNewGuild(guild) {
    await guild.systemChannel.send({ embeds: [embeds_1.ADD_EMBED] });
    guild.fetchOwner();
}
exports.handleNewGuild = handleNewGuild;
