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
const embeds_1 = require("../embeds");
const interactions_1 = require("../interactions");
class ThreadCleanupCommand {
    onThreadCleanup(interaction) {
        interaction.guild.channels.cache.map(channel => {
            if (channel.isThread() && channel.name.startsWith("game-") && channel.archived) {
                channel.delete();
            }
        });
        interaction.reply({ embeds: [new discord_js_1.MessageEmbed(embeds_1.BASE_EMB).setDescription("cleaning up the threads? (not workin dont't worry bout it)")], ephemeral: true });
    }
    commands() {
        return [
            new builders_1.SlashCommandBuilder().setName("threadcleanup").setDescription("removes archived game threads"),
        ];
    }
}
__decorate([
    (0, interactions_1.interactionListener)("threadcleanup", "APPLICATION_COMMAND")
], ThreadCleanupCommand.prototype, "onThreadCleanup", null);
__decorate([
    (0, interactions_1.commandStorage)(true)
], ThreadCleanupCommand.prototype, "commands", null);
exports.default = ThreadCleanupCommand;
