import { TextChannel, User } from "discord.js";
import { JOIN_GAME_EMBED } from "./embeds";

export const runningGames: RunningGame[] = [];
let nextGameId = 0;

type RunningGame = {
  gameId: number,
  infoMessageId: string,
  threadId: string,
  players: string[],
};

export function getGame(userId: string): RunningGame {
  return runningGames.find(gme => gme.players.includes(userId));
}

export async function createGame(creator: User, channel: TextChannel) {
  const infoMessage = await channel.send({
    embeds: [JOIN_GAME_EMBED
      .setTimestamp()
      .setAuthor("started by " + creator.username)
      .addField("Players", "1", true)
      .addField("start", "<t:0:R>", true)]
  });

  const newThread = await infoMessage.startThread({
    name: `game #${runningGames.length + 1}`,
    autoArchiveDuration: 60,
    reason: `<@${creator.id}> started a new game!`
  });

  await newThread.join();

  runningGames.push({
    gameId: nextGameId++,
    infoMessageId: infoMessage.id,
    players: [
      creator.id
    ],
    threadId: newThread.id,
  });
}

export function isGameThread(threadId: string) {
  return runningGames.findIndex(gme => gme.threadId === threadId) > 0;
}