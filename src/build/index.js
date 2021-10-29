"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = exports.client = void 0;
// Require the necessary discord.js classes
const client_1 = require(".prisma/client");
const discord_js_1 = require("discord.js");
const config_1 = require("./config");
const guild_1 = require("./guild");
const interactions_1 = require("./interactions");
exports.client = new discord_js_1.Client({ intents: [discord_js_1.Intents.FLAGS.GUILDS] });
exports.prisma = new client_1.PrismaClient();
exports.client.on("guildCreate", guild_1.cacheGuild);
exports.client.on("ready", async () => {
    await Promise.all(exports.client.guilds.cache.map(async (guild) => {
        await (0, guild_1.cacheGuild)(guild);
    })).then(() => console.log("🎉cached all guilds from the db "));
    await (0, interactions_1.loadInteractions)();
    await (0, interactions_1.registerCommands)();
    // 903747567605665833 | 903747567605665834
    // 903747566875852842 | 903747566875852843
});
exports.client.on("interactionCreate", async (interaction) => {
    await (0, interactions_1.handleInteraction)(interaction);
});
exports.client.login(config_1.token);
// https://discord.com/api/oauth2/authorize?client_id=902616076196651058&scope=bot%20applications.commands&permissions=534790925376
