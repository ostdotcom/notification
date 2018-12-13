'use strict';

/*
 * Custom Console log methods.
 *
 */
const OSTBase = require('@openstfoundation/openst-base'),
  Logger = OSTBase.Logger;

const rootPrefix = '../..',
  loggerLevel = 1 === Number(process.env.DEBUG_ENABLED) ? Logger.LOG_LEVELS.TRACE : Logger.LOG_LEVELS.INFO;

module.exports = new Logger('openst-storage', loggerLevel);
