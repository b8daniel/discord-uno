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
const images_1 = require("../images");
const interactions_1 = require("../interactions");
class CanvasCommand {
    onCommand(interaction) {
        switch (interaction.options.getSubcommand()) {
            case "overview": {
                interaction.reply({
                    files: [
                        new discord_js_1.MessageAttachment((0, images_1.generateOverview)({
                            playedCards: [
                                {
                                    type: images_1.UnoType.ONE,
                                    color: images_1.UnoColor.RED
                                },
                                {
                                    type: images_1.UnoType.ONE,
                                    color: images_1.UnoColor.RED
                                },
                                {
                                    type: images_1.UnoType.ONE,
                                    color: images_1.UnoColor.RED
                                },
                            ],
                            players: [
                                {
                                    name: "BlxckDxn1",
                                    cardsLeft: 2,
                                },
                                {
                                    name: "BlxckDxn1",
                                    cardsLeft: 1,
                                },
                                {
                                    name: "BlxckDxn1",
                                    cardsLeft: 99,
                                },
                            ],
                            playingDirection: 1,
                            upNow: 2
                        }).toBuffer(), "overview.png")
                    ]
                });
            }
            case "cards": {
                interaction.reply({
                    files: [
                        new discord_js_1.MessageAttachment((0, images_1.generateCards)([
                            {
                                color: images_1.UnoColor.GREEN,
                                type: images_1.UnoType.REVERSE,
                            }
                        ]).toBuffer(), "cards.png")
                    ]
                });
            }
        }
    }
    commands() {
        return [
            new builders_1.SlashCommandBuilder().setName("canvas").setDescription("test out canvas functionality")
                .addSubcommand(cmd => cmd.setName("overview").setDescription("generate a test overview of a state"))
                .addSubcommand(cmd => cmd.setName("cards").setDescription("gives a test card overview"))
        ];
    }
}
__decorate([
    (0, interactions_1.interactionListener)("canvas", "APPLICATION_COMMAND")
], CanvasCommand.prototype, "onCommand", null);
__decorate([
    (0, interactions_1.commandStorage)()
], CanvasCommand.prototype, "commands", null);
exports.default = CanvasCommand;
