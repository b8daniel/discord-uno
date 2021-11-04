import { ButtonInteraction, MessageAttachment, MessageEmbed, TextChannel } from "discord.js";
import { BASE_EMB, ERR_BASE } from "../embeds";
import { createGame, getGamefromUser, getHandCardsForPlayer, isGameThread } from "../games";
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
    const generatedCards = await getHandCardsForPlayer(interaction.user, interaction.channelId);

    if (!generatedCards) interaction.editReply({ content: "You aren't playing in this game" });
    else {
      const cardsFile = new MessageAttachment(generatedCards.toBuffer("image/png"), "handcards.png");
      interaction.editReply({ files: [cardsFile] });
    }
  }
}

export async function userChangeInGame() { }