"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.INVITE_EMBED_BOT = exports.INVITE_EMBED_SPONSOR = exports.WIN_EMBED = exports.HAND_CARD_COMPONENTS = exports.INGAME_COMPONENTS = exports.INGAME_OVERVIEW = exports.JOIN_GAME_EMBED = exports.GAME_CONTROL_COMPONENTS = exports.GAME_CONTROLS = exports.ERR_ONLY_AS_ADMIN = exports.ERR_ONLY_IN_GUILD = exports.TUTORIAL_EMBED_USER = exports.TUTORIAL_EMBED_ADMIN = exports.ADD_EMBED = exports.BASE_EMB = exports.ERR_BASE = exports.primaryColor = void 0;
const discord_js_1 = require("discord.js");
const config_1 = require("./config");
exports.primaryColor = "#04F089";
exports.ERR_BASE = new discord_js_1.MessageEmbed()
    .setColor("#ED4245")
    .setTitle("An error accoured!");
exports.BASE_EMB = new discord_js_1.MessageEmbed()
    .setColor(exports.primaryColor);
exports.ADD_EMBED = new discord_js_1.MessageEmbed()
    .setTitle(":partying_face: Thank you for adding me to your server! Get an Overview of the next steps with /tutorial")
    .setTimestamp()
    .setColor("#F45886");
exports.TUTORIAL_EMBED_ADMIN = new discord_js_1.MessageEmbed(exports.BASE_EMB)
    .setTitle("Next steps for an admin to set me up:")
    .addField("`/admin gamechannel` `channel`", "I need to know, where all the gaming action should take place. The only way i know is if you tell it me trough this command.");
exports.TUTORIAL_EMBED_USER = new discord_js_1.MessageEmbed(exports.BASE_EMB)
    .setTitle("How to...")
    .addField("play games", "go into the gamechannel of this server and select a game to play!");
exports.ERR_ONLY_IN_GUILD = new discord_js_1.MessageEmbed(exports.ERR_BASE)
    .setTitle("This is only availeable in a guild.");
exports.ERR_ONLY_AS_ADMIN = new discord_js_1.MessageEmbed(exports.ERR_BASE)
    .setTitle("This is only availeable for admins of a guild.");
exports.GAME_CONTROLS = new discord_js_1.MessageEmbed(exports.BASE_EMB)
    .setTitle("⚔️ Use the button to start a game! 🎮");
exports.GAME_CONTROL_COMPONENTS = [
    new discord_js_1.MessageActionRow().addComponents(new discord_js_1.MessageButton().setStyle("SUCCESS").setEmoji("🎮").setLabel("new game").setCustomId("uno-creategame"))
];
exports.JOIN_GAME_EMBED = new discord_js_1.MessageEmbed(exports.BASE_EMB)
    .setDescription("Join the thread to join the game!");
exports.INGAME_OVERVIEW = new discord_js_1.MessageEmbed()
    .setImage("attachment://overview.png");
exports.INGAME_COMPONENTS = [
    new discord_js_1.MessageActionRow().addComponents(new discord_js_1.MessageButton().setStyle("PRIMARY").setEmoji("🎴").setLabel("hand cards").setCustomId("uno-getcards"))
];
exports.HAND_CARD_COMPONENTS = [
    new discord_js_1.MessageActionRow().addComponents(new discord_js_1.MessageButton().setStyle("DANGER").setEmoji("💥").setLabel("uno").setCustomId("uno-calluno"), new discord_js_1.MessageButton().setStyle("SECONDARY").setLabel("take a card").setCustomId("uno-takecard"), new discord_js_1.MessageButton().setStyle("SECONDARY").setLabel("can't put a card").setCustomId("uno-putnocard"))
];
exports.WIN_EMBED = new discord_js_1.MessageEmbed(exports.BASE_EMB)
    .setThumbnail("https://c.tenor.com/RVfiMRcRJDoAAAAC/confetti-celebrate.gif")
    .setTitle("you won!")
    .setDescription(":confetti_ball: :tada: :partying_face: :tada: :confetti_ball:");
exports.INVITE_EMBED_SPONSOR = new discord_js_1.MessageEmbed(exports.BASE_EMB)
    .setTitle("Join our server!")
    .setDescription(config_1.sponsorDescription)
    .setURL(config_1.sponsorInvite || config_1.botInvite || "https://discord.com");
exports.INVITE_EMBED_BOT = new discord_js_1.MessageEmbed(exports.BASE_EMB)
    .setTitle("Add this bot to your server")
    .setDescription("You will then be able to play UNO on your server with your friends!")
    .setURL(config_1.botInvite);
