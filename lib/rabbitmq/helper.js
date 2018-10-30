'use strict';

/**
 * RabbitMQ helper methods
 *
 * @module lib/rabbitmq/helper
 */

/**
 * RabbitMQ helper constructor
 *
 * @constructor
 */
const RabbitMqHelperKlass = function() {};

RabbitMqHelperKlass.prototype = {
  /**
   * No of max connections attempt in case of failure.<br><br>
   *
   * @constant {number}
   */
  maxConnectionAttempts: 100,

  /**
   * Time in milliseconds that the unused queue should be deleted after
   * Note: Unused means the queue has no consumers, the queue has not been re-declared, or no get message tried.
   *
   * @constant {number}
   */
  dedicatedQueueTtl: 6 * 24 * 60 * 60 * 1000, // 6 days

  /**
   * Messages TTL (in milliseconds) in dedicated queues
   *
   * @constant {number}
   */
  dedicatedQueueMsgTtl: 6 * 24 * 60 * 60 * 1000, // 6 days

  /**
   * Make connection string using configStrategy parameters.
   *
   * @returns {string}
   */
  connectionString: function(configStrategy) {
    const oThis = this;

    return (
      'amqp://' +
      configStrategy.OST_RMQ_USERNAME +
      ':' +
      configStrategy.OST_RMQ_PASSWORD +
      '@' +
      configStrategy.OST_RMQ_HOST +
      ':' +
      configStrategy.OST_RMQ_PORT +
      '/?heartbeat=' +
      configStrategy.OST_RMQ_HEARTBEATS
    );
  },

  /**
   *
   * Get instance key from the configStrategy.
   *
   * @returns {string}
   */
  getInstanceKey: function(configStrategy) {
    const oThis = this;
    return [
      configStrategy.OST_RMQ_USERNAME,
      configStrategy.OST_RMQ_HOST.toLowerCase(),
      configStrategy.OST_RMQ_PORT,
      configStrategy.OST_RMQ_HEARTBEATS
    ].join('-');
  },

  /**
   *
   * Get RMQ host passed into configStrategy.
   *
   * @returns {string}
   */
  getConfigRmqHost: function(configStrategy) {
    return configStrategy.OST_RMQ_HOST.toLowerCase();
  },

  /**
   *
   * Get RMQ host passed into configStrategy.
   *
   * @returns {string}
   */
  getConfigRmqClusterNodes: function(configStrategy) {
    return configStrategy.OST_RMQ_CLUSTER_NODES;
  }
};

module.exports = new RabbitMqHelperKlass();
