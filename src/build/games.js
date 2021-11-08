"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isPlaying = exports.isAllowedToPlay = exports.giveCardsToPlayer = exports.playCard = exports.updateHandCards = exports.updateOverview = exports.removeGame = exports.getHandCardsForPlayer = exports.onGameMembersUpdate = exports.isGameThread = exports.createGame = exports.getGameFromThread = exports.getGamefromUser = exports.unoTypeNames = exports.unoColorEmojis = exports.runningGames = void 0;
const discord_js_1 = require("discord.js");
const embeds_1 = require("./embeds");
const images_1 = require("./images");
exports.runningGames = [];
let nextGameId = 0;
const startCardCount = 7;
exports.unoColorEmojis = {
    [images_1.UnoColor.RED]: "🟥",
    [images_1.UnoColor.BLUE]: "🟦",
    [images_1.UnoColor.GREEN]: "🟩",
    [images_1.UnoColor.YELLOW]: "🟨",
    [images_1.UnoColor.BLACK]: "⬛",
};
exports.unoTypeNames = {
    [images_1.UnoType.ZERO]: "0",
    [images_1.UnoType.ONE]: "1",
    [images_1.UnoType.TWO]: "2",
    [images_1.UnoType.THREE]: "3",
    [images_1.UnoType.FOUR]: "4",
    [images_1.UnoType.FIVE]: "5",
    [images_1.UnoType.SIX]: "6",
    [images_1.UnoType.SEVEN]: "7",
    [images_1.UnoType.EIGHT]: "8",
    [images_1.UnoType.NINE]: "9",
    [images_1.UnoType.DRAW_TWO]: "Draw 2",
    [images_1.UnoType.REVERSE]: "Reverse",
    [images_1.UnoType.SKIP]: "Skip",
    [images_1.UnoType.WILD_DRAW_FOUR]: "Wild Draw 4",
    [images_1.UnoType.WILD]: "Wild",
};
function getGamefromUser(userId) {
    return exports.runningGames.find(gme => gme.players.includes(userId));
}
exports.getGamefromUser = getGamefromUser;
function getGameFromThread(threadId) {
    return exports.runningGames.find(gme => gme.threadId === threadId);
}
exports.getGameFromThread = getGameFromThread;
async function createGame(creator, channel) {
    const infoMessage = await channel.send({
        embeds: [generateJoinGameEmbed([], creator.username, 0)]
    });
    const newThread = await infoMessage.startThread({
        name: `game-${exports.runningGames.length + 1}`,
        autoArchiveDuration: 60,
        reason: `<@${creator.id}> started a new game!`,
    });
    const unoCardStack = getAllUnoCards();
    const newGameData = {
        gameId: nextGameId++,
        infoMessageId: infoMessage.id,
        overviewMessageId: null,
        creator: creator.username,
        startTime: -1,
        players: [],
        threadId: newThread.id,
        running: false,
        gameState: {
            waitingForUno: false,
            cardsInStack: unoCardStack,
            handCards: {},
            lastPlayedCards: takeRandomCards(1, unoCardStack, getAllUnoCards),
            // //! only for testing
            // [{ color: UnoColor.BLACK, type: UnoType.WILD }],
            upNow: 0,
            stats: {},
            playingDirection: -1,
            cardDisplayIds: {},
            cardsTaken: {},
        }
    };
    exports.runningGames.push(newGameData);
    await newThread.members.add(creator);
}
exports.createGame = createGame;
function isGameThread(threadId) {
    return exports.runningGames.findIndex(gme => gme.threadId === threadId) >= 0;
}
exports.isGameThread = isGameThread;
async function onGameMembersUpdate(thread, newMembers) {
    const gameObject = exports.runningGames.find(gme => gme.threadId === thread.id);
    const memberIds = Array.from(newMembers.keys()).filter(id => id !== thread.guild.me.id);
    // update players on gameObject and embed
    if (!gameObject.running) {
        gameObject.players = memberIds;
        memberIds.forEach(id => {
            if (!gameObject.gameState.handCards[id]) {
                gameObject.gameState.handCards[id] =
                    takeRandomCards(startCardCount, gameObject.gameState.cardsInStack, getAllUnoCards);
                // //! only for testing
                // [{ type: UnoType.WILD, color: UnoColor.BLACK }, { type: UnoType.WILD, color: UnoColor.BLACK }];
            }
        });
        const threadMessage = await thread.fetchStarterMessage();
        await threadMessage.edit({ embeds: [generateJoinGameEmbed(gameObject.players, gameObject.creator, gameObject.startTime)] });
        // update the game overview
        await updateOverview(thread, true);
    }
}
exports.onGameMembersUpdate = onGameMembersUpdate;
function generateJoinGameEmbed(playerIds, creator, startTime) {
    return new discord_js_1.MessageEmbed(embeds_1.JOIN_GAME_EMBED)
        .setAuthor("Game started by " + creator)
        .addField("players:", playerIds.length > 0 ? playerIds.map(id => `<@${id}>`).join(", ") : "none", true)
        .addField("start:", startTime === -1 ? "when the first card is played" : `<t:${Math.round(startTime / 1000)}:R>`, true);
}
function getAllUnoCards() {
    const allCards = [];
    for (let color = 0; color <= 4; color++) {
        for (let type = color !== images_1.UnoColor.BLACK ? 0 : 13; type <= (color !== images_1.UnoColor.BLACK ? 12 : 14); type++) {
            allCards.push({ color, type }, { color, type });
            if (type > 12) {
                allCards.push({ color, type }, { color, type });
            }
        }
    }
    return allCards;
}
function takeRandomCards(count, cards, newStack) {
    if (cards.length === 0)
        cards = newStack();
    const takenCards = [];
    for (let i = 0; i < count; i++) {
        takenCards.push(...cards.splice(Math.round(Math.random() * cards.length) % cards.length, 1)); // get a random card
        if (cards.length === 0)
            cards = newStack();
    }
    return takenCards;
}
async function overviewFromGameData(data, client) {
    return (0, images_1.generateOverview)({
        playedCards: data.gameState.lastPlayedCards,
        players: await Promise.all(data.players.map(async (plId) => ({
            cardsLeft: data.gameState.handCards[plId].length,
            name: (await client.users.fetch(plId)).username
        }))),
        playingDirection: data.gameState.playingDirection,
        upNow: data.gameState.upNow,
    });
}
function getHandCardsForPlayer(playerId, threadId) {
    return exports.runningGames.find(gme => gme.threadId === threadId).gameState.handCards[playerId];
}
exports.getHandCardsForPlayer = getHandCardsForPlayer;
function removeGame(threadId) {
    const gameObjectIndex = exports.runningGames.findIndex(gme => gme.threadId === threadId);
    if (gameObjectIndex === -1)
        return;
    //TODO apply stats
    exports.runningGames.splice(gameObjectIndex, 1);
}
exports.removeGame = removeGame;
async function updateOverview(thread, playerJoined = false) {
    const gameObject = exports.runningGames.find(gme => gme.threadId === thread.id);
    if (!gameObject)
        return;
    if (!gameObject.running && !playerJoined) {
        gameObject.running = true;
        gameObject.startTime = Date.now();
        thread.fetchStarterMessage().then(starterMessage => {
            starterMessage.edit({ embeds: [generateJoinGameEmbed(gameObject.players, gameObject.creator, gameObject.startTime)] });
        });
    }
    const overviewFile = new discord_js_1.MessageAttachment((await overviewFromGameData(gameObject, thread.client)).toBuffer("image/png"), "overview.png");
    if (gameObject.overviewMessageId) {
        await thread.messages.fetch(gameObject.overviewMessageId).then(msg => msg.delete());
    }
    const newMessage = await thread.send({ files: [overviewFile], components: embeds_1.INGAME_COMPONENTS });
    gameObject.overviewMessageId = newMessage.id;
}
exports.updateOverview = updateOverview;
async function updateHandCards(interaction) {
    const gameObject = exports.runningGames.find(gme => gme.threadId === interaction.channelId);
    if (!gameObject)
        return;
    const cards = getHandCardsForPlayer(interaction.user.id, interaction.channelId);
    cards.sort((a, b) => (a.color - b.color) !== 0 ? a.color - b.color : a.type - b.type);
    if (cards.length === 0)
        return;
    const cardsFile = new discord_js_1.MessageAttachment((await (0, images_1.generateCards)(cards)).toBuffer("image/png"), "handcards.png");
    const cardSelector = new discord_js_1.MessageActionRow().addComponents(new discord_js_1.MessageSelectMenu().setCustomId("uno-placecard").setPlaceholder("place a card").addOptions(cards.map((card, i) => {
        if (i !== cards.findIndex(card1 => card1.type === card.type && card1.color === card.color)) {
            return [];
        }
        if (card.color === images_1.UnoColor.BLACK) {
            const colorOptions = [];
            for (let c = 0; c < 4; c++) {
                colorOptions.push({
                    label: `${exports.unoColorEmojis[card.color]}: ${exports.unoTypeNames[card.type]}, choose: ${exports.unoColorEmojis[c]}`,
                    value: `${String(i)}_${c}`
                });
            }
            return colorOptions;
        }
        else {
            return [{
                    label: `${exports.unoColorEmojis[card.color]}: ${exports.unoTypeNames[card.type]}`,
                    value: `${String(i)}_${card.color}`,
                }];
        }
    }).reduce((acc, cur) => acc.concat(cur), [])));
    gameObject.gameState.cardDisplayIds[interaction.user.id] = (await interaction.editReply({ files: [cardsFile], components: [cardSelector, ...embeds_1.HAND_CARD_COMPONENTS] })).id;
}
exports.updateHandCards = updateHandCards;
//TODO respond to interaction with overview
async function playCard(interaction, cardIndex, cardColor) {
    const gameObject = exports.runningGames.find(gme => gme.threadId === interaction.channelId);
    if (!gameObject || !interaction.channel.isThread())
        return;
    // reply within 3 seconds
    await interaction.reply({ content: "your cards:", ephemeral: true });
    // remove card from hand
    const handCards = gameObject.gameState.handCards[interaction.user.id];
    const card = handCards.splice(cardIndex, 1)[0];
    card.color = cardColor ?? card.color;
    // add card to last played cards
    gameObject.gameState.lastPlayedCards.push(card);
    if (gameObject.gameState.lastPlayedCards.length > 3)
        gameObject.gameState.lastPlayedCards.shift();
    gameObject.gameState.cardsTaken[interaction.user.id] = 0;
    // player needs to call uno
    if (handCards.length === 1) {
        await interaction.editReply({ content: "don't forget to call uno when you only have one card left." });
        gameObject.gameState.waitingForUno = true;
        const callCollector = await interaction.message.awaitMessageComponent({ componentType: "BUTTON", filter: c => c.customId === "uno-calluno", time: 10e3 }).catch(() => false);
        if (!callCollector) {
            // player didn't call uno
            handCards.push(...takeRandomCards(2, gameObject.gameState.cardsInStack, getAllUnoCards));
            await interaction.editReply({ content: "you didn't call uno, so you get 2 cards" });
        }
        gameObject.gameState.waitingForUno = false;
    }
    else if (handCards.length === 0) {
        //TODO end game
        await updateOverview(interaction.channel);
        await interaction.editReply("You win!");
        await interaction.followUp({ embeds: [new discord_js_1.MessageEmbed(embeds_1.WIN_EMBED).setAuthor(`congratulations ${interaction.user.username},`)] });
        if (interaction.channel.isThread()) {
            await interaction.channel.setArchived(true);
            exports.runningGames.splice(exports.runningGames.findIndex(gme => gme.threadId === interaction.channelId), 1);
        }
        return;
    }
    // set next player
    if (card.type === images_1.UnoType.REVERSE) {
        gameObject.gameState.playingDirection *= -1;
    }
    gameObject.gameState.upNow = (gameObject.gameState.upNow + gameObject.players.length + gameObject.gameState.playingDirection) % gameObject.players.length;
    const nextPlayerId = gameObject.players[gameObject.gameState.upNow];
    // special effects
    //TODO +2 stacking
    switch (card.type) {
        case images_1.UnoType.SKIP: {
            gameObject.gameState.upNow = (gameObject.gameState.upNow + gameObject.players.length + gameObject.gameState.playingDirection) % gameObject.players.length;
            // 0, 1
            // -1 -> 1
            // -1 + 2 -> 1
            // 0, 1, 2, 3
            // -1 -> 3
            // -1 + 4 -> 3
            break;
        }
        case images_1.UnoType.DRAW_TWO: {
            gameObject.gameState.handCards[nextPlayerId].push(...takeRandomCards(2, gameObject.gameState.cardsInStack, getAllUnoCards));
            await interaction.channel.send({ embeds: [new discord_js_1.MessageEmbed(embeds_1.BASE_EMB).setDescription(`<@${nextPlayerId}> you need to draw 2 cards. Do so by clicking :flower_playing_cards: \`hand cards\`!`)] });
            break;
        }
        case images_1.UnoType.WILD_DRAW_FOUR: {
            gameObject.gameState.handCards[nextPlayerId].push(...takeRandomCards(4, gameObject.gameState.cardsInStack, getAllUnoCards));
            await interaction.channel.send({ embeds: [new discord_js_1.MessageEmbed(embeds_1.BASE_EMB).setDescription(`<@${nextPlayerId}> you need to draw 4 cards. Do so by clicking :flower_playing_cards: \`hand cards\`!`)] });
            break;
        }
    }
    await updateHandCards(interaction);
    await updateOverview(interaction.channel);
}
exports.playCard = playCard;
function giveCardsToPlayer(playerId, thread, count) {
    const gameObject = exports.runningGames.find(gme => gme.threadId === thread.id);
    if (!gameObject)
        return;
    gameObject.gameState.handCards[playerId].push(...takeRandomCards(count, gameObject.gameState.cardsInStack, getAllUnoCards));
    if (!gameObject.gameState.cardsTaken[playerId])
        gameObject.gameState.cardsTaken[playerId] = 0;
    gameObject.gameState.cardsTaken[playerId] += count;
}
exports.giveCardsToPlayer = giveCardsToPlayer;
function isAllowedToPlay(interaction, skipUnoWait = false) {
    // needs to be a thread
    if (!isGameThread(interaction.channelId) || !interaction.channel.isThread())
        return interaction.reply({ embeds: [new discord_js_1.MessageEmbed(embeds_1.ERR_BASE).setFooter("this isn't an active game thread")], ephemeral: true });
    const { gameState, players } = getGameFromThread(interaction.channelId);
    // nedds to be in the game
    if (!players.includes(interaction.user.id))
        return interaction.reply({ embeds: [new discord_js_1.MessageEmbed(embeds_1.ERR_BASE).setFooter("you aren't in this game")], ephemeral: true });
    // needs to be the next player
    if (players[gameState.upNow] !== interaction.user.id)
        return interaction.reply({ embeds: [new discord_js_1.MessageEmbed(embeds_1.ERR_BASE).setDescription("It's not your turn")], ephemeral: true });
    //? needs to have enough cards
    // not waiting for uno
    if (!skipUnoWait && gameState.waitingForUno)
        return interaction.reply({ embeds: [new discord_js_1.MessageEmbed(embeds_1.ERR_BASE).setDescription("You need to call uno")], ephemeral: true });
    // latest card message
    if (gameState.cardDisplayIds[interaction.user.id] !== interaction.message.id)
        return interaction.reply({ embeds: [new discord_js_1.MessageEmbed(embeds_1.ERR_BASE).setFooter("these cards are outdated")], ephemeral: true });
    return true;
}
exports.isAllowedToPlay = isAllowedToPlay;
function isPlaying(userId, channelId) {
    const gameObject = getGameFromThread(channelId);
    if (!gameObject)
        return false;
    return gameObject.players.includes(userId);
}
exports.isPlaying = isPlaying;
