import { MessageActionRow, MessageButton, MessageEmbed, MessageOptions } from "discord.js";
import { botInvite, sponsorDescription, sponsorInvite } from "../config";

type MessageOptionComponents = NonNullable<MessageOptions["components"]>;

export const primaryColor = "#04F089";

export const ERR_BASE = new MessageEmbed()
  .setColor("#ED4245")
  .setTitle("Ein Fehler ist aufgetreten!");

export const BASE_EMB = new MessageEmbed()
  .setColor(primaryColor);

export const ADD_EMBED = new MessageEmbed()
  .setTitle(":partying_face: Vielen dank fürs hinzufügen! Eine Übersicht über die nächsten Schritte bekommst du mit /tutorial")
  .setTimestamp()
  .setColor("#F45886");

export const TUTORIAL_EMBED_ADMIN = new MessageEmbed(BASE_EMB)
  .setTitle("Nächste Schritte um mich einzurichten:")
  .addField("`/admin gamechannel` `channel`", "Ich muss wissen, in welchem Kanal die Spiele gespielt werden sollen. Mit diesem Command kann man dies einstellen.");

export const TUTORIAL_EMBED_USER = new MessageEmbed(BASE_EMB)
  .setTitle("Wie kann ich...")
  .addField("ein Spiel spielen?", "Gehe in den Spiele-Kanal des Servers und klicke auf den Knopf an der angepinnten Nachricht.")
  .addField("eine Karte legen?", "Sobald du in einer Runde bist, kannst du mit dem Handkarten Knopf deine Handkarten einsehen. Dort kannst du in einem Menü die Karte anklicken und dadurch legen")
  .addField("eine Karte aufziehen?", "Um eine Karte aufzuziehen, klicke einfach auf den entsprechenden Knopf. Dannach kannst du enweder eine Karte ablegen oder den Knopf 'ich kann keine Karte legen' verwenden.");

export const ERR_ONLY_IN_GUILD = new MessageEmbed(ERR_BASE)
  .setTitle("Diesen Command kann man nur in einem Server verwenden.");

export const ERR_ONLY_AS_ADMIN = new MessageEmbed(ERR_BASE)
  .setTitle("Dieser Command ist nur für Admins eines Servers verfügbar.");

export const GAME_CONTROLS = new MessageEmbed(BASE_EMB)
  .setTitle("⚔️ Benutze den Knopf, um ein Spiel zu starten! 🎮");

export const GAME_CONTROL_COMPONENTS: MessageOptionComponents = [
  new MessageActionRow().addComponents(
    new MessageButton().setStyle("SUCCESS").setEmoji("🎮").setLabel("neues Spiel").setCustomId("uno-creategame"),
    new MessageButton().setStyle("SECONDARY").setEmoji("🔔").setLabel("Rundenbenachrichtigungen an/aus").setCustomId("uno-creategame-notify"),
  )
];

export const JOIN_GAME_EMBED = new MessageEmbed(BASE_EMB)
  .setDescription("Tritt dem Thread bei, um am Spiel teilzunehmen!");


export const INGAME_COMPONENTS: MessageOptionComponents = [
  new MessageActionRow().addComponents(
    new MessageButton().setStyle("PRIMARY").setEmoji("🎴").setLabel("Handkarten bekommen").setCustomId("uno-getcards")
  )
];

export const HAND_CARD_COMPONENTS: MessageOptionComponents = [
  new MessageActionRow().addComponents(
    new MessageButton().setStyle("DANGER").setEmoji("💥").setLabel("UNO rufen").setCustomId("uno-calluno"),
    new MessageButton().setStyle("SECONDARY").setLabel("Eine Karte aufnehmen").setCustomId("uno-takecard"),
    new MessageButton().setStyle("SECONDARY").setLabel("Ich kann keine Karte legen").setCustomId("uno-putnocard"),
  )
];

export const WIN_EMBED = new MessageEmbed(BASE_EMB)
  .setThumbnail("https://c.tenor.com/RVfiMRcRJDoAAAAC/confetti-celebrate.gif")
  .setTitle("du hast gewonnen!")
  .setDescription(":confetti_ball: :tada: :partying_face: :tada: :confetti_ball:");

export const INVITE_EMBED_SPONSOR = new MessageEmbed(BASE_EMB)
  .setTitle("Tritt unserem Server bei!")
  .setDescription(sponsorDescription)
  .setURL(sponsorInvite || botInvite || "https://discord.com");
export const INVITE_EMBED_BOT = new MessageEmbed(BASE_EMB)
  .setTitle("Füge diesen Bot zu deinem Server hinzu")
  .setDescription("Dannach kannst du auf deinem Server mit deinen Mitgliedern UNO spielen")
  .setURL(botInvite);

