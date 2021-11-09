import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";
import { INVITE_EMBED_BOT, INVITE_EMBED_SPONSOR } from "../embeds";
import { commandStorage, interactionListener } from "../interactions";

export default class InviteCommand {
  @interactionListener("invite", "APPLICATION_COMMAND")
  onInviteCommand(interaction: CommandInteraction) {
    interaction.reply({ embeds: [INVITE_EMBED_BOT, INVITE_EMBED_SPONSOR], ephemeral: true });
  }

  @commandStorage()
  commands() {
    return [
      new SlashCommandBuilder().setName("invite").setDescription("Play uno on your server!")
    ];
  }
}