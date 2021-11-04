"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.giveCardsToPlayer = exports.takeCard = exports.playCard = exports.updateHandCards = exports.updateOverview = exports.getCardDisplayForPlayer = exports.setCardDisplayForPlayer = exports.endGame = exports.getHandCardsForPlayer = exports.onGameMembersUpdate = exports.isGameThread = exports.createGame = exports.getGameFromThread = exports.getGamefromUser = exports.runningGames = void 0;
const discord_js_1 = require("discord.js");
const embeds_1 = require("./embeds");
const images_1 = require("./images");
exports.runningGames = [];
let nextGameId = 0;
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
    await newThread.members.add(creator);
    const unoCardStack = getAllUnoCards();
    const handCards = takeRandomCards(7, unoCardStack, getAllUnoCards);
    const newGameData = {
        gameId: nextGameId++,
        infoMessageId: infoMessage.id,
        overviewMessageId: "",
        creator: creator.username,
        startTime: -1,
        players: [
            creator.id
        ],
        threadId: newThread.id,
        running: false,
        gameState: {
            cardsInStack: unoCardStack,
            handCards: {
                [creator.id]: handCards,
            },
            lastPlayedCards: takeRandomCards(1, unoCardStack, getAllUnoCards),
            upNow: 0,
            stats: {},
            playingDirection: 1,
            cardDisplayIds: {},
        }
    };
    exports.runningGames.push(newGameData);
    const overviewFile = new discord_js_1.MessageAttachment((await overviewFromGameData(newGameData, channel.client)).toBuffer("image/png"), "overview.png");
    const overviewMessage = await newThread.send({ files: [overviewFile], components: embeds_1.INGAME_COMPONENTS });
    newGameData.overviewMessageId = overviewMessage.id;
    return newThread;
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
    }
    // update the game overview
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
function overviewFromGameData(data, client) {
    return (0, images_1.generateOverview)({
        playedCards: data.gameState.lastPlayedCards,
        players: data.players.map(plId => ({
            cardsLeft: data.gameState.handCards[plId].length,
            name: client.users.cache.find(usr => usr.id === plId).username
        })),
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
function setCardDisplayForPlayer(playerId, cardDisplayId, threadId) {
    const gameObject = exports.runningGames.find(gme => gme.threadId === threadId);
    if (!gameObject)
        return;
    gameObject.gameState.cardDisplayIds[playerId] = cardDisplayId;
}
exports.setCardDisplayForPlayer = setCardDisplayForPlayer;
function getCardDisplayForPlayer(playerId, threadId) {
    const gameObject = exports.runningGames.find(gme => gme.threadId === threadId);
    if (!gameObject)
        return;
    return gameObject.gameState.cardDisplayIds[playerId];
}
exports.getCardDisplayForPlayer = getCardDisplayForPlayer;
async function updateOverview(thread) {
    const gameObject = exports.runningGames.find(gme => gme.threadId === thread.id);
    if (!gameObject)
        return;
    const overviewFile = new discord_js_1.MessageAttachment((await overviewFromGameData(gameObject, thread.client)).toBuffer("image/png"), "overview.png");
    await thread.messages.fetch(gameObject.overviewMessageId).then(msg => msg.edit({ files: [overviewFile], components: embeds_1.INGAME_COMPONENTS }));
}
exports.updateOverview = updateOverview;
async function updateHandCards(playerId, thread) {
    const gameObject = exports.runningGames.find(gme => gme.threadId === thread.id);
    if (!gameObject)
        return;
    const cards = getHandCardsForPlayer(playerId, thread.id);
    cards.sort((a, b) => (a.color - b.color) !== 0 ? a.color - b.color : a.type - b.type);
    const cardFile = new discord_js_1.MessageAttachment((await getHandCardsForPlayer(playerId, gameObject)).toBuffer("image/png"), "handCards.png");
    await thread.messages.fetch(gameObject.gameState.cardDisplayIds[playerId]).then(msg => msg.edit({ files: [cardFile], components: [embeds_1.HAND_CARD_COMPONENTS] }));
}
exports.updateHandCards = updateHandCards;
async function playCard(playerId, thread, cardIndex, cardColor) {
    const gameObject = exports.runningGames.find(gme => gme.threadId === thread.id);
    if (!gameObject)
        return;
    // remove card from hand
    const card = gameObject.gameState.handCards[playerId].splice(cardIndex, 1)[0];
    card.color = cardColor ?? card.color;
    // add card to last played cards
    gameObject.gameState.lastPlayedCards.push(card);
    if (gameObject.gameState.lastPlayedCards.length > 3)
        gameObject.gameState.lastPlayedCards.shift();
    // set next player
    gameObject.gameState.upNow = (gameObject.gameState.upNow + gameObject.gameState.playingDirection) % gameObject.players.length;
    await updateOverview(thread);
}
exports.playCard = playCard;
async function takeCard(playerId, thread) {
    const gameObject = exports.runningGames.find(gme => gme.threadId === thread.id);
    if (!gameObject)
        return;
    const takenCards = takeRandomCards(1, gameObject.gameState.cardsInStack, getAllUnoCards);
    gameObject.gameState.handCards[playerId].push(...takenCards);
    // await updateOverview(thread);
}
exports.takeCard = takeCard;
async function giveCardsToPlayer(playerId, thread, count) {
    const gameObject = exports.runningGames.find(gme => gme.threadId === thread.id);
    if (!gameObject)
        return;
    gameObject.gameState.handCards[playerId].push(...takeRandomCards(count, gameObject.gameState.cardsInStack, getAllUnoCards));
}
exports.giveCardsToPlayer = giveCardsToPlayer;
