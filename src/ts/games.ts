import { Client, ClientEvents, Message, MessageActionRow, MessageAttachment, MessageComponentInteraction, MessageEmbed, MessageSelectMenu, MessageSelectOptionData, TextChannel, ThreadChannel, User } from "discord.js";
import { BASE_EMB, ERR_BASE, HAND_CARD_COMPONENTS, INGAME_COMPONENTS, JOIN_GAME_EMBED, WIN_EMBED } from "./embeds";
import { generateCards, generateOverview, UnoCard, UnoColor, UnoType } from "./images";

export const runningGames: RunningGame[] = [];
let nextGameId = 0;

const startCardCount = 7;

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
  waitingForUno: boolean,
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
  [UnoType.WILD_DRAW_FOUR]: "Wild Draw 4",
  [UnoType.WILD]: "Wild",
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
    startTime: Date.now(),
    players: [],
    threadId: newThread.id,
    running: false,
    gameState: {
      waitingForUno: false,
      cardsInStack: unoCardStack,
      handCards: {},
      lastPlayedCards:
        takeRandomCards(1, unoCardStack, getAllUnoCards),
      // //! only for testing
      // [{ color: UnoColor.BLACK, type: UnoType.WILD }],
      upNow: 0,
      stats: {},
      playingDirection: -1 as const,
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
        gameObject.gameState.handCards[id] =
          takeRandomCards(startCardCount, gameObject.gameState.cardsInStack, getAllUnoCards);
        // //! only for testing
        // [{ type: UnoType.WILD, color: UnoColor.BLACK }, { type: UnoType.WILD, color: UnoColor.BLACK }];
      }
    });

    const threadMessage = await thread.fetchStarterMessage();
    await threadMessage.edit({ embeds: [generateJoinGameEmbed(gameObject.players, gameObject.creator, gameObject.startTime)] });
    // update the game overview
    await updateOverview(thread);
  }

}

function generateJoinGameEmbed(playerIds: string[], creator: string, startTime: number) {
  return new MessageEmbed(JOIN_GAME_EMBED)
    .setAuthor("Game started by " + creator)
    .addField("players:", playerIds.length > 0 ? playerIds.map(id => `<@${id}>`).join(", ") : "none", true)
    .addField("start:", startTime === -1 ? "waiting" : `<t:${Math.round(startTime / 1000)}:R>`, true);
}

function getAllUnoCards() {
  const allCards: UnoCard[] = [];
  for (let color = 0; color <= 4; color++) {
    for (let type = color !== UnoColor.BLACK ? 0 : 13; type <= (color !== UnoColor.BLACK ? 12 : 14); type++) {
      allCards.push({ color, type }, { color, type });
      if (type > 12) {
        allCards.push({ color, type }, { color, type });
      }
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

export async function updateHandCards(interaction: MessageComponentInteraction) {
  const gameObject = runningGames.find(gme => gme.threadId === interaction.channelId);
  if (!gameObject) return;

  const cards = getHandCardsForPlayer(interaction.user.id, interaction.channelId);
  cards.sort((a, b) => (a.color - b.color) !== 0 ? a.color - b.color : a.type - b.type);

  if (cards.length === 0) return;

  const cardsFile = new MessageAttachment(
    (await generateCards(cards)).toBuffer("image/png"),
    "handcards.png"
  );

  const cardSelector = new MessageActionRow().addComponents(
    new MessageSelectMenu().setCustomId("uno-placecard").setPlaceholder("place a card").addOptions(
      cards.map((card, i): MessageSelectOptionData[] => {
        if (i !== cards.findIndex(card1 => card1.type === card.type && card1.color === card.color)) {
          return [];
        }
        if (card.color === UnoColor.BLACK) {
          const colorOptions: MessageSelectOptionData[] = [];
          for (let c = 0; c < 4; c++) {
            colorOptions.push({
              label: `${unoColorEmojis[card.color]}: ${unoTypeNames[card.type]}, choose: ${unoColorEmojis[c]}`,
              value: `${String(i)}_${c}`
            });
          }
          return colorOptions;
        } else {
          return [{
            label: `${unoColorEmojis[card.color]}: ${unoTypeNames[card.type]}`,
            value: `${String(i)}_${card.color}`,
          }];
        }
      }).reduce((acc, cur) => acc.concat(cur), [])
    ),
  );

  gameObject.gameState.cardDisplayIds[interaction.user.id] = (await interaction.editReply({ files: [cardsFile], components: [cardSelector, ...HAND_CARD_COMPONENTS] })).id;

}

//TODO respond to interaction with overview
export async function playCard(interaction: MessageComponentInteraction, cardIndex: number, cardColor?: UnoColor) {
  const gameObject = runningGames.find(gme => gme.threadId === interaction.channelId);
  if (!gameObject || !interaction.channel.isThread()) return;

  // reply within 3 seconds
  await interaction.reply({ content: "your cards:", ephemeral: true });

  // remove card from hand
  const handCards = gameObject.gameState.handCards[interaction.user.id];
  const card = handCards.splice(cardIndex, 1)[0];
  card.color = cardColor ?? card.color;

  // add card to last played cards
  gameObject.gameState.lastPlayedCards.push(card);
  if (gameObject.gameState.lastPlayedCards.length > 3) gameObject.gameState.lastPlayedCards.shift();

  gameObject.gameState.cardsTaken[interaction.user.id] = 0;

  // player needs to call uno
  if (handCards.length === 1) {
    await interaction.editReply({ content: "don't forget to call uno when you only have one card left." });
    gameObject.gameState.waitingForUno = true;

    const callCollector = await (interaction.message as Message).awaitMessageComponent({ componentType: "BUTTON", filter: c => c.customId === "uno-calluno", time: 10e3 }).catch(() => false as const);
    if (!callCollector) {
      // player didn't call uno
      handCards.push(...takeRandomCards(2, gameObject.gameState.cardsInStack, getAllUnoCards));
      await interaction.editReply({ content: "you didn't call uno, so you get 2 cards" });
    }
    gameObject.gameState.waitingForUno = false;
  } else if (handCards.length === 0) {
    //TODO end game
    await updateOverview(interaction.channel);
    await interaction.editReply("You win!");
    await interaction.followUp({ embeds: [new MessageEmbed(WIN_EMBED).setAuthor(`congratulations ${interaction.user.username},`)] });
    if (interaction.channel.isThread()) {
      await interaction.channel.setArchived(true);
      runningGames.splice(runningGames.findIndex(gme => gme.threadId === interaction.channelId), 1);
    }
    return;
  }

  // set next player
  if (card.type === UnoType.REVERSE) {
    gameObject.gameState.playingDirection *= -1;
  }
  gameObject.gameState.upNow = (gameObject.gameState.upNow + gameObject.players.length + gameObject.gameState.playingDirection) % gameObject.players.length;

  const nextPlayerId = gameObject.players[gameObject.gameState.upNow];
  // special effects
  //TODO +2 stacking
  switch (card.type) {
    case UnoType.SKIP: {
      gameObject.gameState.upNow = (gameObject.gameState.upNow + gameObject.players.length + gameObject.gameState.playingDirection) % gameObject.players.length;
      // 0, 1
      // -1 -> 1
      // -1 + 2 -> 1

      // 0, 1, 2, 3
      // -1 -> 3
      // -1 + 4 -> 3
      break;
    }
    case UnoType.DRAW_TWO: {
      gameObject.gameState.handCards[nextPlayerId].push(...takeRandomCards(2, gameObject.gameState.cardsInStack, getAllUnoCards));
      await interaction.channel.send({ embeds: [new MessageEmbed(BASE_EMB).setDescription(`<@${nextPlayerId}> you need to draw 2 cards. Do so by clicking :flower_playing_cards: \`hand cards\`!`)] });
      break;
    }
    case UnoType.WILD_DRAW_FOUR: {
      gameObject.gameState.handCards[nextPlayerId].push(...takeRandomCards(4, gameObject.gameState.cardsInStack, getAllUnoCards));
      await interaction.channel.send({ embeds: [new MessageEmbed(BASE_EMB).setDescription(`<@${nextPlayerId}> you need to draw 4 cards. Do so by clicking :flower_playing_cards: \`hand cards\`!`)] });
      break;
    }
  }

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

export function isAllowedToPlay(interaction: MessageComponentInteraction, skipUnoWait: boolean = false) {
  // needs to be a thread
  // nedds to be in a game
  if (!isGameThread(interaction.channelId) || !interaction.channel.isThread()) return interaction.reply({ embeds: [new MessageEmbed(ERR_BASE).setFooter("this isn't an active game thread")], ephemeral: true });

  const { gameState, players } = getGameFromThread(interaction.channelId);

  // needs to be the next player
  if (players[gameState.upNow] !== interaction.user.id) return interaction.reply({ embeds: [new MessageEmbed(ERR_BASE).setDescription("It's not your turn")], ephemeral: true });
  //? needs to have enough cards
  // not waiting for uno
  if (!skipUnoWait && gameState.waitingForUno) return interaction.reply({ embeds: [new MessageEmbed(ERR_BASE).setDescription("You need to call uno")], ephemeral: true });

  // latest card message
  if (gameState.cardDisplayIds[interaction.user.id] !== interaction.message.id) return interaction.reply({ embeds: [new MessageEmbed(ERR_BASE).setFooter("these cards are outdated")], ephemeral: true });
  return true;
}