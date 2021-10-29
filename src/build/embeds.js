"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TUTORIAL_EMBED = exports.ADD_EMBED = void 0;
const discord_js_1 = require("discord.js");
const primaryColor = "#04F089";
exports.ADD_EMBED = new discord_js_1.MessageEmbed()
    .setTitle(":partying_face: Thank you for adding me to your server! Get an Overview of the next steps with /tutorial")
    .setTimestamp()
    .setColor("#F45886");
exports.TUTORIAL_EMBED = new discord_js_1.MessageEmbed()
    .setColor(primaryColor)
    .setTitle("Next steps to set me up:")
    .addField("`/adminrole` `role`", "By default only the admin can use certain commands! With this command, he can also give permission to a specific role.")
    .addField("`/gamechannel` `channel`", "I need to know, where all the gaming action should take place. The only way i know is if you tell it me trough this command.");
