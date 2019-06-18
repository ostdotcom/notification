'use strict';
/**
 * Publish event to RabbitMQ using fanout exchange.
 *
 * @module services/fanOut/publish
 */

const OSTBase = require('@ostdotcom/base');

const rootPrefix = '../../..',
  apiErrorConfig = require(rootPrefix + '/config/apiErrorConfig'),
  paramErrorConfig = require(rootPrefix + '/config/paramErrorConfig'),
  coreConstant = require(rootPrefix + '/config/coreConstant');

require(rootPrefix + '/lib/rabbitmq/connection');

const errorConfig = {
    param_error_config: paramErrorConfig,
    api_error_config: apiErrorConfig
  },
  exchange = 'direct_events',
  InstanceComposer = OSTBase.InstanceComposer;
/**
 * Constructor to publish RMQ event
 *
 * @constructor
 */
class DirectPublishEvent {
  constructor() {}

  async perform(params) {
    const oThis = this;

    let rabbitMqConnection = oThis.ic().getInstanceFor(coreConstant.icNameSpace, 'rabbitmqConnection'),
      routingKey = params['routingKey'] || params['queueName'];

    // Publish RMQ events.
    const conn = await rabbitMqConnection.get();

    conn.createChannel(function(error1, channel) {
      if (error1) {
        throw error1;
      }
      var msg = params['message'] || 'Hello World!';

      channel.assertExchange(exchange, 'direct', {
        durable: true
      });
      channel.publish(exchange, routingKey, Buffer.from(msg));
      console.log(' [x] Sent %s', msg);

      channel.close();
    });
  }
}

InstanceComposer.registerAsObject(DirectPublishEvent, coreConstant.icNameSpace, 'DirectPublishEvent', true);

module.exports = {};
