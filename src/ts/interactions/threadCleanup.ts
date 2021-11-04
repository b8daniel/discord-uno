import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction, MessageEmbed } from "discord.js";
import { BASE_EMB } from "../embeds";
import { commandStorage, interactionListener } from "../interactions";

export default class ThreadCleanupCommand {

  @interactionListener("threadcleanup", "APPLICATION_COMMAND")
  onThreadCleanup(interaction: CommandInteraction) {
    interaction.guild.channels.cache.map(channel => {
      if (channel.isThread() && channel.name.startsWith("game-") && channel.archived) {
        channel.delete();
      }
    });
    interaction.reply({ embeds: [new MessageEmbed(BASE_EMB).setDescription("cleaning up the threads? (not workin dont't worry bout it)")], ephemeral: true });
  }

  @commandStorage()
  commands(): SlashCommandBuilder[] {
    return [
      new SlashCommandBuilder().setName("threadcleanup").setDescription("removes archived game threads"),
    ];
  }
}