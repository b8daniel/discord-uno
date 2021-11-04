import { Client, ClientEvents, MessageAttachment, MessageEmbed, TextBasedChannels, TextChannel, ThreadChannel, User } from "discord.js";
import { HAND_CARD_COMPONENTS, INGAME_COMPONENTS, JOIN_GAME_EMBED } from "./embeds";
import { generateOverview, UnoCard, UnoColor } from "./images";

export const runningGames: RunningGame[] = [];
let nextGameId = 0;

type RunningGame = {
  gameId: number,
  creator: string,
  infoMessageId: string,
  overviewMessageId: string,
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
  cardDisplayIds: Record<string, string>,
  playingDirection: 1 | -1,
};


export function getGamefromUser(userId: string): RunningGame {
  return runningGames.find(gme => gme.players.includes(userId));
}

export function getGameFromThread(threadId: string): RunningGame {
  return runningGames.find(gme => gme.threadId === threadId);
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
  const handCards = takeRandomCards(7, unoCardStack, getAllUnoCards);

  const newGameData: RunningGame = {
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
      playingDirection: 1 as const,
      cardDisplayIds: {},
    }
  };
  runningGames.push(newGameData);

  const overviewFile = new MessageAttachment((await overviewFromGameData(newGameData, channel.client)).toBuffer("image/png"), "overview.png");
  const overviewMessage = await newThread.send({ files: [overviewFile], components: INGAME_COMPONENTS });

  newGameData.overviewMessageId = overviewMessage.id;

  return newThread;
}

export function isGameThread(threadId: string) {
  return runningGames.findIndex(gme => gme.threadId === threadId) >= 0;
}

export async function onGameMembersUpdate(thread: ThreadChannel, newMembers: ClientEvents["threadMembersUpdate"]["1"]) {
  const gameObject = runningGames.find(gme => gme.threadId === thread.id);
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
    playedCards: data.gameState.lastPlayedCards,
    players: data.players.map(plId => ({
      cardsLeft: data.gameState.handCards[plId].length,
      name: client.users.cache.find(usr => usr.id === plId).username
    })),
    playingDirection: data.gameState.playingDirection,
    upNow: data.gameState.upNow,
  });
}

export function getHandCardsForPlayer(playerId: string, threadId: string) {
  return runningGames.find(gme => gme.threadId === threadId).gameState.handCards[playerId];
}

export async function endGame(threadId: string) {
  const gameObjectIndex = runningGames.findIndex(gme => gme.threadId === threadId);
  if (!gameObjectIndex) return;

  //TODO apply stats

  runningGames.splice(gameObjectIndex, 1);
}

export function setCardDisplayForPlayer(playerId: string, cardDisplayId: string, threadId: string) {
  const gameObject = runningGames.find(gme => gme.threadId === threadId);
  if (!gameObject) return;

  gameObject.gameState.cardDisplayIds[playerId] = cardDisplayId;
}

export function getCardDisplayForPlayer(playerId: string, threadId: string) {
  const gameObject = runningGames.find(gme => gme.threadId === threadId);
  if (!gameObject) return;

  return gameObject.gameState.cardDisplayIds[playerId];
}

export async function updateOverview(thread: TextBasedChannels) {
  const gameObject = runningGames.find(gme => gme.threadId === thread.id);
  if (!gameObject) return;

  const overviewFile = new MessageAttachment((await overviewFromGameData(gameObject, thread.client)).toBuffer("image/png"), "overview.png");
  await thread.messages.fetch(gameObject.overviewMessageId).then(msg => msg.edit({ files: [overviewFile], components: INGAME_COMPONENTS }));
}

export async function updateHandCards(playerId: string, thread: TextBasedChannels) {
  const gameObject = runningGames.find(gme => gme.threadId === thread.id);
  if (!gameObject) return;

  const cards = getHandCardsForPlayer(playerId, thread.id);
  cards.sort((a, b) => (a.color - b.color) !== 0 ? a.color - b.color : a.type - b.type);

  const cardFile = new MessageAttachment((await getHandCardsForPlayer(playerId, gameObject)).toBuffer("image/png"), "handCards.png");
  await thread.messages.fetch(gameObject.gameState.cardDisplayIds[playerId]).then(msg => msg.edit({ files: [cardFile], components: [HAND_CARD_COMPONENTS] }));
}

export async function playCard(playerId: string, thread: TextBasedChannels, cardIndex: number, cardColor?: UnoColor) {
  const gameObject = runningGames.find(gme => gme.threadId === thread.id);
  if (!gameObject) return;

  // remove card from hand
  const card = gameObject.gameState.handCards[playerId].splice(cardIndex, 1)[0];
  card.color = cardColor ?? card.color;

  // add card to last played cards
  gameObject.gameState.lastPlayedCards.push(card);
  if (gameObject.gameState.lastPlayedCards.length > 3) gameObject.gameState.lastPlayedCards.shift();

  // set next player
  gameObject.gameState.upNow = (gameObject.gameState.upNow + gameObject.gameState.playingDirection) % gameObject.players.length;

  await updateOverview(thread);
}

export async function takeCard(playerId: string, thread: TextBasedChannels) {
  const gameObject = runningGames.find(gme => gme.threadId === thread.id);
  if (!gameObject) return;

  const takenCards = takeRandomCards(1, gameObject.gameState.cardsInStack, getAllUnoCards);
  gameObject.gameState.handCards[playerId].push(...takenCards);

  // await updateOverview(thread);
}

export async function giveCardsToPlayer(playerId: string, thread: TextBasedChannels, count: number) {
  const gameObject = runningGames.find(gme => gme.threadId === thread.id);
  if (!gameObject) return;

  gameObject.gameState.handCards[playerId].push(...takeRandomCards(count, gameObject.gameState.cardsInStack, getAllUnoCards));
}