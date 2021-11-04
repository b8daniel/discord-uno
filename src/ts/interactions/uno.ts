import { ButtonInteraction, Message, MessageActionRow, MessageAttachment, MessageButton, MessageComponentInteraction, MessageEmbed, MessageSelectMenu, SelectMenuInteraction, TextChannel, ThreadChannel } from "discord.js";
import { BASE_EMB, ERR_BASE, HAND_CARD_COMPONENTS } from "../embeds";
import { createGame, getGameFromThread, getGamefromUser, getHandCardsForPlayer, isGameThread, playCard, setCardDisplayForPlayer } from "../games";
import { generateCards, UnoColor, UnoType } from "../images";
import { interactionListener } from "../interactions";



export default class UNOButtons {

  @interactionListener("uno-creategame", "MESSAGE_COMPONENT")
  async createNewGame(interaction: ButtonInteraction) {
    const currentlyPlaying = getGamefromUser(interaction.user.id);

    if (currentlyPlaying) return interaction.reply({ embeds: [BASE_EMB.setDescription(`You are currently playing in <#${currentlyPlaying.threadId}>`)], ephemeral: true });
    if (!(interaction.channel instanceof TextChannel)) return interaction.reply({ embeds: [ERR_BASE.setFooter("The game channel should be a text-channel")] });

    const gameThread = await createGame(interaction.user, interaction.channel);

    interaction.reply({ embeds: [BASE_EMB.setDescription(`started new game in ${gameThread}`)], ephemeral: true });
  }

  @interactionListener("uno-getcards", "MESSAGE_COMPONENT")
  async giveCards(interaction: ButtonInteraction) {
    if (!isGameThread(interaction.channelId)) return interaction.reply({ embeds: [new MessageEmbed(ERR_BASE).setFooter("this isn't an active game thread")] });

    await interaction.deferReply({ ephemeral: true });
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

    const cardDisplay = await interaction.editReply({ files: [cardsFile], components: [cardSelector, ...HAND_CARD_COMPONENTS,] });
    setCardDisplayForPlayer(interaction.user.id, cardDisplay.id, interaction.channelId);
  }

  @interactionListener("uno-placecard", "MESSAGE_COMPONENT")
  async placeCard(interaction: SelectMenuInteraction) {
    if (!isGameThread(interaction.channelId)) return interaction.reply({ embeds: [new MessageEmbed(ERR_BASE).setFooter("this isn't an active game thread")], ephemeral: true });

    const gameObject = getGameFromThread(interaction.channelId);
    const gameState = gameObject.gameState;
    const cards = gameState.handCards[interaction.user.id];
    const cardIndex = Number(interaction.values.pop());
    const selectedCard = cards[cardIndex];
    const lastPlayedCard = gameState.lastPlayedCards[gameState.lastPlayedCards.length - 1];

    if (gameObject.players[gameState.upNow] === interaction.user.id) {
      if (selectedCard.color === UnoColor.BLACK || selectedCard.color === lastPlayedCard.color || selectedCard.type === lastPlayedCard.type) {
        // valid card
        if (selectedCard.color !== UnoColor.BLACK) {
          // if the card is not a black card, we can play it
          return await playCard(interaction.user.id, interaction.channel, cardIndex);
        } else {
          // if the card is a black card, we need to ask the player what color they want to play it as
          const colorSelector = new MessageActionRow().addComponents(
            new MessageSelectMenu().setCustomId("uno-wildcolorselector").setPlaceholder("choose a color").addOptions(
              Object.keys(unoColorEmojis).map((color) => ({
                label: unoColorEmojis[color],
                value: `${cardIndex}_${color}`,
              }))
            ),
          );
          // block further actions until the user selects a color
          if (!(interaction.message instanceof Message)) return; // shoud never happen only for typescript
          await interaction.message.edit({ components: [colorSelector] });

          return interaction.reply({ embeds: [new MessageEmbed(BASE_EMB).setDescription("select the color!")], ephemeral: true });
        }
      } else {
        // invalid card
        return interaction.reply({ embeds: [new MessageEmbed(ERR_BASE).setDescription("You can't play this card")] });
      }
    } else {
      // not up now
      interaction.reply({ embeds: [new MessageEmbed(ERR_BASE).setDescription("It's not your turn")], ephemeral: true });
    }
  }

  @interactionListener("uno-wildcolorselector", "MESSAGE_COMPONENT")
  async selectColor(interaction: SelectMenuInteraction) {
    interaction.reply({ embeds: [new MessageEmbed(BASE_EMB).setDescription("select the color!")], ephemeral: true });
  }

  @interactionListener("uno-calluno", "MESSAGE_COMPONENT")
  async callUno(interaction: ButtonInteraction) {
    interaction.reply({ embeds: [new MessageEmbed(BASE_EMB).setDescription("called UNO!")], ephemeral: true });
  }

  @interactionListener("uno-takecard", "MESSAGE_COMPONENT")
  async takeCard(interaction: ButtonInteraction) {
    if (!isGameThread(interaction.channelId)) return interaction.reply({ embeds: [new MessageEmbed(ERR_BASE).setFooter("this isn't an active game thread")], ephemeral: true });

    interaction.
  }

  @interactionListener("uno-putnocard", "MESSAGE_COMPONENT")
  async putNoCard(interaction: ButtonInteraction) {
    interaction.reply({ embeds: [new MessageEmbed(BASE_EMB).setDescription("put no card!")], ephemeral: true });
  }
}
