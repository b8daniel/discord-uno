"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onGameMembersUpdate = exports.isGameThread = exports.createGame = exports.getGame = exports.runningGames = void 0;
const discord_js_1 = require("discord.js");
const embeds_1 = require("./embeds");
exports.runningGames = [];
let nextGameId = 0;
function getGame(userId) {
    return exports.runningGames.find(gme => gme.players.includes(userId));
}
exports.getGame = getGame;
async function createGame(creator, channel) {
    const infoMessage = await channel.send({
        embeds: [generateJoinGameEmbed(0, creator.username, 0)]
    });
    const newThread = await infoMessage.startThread({
        name: `game-${exports.runningGames.length + 1}`,
        autoArchiveDuration: 60,
        reason: `<@${creator.id}> started a new game!`,
    });
    // await newThread.join();
    exports.runningGames.push({
        gameId: nextGameId++,
        infoMessageId: infoMessage.id,
        creator: creator.username,
        players: [
            creator.id
        ],
        threadId: newThread.id,
    });
    const image = new discord_js_1.MessageAttachment("assets/images/test.jpg");
    await newThread.send({ embeds: [embeds_1.INGAME_DASHBOARD], components: embeds_1.INGAME_COMPONENTS, files: [image] });
    await newThread.members.add(creator);
    return newThread;
}
exports.createGame = createGame;
function isGameThread(threadId) {
    return exports.runningGames.findIndex(gme => gme.threadId === threadId) >= 0;
}
exports.isGameThread = isGameThread;
async function onGameMembersUpdate(thread, newMembers) {
    const gameObject = exports.runningGames.find(gme => gme.threadId === thread.id);
    const threadMessage = await thread.fetchStarterMessage();
    await threadMessage.edit({ embeds: [generateJoinGameEmbed(newMembers.size - 1, gameObject.creator, 100000000)] });
}
exports.onGameMembersUpdate = onGameMembersUpdate;
function generateJoinGameEmbed(players, creator, startTime) {
    return new discord_js_1.MessageEmbed(embeds_1.JOIN_GAME_EMBED)
        .setAuthor("started by " + creator)
        .addField("players:", players.toFixed(0), true)
        .addField("start:", `<t:${startTime.toFixed(0)}:R>`, true);
}
