"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setSong = void 0;
const axios_1 = __importDefault(require("axios"));
const yt_search_1 = __importDefault(require("yt-search"));
const ytdl_core_1 = __importDefault(require("ytdl-core"));
const discord_js_1 = require("discord.js");
const FormatSecondsToTime_1 = require("../../../utils/FormatSecondsToTime");
const ReactionsHandler_1 = require("../../../utils/ReactionsHandler");
const DropBotQueueConnection_1 = require("../../../utils/DropBotQueueConnection");
async function run(bot, msg, args) {
    if (!args)
        return msg.reply('You need to give me a song to play it!');
    let requestedSong = args.join(' ');
    let spotifyPlaylistTracks = [];
    let spotifyPlaylistDuration = 0;
    let song;
    try {
        if (ytdl_core_1.default.validateURL(requestedSong)) {
            song = await yt_search_1.default({ videoId: ytdl_core_1.default.getURLVideoID(requestedSong) });
            return handlePlaySong(true);
        }
        else if (requestedSong.startsWith('https://open.spotify.com/')) {
            await axios_1.default
                .get(requestedSong)
                .then(({ data }) => {
                let contextSelector;
                if (requestedSong.charAt(25) === 't') {
                    contextSelector = data.substring(data.indexOf('<ti') + 7, data.indexOf('|') - 1);
                    requestedSong = contextSelector;
                }
                else if (requestedSong.charAt(25) === 'p') {
                    contextSelector = data.substring(data.indexOf('Spotify.Entity') + 17, data.indexOf('"available_markets"') - 1) + '}';
                    const spotifyPlaylist = JSON.parse(contextSelector);
                    spotifyPlaylistTracks = spotifyPlaylist.tracks.items.map(song => {
                        spotifyPlaylistDuration += song.track.duration_ms;
                        return `${song.track.name} - ${song.track.album.artists[0].name}`;
                    });
                    const embed = new discord_js_1.MessageEmbed();
                    embed
                        .setAuthor(`"${spotifyPlaylist.name}"\nSpotify playlist by ${spotifyPlaylist.owner.display_name}`)
                        .setDescription(`\n• Total playlist tracks: \`${spotifyPlaylist.tracks.items.length}\`\n• Playlist duration: \`${FormatSecondsToTime_1.formatSecondsToTime(spotifyPlaylistDuration / 1000)}\``)
                        .setThumbnail(spotifyPlaylist.images[0].url)
                        .setTimestamp(Date.now())
                        .setFooter('Spotify | Music for everyone')
                        .setColor('#6E76E5');
                    msg.channel.send({ embed });
                }
                else
                    throw new Error('Invalid URL');
            })
                .catch((err) => console.error(err));
        }
        if (spotifyPlaylistTracks.length > 0) {
            const playlistTracks = new Map();
            spotifyPlaylistTracks.map((track, index) => {
                yt_search_1.default(track, (err, res) => {
                    if (err)
                        throw err;
                    if (res && res.videos.length > 0) {
                        playlistTracks.set(index, res.videos[0]);
                    }
                });
            });
            const embed = new discord_js_1.MessageEmbed();
            embed
                .setTitle('Gotcha!, loading playlist songs ... ⏳')
                .setDescription('I\'ll join the party in 1 minute, please wait')
                .setColor('#6E76E5');
            msg.channel.send({ embed });
            setTimeout(() => {
                song = playlistTracks.get(0);
                handlePlaySong();
                playlistTracks.delete(0);
                for (let [index] of playlistTracks) {
                    setTimeout(() => {
                        song = playlistTracks.get(index);
                        handlePlaySong();
                    }, 5000);
                }
            }, 60000);
        }
        else {
            yt_search_1.default(requestedSong, (err, res) => {
                if (err)
                    throw err;
                if (res && res.videos.length > 0) {
                    song = res.videos[0];
                    handlePlaySong(true);
                }
                else
                    return msg.reply('Sorry!, I couldn\'t find any song related to your search.');
            });
        }
    }
    catch (err) {
        console.error(err);
    }
    function handlePlaySong(sendQueueNotifMsg = false) {
        const queue = bot.queues.get(msg.guild.id);
        if (!queue) {
            setSong(bot, msg, song, msg.author.id);
            const embed = new discord_js_1.MessageEmbed();
            embed
                .setTitle('🎵  Music Playback')
                .setDescription(`Joining channel \`${msg.member.voice.channel.name}\``)
                .setColor('#6E76E5');
            msg.channel.send({ embed });
        }
        else {
            queue.songs.push(song);
            queue.authors.push(msg.author.id);
            bot.queues.set(msg.guild.id, queue);
            if (sendQueueNotifMsg) {
                const embed = new discord_js_1.MessageEmbed();
                embed
                    .setTitle('📃  Queue')
                    .setDescription(`Got it! [${song.title}](${song.url}) was added to the queue and his current position is \`${queue.songs.indexOf(song)}\`.\n\nYou can see the guild's queue anytime using \`.queue\``)
                    .setFooter(`Added by ${msg.author.username}`, msg.author.displayAvatarURL())
                    .setTimestamp(new Date())
                    .setColor('#6E76E5');
                msg.channel.send({ embed });
            }
        }
    }
}
async function setSong(bot, msg, song, msgAuthor) {
    var _a;
    let queue = bot.queues.get(msg.guild.id);
    if (!song) {
        if (queue) {
            queue.connection.disconnect();
            return bot.queues.delete(msg.guild.id);
        }
    }
    if (!((_a = msg.member) === null || _a === void 0 ? void 0 : _a.voice.channel))
        return msg.reply('You need to be in a voice channel to play a song!');
    if (!queue) {
        const botConnection = await msg.member.voice.channel.join();
        queue = {
            connection: botConnection,
            songs: [song],
            authors: [msgAuthor],
            volume: 10,
            dispatcher: null
        };
    }
    try {
        queue.dispatcher = queue.connection.play(ytdl_core_1.default(song.url, {
            filter: 'audioonly',
            quality: 'highestaudio'
        }));
        const embed = new discord_js_1.MessageEmbed();
        embed
            .setAuthor('We hear you 💜', 'https://raw.githubusercontent.com/felpshn/saturn-bot/master/assets/cd.gif')
            .setThumbnail(song.thumbnail)
            .setDescription(`Now playing **[${song.title}](${song.url})** requested by <@${queue.authors[0]}>`)
            .setFooter(`Song duration: ${song.timestamp}`)
            .setColor('#6E76E5');
        msg.channel.send({ embed })
            .then((sentMsg) => { ReactionsHandler_1.Reaction.handleMusicControls(bot, msg, sentMsg); });
        queue.dispatcher.on('finish', () => {
            queue.songs.shift();
            queue.authors.shift();
            ReactionsHandler_1.Reaction.handleDeletion(true);
            setSong(bot, msg, queue.songs[0], queue.authors[0]);
        });
        bot.queues.set(msg.guild.id, queue);
    }
    catch (err) {
        DropBotQueueConnection_1.dropBotQueueConnection(bot, msg);
        console.error(err);
    }
}
exports.setSong = setSong;
exports.default = {
    name: `${process.env.BOT_PREFIX}play`,
    help: 'Plays song from YouTube or Spotify',
    permissionLvl: 0,
    run
};
