"use strict";
/**
 * RabbmitMQ helper methods
 *
 * @module lib/helper/rabbitmq
 */

const rootPrefix = '../..'
  , coreConstants = require(rootPrefix + '/config/core_constants')
  ;

/**
 * RabbmitMQ helper constructor
 *
 * @constructor
 */
const RabbmitHelperKlass = function() {};

RabbmitHelperKlass.prototype = {

  /**
   * No of max connections attempt in case of failure.<br><br>
   *
   * @constant {number}
   */
  maxConnectionAttempts: 10,

  /**
   * Make connection string using environment parameters.
   *
   * @returns {string}
   */
  connectionString: function () {
    return "amqp://" + coreConstants.OST_RMQ_USERNAME + ":" + coreConstants.OST_RMQ_PASSWORD + "@" +
      coreConstants.OST_RMQ_HOST + ":" +coreConstants.OST_RMQ_PORT +
      "/?heartbeat=" + coreConstants.OST_RMQ_HEARTBEATS;
  }

};

module.exports = new RabbmitHelperKlass();