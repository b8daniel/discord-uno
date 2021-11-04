"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHandCardsForPlayer = exports.onGameMembersUpdate = exports.isGameThread = exports.createGame = exports.getGamefromUser = exports.runningGames = void 0;
const discord_js_1 = require("discord.js");
const embeds_1 = require("./embeds");
const images_1 = require("./images");
exports.runningGames = [];
let nextGameId = 0;
function getGamefromUser(userId) {
    return exports.runningGames.find(gme => gme.players.includes(userId));
}
exports.getGamefromUser = getGamefromUser;
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
    const handCards = takeRandomCards(16, unoCardStack, getAllUnoCards);
    const newGameData = {
        gameId: nextGameId++,
        infoMessageId: infoMessage.id,
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
            lastPlayedCards: [],
            upNow: 0,
            stats: {},
            playingDirection: 1,
        }
    };
    exports.runningGames.push(newGameData);
    const overviewFile = new discord_js_1.MessageAttachment((await overviewFromGameData(newGameData, channel.client)).toBuffer("image/png"), "overview.png");
    await newThread.send({ files: [overviewFile], components: embeds_1.INGAME_COMPONENTS });
    return newThread;
}
exports.createGame = createGame;
function isGameThread(threadId) {
    return exports.runningGames.findIndex(gme => gme.threadId === threadId) >= 0;
}
exports.isGameThread = isGameThread;
async function onGameMembersUpdate(thread, newMembers) {
    const gameObject = exports.runningGames.find(gme => gme.threadId === thread.id);
    // update players on gameObject and embed
    if (!gameObject.running) {
        gameObject.players = Array.from(newMembers.keys()).filter(id => id !== thread.guild.me.id);
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
        playedCards: data.gameState.lastPlayedCards.slice(0, 3).reverse(),
        players: data.players.map(plId => ({
            cardsLeft: data.gameState.handCards[plId].length,
            name: client.users.cache.find(usr => usr.id === plId).username
        })),
        playingDirection: data.gameState.playingDirection,
        upNow: data.gameState.upNow,
    });
}
async function getHandCardsForPlayer(player, threadId) {
    const playerCards = exports.runningGames.find(gme => gme.threadId === threadId).gameState.handCards[player.id];
    if (!playerCards)
        return undefined;
    else
        return (0, images_1.generateCards)(playerCards.sort((a, b) => (a.color - b.color) !== 0 ? a.color - b.color : a.type - b.type));
}
exports.getHandCardsForPlayer = getHandCardsForPlayer;
