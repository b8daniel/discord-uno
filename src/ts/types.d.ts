import { SlashCommandBuilder } from "@discordjs/builders";
import { Interaction, InteractionType } from "discord.js";

export type InteractionListener = {
  name: string,
  accepts: InteractionType[],
  listener: (interaction: Interaction) => void | Promise<void>;
};

export type SlashCommandData = {
  builder: SlashCommandBuilder,
  commandIds: {
    guildId: string,
    id: string,
  }[];
  global: boolean,
};

export type ApplicationCommandResponse = {
  id: string,
  guild_id: string,
  name: string,
};