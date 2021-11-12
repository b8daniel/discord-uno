import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction, MessageActionRow, MessageButton, MessageComponentInteraction, Permissions } from "discord.js";
import { ERR_ONLY_IN_GUILD, TUTORIAL_EMBED_ADMIN, TUTORIAL_EMBED_USER } from "../embeds";
import { commandStorage, interactionListener } from "../interactions";
import { lang } from "../lang";

export default class TutorialCommand {

  @interactionListener("tutorial", "APPLICATION_COMMAND")
  onTutorialCommand(interaction: CommandInteraction) {
    if (!interaction.inGuild()) return interaction.reply({ embeds: [ERR_ONLY_IN_GUILD], ephemeral: true });
    const row = new MessageActionRow()
      .addComponents(
        new MessageButton()
          .setCustomId("tutorial-yes")
          .setLabel(randomItem(positiveWords))
          .setStyle("SUCCESS")
          .setEmoji(randomItem(positiveEmojis))
      );
    interaction.reply({ embeds: [TUTORIAL_EMBED_USER], ephemeral: true, components: [row] });
    if (interaction.memberPermissions.has(Permissions.FLAGS.ADMINISTRATOR)) {
      interaction.reply({ embeds: [TUTORIAL_EMBED_ADMIN], ephemeral: true });
    }
  }

  @interactionListener("tutorial-yes", "MESSAGE_COMPONENT")
  onButtonInteract(interaction: MessageComponentInteraction) {
    interaction.reply({ content: `${randomItem(positiveWords).toLocaleUpperCase()}! ${randomItem(positiveEmojis)}`, ephemeral: true });
  }

  @commandStorage()
  commands() {
    return [
      new SlashCommandBuilder().setName("tutorial").setDescription(lang.cmdTutorialDesc)
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