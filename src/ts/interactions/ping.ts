import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";
import { commandStorage, interactionListener } from "../interactions";

export default class PingCommand {

  @interactionListener("ping", "APPLICATION_COMMAND")
  async onPing(interaction: CommandInteraction) {
    await interaction.reply({ content: `Pong :partying_face: (${interaction.client.ws.ping}ms ping)`, ephemeral: true });
  }

  @commandStorage()
  commands() {
    return [
      new SlashCommandBuilder().setName("ping").setDescription("Test out a slash command!")
    ];
  }
}