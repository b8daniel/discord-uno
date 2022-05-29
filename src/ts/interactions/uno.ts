import {
  ButtonInteraction,
  GuildMemberRoleManager,
  Message,
  MessageEmbed,
  SelectMenuInteraction,
  TextChannel,
} from "discord.js";
import { notifyRoleId } from "../config";
import { BASE_EMB, ERR_BASE } from "../embeds";
import {
  createGame,
  getGameFromThread,
  getGamefromUser,
  giveCardsToPlayer,
  isAllowedToPlay,
  isGameThread,
  isPlaying,
  playCard,
  updateHandCards,
  updateOverview,
} from "../games";
import { UnoColor, UnoType } from "../images";
import { interactionListener } from "../interactions";
import { lang } from "../lang";

export default class UNOButtons {
  @interactionListener("uno-creategame", "MESSAGE_COMPONENT")
  async createNewGame(interaction: ButtonInteraction) {
    const currentlyPlaying = getGamefromUser(interaction.user.id);

    if (currentlyPlaying)
      return interaction.reply({
        embeds: [BASE_EMB.setDescription(lang.playingIn.replace("{0}", currentlyPlaying.threadId))],
        ephemeral: true,
      });
    if (!(interaction.channel instanceof TextChannel))
      return interaction.reply({
        embeds: [ERR_BASE.setFooter(lang.channelNotText)],
        ephemeral: true,
      });

    await createGame(interaction.user, interaction.channel);

    interaction.deferUpdate();
  }

  @interactionListener("uno-creategame-notify", "MESSAGE_COMPONENT")
  async wantsToToggleNotified(interaction: ButtonInteraction) {
    const role = interaction.guild?.roles.resolve(notifyRoleId);
    if (!role)
      return interaction.reply({
        embeds: [new MessageEmbed(ERR_BASE).setDescription(lang.roleNotFound)],
        ephemeral: true,
      });

    if (role.members.has(interaction.user.id)) {
      await (interaction.member.roles as GuildMemberRoleManager).remove(role);
      return interaction.reply({
        embeds: [new MessageEmbed(BASE_EMB).setDescription(lang.notifyOff)],
        ephemeral: true,
      });
    } else {
      await (interaction.member.roles as GuildMemberRoleManager).add(role);
      return interaction.reply({
        embeds: [new MessageEmbed(BASE_EMB).setDescription(lang.notifyOn)],
        ephemeral: true,
      });
    }
  }

  @interactionListener("uno-getcards", "MESSAGE_COMPONENT")
  async giveCards(interaction: ButtonInteraction) {
    if (!isGameThread(interaction.channelId) || !interaction.channel?.isThread())
      return interaction.reply({
        embeds: [new MessageEmbed(ERR_BASE).setFooter(lang.gameNotActive)],
        ephemeral: true,
      });

    if (!isPlaying(interaction.user.id, interaction.channelId))
      return interaction.reply({
        embeds: [new MessageEmbed(ERR_BASE).setDescription(lang.gameNotPlaying)],
        ephemeral: true,
      });

    await interaction.reply({ content: lang.yourCards, ephemeral: true });
    await updateHandCards(interaction);
  }

  @interactionListener("uno-placecard", "MESSAGE_COMPONENT")
  async placeCard(interaction: SelectMenuInteraction) {
    if (!(await isAllowedToPlay(interaction))) return;

    const gameObject = getGameFromThread(interaction.channelId);
    if (!gameObject) return;
    const gameState = gameObject.gameState;
    const cards = gameState.handCards[interaction.user.id];
    const [cardIndex, color] = interaction.values[0].split("_").map(Number);
    const selectedCard = cards[cardIndex];
    const lastPlayedCard = gameState.lastPlayedCards[gameState.lastPlayedCards.length - 1];

    if (gameObject.players[gameState.upNow] !== interaction.user.id)
      return await interaction.reply({
        embeds: [new MessageEmbed(ERR_BASE).setDescription(lang.notYourTurn)],
        ephemeral: true,
      });

    if (selectedCard.type !== UnoType.DRAW_TWO && gameState.cardsToTake > 0)
      return await interaction.reply({
        embeds: [
          new MessageEmbed(ERR_BASE).setDescription(
            lang.drawCards
              .replace("{0}", interaction.user.id)
              .replace("{1}", gameState.cardsToTake.toFixed())
          ),
        ],
        ephemeral: true,
      });

    if (
      selectedCard.color === UnoColor.BLACK ||
      lastPlayedCard.color === UnoColor.BLACK || // only happens if the start card is black, so it's fine
      selectedCard.color === lastPlayedCard.color ||
      selectedCard.type === lastPlayedCard.type
    ) {
      // valid card
      return await playCard(interaction, cardIndex, color);
    } else {
      // invalid card
      return interaction.reply({
        embeds: [new MessageEmbed(ERR_BASE).setDescription(lang.cantPlayCard)],
        ephemeral: true,
      });
    }
  }

  // @interactionListener("uno-wildcolorselector", "MESSAGE_COMPONENT")
  // async selectColor(interaction: SelectMenuInteraction) {
  //   interaction.reply({ embeds: [new MessageEmbed(BASE_EMB).setDescription("select the color!")], ephemeral: true });
  // }

  @interactionListener("uno-calluno", "MESSAGE_COMPONENT")
  async callUno(interaction: ButtonInteraction) {
    if (!(await isAllowedToPlay(interaction, true))) return;
    await interaction.reply({
      embeds: [
        new MessageEmbed(BASE_EMB).setDescription(lang.callUno.replace("{0}", interaction.user.id)),
      ],
    });
    const unoMessage = await interaction.fetchReply();
    if (!(unoMessage instanceof Message)) return;

    setTimeout(async () => {
      await unoMessage.delete().catch();
    }, 30e3);
  }

  @interactionListener("uno-takecard", "MESSAGE_COMPONENT")
  async takeCard(interaction: ButtonInteraction) {
    if (!(await isAllowedToPlay(interaction)) || !interaction.channel?.isThread()) return;

    const gameObject = getGameFromThread(interaction.channelId);
    if (!gameObject) return;

    if (gameObject.gameState.cardsTaken[interaction.user.id] > 0)
      return interaction.reply({
        embeds: [new MessageEmbed(ERR_BASE).setDescription(lang.tookCardAllready)],
        ephemeral: true,
      });

    giveCardsToPlayer(interaction.user.id, interaction.channel, 1);

    await interaction.deferReply({ ephemeral: true });

    await updateHandCards(interaction);
    await updateOverview(interaction.channel);
  }

  @interactionListener("uno-putnocard", "MESSAGE_COMPONENT")
  async putNoCard(interaction: ButtonInteraction) {
    if (!(await isAllowedToPlay(interaction)) || !interaction.channel?.isThread()) return;

    const gameObject = getGameFromThread(interaction.channelId);
    if (!gameObject) return;

    if (gameObject.gameState.cardsTaken[interaction.user.id] > 0) {
      gameObject.gameState.upNow =
        (gameObject.gameState.upNow +
          gameObject.players.length +
          gameObject.gameState.playingDirection) %
        gameObject.players.length;
      gameObject.gameState.cardsTaken[interaction.user.id] = 0;
      await interaction.deferUpdate();
      await updateOverview(interaction.channel); // to show who is next
    } else {
      interaction.reply({
        embeds: [new MessageEmbed(ERR_BASE).setDescription(lang.noCardTakenToSkip)],
        ephemeral: true,
      });
    }
  }
}
