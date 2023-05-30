"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const Play_1 = require("./Play");
function run(bot, msg, args) {
    const queueExists = bot.queues.get(msg.guild.id);
    if (!queueExists)
        return msg.reply('There\'s no song currently playing.');
    if (queueExists.songs.length > 1) {
        queueExists.songs.shift();
        queueExists.author.shift();
        const embed = new discord_js_1.MessageEmbed();
        embed
            .setTitle('⏭  Skip Music')
            .setDescription('Okay! Setting up the next song for you.')
            .setColor('#6E76E5');
        msg.channel.send({ embed });
        Play_1.setSong(bot, msg, queueExists.songs[0], queueExists.author[0]);
    }
}
exports.default = {
    name: '.skip',
    help: 'Skips the current song',
    permissionLvl: 0,
    run
};
