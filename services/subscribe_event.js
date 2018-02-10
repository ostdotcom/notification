"use strict";

/**
 * Listening to Rabbitmq channels to receive published message.
 * Note: published messages are not preserved, they will be published and discarded immediately.
 *
 * @module services/subscribe_event
 *
 */

const rootPrefix = '..'
  , rabbitmqConnection = require(rootPrefix + '/services/rabbitmqConnection')
  , localEmitter = require(rootPrefix + '/services/local_emitter')
  , coreConstants = require(rootPrefix + '/config/core_constants')
  , rabbitmqHelper = require(rootPrefix + '/lib/helper/rabbitmq')
  , rmqId = 'rmq1' // To support horizontal scaling in future
;

/**
 * Constructor to subscribe RMQ event
 *
 * @constructor
 */
const SubscribeEventKlass = function () {
};

SubscribeEventKlass.prototype = {
  /**
   * Subscribe rabbitmq topics to receive messages.
   *
   * @param {array} topics - list of topics to receive messages.
   * @param {object} options - options about queue
   * @param {function} callback - function to run on message arrived on the channel.
   *
   */
  rabbit: async function (topics, options, readCallback) {

    if(coreConstants.OST_RMQ_SUPPORT != 1){
      console.log("No RMQ support");
      process.exit(1);
    }

    if (topics.length == 0) {
      console.log("invalid parameters.");
      process.exit(1);
    }

    const conn = await rabbitmqConnection.get(rmqId);

    if(!conn){
      console.log('Not able to establish rabbitmq connection for now. Please try after sometime.');
      return false;
    } else {
      console.log('Retrieved connection..........');
    }

    conn.createChannel(function(err, ch) {
      const ex = 'topic_events';

      ch.assertExchange(ex, 'topic', {durable: true});

      const assertQueueCallback = function(err, q) {
        console.log(' [*] Waiting for logs. To exit press CTRL+C', q.queue);

        topics.forEach(function(key) {
          ch.bindQueue(q.queue, ex, key);
        });

        ch.consume(q.queue, function(msg) {
          const msgContent = msg.content.toString();
          readCallback(msgContent);

        }, {noAck: true});
      };

      if(options['queue']){
        ch.assertQueue(options['queue']+'_testQ',
          {
            autoDelete:false,
            durable:false,
            arguments:
              {
                "x-expires":rabbitmqHelper.dedicatedQueueTtl,
                "x-message-ttl":rabbitmqConnection.dedicatedQueueMsgTtl
              }
          },
          assertQueueCallback);

      } else {
        ch.assertQueue('', {exclusive: true}, assertQueueCallback);
      }

    });

  },

  /**
   * Subscribe local emitters by topics to receive messages.
   * Note: messages could be received only on the same object(thus, same process) where the message was emitted.
   *
   * @param {array} topics - list of topics to receive messages.
   * @param {function} callback - function to run on message arrived on the channel.
   *
   */
  local: function(topics, readCallback) {

    if (topics.length == 0) {
      console.log("invalid parameters.");
      process.exit(1);
    }

    topics.forEach(function(key) {
      localEmitter.emitObj.on(key, readCallback);
    });

  }

};

module.exports = new SubscribeEventKlass();