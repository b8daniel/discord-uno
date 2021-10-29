"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const builders_1 = require("@discordjs/builders");
const interactions_1 = require("../interactions");
class PingCommand {
    async onPing(interaction) {
        await interaction.reply("Pong :partying_face:");
    }
    commands() {
        return [
            new builders_1.SlashCommandBuilder().setName("ping").setDescription("Test out a slash command!")
        ];
    }
}
__decorate([
    (0, interactions_1.interactionListener)("ping", "APPLICATION_COMMAND")
], PingCommand.prototype, "onPing", null);
__decorate([
    (0, interactions_1.commandStorage)(true)
], PingCommand.prototype, "commands", null);
exports.default = PingCommand;