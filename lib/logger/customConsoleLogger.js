'use strict';

/**
 * Custom console log methods.
 *
 * @module lib/logger/customConsoleLogger
 */
const OSTBase = require('@ostdotcom/base'),
  Logger = OSTBase.Logger;

const rootPrefix = '../..',
  coreConstants = require(rootPrefix + '/config/coreConstant');

// Following is to ensure that INFO logs are printed when debug is off.
let loggerLevel;
if (1 === Number(coreConstants.DEBUG_ENABLED)) {
  loggerLevel = Logger.LOG_LEVELS.DEBUG;
} else {
  loggerLevel = Logger.LOG_LEVELS.INFO;
}

module.exports = new Logger('ost-notification', loggerLevel);