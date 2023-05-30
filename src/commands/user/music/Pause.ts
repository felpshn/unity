import { Message } from 'discord.js';
import { Bot } from '../../..';

import { IQueue } from './Play';

async function run (bot: Bot, msg: Message, args: string[]) {
  const queueExists: IQueue = bot.queues.get(msg.guild!.id);
  if (!queueExists || !queueExists.connection) return msg.reply('There\'s no song playing in your current channel.');

  await msg.react('👍');
  queueExists.connection.dispatcher.pause();
}

export default {
  name: `${process.env.BOT_PREFIX}pause`,
  help: 'Pauses the current song',
  permissionLvl: 0,
  run
};
