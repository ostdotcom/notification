"use strict";
/**
 * Load all the core constants from the environment variables OR define them as literals here and export them.
 *
 * @module config/core_constants
 *
 */
const rootPrefix = "..";

/**
 * Constructor for core constants
 *
 * @constructor
 */
const CoreConstant = function () {};

CoreConstant.prototype = {

  /**
   * Is RMQ support required. 0 to disable and 1 to enable.<br><br>
   *
   * @constant {number}
   */
  OST_RMQ_SUPPORT: process.env.OST_RMQ_SUPPORT,

  /**
   * RMQ connect host.<br><br>
   *
   * @constant {string}
   */
  OST_RMQ_HOST: process.env.OST_RMQ_HOST,

  /**
   * RMQ connect port.<br><br>
   *
   * @constant {number}
   */
  OST_RMQ_PORT: process.env.OST_RMQ_PORT,

  /**
   * RMQ connect username.<br><br>
   *
   * @constant {string}
   */
  OST_RMQ_USERNAME: process.env.OST_RMQ_USERNAME,

  /**
   * RMQ connect password.<br><br>
   *
   * @constant {string}
   */
  OST_RMQ_PASSWORD: process.env.OST_RMQ_PASSWORD,

  /**
   * Interval to check RMQ heartbeat (in seconds).<br><br>
   *
   * @constant {number}
   */
  OST_RMQ_HEARTBEATS: process.env.OST_RMQ_HEARTBEATS,

  /**
   * debug level<br><br>
   *
   * @constant {number}
   */
  DEBUG_ENABLED: process.env.OST_DEBUG_ENABLED
};

module.exports = new CoreConstant();