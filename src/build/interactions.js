"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.commandStorage = exports.interactionListener = exports.loadInteractions = exports.handleInteraction = exports.registerCommands = void 0;
const rest_1 = require("@discordjs/rest");
const v9_1 = require("discord-api-types/v9");
const config_1 = require("./config");
const promises_1 = require("fs/promises");
const pathUtils = require("path");
const guild_1 = require("./guild");
const listeners = [];
const commands = [];
//* COMMANDS
async function registerCommands(statusMessage = true) {
    const rest = new rest_1.REST({ version: '9' }).setToken(config_1.token);
    const guilds = (0, guild_1.getGuildCache)();
    if (guilds.length === 0)
        console.warn("! Couldn't find any guilds from the db in the cache! Are they beeing cached before?");
    /*
    //* GUILD COMMANDS
    await Promise.all(
      guilds.map(async (guild: DBGuild) => {
        console.log(guild.guildId);
        const response = await rest.put(Routes.applicationGuildCommands(clientId, guild.guildId), { body: commands.filter(cmd => !cmd.global).map(cmd => cmd.builder.toJSON()) });
        console.log(response);
        ; (response as ApplicationCommandResponse[]).forEach(cmd => commands.find(cmd1 => cmd1.builder.name === cmd.name).commandIds.push({
          guildId: guild.guildId,
          id: cmd.id
        }));
        console.log(commands);
      })
    ).catch(err => {
      console.error("Error with guild command registration: \n", err);
    });
    */
    //* GLOBAL COMMANDS
    await rest.put(process.env.NODE_ENV === "DEV" ?
        v9_1.Routes.applicationGuildCommands(config_1.clientId, config_1.devServerId) : v9_1.Routes.applicationCommands(config_1.clientId), { body: commands.map(cmd => cmd.toJSON()) }).catch(err => {
        console.error("Error with global command registration: \n", err);
    });
    if (statusMessage)
        console.log("Registered", commands.length, "commands on all guilds and global commands", process.env.NODE_ENV === "DEV" ? "on the dev server" : "globally");
}
exports.registerCommands = registerCommands;
//* INTERACTIONS
async function handleInteraction(interaction) {
    switch (interaction.type) {
        case "APPLICATION_COMMAND": {
            if (!interaction.isCommand())
                break;
            await Promise.all(listeners.filter(i => i.name === interaction.commandName && i.accepts.includes("APPLICATION_COMMAND"))
                .map(async (i) => await i.listener(interaction)));
            break;
        }
        case "MESSAGE_COMPONENT": {
            if (!interaction.isMessageComponent())
                break;
            await Promise.all(listeners.filter(i => i.name === interaction.customId && i.accepts.includes("MESSAGE_COMPONENT"))
                .map(async (i) => await i.listener(interaction)));
            break;
        }
        case "PING":
        default: {
            console.debug("(i) PING is transferred!");
            break;
        }
    }
}
exports.handleInteraction = handleInteraction;
async function loadInteractions(folderPath = "src/build/interactions") {
    const fullPath = pathUtils.resolve(folderPath);
    const fileNames = await (0, promises_1.readdir)(fullPath).catch(() => {
        console.error("Error loading interactions from", folderPath, "-", fullPath);
        return [];
    }).then(arr => arr.filter(p => p.endsWith(".js")));
    await Promise.all(fileNames.map(async (path) => {
        const filePath = pathUtils.resolve(folderPath, path);
        try {
            const module = await Promise.resolve().then(() => require(filePath));
            new module.default(); //? no TS! ;[
        }
        catch (err) {
            console.error("Error while loading class in", filePath);
        }
    }));
    console.log("Loaded", commands.length, "command(s) &", listeners.length, "listener(s) from", fileNames.length, "file(s)!");
}
exports.loadInteractions = loadInteractions;
//* DECORATORS
function interactionListener(interName, accepts) {
    return (obj, symbol, _descriptor) => {
        listeners.push({
            name: interName,
            accepts: accepts ? [accepts] : ["APPLICATION_COMMAND", "MESSAGE_COMPONENT"],
            listener: obj[symbol],
        });
    };
}
exports.interactionListener = interactionListener;
function commandStorage() {
    return (obj, symbol) => {
        try {
            commands.push(...(obj[symbol]()));
        }
        catch (error) {
            console.error("A commandStorage isn't set up properly. Is the methods return type `SlashCommandBuilder[]`?");
        }
    };
}
exports.commandStorage = commandStorage;
