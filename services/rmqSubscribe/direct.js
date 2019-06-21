'use strict';
/**
 * Subscribe to FanOut exchange.
 *
 * @module services/fanOut/subscribe
 */

const OSTBase = require('@ostdotcom/base'),
  InstanceComposer = OSTBase.InstanceComposer;

const rootPrefix = '../../..',
  apiErrorConfig = require(rootPrefix + '/config/apiErrorConfig'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  paramErrorConfig = require(rootPrefix + '/config/paramErrorConfig'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

require(rootPrefix + '/lib/rabbitmq/connection');

const errorConfig = {
    param_error_config: paramErrorConfig,
    api_error_config: apiErrorConfig
  },
  exchange = 'direct_events';
/**
 * Constructor to Subscribe Fanout exchange
 *
 * @constructor
 */
class DirectSubscription {
  constructor() {}

  /**
   * Perform
   *
   * @returns {Promise<void>}
   */
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

      channel.assertExchange(exchange, 'direct', {
        durable: true
      });

      channel.assertQueue(
        params['queueName'],
        {
          exclusive: false,
          durable: true
        },
        function(error2, q) {
          if (error2) {
            throw error2;
          }
          console.log(' [*] Waiting for messages in %s. To exit press CTRL+C', q.queue);
          channel.bindQueue(q.queue, exchange, routingKey);

          channel.consume(
            q.queue,
            function(msg) {
              console.log(' [x] ------------------- ', msg.content.toString());
              if (msg.content) {
              }
            },
            {
              noAck: true
            }
          );
        }
      );
    });
  }
}

InstanceComposer.registerAsObject(DirectSubscription, coreConstant.icNameSpace, 'DirectSubscription', true);

module.exports = {};
