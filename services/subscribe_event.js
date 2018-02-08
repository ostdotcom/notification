"use strict";

/**
 * Listening to Rabbitmq channels to receive published message.
 * Note: published messages are not preserved, they will be published and discarded immediately.
 *
 * @module services/publish_event
 *
 */

const rootPrefix = '..'
  , rabbitmqConnection = require(rootPrefix + '/services/rabbitmqConnection')
  , localEmitter = require(rootPrefix + '/services/local_emitter')
  , coreConstants = require(rootPrefix + '/config/core_constants')
  , rmqId = 'rmq1'
;

const subscribeEvent = {

  /**
   * Subscribe rabbitmq topics to receive messages.
   *
   * @param {array} topics - list of topics to receive messages.
   * @param {function} callback - function to run on message arrived on the channel.
   *
   */
  rabbit: async function (topics, callback) {

    if(!coreConstants.RMQ_SUPPORT){
      console.log("No RMQ support");
      process.exit(1);
    }

    if (topics.length == 0) {
      console.log("invalid parameters.");
      process.exit(1);
    }

    const conn = await rabbitmqConnection.get(rmqId);

    if(!conn){
      console.log(' Not able to establish rabbitmq connection for now. Please try after sometime.');
      return false;
    }

    conn.createChannel(function(err, ch) {
      const ex = 'topic_events';

      ch.assertExchange(ex, 'topic', {durable: true});

      ch.assertQueue('', {exclusive: true}, function(err, q) {
        console.log(' [*] Waiting for logs. To exit press CTRL+C', q.queue);

        topics.forEach(function(key) {
          ch.bindQueue(q.queue, ex, key);
        });

        ch.consume(q.queue, function(msg) {
          const msgContent = msg.content.toString();
          callback(msgContent);

        }, {noAck: true});
      });
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
  local: function(topics, callback) {

    if (topics.length == 0) {
      console.log("invalid parameters.");
      process.exit(1);
    }

    topics.forEach(function(key) {
      localEmitter.emitObj.on(key, callback);
    });

  }

};

module.exports = subscribeEvent;