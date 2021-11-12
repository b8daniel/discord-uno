import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";
import { commandStorage, interactionListener } from "../interactions";
import { lang } from "../lang";

export default class PingCommand {

  @interactionListener("ping", "APPLICATION_COMMAND")
  async onPing(interaction: CommandInteraction) {
    await interaction.reply({ content: lang.cmdPingMsg.replace("{0}", interaction.client.ws.ping.toFixed(0)), ephemeral: true });
  }

  @commandStorage()
  commands() {
    return [
      new SlashCommandBuilder().setName("ping").setDescription(lang.cmdPingDesc)
    ];
  }
}