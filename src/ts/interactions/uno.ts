import { ButtonInteraction, Interaction, Message, MessageActionRow, MessageComponentInteraction, MessageEmbed, MessageSelectMenu, SelectMenuInteraction, TextChannel, ThreadChannel } from "discord.js";
import { BASE_EMB, ERR_BASE } from "../embeds";
import { createGame, getGameFromThread, getGamefromUser, giveCardsToPlayer, isGameThread, playCard, unoColorEmojis, updateHandCards, updateOverview } from "../games";
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

    await interaction.reply({ content: "your cards", ephemeral: true });
    await updateHandCards(interaction);
  }

  @interactionListener("uno-placecard", "MESSAGE_COMPONENT")
  async placeCard(interaction: SelectMenuInteraction) {
    if (!isGameThread(interaction.channelId) || !interaction.channel.isThread()) return interaction.reply({ embeds: [new MessageEmbed(ERR_BASE).setFooter("this isn't an active game thread")], ephemeral: true });

    const gameObject = getGameFromThread(interaction.channelId);
    const gameState = gameObject.gameState;

    if (gameState.cardDisplayIds[interaction.user.id] !== interaction.message.id) return interaction.reply({ embeds: [new MessageEmbed(ERR_BASE).setFooter("these cards are outdated")], ephemeral: true });

    const cards = gameState.handCards[interaction.user.id];
    const cardIndex = Number(interaction.values.pop());
    const selectedCard = cards[cardIndex];
    const lastPlayedCard = gameState.lastPlayedCards[gameState.lastPlayedCards.length - 1];

    if (gameObject.players[gameState.upNow] === interaction.user.id) {
      if (selectedCard.color === UnoColor.BLACK || selectedCard.color === lastPlayedCard.color || selectedCard.type === lastPlayedCard.type) {
        // valid card
        if (selectedCard.color !== UnoColor.BLACK) {
          // if the card is not a black card, we can play it
          await interaction.reply({ content: "your cards:", ephemeral: true });
          return await playCard(interaction, cardIndex);
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
        return interaction.reply({ embeds: [new MessageEmbed(ERR_BASE).setDescription("You can't play this card")], ephemeral: true });
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
    if (!isGameThread(interaction.channelId) || !interaction.channel.isThread()) return interaction.reply({ embeds: [new MessageEmbed(ERR_BASE).setFooter("this isn't an active game thread")], ephemeral: true });
    const gameObject = getGameFromThread(interaction.channelId);

    if (gameObject.players[gameObject.gameState.upNow] !== interaction.user.id) return interaction.reply({ embeds: [new MessageEmbed(ERR_BASE).setDescription("It's not your turn")], ephemeral: true });

    if (gameObject.gameState.cardsTaken[interaction.user.id] > 0) return interaction.reply({ embeds: [new MessageEmbed(ERR_BASE).setDescription("You already took a card")], ephemeral: true });

    giveCardsToPlayer(interaction.user.id, interaction.channel, 1);

    await interaction.deferReply({ ephemeral: true });

    await updateHandCards(interaction);
    await updateOverview(interaction.channel);

  }

  @interactionListener("uno-putnocard", "MESSAGE_COMPONENT")
  async putNoCard(interaction: ButtonInteraction) {
    if (!isGameThread(interaction.channelId) || !interaction.channel.isThread()) return interaction.reply({ embeds: [new MessageEmbed(ERR_BASE).setFooter("this isn't an active game thread")], ephemeral: true });
    const gameObject = getGameFromThread(interaction.channelId);

    if (gameObject.players[gameObject.gameState.upNow] === interaction.user.id) {
      if (gameObject.gameState.cardsTaken[interaction.user.id] > 0) {
        gameObject.gameState.upNow = (gameObject.gameState.upNow + gameObject.gameState.playingDirection) % gameObject.players.length;
        gameObject.gameState.cardsTaken[interaction.user.id] = 0;
        interaction.deferUpdate();
      } else {
        interaction.reply({ embeds: [new MessageEmbed(ERR_BASE).setDescription("You can't skip if you didn't take a card")], ephemeral: true });
      }
    } else {
      interaction.reply({ embeds: [new MessageEmbed(ERR_BASE).setDescription("It's not your turn")], ephemeral: true });
    }
  }
}
