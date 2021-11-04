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
        const gameThread = await (0, games_1.createGame)(interaction.user, interaction.channel);
        interaction.reply({ embeds: [embeds_1.BASE_EMB.setDescription(`started new game in ${gameThread}`)], ephemeral: true });
    }
    async giveCards(interaction) {
        if (!(0, games_1.isGameThread)(interaction.channelId))
            return interaction.reply({ embeds: [new discord_js_1.MessageEmbed(embeds_1.ERR_BASE).setFooter("this isn't an active game thread")] });
        await interaction.deferReply({ ephemeral: true });
        const cards = (0, games_1.getHandCardsForPlayer)(interaction.user.id, interaction.channelId);
        cards.sort((a, b) => (a.color - b.color) !== 0 ? a.color - b.color : a.type - b.type);
        const cardsFile = new discord_js_1.MessageAttachment((await (0, images_1.generateCards)(cards)).toBuffer("image/png"), "handcards.png");
        const cardSelector = new discord_js_1.MessageActionRow().addComponents(new discord_js_1.MessageSelectMenu().setCustomId("uno-placecard").setPlaceholder("place a card").addOptions(cards.filter((card, i) => i === cards.findIndex((card1 => card1.type === card.type && card1.color === card.color)))
            .map((card, i) => ({
            label: `${unoColorEmojis[card.color]}: ${unoTypeNames[card.type]}`,
            value: String(i),
        }))));
        const cardDisplay = await interaction.editReply({ files: [cardsFile], components: [cardSelector, ...embeds_1.HAND_CARD_COMPONENTS,] });
        (0, games_1.setCardDisplayForPlayer)(interaction.user.id, cardDisplay.id, interaction.channelId);
    }
    async placeCard(interaction) {
        if (!(0, games_1.isGameThread)(interaction.channelId))
            return interaction.reply({ embeds: [new discord_js_1.MessageEmbed(embeds_1.ERR_BASE).setFooter("this isn't an active game thread")], ephemeral: true });
        const gameObject = (0, games_1.getGameFromThread)(interaction.channelId);
        const gameState = gameObject.gameState;
        const cards = gameState.handCards[interaction.user.id];
        const cardIndex = Number(interaction.values.pop());
        const selectedCard = cards[cardIndex];
        const lastPlayedCard = gameState.lastPlayedCards[gameState.lastPlayedCards.length - 1];
        if (gameObject.players[gameState.upNow] === interaction.user.id) {
            if (selectedCard.color === images_1.UnoColor.BLACK || selectedCard.color === lastPlayedCard.color || selectedCard.type === lastPlayedCard.type) {
                // valid card
                if (selectedCard.color !== images_1.UnoColor.BLACK) {
                    // if the card is not a black card, we can play it
                    return await (0, games_1.playCard)(interaction.user.id, interaction.channel, cardIndex);
                }
                else {
                    // if the card is a black card, we need to ask the player what color they want to play it as
                    const colorSelector = new discord_js_1.MessageActionRow().addComponents(new discord_js_1.MessageSelectMenu().setCustomId("uno-wildcolorselector").setPlaceholder("choose a color").addOptions(Object.keys(unoColorEmojis).map((color) => ({
                        label: unoColorEmojis[color],
                        value: `${cardIndex}_${color}`,
                    }))));
                    // block further actions until the user selects a color
                    if (!(interaction.message instanceof discord_js_1.Message))
                        return; // shoud never happen only for typescript
                    await interaction.message.edit({ components: [colorSelector] });
                    return interaction.reply({ embeds: [new discord_js_1.MessageEmbed(embeds_1.BASE_EMB).setDescription("select the color!")], ephemeral: true });
                }
            }
            else {
                // invalid card
                return interaction.reply({ embeds: [new discord_js_1.MessageEmbed(embeds_1.ERR_BASE).setDescription("You can't play this card")] });
            }
        }
        else {
            // not up now
            interaction.reply({ embeds: [new discord_js_1.MessageEmbed(embeds_1.ERR_BASE).setDescription("It's not your turn")], ephemeral: true });
        }
    }
    async selectColor(interaction) {
        interaction.reply({ embeds: [new discord_js_1.MessageEmbed(embeds_1.BASE_EMB).setDescription("select the color!")], ephemeral: true });
    }
    async callUno(interaction) {
        interaction.reply({ embeds: [new discord_js_1.MessageEmbed(embeds_1.BASE_EMB).setDescription("called UNO!")], ephemeral: true });
    }
    async takeCard(interaction) {
        if (!(0, games_1.isGameThread)(interaction.channelId))
            return interaction.reply({ embeds: [new discord_js_1.MessageEmbed(embeds_1.ERR_BASE).setFooter("this isn't an active game thread")], ephemeral: true });
        interaction.
        ;
    }
    async putNoCard(interaction) {
        interaction.reply({ embeds: [new discord_js_1.MessageEmbed(embeds_1.BASE_EMB).setDescription("put no card!")], ephemeral: true });
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
    (0, interactions_1.interactionListener)("uno-wildcolorselector", "MESSAGE_COMPONENT")
], UNOButtons.prototype, "selectColor", null);
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
