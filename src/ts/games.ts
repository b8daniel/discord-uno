import { Client, Guild, Message, MessageActionRow, MessageAttachment, MessageComponentInteraction, MessageEmbed, MessageSelectMenu, MessageSelectOptionData, Sticker, TextChannel, ThreadChannel, User } from "discord.js";
import { notifyRoleId } from "./config";
import { BASE_EMB, ERR_BASE, HAND_CARD_COMPONENTS, INGAME_COMPONENTS, JOIN_GAME_EMBED, WIN_EMBED } from "./embeds";
import { generateCards, generateOverview, UnoCard, UnoColor, UnoType } from "./images";
import { lang } from "./lang";

export const runningGames: RunningGame[] = [];
let nextGameId = 0;

const startCardCount = 7;

class UnoState {
  upNow: number = 0;
  waitingForUno: boolean = false;
  cardsInStack: UnoCard[];
  lastPlayedCards: UnoCard[];
  handCards: Record<string, UnoCard[]> = {};
  cardsTaken: Record<string, number> = {}; // to disallow taking two cards in a row
  cardDisplayIds: Record<string, string> = {};
  playingDirection: 1 | -1 = -1;
  cardsToTake: number = 0;

  constructor() {
    const cardStack = getAllUnoCards();
    const firstCard = takeRandomCards(1, cardStack, getAllUnoCards);
    this.cardsInStack = cardStack;
    this.lastPlayedCards = firstCard;
  }

  setNextPlayer(playerCount: number) {
    this.upNow = (this.upNow + playerCount + this.playingDirection) % playerCount;
  }
}

type RunningGame = {
  gameId: number,
  creator: string,
  infoMessageId: string,
  overviewMessageId: string | null,
  threadId: string,
  players: string[],
  gameState: UnoState,
  running: boolean,
  startTime: number, // -1 -> waiting for players else UNIX timestamp
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
  [UnoType.DRAW_TWO]: "+2",
  [UnoType.REVERSE]: "↺",
  [UnoType.SKIP]: "∅",
  [UnoType.WILD_DRAW_FOUR]: "+4",
  [UnoType.WILD]: "★",
};

export function getGamefromUser(userId: string): RunningGame | undefined {
  return runningGames.find(gme => gme.players.includes(userId));
}

export function getGameFromThread(threadId: string): RunningGame | undefined {
  return runningGames.find(gme => gme.threadId === threadId);
}

export async function createGame(creator: User, channel: TextChannel) {
  const infoMessage = await channel.send({
    embeds: [generateInfoEmbed([], creator.username, 0)],
    content: await channel.guild.roles.fetch(notifyRoleId) && `<@&${notifyRoleId}>`,
  });

  const newThread = await infoMessage.startThread({
    name: lang.gameGroupName.replace("{0}", creator.username),
    autoArchiveDuration: 60,
    reason: `<@${creator.id}> started a new game!`,
  });

  const newGameData: RunningGame = {
    gameId: nextGameId++,
    infoMessageId: infoMessage.id,
    overviewMessageId: null,
    creator: await getGuildName(creator, channel.guild),
    startTime: -1,
    players: [],
    threadId: newThread.id,
    running: false,
    gameState: new UnoState(),
  };
  runningGames.push(newGameData);

  await newThread.members.add(creator);
}

export function isGameThread(threadId: string) {
  return runningGames.findIndex(gme => gme.threadId === threadId) >= 0;
}

function isInGame(userId: string) {
  return runningGames.findIndex(gme => gme.players.includes(userId)) != -1;
}

export async function onGameMembersUpdate(thread: ThreadChannel, membersJoinedIds: string[], membersLeftIds: string[]) { //TODO refactor to only accept one joined/left member and no list
  const gameObject = runningGames.find(gme => gme.threadId === thread.id);
  if (!gameObject || !thread.guild) return;

  if (membersJoinedIds.length > 0) {
    const membersJoinedEmbed = new MessageEmbed(BASE_EMB).setDescription("➡ " + membersJoinedIds.map(id => `<@${id}>`).join(", "));
    if (gameObject.running) membersJoinedEmbed.setFooter(lang.joinedAsSpectator);
    thread.send({ embeds: [membersJoinedEmbed] });
  }
  if (membersLeftIds.length > 0) {
    thread.send({
      embeds: [
        new MessageEmbed(BASE_EMB).setDescription("⬅ " + membersLeftIds.map(id => `<@${id}>`).join(", "))
      ]
    });
  }

  let shouldUpdateOverview = false;
  const { gameState } = gameObject;

  if (!gameObject.running) membersJoinedIds.map(async (memberId) => {
    if (!isInGame(memberId)) {
      shouldUpdateOverview = true;

      gameObject.players.push(memberId);

      // give cards to new player
      if (!gameState.handCards[memberId]) {
        gameState.handCards[memberId] =
          takeRandomCards(startCardCount, gameState.cardsInStack, getAllUnoCards);
      }
    }
  });
  membersLeftIds.map(async (memberId) => {
    const memberIndex = gameObject.players.findIndex(pl => pl === memberId);
    if (memberIndex >= 0) {
      let playerUpNow = gameObject.players[gameState.upNow];
      if (memberIndex === gameState.upNow) {
        gameState.setNextPlayer(gameObject.players.length);
        playerUpNow = gameObject.players[gameState.upNow];
      }
      shouldUpdateOverview = true;
      gameObject.players.splice(memberIndex, 1);
      gameState.upNow = gameObject.players.findIndex(pl => pl === playerUpNow);
    }
  });

  // update the game overview (if needed)
  if (shouldUpdateOverview) await Promise.all([
    updateOverview(thread, true),
    (await thread.fetchStarterMessage())
      .edit({ embeds: [generateInfoEmbed(gameObject.players, gameObject.creator, gameObject.startTime)] })
  ]);

  if (gameObject.players.length === 0) {
    await thread.send({
      embeds: [
        new MessageEmbed(BASE_EMB).setDescription("😕 " + lang.allPlayersLeft)
      ]
    });
    await endGame(thread); //! dont acces the thread now - it's archived!
  }
}

function generateInfoEmbed(playerIds: string[], creator: string, startTime: number, duration?: number) {
  const infoEmbed = new MessageEmbed(JOIN_GAME_EMBED)
    .setAuthor(lang.gameStartedBy.replace("{0}", creator))
    .addField(lang.players + ":", playerIds.length > 0 ? playerIds.map(id => `<@${id}>`).join(", ") : "∅", true)
    .addField(lang.start + ":", startTime === -1 ? lang.startOnFirstCard : `<t:${Math.round(startTime / 1000)}:R>`, true);

  if (duration) {
    const durationDate = new Date(duration);
    infoEmbed.addField(lang.duration + ":", durationDate.toLocaleTimeString("default", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZone: "GMT",
    }), true);
  }

  return infoEmbed;
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

async function getGuildName(user: User, guild?: Guild) {
  const guildUser = await guild?.members.fetch(user);
  return guildUser?.displayName ?? user.username;
}

async function overviewFromGameData(data: RunningGame, client: Client, guild: Guild) {

  return generateOverview({
    playedCards: data.gameState.lastPlayedCards,
    players: await Promise.all(data.players.map(async plId => ({
      cardsLeft: data.gameState.handCards[plId]?.length || 7,
      name: (await getGuildName(await client.users.fetch(plId), guild)),
    }))),
    playingDirection: data.gameState.playingDirection,
    upNow: data.gameState.upNow,
  });
}

export function getHandCardsForPlayer(playerId: string, threadId: string) {
  return runningGames.find(gme => gme.threadId === threadId)?.gameState.handCards[playerId];
}

export function removeGame(threadId: string) {
  const gameObjectIndex = runningGames.findIndex(gme => gme.threadId === threadId);
  if (gameObjectIndex === -1) return;

  //TODO apply stats

  runningGames.splice(gameObjectIndex, 1);
}

export async function updateOverview(thread: ThreadChannel, playersChanged = false) {
  const gameObject = runningGames.find(gme => gme.threadId === thread.id);
  if (!gameObject) return;

  if (!gameObject.running && !playersChanged) {
    gameObject.running = true;
    gameObject.startTime = Date.now();
    // show that the game has started
    thread.fetchStarterMessage().then(starterMessage => {
      starterMessage.edit({ embeds: [generateInfoEmbed(gameObject.players, gameObject.creator, gameObject.startTime)] });
    });
  }

  const overviewFile = new MessageAttachment((await overviewFromGameData(gameObject, thread.client, thread.guild)).toBuffer("image/png"), "overview.png");
  if (gameObject.overviewMessageId) {
    await thread.messages.fetch(gameObject.overviewMessageId).then(msg => msg.delete());
  }

  const newMessage = await thread.send({ files: [overviewFile], components: INGAME_COMPONENTS });
  gameObject.overviewMessageId = newMessage.id;
}

export async function updateHandCards(interaction: MessageComponentInteraction) {
  const gameObject = runningGames.find(gme => gme.threadId === interaction.channelId);
  if (!gameObject) return;

  const needsToDrawCards = gameObject.players[gameObject.gameState.upNow] === interaction.user.id && gameObject.gameState.cardsToTake > 0;
  if (needsToDrawCards) {
    gameObject.gameState.handCards[interaction.user.id].push(...takeRandomCards(gameObject.gameState.cardsToTake, gameObject.gameState.cardsInStack, getAllUnoCards)); //? "null pointer"
    gameObject.gameState.cardsToTake = 0;
  }

  const cards = getHandCardsForPlayer(interaction.user.id, interaction.channelId);
  if (!cards) return;
  cards.sort((a, b) => (a.color - b.color) !== 0 ? a.color - b.color : a.type - b.type);


  if (cards.length === 0) return;

  const cardsFile = new MessageAttachment(
    (await generateCards(cards)).toBuffer("image/png"),
    "handcards.png"
  );

  const cardSelector = new MessageActionRow().addComponents(
    new MessageSelectMenu().setCustomId("uno-placecard").setPlaceholder(lang.placeCard).addOptions(
      cards.map((card, i): MessageSelectOptionData[] => {
        if (i !== cards.findIndex(card1 => card1.type === card.type && card1.color === card.color)) {
          return [];
        }
        if (card.color === UnoColor.BLACK) {
          const colorOptions: MessageSelectOptionData[] = [];
          for (let c = 0; c < 4; c++) {
            colorOptions.push({
              label: `${unoColorEmojis[card.color]}: ${unoTypeNames[card.type]}, ${lang.choose}: ${unoColorEmojis[c as UnoColor]}`,
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

  if (needsToDrawCards && interaction.channel instanceof ThreadChannel) await updateOverview(interaction.channel);
}

async function endGame(gameThread: ThreadChannel) {
  const gameObjectIndex = runningGames.findIndex(gme => gme.threadId === gameThread.id);
  const gameObject = runningGames[gameObjectIndex];
  const endMessage = generateInfoEmbed(gameObject.players, gameObject.creator, gameObject.startTime, (gameObject.startTime === -1 ? 0 : Date.now() - gameObject.startTime));
  await gameThread.send({ embeds: [endMessage] });
  const startMessage = await gameThread.fetchStarterMessage();
  await gameThread.setArchived(true);

  runningGames.splice(gameObjectIndex, 1);
  setTimeout(() => { //* not async/awaited
    startMessage.delete().catch(() => console.debug("could not delete starter message"));
  }, 180e3);
}

//TODO respond to interaction with overview
export async function playCard(interaction: MessageComponentInteraction, cardIndex: number, cardColor?: UnoColor) {
  const gameObject = runningGames.find(gme => gme.threadId === interaction.channelId);
  if (!gameObject || !interaction.channel?.isThread()) return;

  // reply within 3 seconds
  await interaction.reply({ content: lang.yourCards, ephemeral: true });

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
    await interaction.editReply({ content: lang.callUnoBeforePlaying });
    gameObject.gameState.waitingForUno = true;

    const callCollector = await (interaction.message as Message).awaitMessageComponent({ componentType: "BUTTON", filter: c => c.customId === "uno-calluno", time: 10e3 }).catch(() => false as const);
    if (!callCollector) {
      // player didn't call uno
      handCards.push(...takeRandomCards(2, gameObject.gameState.cardsInStack, getAllUnoCards));
      await interaction.editReply({ content: lang.didntCallUno });
    }
    gameObject.gameState.waitingForUno = false;
  } else if (handCards.length === 0) {
    //TODO end game
    await updateOverview(interaction.channel);
    await interaction.editReply(lang.youWin);
    await interaction.followUp({ embeds: [new MessageEmbed(WIN_EMBED).setAuthor(lang.congrats.replace("{0}", interaction.user.username))] });
    if (interaction.channel.isThread()) {
      endGame(interaction.channel);
    }
    return;
  }

  // set next player
  if (card.type === UnoType.REVERSE) {
    gameObject.gameState.playingDirection *= -1;
  }

  if (!(card.type === UnoType.REVERSE && gameObject.players.length === 2)) {
    gameObject.gameState.setNextPlayer(gameObject.players.length);
  }
  const nextPlayerId = gameObject.players[gameObject.gameState.upNow];
  // special effects
  //TODO +2 stacking
  switch (card.type) {
    case UnoType.SKIP: {
      gameObject.gameState.setNextPlayer(gameObject.players.length);
      // 0, 1
      // -1 -> 1
      // -1 + 2 -> 1

      // 0, 1, 2, 3
      // -1 -> 3
      // -1 + 4 -> 3
      break;
    }
    case UnoType.DRAW_TWO: {
      gameObject.gameState.cardsToTake += 2;
      await interaction.channel.send({ embeds: [new MessageEmbed(BASE_EMB).setDescription(lang.drawCards.replace("{0}", nextPlayerId).replace("{1}", gameObject.gameState.cardsToTake.toFixed()))] });
      break;
    }
    case UnoType.WILD_DRAW_FOUR: {
      gameObject.gameState.handCards[nextPlayerId].push(...takeRandomCards(4, gameObject.gameState.cardsInStack, getAllUnoCards)); //? "null pointer" 
      await interaction.channel.send({ embeds: [new MessageEmbed(BASE_EMB).setDescription(lang.drawCardsFour.replace("{0}", nextPlayerId))] });
      break;
    }
  }

  await updateHandCards(interaction);
  await updateOverview(interaction.channel);
}

export function giveCardsToPlayer(playerId: string, thread: ThreadChannel, count: number) {
  const gameObject = runningGames.find(gme => gme.threadId === thread.id);
  if (!gameObject) return;

  gameObject.gameState.handCards[playerId].push(...takeRandomCards(count, gameObject.gameState.cardsInStack, getAllUnoCards)); //? "null pointer"
  if (!gameObject.gameState.cardsTaken[playerId]) gameObject.gameState.cardsTaken[playerId] = 0;
  gameObject.gameState.cardsTaken[playerId] += count;
}

export function isAllowedToPlay(interaction: MessageComponentInteraction, skipUnoWait: boolean = false) {
  // needs to be a thread
  if (!isGameThread(interaction.channelId) || !interaction.channel?.isThread()) return interaction.reply({ embeds: [new MessageEmbed(ERR_BASE).setFooter(lang.gameNotActive)], ephemeral: true });

  const game = getGameFromThread(interaction.channelId);
  if (!game) return;
  const { gameState, players } = game;
  // nedds to be in the game
  if (!players.includes(interaction.user.id)) return interaction.reply({ embeds: [new MessageEmbed(ERR_BASE).setFooter(lang.gameNotPlaying)], ephemeral: true });

  // needs to be the next player
  if (players[gameState.upNow] !== interaction.user.id) return interaction.reply({ embeds: [new MessageEmbed(ERR_BASE).setDescription(lang.notYourTurn)], ephemeral: true });
  //? needs to have enough cards
  // not waiting for uno
  if (!skipUnoWait && gameState.waitingForUno) return interaction.reply({ embeds: [new MessageEmbed(ERR_BASE).setDescription(lang.needToCallUno)], ephemeral: true });

  // latest card message
  if (gameState.cardDisplayIds[interaction.user.id] !== interaction.message.id) return interaction.reply({ embeds: [new MessageEmbed(ERR_BASE).setFooter(lang.cardsOutdated)], ephemeral: true });
  return true;
}

export function isPlaying(userId: string, channelId: string): boolean {
  const gameObject = getGameFromThread(channelId);
  if (!gameObject) return false;
  return gameObject.players.includes(userId);
}