import { ClientEvents, MessageAttachment, MessageEmbed, TextChannel, ThreadChannel, User } from "discord.js";
import { INGAME_COMPONENTS, INGAME_DASHBOARD, JOIN_GAME_EMBED } from "./embeds";

export const runningGames: RunningGame[] = [];
let nextGameId = 0;

type RunningGame = {
  gameId: number,
  creator: string,
  infoMessageId: string,
  threadId: string,
  players: string[],
};

export function getGame(userId: string): RunningGame {
  return runningGames.find(gme => gme.players.includes(userId));
}

export async function createGame(creator: User, channel: TextChannel) {
  const infoMessage = await channel.send({
    embeds: [generateJoinGameEmbed(0, creator.username, 0)]
  });

  const newThread = await infoMessage.startThread({
    name: `game-${runningGames.length + 1}`,
    autoArchiveDuration: 60,
    reason: `<@${creator.id}> started a new game!`,
  });

  // await newThread.join();

  runningGames.push({
    gameId: nextGameId++,
    infoMessageId: infoMessage.id,
    creator: creator.username,
    players: [
      creator.id
    ],
    threadId: newThread.id,
  });

  const image = new MessageAttachment("assets/images/test.jpg");
  await newThread.send({ embeds: [INGAME_DASHBOARD], components: INGAME_COMPONENTS, files: [image] });
  await newThread.members.add(creator);

  return newThread;
}

export function isGameThread(threadId: string) {
  return runningGames.findIndex(gme => gme.threadId === threadId) >= 0;
}

export async function onGameMembersUpdate(thread: ThreadChannel, newMembers: ClientEvents["threadMembersUpdate"]["1"]) {
  const gameObject = runningGames.find(gme => gme.threadId === thread.id);

  const threadMessage = await thread.fetchStarterMessage();
  await threadMessage.edit({ embeds: [generateJoinGameEmbed(newMembers.size - 1, gameObject.creator, 100000000)] });
}

function generateJoinGameEmbed(players: number, creator: string, startTime: number) {
  return new MessageEmbed(JOIN_GAME_EMBED)
    .setAuthor("started by " + creator)
    .addField("players:", players.toFixed(0), true)
    .addField("start:", `<t:${startTime.toFixed(0)}:R>`, true);
}