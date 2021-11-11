import { SlashCommandBuilder } from "@discordjs/builders";
import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v9";
import { Interaction, InteractionType } from "discord.js";
import { clientId, devServerId, token } from "./config";
import { InteractionListener } from "./types";
import { readdir } from "fs/promises";
import * as pathUtils from "path";

const listeners: InteractionListener[] = [];
const commands: SlashCommandBuilder[] = [];

//* COMMANDS
export async function registerCommands(statusMessage: boolean = true) {

  const rest = new REST({ version: '9' }).setToken(token);

  //* GUILD COMMANDS
  /*
  const guilds = getGuildCache();
  if (guilds.length === 0) console.warn("! Couldn't find any guilds from the db in the cache! Are they beeing cached before?");
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
    Routes.applicationGuildCommands(clientId, devServerId) : Routes.applicationCommands(clientId),
    { body: commands.map(cmd => cmd.toJSON()) }
  ).catch(err => {
    console.error("Error with global command registration: \n", err);
  });

  if (statusMessage) console.log(
    "Registered",
    commands.length,
    "commands on all guilds and global commands",
    process.env.NODE_ENV === "DEV" ? "on the dev server" : "globally");
}

//* INTERACTIONS
export async function handleInteraction(interaction: Interaction) {
  switch (interaction.type) {
    case "APPLICATION_COMMAND": {

      if (!interaction.isCommand()) break;

      await Promise.all(
        listeners.filter(i => i.name === interaction.commandName && i.accepts.includes("APPLICATION_COMMAND"))
          .map(async i => await i.listener(interaction))
      );

      break;
    }
    case "MESSAGE_COMPONENT": {

      if (!interaction.isMessageComponent()) break;

      await Promise.all(
        listeners.filter(i => i.name === interaction.customId && i.accepts.includes("MESSAGE_COMPONENT"))
          .map(async i => await i.listener(interaction))
      );

      break;
    }
    case "PING":
    default: {
      console.debug("(i) PING is transferred!");
      break;
    }
  }
}

export async function loadInteractions(folderPath: string = "build/interactions") {
  const fullPath = pathUtils.resolve(folderPath);

  const fileNames = await readdir(fullPath).catch(() => {
    console.error("Error loading interactions from", folderPath, "-", fullPath);
    return [];
  }).then(arr => arr.filter(p => p.endsWith(".js")));

  await Promise.all(
    fileNames.map(async path => {
      const filePath = pathUtils.resolve(folderPath, path);

      try {
        const module = await import(filePath);
        new module.default(); //? no TS! ;[

      } catch (err) {
        console.error("Error while loading class in", filePath);
      }
    })
  );

  console.log("Loaded", commands.length, "command(s) &", listeners.length, "listener(s) from", fileNames.length, "file(s)!");
}

//* DECORATORS
export function interactionListener(interName: string, accepts?: InteractionType): MethodDecorator {
  return (obj, symbol, _descriptor) => {

    listeners.push({
      name: interName,
      accepts: accepts ? [accepts] : ["APPLICATION_COMMAND", "MESSAGE_COMPONENT"],
      listener: obj[symbol],
    });
  };
}

export function commandStorage(debugCommands = false): MethodDecorator {
  return (obj, symbol) => {
    if (debugCommands && process.env.NODE_ENV !== "DEV") return;
    try {
      commands.push(...(obj[symbol]()));
    } catch (error) {
      console.error("A commandStorage isn't set up properly. Is the methods return type `SlashCommandBuilder[]`?");
    }
  };
}
