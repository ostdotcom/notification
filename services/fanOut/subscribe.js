'use strict';
/**
 * Subscribe to FanOut exchange.
 *
 * @module services/fanOut/subscribe
 */

const OSTBase = require('@ostdotcom/base'),
  InstanceComposer = OSTBase.InstanceComposer;

const rootPrefix = '../..',
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
 * Constructor to Subscribe Fanout exchange
 *
 * @constructor
 */
class FanoutSubscription {
  constructor() {
  }

  /**
   * Perform
   *
   * @returns {Promise<void>}
   */
  async perform() {
    const oThis = this;

    let rabbitMqConnection = oThis.ic().getInstanceFor(coreConstant.icNameSpace, 'rabbitmqConnection');

    // Publish RMQ events.
    const conn = await rabbitMqConnection.get();

    conn.createChannel(function (error1, channel) {
      if (error1) {
        throw error1;
      }

      channel.assertExchange(exchange, 'fanout', {
        durable: false
      });

      channel.assertQueue('', {
        exclusive: true
      }, function (error2, q) {
        if (error2) {
          throw error2;
        }
        logger.log(" [*] Waiting for messages in %s. To exit press CTRL+C", q.queue);
        channel.bindQueue(q.queue, exchange, '');

        channel.consume(q.queue, function (msg) {
          if (msg.content) {
            logger.log(" [x] %s", msg.content.toString());
          }
        }, {
          noAck: true
        });
      });

    });
  }

}

InstanceComposer.registerAsObject(FanoutSubscription, coreConstant.icNameSpace, 'FanoutSubscription', true);

module.exports = {};
