import { Canvas } from "canvas";
import { Client, ClientEvents, MessageAttachment, MessageEmbed, TextChannel, ThreadChannel, User } from "discord.js";
import { INGAME_COMPONENTS, JOIN_GAME_EMBED } from "./embeds";
import { generateCards, generateOverview, UnoCard, UnoColor } from "./images";

export const runningGames: RunningGame[] = [];
let nextGameId = 0;

type RunningGame = {
  gameId: number,
  creator: string,
  infoMessageId: string,
  threadId: string,
  players: string[],
  gameState: UnoState,
  running: boolean,
  startTime: number, // -1 -> waiting for players else UNIX timestamp
};

type UnoState = {
  upNow: number,
  cardsInStack: UnoCard[],
  lastPlayedCards: UnoCard[], // 3 last played cards
  stats: Record<number, number>,
  handCards: Record<string, UnoCard[]>,
  playingDirection: 1 | -1,
};


export function getGamefromUser(userId: string): RunningGame {
  return runningGames.find(gme => gme.players.includes(userId));
}

export async function createGame(creator: User, channel: TextChannel) {
  const infoMessage = await channel.send({
    embeds: [generateJoinGameEmbed([], creator.username, 0)]
  });

  const newThread = await infoMessage.startThread({
    name: `game-${runningGames.length + 1}`,
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
      playingDirection: 1 as const,
    }
  };
  runningGames.push(newGameData);

  const overviewFile = new MessageAttachment((await overviewFromGameData(newGameData, channel.client)).toBuffer("image/png"), "overview.png");
  await newThread.send({ files: [overviewFile], components: INGAME_COMPONENTS });

  return newThread;
}

export function isGameThread(threadId: string) {
  return runningGames.findIndex(gme => gme.threadId === threadId) >= 0;
}

export async function onGameMembersUpdate(thread: ThreadChannel, newMembers: ClientEvents["threadMembersUpdate"]["1"]) {
  const gameObject = runningGames.find(gme => gme.threadId === thread.id);

  // update players on gameObject and embed
  if (!gameObject.running) {
    gameObject.players = Array.from(newMembers.keys()).filter(id => id !== thread.guild.me.id);
    const threadMessage = await thread.fetchStarterMessage();
    await threadMessage.edit({ embeds: [generateJoinGameEmbed(gameObject.players, gameObject.creator, 100000000)] });
  }

  // update the game overview
}

function generateJoinGameEmbed(playerIds: string[], creator: string, startTime: number) {
  return new MessageEmbed(JOIN_GAME_EMBED)
    .setAuthor("Game started by " + creator)
    .addField("players:", playerIds.length > 0 ? playerIds.map(id => `<@${id}>`).join(", ") : "none", true)
    .addField("start:", startTime === -1 ? "waiting" : `<t:${startTime.toFixed(0)}:R>`, true);
}

function getAllUnoCards() {
  const allCards: UnoCard[] = [];
  for (let color = 0; color <= 4; color++) {
    for (let type = color !== UnoColor.BLACK ? 0 : 13; type <= (color !== UnoColor.BLACK ? 12 : 14); type++) {
      allCards.push({ color, type }, { color, type });
    }
  }
  return allCards;
}

function takeRandomCards(count: number, cards: UnoCard[], newStack: () => UnoCard[]) {
  if (cards.length === 0) cards = newStack();

  const takenCards: UnoCard[] = [];

  for (let i = 0; i < count; i++) {
    takenCards.push(...cards.splice(Math.round(Math.random() * cards.length) % cards.length, 1)); // get a random card
    if (cards.length === 0) cards = newStack();
  }

  return takenCards;
}

function overviewFromGameData(data: RunningGame, client: Client) {
  return generateOverview({
    playedCards: data.gameState.lastPlayedCards.slice(0, 3).reverse(),
    players: data.players.map(plId => ({
      cardsLeft: data.gameState.handCards[plId].length,
      name: client.users.cache.find(usr => usr.id === plId).username
    })),
    playingDirection: data.gameState.playingDirection,
    upNow: data.gameState.upNow,
  });
}

export async function getHandCardsForPlayer(player: User, threadId: string): Promise<Canvas> {
  const playerCards = runningGames.find(gme => gme.threadId === threadId).gameState.handCards[player.id];

  if (!playerCards) return undefined;
  else return generateCards(playerCards.sort((a, b) => (a.color - b.color) !== 0 ? a.color - b.color : a.type - b.type));
}