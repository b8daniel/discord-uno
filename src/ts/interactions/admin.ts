import { SlashCommandBuilder } from "@discordjs/builders";
import { ChannelType } from "discord-api-types";
import { CommandInteraction, MessageEmbed, Permissions, TextChannel } from "discord.js";
import {
  BASE_EMB,
  ERR_BASE,
  ERR_ONLY_AS_ADMIN,
  GAME_CONTROLS,
  GAME_CONTROL_COMPONENTS,
} from "../embeds";
import { commandStorage, interactionListener } from "../interactions";
import { lang } from "../lang";

export default class AdminCommand {
  @interactionListener("admin", "APPLICATION_COMMAND")
  async onAdminCommand(interaction: CommandInteraction) {
    if (!interaction.memberPermissions?.has(Permissions.FLAGS.ADMINISTRATOR))
      return interaction.reply({ embeds: [ERR_ONLY_AS_ADMIN], ephemeral: true });

    switch (interaction.options.getSubcommand()) {
      case "gamechannel": {
        const gameChannel = interaction.options.getChannel("gamechannel");
        if (!gameChannel) return interaction.reply({ embeds: [ERR_BASE], ephemeral: true });

        if (!(gameChannel instanceof TextChannel))
          return interaction.reply({
            embeds: [
              new MessageEmbed(ERR_BASE).setDescription(
                "specified channel is not instanceof TextChannel"
              ),
            ],
            ephemeral: true,
          });

        interaction.reply({
          embeds: [BASE_EMB.setDescription(lang.gameChannelUpdate.replace("{0}", gameChannel.id))],
          ephemeral: true,
        });

        gameChannel
          .send({ embeds: [GAME_CONTROLS], components: GAME_CONTROL_COMPONENTS })
          .then(msg => msg.pin())
          .catch(e => {
            interaction.followUp({
              embeds: [new MessageEmbed(ERR_BASE).setFooter(lang.gameControlsSendFail)],
              ephemeral: true,
            });
          });
        break;
      }
    }
  }

  @commandStorage()
  commands() {
    return [
      new SlashCommandBuilder()
        .setName("admin")
        .setDescription(lang.cmdAdminDesc)

        .addSubcommand(cmd =>
          cmd
            .setName("gamechannel")
            .setDescription(lang.cmdAdminGameChannelDesc)
            .addChannelOption(op =>
              op
                .setName("gamechannel")
                .setDescription(lang.cmdAdminGameChannelSelectDesc)
                .addChannelType(ChannelType.GuildText)
                .setRequired(true)
            )
        ),
    ];
  }
}
