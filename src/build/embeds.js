"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.INGAME_COMPONENTS = exports.INGAME_DASHBOARD = exports.JOIN_GAME_EMBED = exports.GAME_CONTROL_COMPONENTS = exports.GAME_CONTROLS = exports.BASE_EMB = exports.ERR_BASE = exports.ERR_ONLY_AS_ADMIN = exports.ERR_ONLY_IN_GUILD = exports.TUTORIAL_EMBED_USER = exports.TUTORIAL_EMBED_ADMIN = exports.ADD_EMBED = exports.primaryColor = void 0;
const discord_js_1 = require("discord.js");
exports.primaryColor = "#04F089";
exports.ADD_EMBED = new discord_js_1.MessageEmbed()
    .setTitle(":partying_face: Thank you for adding me to your server! Get an Overview of the next steps with /tutorial")
    .setTimestamp()
    .setColor("#F45886");
exports.TUTORIAL_EMBED_ADMIN = new discord_js_1.MessageEmbed()
    .setColor(exports.primaryColor)
    .setTitle("Next steps for an admin to set me up:")
    .addField("`/admin gamechannel` `channel`", "I need to know, where all the gaming action should take place. The only way i know is if you tell it me trough this command.");
exports.TUTORIAL_EMBED_USER = new discord_js_1.MessageEmbed()
    .setColor(exports.primaryColor)
    .setTitle("How to...")
    .addField("play games", "go into the gamechannel of this server and select a game to play!");
exports.ERR_ONLY_IN_GUILD = new discord_js_1.MessageEmbed()
    .setColor("DARK_RED")
    .setTitle("This is only availeable in a guild.");
exports.ERR_ONLY_AS_ADMIN = new discord_js_1.MessageEmbed()
    .setColor("DARK_RED")
    .setTitle("This is only availeable for admins of a guild.");
exports.ERR_BASE = new discord_js_1.MessageEmbed()
    .setColor("DARK_RED")
    .setTitle("An error accoured!");
exports.BASE_EMB = new discord_js_1.MessageEmbed()
    .setColor(exports.primaryColor);
exports.GAME_CONTROLS = new discord_js_1.MessageEmbed()
    .setColor(exports.primaryColor)
    .setTitle("⚔️ Use the buttons to start a game! 🎮");
exports.GAME_CONTROL_COMPONENTS = [
    new discord_js_1.MessageActionRow().addComponents(new discord_js_1.MessageButton().setStyle("SUCCESS").setEmoji("🎮").setLabel("new game").setCustomId("uno-creategame"))
];
exports.JOIN_GAME_EMBED = new discord_js_1.MessageEmbed()
    .setColor(exports.primaryColor)
    .setDescription("Join the thread to join the game!");
exports.INGAME_DASHBOARD = new discord_js_1.MessageEmbed()
    .setImage("attachment://test.jpg")
    .setTitle("Waiting for game to start.")
    .setDescription("Get your hand cards ready while you wait.");
exports.INGAME_COMPONENTS = [
    new discord_js_1.MessageActionRow().addComponents(new discord_js_1.MessageButton().setStyle("SECONDARY").setLabel("Card overview").setCustomId("uno-getcards"))
];
