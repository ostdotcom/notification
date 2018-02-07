"use strict";

const rootPrefix = '..'
  , rabbitmqConnection = require(rootPrefix + '/services/rabbitmqConnection')
  , localEmitter = require(rootPrefix + '/services/local_emitter')
  , rmqId = 'rmq1'
;

const subscribeEvent = {

  rabbit: async function (topics, callback) {

    if (topics.length == 0) {
      console.log("invalid parameters.");
      process.exit(1);
    }

    var conn = await rabbitmqConnection.get(rmqId);

    if(!conn){
      console.log(' Not able to establish rabbitmq connection for now. Please try after sometime.');
      return false;
    }

    conn.createChannel(function(err, ch) {
      var ex = 'topic_events';

      ch.assertExchange(ex, 'topic', {durable: true});

      ch.assertQueue('', {exclusive: true}, function(err, q) {
        console.log(' [*] Waiting for logs. To exit press CTRL+C', q.queue);

        topics.forEach(function(key) {
          ch.bindQueue(q.queue, ex, key);
        });

        ch.consume(q.queue, function(msg) {
          var msgContent = msg.content.toString();
          callback(msgContent);

        }, {noAck: true});
      });
    });

  },

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