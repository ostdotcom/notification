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
    return "amqp://" + coreConstants.RMQ_USERNAME + ":" + coreConstants.RMQ_PASSWORD + "@" +
      coreConstants.RMQ_HOST + ":" +coreConstants. RMQ_PORT +
      "/?heartbeat=" + coreConstants.RMQ_HEARTBEATS;
  }

};

module.exports = rabbitmqConstants;