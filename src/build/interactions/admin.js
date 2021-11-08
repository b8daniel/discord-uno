"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const builders_1 = require("@discordjs/builders");
const discord_js_1 = require("discord.js");
const __1 = require("..");
const embeds_1 = require("../embeds");
const interactions_1 = require("../interactions");
class AdminCommand {
    async onAdminCommand(interaction) {
        if (!interaction.memberPermissions.has(discord_js_1.Permissions.FLAGS.ADMINISTRATOR))
            return interaction.reply({ embeds: [embeds_1.ERR_ONLY_AS_ADMIN], ephemeral: true });
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
        
                */
                interaction.reply({ embeds: [embeds_1.BASE_EMB.setDescription(`Updated gamechannel to <#${newChannel.id}>`)], ephemeral: true });
                if (!(newChannel instanceof discord_js_1.TextChannel))
                    return interaction.reply({ embeds: [new discord_js_1.MessageEmbed(embeds_1.ERR_BASE).setFooter("specified channel is not instanceof TextChannel")], ephemeral: true });
                newChannel.send({ embeds: [embeds_1.GAME_CONTROLS], components: embeds_1.GAME_CONTROL_COMPONENTS });
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
    commands() {
        return [
            new builders_1.SlashCommandBuilder().setName("admin").setDescription("Command for admins to configure things.")
                .addSubcommand(cmd => cmd.setName("gamechannel").setDescription("Select the channel where games are played in.")
                .addChannelOption(op => op.setName("gamechannel").setDescription("This channel will be used to play games").addChannelType(0 /* GuildText */).setRequired(true)))
            /*.addSubcommand(cmd => cmd.setName("unoping").setDescription("Select the role to be pinged if someone is looking to play UNO")
              .addRoleOption(op => op.setName("unoping").setDescription("This role will be pinged when someone is lokking for a game").setRequired(true)))
              */
        ];
    }
}
__decorate([
    (0, interactions_1.interactionListener)("admin", "APPLICATION_COMMAND")
], AdminCommand.prototype, "onAdminCommand", null);
__decorate([
    (0, interactions_1.commandStorage)()
], AdminCommand.prototype, "commands", null);
exports.default = AdminCommand;
async function getUnoConfigId(guildId) {
    const guild = await __1.prisma.guild.findFirst({
        where: {
            guildId,
        }
    });
    if (!guild)
        return null;
    else
        return guild.unoConfigId;
}
