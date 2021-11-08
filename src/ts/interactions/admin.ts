import { SlashCommandBuilder } from "@discordjs/builders";
import { ChannelType } from "discord-api-types";
import { CommandInteraction, MessageEmbed, Permissions, TextChannel } from "discord.js";
import { prisma } from "..";
import { ERR_BASE, ERR_ONLY_AS_ADMIN, GAME_CONTROLS, GAME_CONTROL_COMPONENTS } from "../embeds";
import { commandStorage, interactionListener } from "../interactions";

export default class AdminCommand {

  @interactionListener("admin", "APPLICATION_COMMAND")
  async onAdminCommand(interaction: CommandInteraction) {

    if (!interaction.memberPermissions.has(Permissions.FLAGS.ADMINISTRATOR)) return interaction.reply({ embeds: [ERR_ONLY_AS_ADMIN], ephemeral: true });

    switch (interaction.options.getSubcommand()) {
      case "gamechannel": {

        const newChannel = interaction.options.getChannel("gamechannel");
        /*
        const unoConfigId = await getUnoConfigId(interaction.guildId);

        if (!unoConfigId) return interaction.reply({ embeds: [new MessageEmbed(ERR_BASE).setFooter("guild not found in db")], ephemeral: true });

        await prisma.unoConfig.update({
          where: {
            id: unoConfigId,
          },
          data: {
            unoChannelId: newChannel.id
          }
        });

        interaction.reply({ embeds: [BASE_EMB.setDescription(`Updated gamechannel to <#${newChannel.id}>`)], ephemeral: true });
        */
        if (!(newChannel instanceof TextChannel)) return interaction.reply({ embeds: [new MessageEmbed(ERR_BASE).setFooter("specified channel is not instanceof TextChannel")], ephemeral: true });
        newChannel.send({ embeds: [GAME_CONTROLS], components: GAME_CONTROL_COMPONENTS });
        break;
      }
      /*
      case "unoping": {

        const newRole = interaction.options.getRole("unoping");

        const unoConfigId = await getUnoConfigId(interaction.guildId);

        if (!unoConfigId) return interaction.reply({ embeds: [new MessageEmbed(ERR_BASE).setFooter("guild not found in db")], ephemeral: false });

        await prisma.unoConfig.update({
          where: {
            id: unoConfigId,
          },
          data: {
            matchRoleId: newRole.id,
          }
        });

        interaction.reply({ embeds: [new MessageEmbed(BASE_EMB).setDescription(`Updated unoping to <@&${newRole.id}>`)], ephemeral: true });

        break;
      }
      */
    }
  }

  @commandStorage()
  commands() {
    return [
      new SlashCommandBuilder().setName("admin").setDescription("Command for admins to configure things.")

        .addSubcommand(cmd => cmd.setName("gamechannel").setDescription("Select the channel where games are played in.")
          .addChannelOption(op => op.setName("gamechannel").setDescription("This channel will be used to play games").addChannelType(ChannelType.GuildText).setRequired(true)))

      /*.addSubcommand(cmd => cmd.setName("unoping").setDescription("Select the role to be pinged if someone is looking to play UNO")
        .addRoleOption(op => op.setName("unoping").setDescription("This role will be pinged when someone is lokking for a game").setRequired(true)))
        */
    ];
  }

}

async function getUnoConfigId(guildId: string): Promise<number> {
  const guild = await prisma.guild.findFirst({
    where: {
      guildId,
    }
  });
  if (!guild) return null;
  else return guild.unoConfigId;
}