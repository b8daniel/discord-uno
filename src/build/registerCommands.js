"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("./config");
const rest_1 = require("@discordjs/rest");
const v9_1 = require("discord-api-types/v9");
const builders_1 = require("@discordjs/builders");
exports.default = async () => {
    const rest = new rest_1.REST({ version: '9' }).setToken(config_1.token);
    const commands = [
        new builders_1.SlashCommandBuilder().setName('ping').setDescription('Replies with pong!'),
        new builders_1.SlashCommandBuilder()
            .setName('setgamechannel')
            .setDescription("sets the chanel in which to start games in")
            .addChannelOption(b => b.setName("channel").setDescription("channel to use").setRequired(false))
            .setDefaultPermission(false),
    ].map(cmd => cmd.toJSON());
    await rest.put(process.env.NODE_ENV === "DEV" ? v9_1.Routes.applicationGuildCommands(config_1.clientId, config_1.devServerId) : v9_1.Routes.applicationCommands(config_1.clientId), { body: commands })
        .then((res) => console.log(`registered commands ${process.env.NODE_ENV === "DEV" ? "on guild" : "globally"}`))
        .catch(e => console.error(e));
};
