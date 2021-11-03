"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userChangeInGame = void 0;
const discord_js_1 = require("discord.js");
const embeds_1 = require("../embeds");
const games_1 = require("../games");
const interactions_1 = require("../interactions");
class UNOButtons {
    async createNewGame(interaction) {
        const currentlyPlaying = (0, games_1.getGame)(interaction.user.id);
        if (currentlyPlaying)
            return interaction.reply({ embeds: [embeds_1.BASE_EMB.setDescription(`You are currently playing in <#${currentlyPlaying.threadId}>`)], ephemeral: true });
        if (!(interaction.channel instanceof discord_js_1.TextChannel))
            return interaction.reply({ embeds: [embeds_1.ERR_BASE.setFooter("The game channel should be a text-channel")] });
        const gameThread = await (0, games_1.createGame)(interaction.user, interaction.channel);
        interaction.reply({ embeds: [embeds_1.BASE_EMB.setDescription(`started new game in ${gameThread}`)], ephemeral: true });
    }
    giveCards(interaction) {
        interaction.reply({ content: "your secret cards go here", ephemeral: true });
    }
}
__decorate([
    (0, interactions_1.interactionListener)("uno-creategame", "MESSAGE_COMPONENT")
], UNOButtons.prototype, "createNewGame", null);
__decorate([
    (0, interactions_1.interactionListener)("uno-getcards", "MESSAGE_COMPONENT")
], UNOButtons.prototype, "giveCards", null);
exports.default = UNOButtons;
async function userChangeInGame() { }
exports.userChangeInGame = userChangeInGame;
