'use strict';

/**
 * RabbmitMQ helper methods
 *
 * @module lib/rabbitmq/helper
 */

const rootPrefix = '../..',
  coreConstants = require(rootPrefix + '/config/core_constants');

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
  maxConnectionAttempts: 100,

  /**
   * Time in milliseconds that the unused queue should be deleted after
   * Note: Unused means the queue has no consumers, the queue has not been redeclared, or no get message tried
   *
   * @constant {number}
   */
  dedicatedQueueTtl: 6 * 24 * 60 * 60 * 1000,

  /**
   * Messages TTL (in milliseconds) in dedicated queues
   *
   * @constant {number}
   */
  dedicatedQueueMsgTtl: 6 * 24 * 60 * 60 * 1000,

  /**
   * Make connection string using environment parameters.
   *
   * @returns {string}
   */
  connectionString: function() {
    return (
      'amqp://' +
      coreConstants.OST_RMQ_USERNAME +
      ':' +
      coreConstants.OST_RMQ_PASSWORD +
      '@' +
      coreConstants.OST_RMQ_HOST +
      ':' +
      coreConstants.OST_RMQ_PORT +
      '/?heartbeat=' +
      coreConstants.OST_RMQ_HEARTBEATS
    );
  }
};

module.exports = new RabbmitHelperKlass();
