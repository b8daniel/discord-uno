import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction, MessageActionRow, MessageButton, MessageComponentInteraction } from "discord.js";
import { TUTORIAL_EMBED } from "../embeds";
import { commandStorage, interactionListener } from "../interactions";

export default class Tutorial {

  @interactionListener("tutorial", "APPLICATION_COMMAND")
  onTutorialCommand(interaction: CommandInteraction) {
    const row = new MessageActionRow()
      .addComponents(
        new MessageButton()
          .setCustomId("tutorial-yes")
          .setLabel(randomItem(positiveWords))
          .setStyle("PRIMARY")
          .setEmoji(randomItem(positiveEmojis))
      );
    interaction.reply({ embeds: [TUTORIAL_EMBED], ephemeral: true, components: [row] });
  }

  @interactionListener("tutorial-yes", "MESSAGE_COMPONENT")
  onButtonInteract(interaction: MessageComponentInteraction) {
    interaction.reply({ content: `${randomItem(positiveWords).toLocaleUpperCase()}! ${randomItem(positiveEmojis)}`, ephemeral: true });
  }

  @commandStorage()
  commands() {
    return [
      new SlashCommandBuilder().setName("tutorial").setDescription("This command will to get started with the bot!")
    ];
  }
}

const positiveWords = [
  "amazing",
  "awesome",
  "blithesome",
  "excellent",
  "fabulous",
  "favorable",
  "fortuitous",
  "gorgeous",
  "incredible",
  "unique",
  "mirthful",
  "outstanding",
  "perfect",
  "philosophical",
  "propitious",
  "remarkable",
  "rousing",
  "spectacular",
  "splendid",
  "stellar",
  "stupendous",
  "super",
  "upbeat",
  "stunning",
  "wondrous",
];

const positiveEmojis = ["🥳", "👍", "👏", "🎈", "🎁", "👑", "💡", "💯", "🌟", "⭐", "✨", "🤩"];

function randomItem<T>(list: T[]): T {
  return list[Math.round(Math.random() * list.length) % list.length];
}