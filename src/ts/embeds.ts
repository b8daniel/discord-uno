import { MessageActionRow, MessageButton, MessageEmbed, MessageOptions } from "discord.js";

type MessageOptionComponents = MessageOptions["components"];

export const primaryColor = "#04F089";

export const ERR_BASE = new MessageEmbed()
  .setColor("RED")
  .setTitle("An error accoured!");

export const BASE_EMB = new MessageEmbed()
  .setColor(primaryColor);

export const ADD_EMBED = new MessageEmbed()
  .setTitle(":partying_face: Thank you for adding me to your server! Get an Overview of the next steps with /tutorial")
  .setTimestamp()
  .setColor("#F45886");

export const TUTORIAL_EMBED_ADMIN = new MessageEmbed(BASE_EMB)
  .setTitle("Next steps for an admin to set me up:")
  .addField("`/admin gamechannel` `channel`", "I need to know, where all the gaming action should take place. The only way i know is if you tell it me trough this command.");

export const TUTORIAL_EMBED_USER = new MessageEmbed(BASE_EMB)
  .setTitle("How to...")
  .addField("play games", "go into the gamechannel of this server and select a game to play!");

export const ERR_ONLY_IN_GUILD = new MessageEmbed()
  .setColor("DARK_RED")
  .setTitle("This is only availeable in a guild.");

export const ERR_ONLY_AS_ADMIN = new MessageEmbed()
  .setColor("DARK_RED")
  .setTitle("This is only availeable for admins of a guild.");

export const GAME_CONTROLS = new MessageEmbed(BASE_EMB)
  .setTitle("⚔️ Use the button to start a game! 🎮");

export const GAME_CONTROL_COMPONENTS: MessageOptionComponents = [
  new MessageActionRow().addComponents(
    new MessageButton().setStyle("SUCCESS").setEmoji("🎮").setLabel("new game").setCustomId("uno-creategame")
  )
];

export const JOIN_GAME_EMBED = new MessageEmbed(BASE_EMB)
  .setDescription("Join the thread to join the game!");

export const INGAME_OVERVIEW = new MessageEmbed()
  .setImage("attachment://overview.png");

export const INGAME_COMPONENTS: MessageOptionComponents = [
  new MessageActionRow().addComponents(
    new MessageButton().setStyle("PRIMARY").setEmoji("🎴").setLabel("hand cards").setCustomId("uno-getcards")
  )
];

export const HAND_CARD_COMPONENTS: MessageOptionComponents = [
  new MessageActionRow().addComponents(
    new MessageButton().setStyle("DANGER").setEmoji("💥").setLabel("uno").setCustomId("uno-calluno"),
    new MessageButton().setStyle("SECONDARY").setLabel("take a card").setCustomId("uno-takecard"),
    new MessageButton().setStyle("SECONDARY").setLabel("can't put a card").setCustomId("uno-putnocard"),
  )
];
