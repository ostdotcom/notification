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
      routingKey = params['routingKey'] || params['queueName'],
      msg = params['message'] || 'Hello World!';

    // Publish RMQ events.
    const conn = await rabbitMqConnection.get();

    conn.createChannel(function(error1, channel) {
      if (error1) {
        throw error1;
      }
      channel.assertExchange(exchange, 'direct', {
        durable: true
      });
      if (!params['publishAfter']) {
        channel.publish(exchange, routingKey, new Buffer(msg));
        console.log(' [x] Sent %s', msg);
      }

      channel.close();
    });

    if (params['publishAfter']) {
      let dlxExchangeName = `${exchange}_DLX`,
        dlxQueueName = `${exchange}_DLX_queue_${params['publishAfter']}`;

      conn.createChannel(function(error1, channel) {
        if (error1) {
          throw error1;
        }

        channel.assertExchange(dlxExchangeName, 'direct', {
          durable: true
        });
        channel.assertQueue(
          dlxQueueName,
          {
            exclusive: false,
            durable: true,
            arguments: {
              'x-dead-letter-exchange': exchange,
              'x-dead-letter-routing-key': routingKey,
              'x-message-ttl': params['publishAfter'],
              'x-expires': params['publishAfter'] * 10
            }
          },
          function(error2, q) {
            if (error2) {
              throw error2;
            }
            console.log('---------arguments------', JSON.stringify(q));
            console.log(' [*] Waiting for messages in %s. To exit press CTRL+C', q.queue);
            channel.bindQueue(q.queue, dlxExchangeName, q.queue);

            channel.publish(dlxExchangeName, q.queue, new Buffer(msg));
            console.log(' [x] Sent to DLX %s', msg);
          }
        );
        // channel.close();
      });
    }
  }
}

InstanceComposer.registerAsObject(DirectPublishEvent, coreConstant.icNameSpace, 'DirectPublishEvent', true);

module.exports = {};
