"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isGameThread = exports.createGame = exports.getGame = exports.runningGames = void 0;
const embeds_1 = require("./embeds");
exports.runningGames = [];
let nextGameId = 0;
function getGame(userId) {
    return exports.runningGames.find(gme => gme.players.includes(userId));
}
exports.getGame = getGame;
async function createGame(creator, channel) {
    const infoMessage = await channel.send({
        embeds: [embeds_1.JOIN_GAME_EMBED
                .setTimestamp()
                .setAuthor("started by " + creator.username)
                .addField("Players", "1", true)
                .addField("start", "<t:0:R>", true)]
    });
    const newThread = await infoMessage.startThread({
        name: `game #${exports.runningGames.length + 1}`,
        autoArchiveDuration: 60,
        reason: `<@${creator.id}> started a new game!`
    });
    await newThread.join();
    exports.runningGames.push({
        gameId: nextGameId++,
        infoMessageId: infoMessage.id,
        players: [
            creator.id
        ],
        threadId: newThread.id,
    });
}
exports.createGame = createGame;
function isGameThread(threadId) {
    return exports.runningGames.findIndex(gme => gme.threadId === threadId) > 0;
}
exports.isGameThread = isGameThread;
