'use strict';
/**
 * Publish event to RabbitMQ using fanout exchange.
 *
 * @module services/fanOut/publish
 */

const OSTBase = require('@ostdotcom/base');

const rootPrefix = '../..',
  apiErrorConfig = require(rootPrefix + '/config/apiErrorConfig'),
  paramErrorConfig = require(rootPrefix + '/config/paramErrorConfig'),
  coreConstant = require(rootPrefix + '/config/coreConstant');

require(rootPrefix + '/lib/rabbitmq/connection');

const errorConfig = {
    param_error_config: paramErrorConfig,
    api_error_config: apiErrorConfig
  },
  exchange = 'fanout_events',
  InstanceComposer = OSTBase.InstanceComposer;
/**
 * Constructor to publish RMQ event
 *
 * @constructor
 */
class PublishEventToAll {
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
      var msg = params['message'] || 'Hello World!';

      channel.assertExchange(exchange, 'fanout', {
        durable: true
      });
      channel.publish(exchange, rKey1, Buffer.from(msg));
      console.log(' [x] Sent %s', msg);

      channel.close();
    });
  }
}

InstanceComposer.registerAsObject(PublishEventToAll, coreConstant.icNameSpace, 'PublishEventToAll', true);

module.exports = {};
