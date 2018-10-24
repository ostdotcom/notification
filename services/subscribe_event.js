'use strict';

/**
 * Listening to RabbitMq channels to receive published message.
 *
 * @module services/subscribe_event
 */

const rootPrefix = '..',
  uuidV4 = require('uuid/v4'),
  InstanceComposer = require(rootPrefix + '/instance_composer'),
  rabbitMqHelper = require(rootPrefix + '/lib/rabbitmq/helper'),
  localEmitter = require(rootPrefix + '/services/local_emitter'),
  logger = require(rootPrefix + '/lib/logger/custom_console_logger');

require(rootPrefix + '/lib/rabbitmq/connect');

/**
 * Constructor to subscribe RMQ event
 *
 * @constructor
 */
const SubscribeEventKlass = function() {};

SubscribeEventKlass.prototype = {
  /**
   * Subscribe to rabbitMq topics to receive messages.
   *
   * @param {array} topics - list of topics to receive messages.
   * @param {object} options -
   * @param {string} [options.queue] - RMQ queue name.
   *    - Name of the queue on which you want to receive all your subscribed events.
   *    These queues and events, published in them, have TTL of 6 days.
   *    If queue name is not passed, a queue with unique name is created and is deleted when subscriber gets disconnected.
   * @param {function} readCallback - function to run on message arrived on the channel.
   * @param {function} subscribeCallback - function to return consumerTag.
   *
   */
  rabbit: async function(topics, options, readCallback, subscribeCallback) {
    const oThis = this;

    if (oThis.ic().configStrategy.OST_RMQ_SUPPORT != '1') {
      logger.error('There is no rmq support. Error: ');
      process.emit('ost_rmq_error', 'There is no rmq support.');
      return;
    }

    if (topics.length === 0) {
      logger.error('Invalid topic parameters.');
      process.emit('ost_rmq_error', 'Invalid topic parameters.');
      return;
    }

    let rabbitMqConnection = oThis.ic().getRabbitMqConnection();

    options.prefetch = options.prefetch || 1;
    options.noAck = options.ackRequired !== 1;

    const conn = await rabbitMqConnection.get();

    if (!conn) {
      logger.error('Not able to establish rabbitMQ connection for now. Please try after sometime.');
      process.emit('ost_rmq_error', 'Not able to establish rabbitMQ connection for now. Please try after sometime.');
      return;
    }

    conn.createChannel(function(err, ch) {
      const consumerTag = uuidV4();

      if (err) {
        logger.error('channel could  be not created: Error: ', err);
        process.emit('ost_rmq_error', 'channel could  be not created: Error:' + err);
        return;
      }

      ch.once('error', function(err) {
        logger.error('[AMQP] Channel error', err);
        process.emit('ost_rmq_error', '[AMQP] Channel error: Error:' + err);
      });
      ch.once('close', function() {
        logger.error('[AMQP] Channel Closed');
      });

      const ex = 'topic_events';

      // Call only if subscribeCallback is passed.
      subscribeCallback && subscribeCallback(consumerTag);

      ch.assertExchange(ex, 'topic', { durable: true });

      const assertQueueCallback = function(err, q) {
        if (err) {
          logger.error('subscriber could not assert queue: ' + err);
          process.emit('ost_rmq_error', 'subscriber could not assert queue:' + err);
          return;
        }

        logger.info(' [*] Waiting for logs. To exit press CTRL+C', q.queue);

        topics.forEach(function(key) {
          ch.bindQueue(q.queue, ex, key);
        });

        ch.prefetch(options.prefetch);

        const startConsumption = function() {
          ch.consume(
            q.queue,
            function(msg) {
              const msgContent = msg.content.toString();
              if (options.noAck) {
                readCallback(msgContent);
              } else {
                let successCallback = function() {
                  logger.debug('done with ack');
                  ch.ack(msg);
                };
                let rejectCallback = function() {
                  logger.debug('requeue message');
                  ch.nack(msg);
                };
                readCallback(msgContent).then(successCallback, rejectCallback);
              }
            },
            { noAck: options.noAck, consumerTag: consumerTag }
          );
        };
        // If queue should start consuming as well.
        if (!options.onlyAssert) {
          startConsumption();

          process.on('CANCEL_CONSUME', function(ct) {
            if (ct === consumerTag) {
              logger.info('Received CANCEL_CONSUME, cancelling consumption of', ct);
              ch.cancel(consumerTag);
            }
          });
          process.on('RESUME_CONSUME', function(ct) {
            if (ct === consumerTag) {
              logger.info('Received RESUME_CONSUME, Resuming consumption of', ct);
              startConsumption();
            }
          });
          process.on('SIGINT', function() {
            logger.info('Received SIGINT, cancelling consumption');
            ch.cancel(consumerTag);
          });
          process.on('SIGTERM', function() {
            logger.info('Received SIGTERM, cancelling consumption');
            ch.cancel(consumerTag);
          });
        } else {
          logger.info('Closing the channel as only assert queue was required.');
          ch.close();
        }
      };

      if (options['queue']) {
        ch.assertQueue(
          options['queue'],
          {
            autoDelete: false,
            durable: true,
            arguments: {
              'x-expires': rabbitMqHelper.dedicatedQueueTtl,
              'x-message-ttl': rabbitMqHelper.dedicatedQueueMsgTtl
            }
          },
          assertQueueCallback
        );
      } else {
        ch.assertQueue('', { exclusive: true }, assertQueueCallback);
      }
    });

    localEmitter.emitObj.once('rmq_fail', function(err) {
      logger.error('RMQ Failed event received. Error: ', err);
      setTimeout(function() {
        logger.info('trying consume again......');
        oThis.rabbit(topics, options, readCallback);
      }, 2000);
    });
  },

  /**
   * Subscribe local emitters by topics to receive messages.
   * Note: messages could be received only on the same object(thus, same process) where the message was emitted.
   *
   * @param {array} topics - list of topics to receive messages.
   * @param {function} readCallback - function to run on message arrived on the channel.
   *
   */
  local: function(topics, readCallback) {
    if (topics.length === 0) {
      logger.error('Invalid parameters Error: topics are mandatory');
      return;
    }

    topics.forEach(function(key) {
      localEmitter.emitObj.on(key, readCallback);
    });
  }
};

SubscribeEventKlass.prototype.constructor = SubscribeEventKlass;

InstanceComposer.register(SubscribeEventKlass, 'getSubscribeEventKlass', true);

module.exports = SubscribeEventKlass;
