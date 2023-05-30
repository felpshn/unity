import { Message } from 'discord.js';

import config from '@/config';
import Command from '@/structs/Command';
import Bot from '@/structs/Bot';

export default class Pause extends Command {
  constructor(bot: Bot) {
    super(bot, {
      name: `${config.botPrefix}pause`,
      help: 'Pause the current song',
      requiredRoleLvl: 0
    });
  }

  async run(msg: Message) {
    const queueExists = this.bot.queues.get(msg.guild!.id);
    if (!queueExists || !queueExists.connection)
      return msg.reply("There's no song playing in your current channel.");

    await msg.react('👍');
    queueExists.connection.dispatcher.pause();
  }
}
