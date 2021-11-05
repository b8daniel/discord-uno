import { ButtonInteraction, Client, ClientEvents, Interaction, MessageActionRow, MessageAttachment, MessageComponentInteraction, MessageEmbed, MessageSelectMenu, TextBasedChannels, TextChannel, ThreadChannel, User } from "discord.js";
import { HAND_CARD_COMPONENTS, INGAME_COMPONENTS, INGAME_OVERVIEW, JOIN_GAME_EMBED } from "./embeds";
import { generateCards, generateOverview, UnoCard, UnoColor, UnoType } from "./images";

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
  cardsTaken: Record<string, number>,
  cardDisplayIds: Record<string, string>,
  playingDirection: 1 | -1,
};

export const unoColorEmojis: Record<UnoColor, string> = {
  [UnoColor.RED]: "🟥",
  [UnoColor.BLUE]: "🟦",
  [UnoColor.GREEN]: "🟩",
  [UnoColor.YELLOW]: "🟨",
  [UnoColor.BLACK]: "⬛",
};

export const unoTypeNames: Record<UnoType, string> = {
  [UnoType.ZERO]: "0",
  [UnoType.ONE]: "1",
  [UnoType.TWO]: "2",
  [UnoType.THREE]: "3",
  [UnoType.FOUR]: "4",
  [UnoType.FIVE]: "5",
  [UnoType.SIX]: "6",
  [UnoType.SEVEN]: "7",
  [UnoType.EIGHT]: "8",
  [UnoType.NINE]: "9",
  [UnoType.DRAW_TWO]: "Draw 2",
  [UnoType.REVERSE]: "Reverse",
  [UnoType.SKIP]: "Skip",
  [UnoType.WILD]: "Wild",
  [UnoType.WILD_DRAW_FOUR]: "Wild Draw 4",
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

  const unoCardStack = getAllUnoCards();

  const newGameData: RunningGame = {
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
      playingDirection: 1 as const,
      cardDisplayIds: {},
      cardsTaken: {},
    }
  };
  runningGames.push(newGameData);

  await newThread.members.add(creator);
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
    // update the game overview
    await updateOverview(thread);
  }

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

async function overviewFromGameData(data: RunningGame, client: Client) {
  return generateOverview({
    playedCards: data.gameState.lastPlayedCards,
    players: await Promise.all(data.players.map(async plId => ({
      cardsLeft: data.gameState.handCards[plId].length,
      name: (await client.users.fetch(plId)).username
    }))),
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

export async function updateOverview(thread: ThreadChannel) {
  const gameObject = runningGames.find(gme => gme.threadId === thread.id);
  if (!gameObject) return;

  const overviewFile = new MessageAttachment((await overviewFromGameData(gameObject, thread.client)).toBuffer("image/png"), "overview.png");
  if (gameObject.overviewMessageId) {
    await thread.messages.fetch(gameObject.overviewMessageId).then(msg => msg.delete());
  }

  const newMessage = await thread.send({ files: [overviewFile], components: INGAME_COMPONENTS });
  gameObject.overviewMessageId = newMessage.id;
}

//asdasd
export async function updateHandCards(interaction: MessageComponentInteraction) {
  const gameObject = runningGames.find(gme => gme.threadId === interaction.channelId);
  if (!gameObject) return;

  //! Uncaught DiscordAPIError: Unknown Message
  // const oldCardDisplayId = gameObject.gameState.cardDisplayIds[interaction.user.id];
  // if (oldCardDisplayId) {
  //   await interaction.channel.messages.fetch(oldCardDisplayId).then(msg => msg.edit({ components: [] }));
  // }

  const cards = getHandCardsForPlayer(interaction.user.id, interaction.channelId);
  cards.sort((a, b) => (a.color - b.color) !== 0 ? a.color - b.color : a.type - b.type);

  const cardsFile = new MessageAttachment(
    (await generateCards(cards)).toBuffer("image/png"),
    "handcards.png"
  );

  const cardSelector = new MessageActionRow().addComponents(
    new MessageSelectMenu().setCustomId("uno-placecard").setPlaceholder("place a card").addOptions(
      cards.filter((card, i) => i === cards.findIndex((card1 => card1.type === card.type && card1.color === card.color)))
        .map((card, i) => ({
          label: `${unoColorEmojis[card.color]}: ${unoTypeNames[card.type]}`,
          value: String(i),
        }))
    ),
  );

  gameObject.gameState.cardDisplayIds[interaction.user.id] = (await interaction.editReply({ files: [cardsFile], components: [cardSelector, ...HAND_CARD_COMPONENTS] })).id;

}

//TODO respond to interaction with overview
export async function playCard(interaction: MessageComponentInteraction, cardIndex: number, cardColor?: UnoColor) {
  const gameObject = runningGames.find(gme => gme.threadId === interaction.channelId);
  if (!gameObject || !interaction.channel.isThread()) return;

  // remove card from hand
  const card = gameObject.gameState.handCards[interaction.user.id].splice(cardIndex, 1)[0];
  card.color = cardColor ?? card.color;

  // add card to last played cards
  gameObject.gameState.lastPlayedCards.push(card);
  if (gameObject.gameState.lastPlayedCards.length > 3) gameObject.gameState.lastPlayedCards.shift();

  // set next player
  gameObject.gameState.upNow = (gameObject.gameState.upNow + gameObject.gameState.playingDirection) % gameObject.players.length;

  gameObject.gameState.cardsTaken[interaction.user.id] = 0;

  await updateHandCards(interaction);
  await updateOverview(interaction.channel);
}

export function giveCardsToPlayer(playerId: string, thread: ThreadChannel, count: number) {
  const gameObject = runningGames.find(gme => gme.threadId === thread.id);
  if (!gameObject) return;

  gameObject.gameState.handCards[playerId].push(...takeRandomCards(count, gameObject.gameState.cardsInStack, getAllUnoCards));
  if (!gameObject.gameState.cardsTaken[playerId]) gameObject.gameState.cardsTaken[playerId] = 0;
  gameObject.gameState.cardsTaken[playerId] += count;
}