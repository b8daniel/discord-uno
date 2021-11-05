"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.giveCardsToPlayer = exports.playCard = exports.updateHandCards = exports.updateOverview = exports.endGame = exports.getHandCardsForPlayer = exports.onGameMembersUpdate = exports.isGameThread = exports.createGame = exports.getGameFromThread = exports.getGamefromUser = exports.unoTypeNames = exports.unoColorEmojis = exports.runningGames = void 0;
const discord_js_1 = require("discord.js");
const embeds_1 = require("./embeds");
const images_1 = require("./images");
exports.runningGames = [];
let nextGameId = 0;
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
    [images_1.UnoType.WILD]: "Wild",
    [images_1.UnoType.WILD_DRAW_FOUR]: "Wild Draw 4",
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
            cardsInStack: unoCardStack,
            handCards: {},
            lastPlayedCards: takeRandomCards(1, unoCardStack, getAllUnoCards),
            upNow: 0,
            stats: {},
            playingDirection: 1,
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
                gameObject.gameState.handCards[id] = takeRandomCards(7, gameObject.gameState.cardsInStack, getAllUnoCards);
            }
        });
        const threadMessage = await thread.fetchStarterMessage();
        await threadMessage.edit({ embeds: [generateJoinGameEmbed(gameObject.players, gameObject.creator, 100000000)] });
        // update the game overview
        await updateOverview(thread);
    }
}
exports.onGameMembersUpdate = onGameMembersUpdate;
function generateJoinGameEmbed(playerIds, creator, startTime) {
    return new discord_js_1.MessageEmbed(embeds_1.JOIN_GAME_EMBED)
        .setAuthor("Game started by " + creator)
        .addField("players:", playerIds.length > 0 ? playerIds.map(id => `<@${id}>`).join(", ") : "none", true)
        .addField("start:", startTime === -1 ? "waiting" : `<t:${startTime.toFixed(0)}:R>`, true);
}
function getAllUnoCards() {
    const allCards = [];
    for (let color = 0; color <= 4; color++) {
        for (let type = color !== images_1.UnoColor.BLACK ? 0 : 13; type <= (color !== images_1.UnoColor.BLACK ? 12 : 14); type++) {
            allCards.push({ color, type }, { color, type });
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
async function endGame(threadId) {
    const gameObjectIndex = exports.runningGames.findIndex(gme => gme.threadId === threadId);
    if (!gameObjectIndex)
        return;
    //TODO apply stats
    exports.runningGames.splice(gameObjectIndex, 1);
}
exports.endGame = endGame;
async function updateOverview(thread) {
    const gameObject = exports.runningGames.find(gme => gme.threadId === thread.id);
    if (!gameObject)
        return;
    const overviewFile = new discord_js_1.MessageAttachment((await overviewFromGameData(gameObject, thread.client)).toBuffer("image/png"), "overview.png");
    if (gameObject.overviewMessageId) {
        await thread.messages.fetch(gameObject.overviewMessageId).then(msg => msg.delete());
    }
    const newMessage = await thread.send({ files: [overviewFile], components: embeds_1.INGAME_COMPONENTS });
    gameObject.overviewMessageId = newMessage.id;
}
exports.updateOverview = updateOverview;
//asdasd
async function updateHandCards(interaction) {
    const gameObject = exports.runningGames.find(gme => gme.threadId === interaction.channelId);
    if (!gameObject)
        return;
    //! Uncaught DiscordAPIError: Unknown Message
    // const oldCardDisplayId = gameObject.gameState.cardDisplayIds[interaction.user.id];
    // if (oldCardDisplayId) {
    //   await interaction.channel.messages.fetch(oldCardDisplayId).then(msg => msg.edit({ components: [] }));
    // }
    const cards = getHandCardsForPlayer(interaction.user.id, interaction.channelId);
    cards.sort((a, b) => (a.color - b.color) !== 0 ? a.color - b.color : a.type - b.type);
    const cardsFile = new discord_js_1.MessageAttachment((await (0, images_1.generateCards)(cards)).toBuffer("image/png"), "handcards.png");
    const cardSelector = new discord_js_1.MessageActionRow().addComponents(new discord_js_1.MessageSelectMenu().setCustomId("uno-placecard").setPlaceholder("place a card").addOptions(cards.filter((card, i) => i === cards.findIndex((card1 => card1.type === card.type && card1.color === card.color)))
        .map((card, i) => ({
        label: `${exports.unoColorEmojis[card.color]}: ${exports.unoTypeNames[card.type]}`,
        value: String(i),
    }))));
    gameObject.gameState.cardDisplayIds[interaction.user.id] = (await interaction.editReply({ files: [cardsFile], components: [cardSelector, ...embeds_1.HAND_CARD_COMPONENTS] })).id;
}
exports.updateHandCards = updateHandCards;
//TODO respond to interaction with overview
async function playCard(interaction, cardIndex, cardColor) {
    const gameObject = exports.runningGames.find(gme => gme.threadId === interaction.channelId);
    if (!gameObject || !interaction.channel.isThread())
        return;
    // remove card from hand
    const card = gameObject.gameState.handCards[interaction.user.id].splice(cardIndex, 1)[0];
    card.color = cardColor ?? card.color;
    // add card to last played cards
    gameObject.gameState.lastPlayedCards.push(card);
    if (gameObject.gameState.lastPlayedCards.length > 3)
        gameObject.gameState.lastPlayedCards.shift();
    // set next player
    gameObject.gameState.upNow = (gameObject.gameState.upNow + gameObject.gameState.playingDirection) % gameObject.players.length;
    gameObject.gameState.cardsTaken[interaction.user.id] = 0;
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
