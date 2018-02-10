"use strict";

/**
 * Listening to Rabbitmq channels to receive published message.
 *
 * @module services/subscribe_event
 *
 */

const rootPrefix = '..'
  , rabbitmqConnection = require(rootPrefix + '/lib/rabbitmq/connect')
  , localEmitter = require(rootPrefix + '/services/local_emitter')
  , coreConstants = require(rootPrefix + '/config/core_constants')
  , rabbitmqHelper = require(rootPrefix + '/lib/rabbitmq/helper')
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
   * @param {object} options -
   * @param {string} [options.queue] - RMQ queue name.
   *    - Name of the queue on which you want to receive all your subscribed events.
   *    These queues and events, published in them, have TTL of 6 days.
   *    If queue name is not passed, a queue with unique name is created and is deleted when subscriber gets disconnected.
   * @param {function} callback - function to run on message arrived on the channel.
   *
   */
  rabbit: async function (topics, options, readCallback) {

    if(coreConstants.OST_RMQ_SUPPORT != '1'){
      throw 'No RMQ support';
    }

    if (topics.length == 0) {
      throw 'invalid parameters';
    }

    const conn = await rabbitmqConnection.get(rmqId);

    const oThis = this;

    if(!conn){
      throw 'Not able to establish rabbitmq connection for now. Please try after sometime';
    }

    conn.createChannel(function(err, ch) {

      if(err){
        throw 'channel could  be not created: '+err ;
      }

      const ex = 'topic_events';

      //TODO - assertExchange, bindQueue and consume, promise is not handled
      ch.assertExchange(ex, 'topic', {durable: true});

      const assertQueueCallback = function(err, q) {
        if(err){
          throw 'subscriber could assert queue: '+err ;
        }

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
        ch.assertQueue(options['queue'],
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

    localEmitter.emitObj.once('rmq_fail', function(err){
      console.log('RMQ Failed event received.');
      setTimeout(function(){
        console.log("trying consume again......");
        oThis.rabbit(topics, options, readCallback);
      }, 2000);
    })

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
      throw 'invalid parameters';
    }

    topics.forEach(function(key) {
      localEmitter.emitObj.on(key, readCallback);
    });

  }

};

module.exports = new SubscribeEventKlass();