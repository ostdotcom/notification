'use strict';
/**
 * Publish event to RabbitMQ using fanout exchange.
 *
 * @module services/fanOut/publish
 */

const InstanceComposer = OSTBase.InstanceComposer;

const rootPrefix = '..',
  apiErrorConfig = require(rootPrefix + '/config/apiErrorConfig'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  paramErrorConfig = require(rootPrefix + '/config/paramErrorConfig'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

require(rootPrefix + '/lib/rabbitmq/connection');

const errorConfig = {
    param_error_config: paramErrorConfig,
    api_error_config: apiErrorConfig
  },
  exchange = 'fanout_events';
/**
 * Constructor to publish RMQ event
 *
 * @constructor
 */
class FanoutPublishEvent {
  constructor() {}

  async perform(params) {
    const oThis = this;

    let rabbitMqConnection = oThis.ic().getInstanceFor(coreConstant.icNameSpace, 'rabbitmqConnection'),
      rKey1 = 'routing_key_1';

    // Publish RMQ events.
    const conn = await rabbitMqConnection.get();

    conn.createChannel(function(error1, channel) {
      if (error1) {
        throw error1;
      }
      var msg = process.argv.slice(2).join(' ') || 'Hello World!';

      channel.assertExchange(exchange, 'fanout', {
        durable: false
      });
      channel.publish(exchange, rKey1, Buffer.from(msg));
      console.log(" [x] Sent %s", msg);

      channel.close();
    });

  }
}

module.exports = FanoutPublishEvent;
