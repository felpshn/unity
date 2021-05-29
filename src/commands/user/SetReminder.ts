import { Message } from 'discord.js';

import config from '../../config';
import { Bot } from '../..';
import { formatSecondsToTime } from '../../utils/FormatSecondsToTime';

function run (bot: Bot, msg: Message, args: string[]) {
  const reminderMessage = args.slice(0, args.length - 1).join(' ');
  if (!reminderMessage) return msg.reply('You need to inform what I need to remind you about!');
  
  const reminderTime = args.slice(-1)[0];
  let numberTimestamp = <any>reminderTime.slice(0, reminderTime.length - 1);
  const charTimestamp = reminderTime.slice(-1)[0];

  switch (charTimestamp) {
    case 'd':
      numberTimestamp *= 60 * 60 * 24 * 1000;
      break;
    case 'h':
      numberTimestamp *= 60 * 60 * 1000;
      break;
    case 'm':
      numberTimestamp *= 60 * 1000;
      break;
    case 's':
      numberTimestamp *= 1000;
      break;
    default:
      return msg.reply('You need to inform the time in days [d], hours [h], minutes [m] or seconds [s]!');
  }
  msg.reply(`Understood! I'll remind you about "${reminderMessage}" in ${formatSecondsToTime(numberTimestamp / 1000)}`);

  setTimeout(() => {
    msg.reply(`[REMINDER] ${reminderMessage}`);
  }, numberTimestamp);
}

export default {
  name: `${config.botPrefix}remind`,
  help: 'Reminds you about whatever you want',
  permissionLvl: 0,
  run
};
