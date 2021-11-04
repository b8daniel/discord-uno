import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction, MessageAttachment } from "discord.js";
import { generateCards, generateOverview, UnoColor, UnoType } from "../images";
import { commandStorage, interactionListener } from "../interactions";

export default class CanvasCommand {

  @interactionListener("canvas", "APPLICATION_COMMAND")
  async onCommand(interaction: CommandInteraction) {
    await interaction.deferReply();
    switch (interaction.options.getSubcommand()) {
      case "overview": {
        const generatedCanvas = await generateOverview({
          playedCards: [
            {
              type: UnoType.ONE,
              color: UnoColor.RED
            },
            {
              type: UnoType.NINE,
              color: UnoColor.GREEN
            },
            {
              type: UnoType.ONE,
              color: UnoColor.BLUE
            },
          ],
          players: [
            {
              name: "BlxckDxn1",
              cardsLeft: 2,
            },
            {
              name: "BlxckDxn",
              cardsLeft: 1,
            },
            {
              name: "BlxckDx",
              cardsLeft: 22,
            },
            {
              name: "BlxckD",
              cardsLeft: 12,
            },
            {
              name: "Blxck",
              cardsLeft: 11,
            },
          ],
          playingDirection: 1,
          upNow: 2
        });

        const overviewPng = new MessageAttachment(generatedCanvas.toBuffer("image/png"), "overview.png");

        await interaction.editReply({ files: [overviewPng] });
        break;
      }
      case "cards": {
        const generatedCanvas = await generateCards([
          {
            color: UnoColor.GREEN,
            type: UnoType.REVERSE,
          },
          {
            color: UnoColor.BLACK,
            type: UnoType.CHOOSE_FOUR
          }
        ]);

        interaction.editReply({
          files: [
            new MessageAttachment(generatedCanvas.toBuffer(), "cards.png")
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
        .addSubcommand(cmd => cmd.setName("cards").setDescription("gives a test card overview"))
    ];
  }
}