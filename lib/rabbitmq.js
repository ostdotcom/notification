"use strict";
/**
 * Library methods for rabbitmq.
 *
 * @module lib/rabbitmq
 */

const rootPrefix = '..'
  , coreConstants = require(rootPrefix + '/config/core_constants')
  ;

const rabbitmqConstants = {

  /**
   * No of max connections attempt in case of failure.
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

module.exports = rabbitmqConstants;