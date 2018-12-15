const winston = require('winston');
const fs = require('fs');
const request = require('request');

// Create logs dir if necessary.
if (!fs.existsSync('logs')) {
  fs.mkdirSync('logs');
}

// Configure winston based logger.
const _date = new Date().toISOString().substr(0, 10);
const logger = winston.createLogger({
  level: 'debug',
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

if (!config.podcastUrls) {
  logger.error('[podcasts] missing from config.json. Please verify your configuration and try again.');
  process.exit(2);
}
if (config.podcastUrls.length < 1) {
  logger.error('[podcasts] loaded without any data. Did you forget to add your podcasts?');
  process.exit(3);
}
if (!config.libraryPath) {
  logger.error('[libraryPath] missing from config.json. Please verify your configuration and try again.');
  process.exit(4);
}
logger.info(`Configuration complete. Found ${config.podcastUrls.length} podcast urls.`);

logger.info('Processing each podcast individually to prevent bogging down your internet connection or someone else\'s server.');
config.podcastUrls.forEach(function (podcasts) {
  logger.info(`Processing [${podcasts.url}].`);

  request
    .get(url)
    .on('error', function (error) {
      logger.warn(`Failed to download feed for []`);
    })
    .on('response', function (response) {

    });

});
