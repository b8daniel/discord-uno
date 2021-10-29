import { MessageEmbed } from "discord.js";

const primaryColor = "#04F089";

export const ADD_EMBED = new MessageEmbed()
  .setTitle(":partying_face: Thank you for adding me to your server! Get an Overview of the next steps with /tutorial")
  .setTimestamp()
  .setColor("#F45886");

export const TUTORIAL_EMBED = new MessageEmbed()
  .setColor(primaryColor)
  .setTitle("Next steps to set me up:")
  .addField("`/adminrole` `role`", "By default only the admin can use certain commands! With this command, he can also give permission to a specific role.")
  .addField("`/gamechannel` `channel`", "I need to know, where all the gaming action should take place. The only way i know is if you tell it me trough this command.");