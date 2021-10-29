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
class Tutorial {
    onTutorialCommand(interaction) {
        const row = new discord_js_1.MessageActionRow()
            .addComponents(new discord_js_1.MessageButton()
            .setCustomId("tutorial-yes")
            .setLabel(randomItem(positiveWords))
            .setStyle("PRIMARY")
            .setEmoji(randomItem(positiveEmojis)));
        interaction.reply({ embeds: [embeds_1.TUTORIAL_EMBED], ephemeral: true, components: [row] });
    }
    onButtonInteract(interaction) {
        interaction.reply({ content: `${randomItem(positiveWords).toLocaleUpperCase()}! ${randomItem(positiveEmojis)}`, ephemeral: true });
    }
    commands() {
        return [
            new builders_1.SlashCommandBuilder().setName("tutorial").setDescription("This command will to get started with the bot!")
        ];
    }
}
__decorate([
    (0, interactions_1.interactionListener)("tutorial", "APPLICATION_COMMAND")
], Tutorial.prototype, "onTutorialCommand", null);
__decorate([
    (0, interactions_1.interactionListener)("tutorial-yes", "MESSAGE_COMPONENT")
], Tutorial.prototype, "onButtonInteract", null);
__decorate([
    (0, interactions_1.commandStorage)()
], Tutorial.prototype, "commands", null);
exports.default = Tutorial;
const positiveWords = [
    "amazing",
    "awesome",
    "blithesome",
    "excellent",
    "fabulous",
    "favorable",
    "fortuitous",
    "gorgeous",
    "incredible",
    "unique",
    "mirthful",
    "outstanding",
    "perfect",
    "philosophical",
    "propitious",
    "remarkable",
    "rousing",
    "spectacular",
    "splendid",
    "stellar",
    "stupendous",
    "super",
    "upbeat",
    "stunning",
    "wondrous",
];
const positiveEmojis = ["🥳", "👍", "👏", "🎈", "🎁", "👑", "💡", "💯", "🌟", "⭐", "✨", "🤩"];
function randomItem(list) {
    return list[Math.round(Math.random() * list.length) % list.length];
}
