const winston = require('winston');

const _date = new Date().toISOString.substr(0,10);
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: `${_date}-plex-podcast-library.log` }),
    new winston.transports.Console({ format: winston.format.simple() })
  ]
});