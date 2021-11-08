"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const embeds_1 = require("../embeds");
const games_1 = require("../games");
const images_1 = require("../images");
const interactions_1 = require("../interactions");
class UNOButtons {
    async createNewGame(interaction) {
        const currentlyPlaying = (0, games_1.getGamefromUser)(interaction.user.id);
        if (currentlyPlaying)
            return interaction.reply({ embeds: [embeds_1.BASE_EMB.setDescription(`You are currently playing in <#${currentlyPlaying.threadId}>`)], ephemeral: true });
        if (!(interaction.channel instanceof discord_js_1.TextChannel))
            return interaction.reply({ embeds: [embeds_1.ERR_BASE.setFooter("The game channel should be a text-channel")] });
        await (0, games_1.createGame)(interaction.user, interaction.channel);
        interaction.deferUpdate();
    }
    async giveCards(interaction) {
        if (!(0, games_1.isGameThread)(interaction.channelId) || !interaction.channel.isThread())
            return interaction.reply({ embeds: [new discord_js_1.MessageEmbed(embeds_1.ERR_BASE).setFooter("this isn't an active game thread")], ephemeral: true });
        if (!(0, games_1.isPlaying)(interaction.user.id, interaction.channelId))
            return interaction.reply({ embeds: [new discord_js_1.MessageEmbed(embeds_1.ERR_BASE).setDescription("You are not playing in this game")], ephemeral: true });
        await interaction.reply({ content: "your cards", ephemeral: true });
        await (0, games_1.updateHandCards)(interaction);
    }
    async placeCard(interaction) {
        if (!(await (0, games_1.isAllowedToPlay)(interaction)))
            return;
        const gameObject = (0, games_1.getGameFromThread)(interaction.channelId);
        const gameState = gameObject.gameState;
        const cards = gameState.handCards[interaction.user.id];
        const [cardIndex, color] = interaction.values[0].split("_").map(Number);
        const selectedCard = cards[cardIndex];
        const lastPlayedCard = gameState.lastPlayedCards[gameState.lastPlayedCards.length - 1];
        if (gameObject.players[gameState.upNow] === interaction.user.id) {
            if (selectedCard.color === images_1.UnoColor.BLACK
                || lastPlayedCard.color === images_1.UnoColor.BLACK // only happens if the start card is black, so it's fine
                || selectedCard.color === lastPlayedCard.color
                || selectedCard.type === lastPlayedCard.type) {
                // valid card
                return await (0, games_1.playCard)(interaction, cardIndex, color);
            }
            else {
                // invalid card
                return interaction.reply({ embeds: [new discord_js_1.MessageEmbed(embeds_1.ERR_BASE).setDescription("You can't play this card")], ephemeral: true });
            }
        }
        else {
            // not up now
            interaction.reply({ embeds: [new discord_js_1.MessageEmbed(embeds_1.ERR_BASE).setDescription("It's not your turn")], ephemeral: true });
        }
    }
    // @interactionListener("uno-wildcolorselector", "MESSAGE_COMPONENT")
    // async selectColor(interaction: SelectMenuInteraction) {
    //   interaction.reply({ embeds: [new MessageEmbed(BASE_EMB).setDescription("select the color!")], ephemeral: true });
    // }
    async callUno(interaction) {
        if (!(await (0, games_1.isAllowedToPlay)(interaction, true)))
            return;
        await interaction.reply({ embeds: [new discord_js_1.MessageEmbed(embeds_1.BASE_EMB).setDescription(`<@${interaction.user.id}> called uno!`)] });
        const unoMessage = await interaction.fetchReply();
        if (!(unoMessage instanceof discord_js_1.Message))
            return;
        setTimeout(async () => {
            try {
                await unoMessage.delete();
            }
            catch (e) {
                // thread is archived or deleted
            }
        }, 30e3);
    }
    async takeCard(interaction) {
        if (!(await (0, games_1.isAllowedToPlay)(interaction)) || !interaction.channel.isThread())
            return;
        const gameObject = (0, games_1.getGameFromThread)(interaction.channelId);
        if (gameObject.gameState.cardsTaken[interaction.user.id] > 0)
            return interaction.reply({ embeds: [new discord_js_1.MessageEmbed(embeds_1.ERR_BASE).setDescription("You already took a card")], ephemeral: true });
        (0, games_1.giveCardsToPlayer)(interaction.user.id, interaction.channel, 1);
        await interaction.deferReply({ ephemeral: true });
        await (0, games_1.updateHandCards)(interaction);
        await (0, games_1.updateOverview)(interaction.channel);
    }
    async putNoCard(interaction) {
        if (!(await (0, games_1.isAllowedToPlay)(interaction)) || !interaction.channel.isThread())
            return;
        const gameObject = (0, games_1.getGameFromThread)(interaction.channelId);
        if (gameObject.gameState.cardsTaken[interaction.user.id] > 0) {
            gameObject.gameState.upNow = (gameObject.gameState.upNow + gameObject.players.length + gameObject.gameState.playingDirection) % gameObject.players.length;
            gameObject.gameState.cardsTaken[interaction.user.id] = 0;
            await interaction.deferUpdate();
            await (0, games_1.updateOverview)(interaction.channel); // to show who is next
        }
        else {
            interaction.reply({ embeds: [new discord_js_1.MessageEmbed(embeds_1.ERR_BASE).setDescription("You can't skip if you didn't take a card")], ephemeral: true });
        }
    }
}
__decorate([
    (0, interactions_1.interactionListener)("uno-creategame", "MESSAGE_COMPONENT")
], UNOButtons.prototype, "createNewGame", null);
__decorate([
    (0, interactions_1.interactionListener)("uno-getcards", "MESSAGE_COMPONENT")
], UNOButtons.prototype, "giveCards", null);
__decorate([
    (0, interactions_1.interactionListener)("uno-placecard", "MESSAGE_COMPONENT")
], UNOButtons.prototype, "placeCard", null);
__decorate([
    (0, interactions_1.interactionListener)("uno-calluno", "MESSAGE_COMPONENT")
], UNOButtons.prototype, "callUno", null);
__decorate([
    (0, interactions_1.interactionListener)("uno-takecard", "MESSAGE_COMPONENT")
], UNOButtons.prototype, "takeCard", null);
__decorate([
    (0, interactions_1.interactionListener)("uno-putnocard", "MESSAGE_COMPONENT")
], UNOButtons.prototype, "putNoCard", null);
exports.default = UNOButtons;
