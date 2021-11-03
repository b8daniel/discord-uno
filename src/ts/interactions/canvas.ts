import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction, MessageAttachment } from "discord.js";
import { generateCards, generateOverview, UnoColor, UnoType } from "../images";
import { commandStorage, interactionListener } from "../interactions";

export default class CanvasCommand {

  @interactionListener("canvas", "APPLICATION_COMMAND", true)
  onCommand(interaction: CommandInteraction) {
    switch (interaction.options.getSubcommand()) {
      case "overview": {
        interaction.editReply({
          files: [
            new MessageAttachment(generateOverview({
              playedCards: [
                {
                  type: UnoType.ONE,
                  color: UnoColor.RED
                },
                {
                  type: UnoType.ONE,
                  color: UnoColor.RED
                },
                {
                  type: UnoType.ONE,
                  color: UnoColor.RED
                },
              ],
              players: [
                {
                  name: "BlxckDxn1",
                  cardsLeft: 2,
                },
                {
                  name: "BlxckDxn1",
                  cardsLeft: 1,
                },
                {
                  name: "BlxckDxn1",
                  cardsLeft: 99,
                },
              ],
              playingDirection: 1,
              upNow: 2
            }).toBuffer(), "overview.png")
          ]
        });
      }
      case "cards": {
        interaction.editReply({
          files: [
            new MessageAttachment(generateCards([
              {
                color: UnoColor.GREEN,
                type: UnoType.REVERSE,
              }
            ]).toBuffer(), "cards.png")
          ]
        });
      }
    }
  }

  @commandStorage()
  commands() {
    return [
      new SlashCommandBuilder().setName("canvas").setDescription("test out canvas functionality")
        .addSubcommand(cmd => cmd.setName("overview").setDescription("generate a test overview of a state"))
        .addSubcommand(cmd => cmd.setName("cards").setDescription("gives a test card overview")
        )
    ];
  }
}