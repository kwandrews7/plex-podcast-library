const winston = require('winston');
const fs = require('fs');
const request = require('request');
const parseString = require('xml2js').parseString;
const _ = require('lodash');

// Create logs dir if necessary.
if (!fs.existsSync('logs')) {
  fs.mkdirSync('logs');
}

// Configure winston based logger.
const _date = new Date().toISOString().substr(0, 10);
const logger = winston.createLogger({
  level: process.env.PPL_LOG_LEVEL || 'info',
  format: winston.format.printf(
    info => `${new Date().toISOString()} [${info.level}] ${info.message}`),
  transports: [
    new winston.transports.File({
      filename: `logs/${_date}-plex-podcast-library.log`
    }),
    new winston.transports.Console({})
  ]
});

logger.info('Plex Podcast Library started, winston logger configured.');

logger.info('Searching for config file...');
if (!fs.existsSync('config.json')) {
  logger.error('No config file found! Please include a config.json file in the project working directory.');
  process.exit(1);
}

logger.info('Found config.json. Reading configuration...');
let config = JSON.parse(fs.readFileSync('config.json'));

if (!config.podcasts) {
  logger.error('[podcasts] missing from config.json. Please verify your configuration and try again.');
  process.exit(2);
}
if (config.podcasts.length < 1) {
  logger.error('[podcasts] loaded without any data. Did you forget to add your podcasts?');
  process.exit(3);
}
if (!config.libraryPath) {
  logger.error('[libraryPath] missing from config.json. Please verify your configuration and try again.');
  process.exit(4);
}
logger.info(`Configuration complete. Found ${config.podcasts.length} podcast urls.`);

logger.info('Processing each podcast individually to prevent bogging down your internet connection or someone else\'s server.');
config.podcasts.forEach(function (podcast) {
  logger.info(`Processing [${podcast.url}].`);
  getPodcastsData(podcast);
});


function getPodcastsData(podcast) {
  logger.info(`Downloading RSS feed at [${podcast.url}].`);
  request(podcast.url, function (error, response, body) {
    if (error) {
      logger.warn(`Failed to download feed for [${podcast.name}].`);
      return;
    }

    logger.info(`RSS feed for [${podcast.name}] found and downloaded.`);
    parsePodcastXml(podcast, body);
  });
}

function parsePodcastXml(podcast, xml) {
  logger.info(`Parsing [${podcast.name}] RSS XML into Objects`);
  parseString(xml, function (err, rawPodcast) {
    if (err || !(_.get(rawPodcast, ['rss', 'channel', '0']))) {
      logger.error(`Error parsing [${podcast.name}] into Objects. Stopping processing for this podcast.`);
      logger.error(err);
      return;
    }
    let episodeCount = _.get(rawPodcast, ['rss', 'channel', '0', 'item', 'length']);
    logger.info(`[${podcast.name}] parsed successfully, found [${episodeCount}] episodes.`);
    let podcastJson = mapPodcast(rawPodcast.rss.channel[0]);
  });
}

function mapPodcast(rawPodcast) {
  let podcastJson = {
    title: _.get(rawPodcast, ['title', '0']),
    subtitle: _.get(rawPodcast, ['itunes:subtitle', '0']),
    description: _.get(rawPodcast, 'description'),
    author: _.get(rawPodcast, ['itunes:author', '0']),
    image: _.get(rawPodcast, ['itunes:image', '0', '$', 'href']),
    link: _.get(rawPodcast, ['link', '0'])
  };
  if (_.get(rawPodcast, 'itunes:category')) {
    var categories = _.get(rawPodcast, 'itunes:category');
    podcastJson.categories = categories.map(c => _.get(c, ['$', 'text']));
  }
  if (_.get(rawPodcast, 'item')) {
    var episodes = _.get(rawPodcast, 'item');
    podcastJson.episodes = episodes.map(i => mapItemToEpisode(i));
  }
  return podcastJson;
}

function mapItemToEpisode(item) {
  return {
    title: _.get(item, ['title', '0']),
    subtitle: _.get(item, ['itunes:subtitle', '0']),
    description: _.get(item, ['itunes:summary', '0']),
    author: _.get(item, ['itunes:author', '0']),
    image: _.get(item, ['itunes:image', '0', '$', 'href']),
    link: _.get(item, ['link', '0']),
    duration: _.get(item, ['itunes:duration', '0']),
    date: _.get(item, ['pubDate', '0']),
    fileUrl: _.get(item, ['enclosure', '0', '$', 'url']),
    fileType: _.get(item, ['enclosure', '0', '$', 'type'])
  };
}

//function process
