import { ButtonInteraction, TextChannel } from "discord.js";
import { BASE_EMB, ERR_BASE } from "../embeds";
import { createGame, getGame } from "../games";
import { interactionListener } from "../interactions";

export default class UNOButtons {

  @interactionListener("uno-creategame", "MESSAGE_COMPONENT")
  async createNewGame(interaction: ButtonInteraction) {
    const currentlyPlaying = getGame(interaction.user.id);

    if (currentlyPlaying) return interaction.reply({ embeds: [BASE_EMB.setDescription(`You are currently playing in <#${currentlyPlaying.threadId}>`)], ephemeral: true });
    if (!(interaction.channel instanceof TextChannel)) return interaction.reply({ embeds: [ERR_BASE.setFooter("The game channel should be a text-channel")] });

    const gameThread = await createGame(interaction.user, interaction.channel);

    interaction.reply({ embeds: [BASE_EMB.setDescription(`started new game in ${gameThread}`)], ephemeral: true });
  }

  @interactionListener("uno-getcards", "MESSAGE_COMPONENT")
  giveCards(interaction: ButtonInteraction) {
    interaction.reply({ content: "your secret cards go here", ephemeral: true });
  }
}

export async function userChangeInGame() { }