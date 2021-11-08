import { ButtonInteraction, Message, MessageEmbed, SelectMenuInteraction, TextChannel } from "discord.js";
import { BASE_EMB, ERR_BASE } from "../embeds";
import { createGame, getGameFromThread, getGamefromUser, giveCardsToPlayer, isAllowedToPlay, isGameThread, isPlaying, playCard, updateHandCards, updateOverview } from "../games";
import { UnoColor } from "../images";
import { interactionListener } from "../interactions";

export default class UNOButtons {

  @interactionListener("uno-creategame", "MESSAGE_COMPONENT")
  async createNewGame(interaction: ButtonInteraction) {
    const currentlyPlaying = getGamefromUser(interaction.user.id);

    if (currentlyPlaying) return interaction.reply({ embeds: [BASE_EMB.setDescription(`You are currently playing in <#${currentlyPlaying.threadId}>`)], ephemeral: true });
    if (!(interaction.channel instanceof TextChannel)) return interaction.reply({ embeds: [ERR_BASE.setFooter("The game channel should be a text-channel")] });

    await createGame(interaction.user, interaction.channel);

    interaction.deferUpdate();
  }

  @interactionListener("uno-getcards", "MESSAGE_COMPONENT")
  async giveCards(interaction: ButtonInteraction) {
    if (!isGameThread(interaction.channelId) || !interaction.channel.isThread()) return interaction.reply({ embeds: [new MessageEmbed(ERR_BASE).setFooter("this isn't an active game thread")], ephemeral: true });

    if (!isPlaying(interaction.user.id, interaction.channelId)) return interaction.reply({ embeds: [new MessageEmbed(ERR_BASE).setDescription("You are not playing in this game")], ephemeral: true });

    await interaction.reply({ content: "your cards", ephemeral: true });
    await updateHandCards(interaction);
  }

  @interactionListener("uno-placecard", "MESSAGE_COMPONENT")
  async placeCard(interaction: SelectMenuInteraction) {
    if (!(await isAllowedToPlay(interaction))) return;

    const gameObject = getGameFromThread(interaction.channelId);
    const gameState = gameObject.gameState;
    const cards = gameState.handCards[interaction.user.id];
    const [cardIndex, color] = interaction.values[0].split("_").map(Number);
    const selectedCard = cards[cardIndex];
    const lastPlayedCard = gameState.lastPlayedCards[gameState.lastPlayedCards.length - 1];

    if (gameObject.players[gameState.upNow] === interaction.user.id) {
      if (
        selectedCard.color === UnoColor.BLACK
        || lastPlayedCard.color === UnoColor.BLACK // only happens if the start card is black, so it's fine
        || selectedCard.color === lastPlayedCard.color
        || selectedCard.type === lastPlayedCard.type) {
        // valid card
        return await playCard(interaction, cardIndex, color);

      } else {
        // invalid card
        return interaction.reply({ embeds: [new MessageEmbed(ERR_BASE).setDescription("You can't play this card")], ephemeral: true });
      }
    } else {
      // not up now
      interaction.reply({ embeds: [new MessageEmbed(ERR_BASE).setDescription("It's not your turn")], ephemeral: true });
    }
  }

  // @interactionListener("uno-wildcolorselector", "MESSAGE_COMPONENT")
  // async selectColor(interaction: SelectMenuInteraction) {
  //   interaction.reply({ embeds: [new MessageEmbed(BASE_EMB).setDescription("select the color!")], ephemeral: true });
  // }

  @interactionListener("uno-calluno", "MESSAGE_COMPONENT")
  async callUno(interaction: ButtonInteraction) {
    if (!(await isAllowedToPlay(interaction, true))) return;
    await interaction.reply({ embeds: [new MessageEmbed(BASE_EMB).setDescription(`<@${interaction.user.id}> called uno!`)] });
    const unoMessage = await interaction.fetchReply();
    if (!(unoMessage instanceof Message)) return;

    setTimeout(() => {
      unoMessage.delete().catch();
    }, 30e3);
  }

  @interactionListener("uno-takecard", "MESSAGE_COMPONENT")
  async takeCard(interaction: ButtonInteraction) {
    if (!(await isAllowedToPlay(interaction)) || !interaction.channel.isThread()) return;

    const gameObject = getGameFromThread(interaction.channelId);

    if (gameObject.gameState.cardsTaken[interaction.user.id] > 0) return interaction.reply({ embeds: [new MessageEmbed(ERR_BASE).setDescription("You already took a card")], ephemeral: true });

    giveCardsToPlayer(interaction.user.id, interaction.channel, 1);

    await interaction.deferReply({ ephemeral: true });

    await updateHandCards(interaction);
    await updateOverview(interaction.channel);

  }

  @interactionListener("uno-putnocard", "MESSAGE_COMPONENT")
  async putNoCard(interaction: ButtonInteraction) {
    if (!(await isAllowedToPlay(interaction)) || !interaction.channel.isThread()) return;

    const gameObject = getGameFromThread(interaction.channelId);

    if (gameObject.gameState.cardsTaken[interaction.user.id] > 0) {
      gameObject.gameState.upNow = (gameObject.gameState.upNow + gameObject.players.length + gameObject.gameState.playingDirection) % gameObject.players.length;
      gameObject.gameState.cardsTaken[interaction.user.id] = 0;
      await interaction.deferUpdate();
      await updateOverview(interaction.channel); // to show who is next
    } else {
      interaction.reply({ embeds: [new MessageEmbed(ERR_BASE).setDescription("You can't skip if you didn't take a card")], ephemeral: true });
    }
  }
}
