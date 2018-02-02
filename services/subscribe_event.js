"use strict";

const root_prefix = '..'
  , rabbitmqConnection = require(root_prefix + '/services/rabbitmqConnection')
  , rmqId = 'rmq1'
;

const subscribeEvent = {

  perform: async function (params) {

    if (params.length == 0) {
      console.log("invalid parameters.");
      process.exit(1);
    }

    var conn = await rabbitmqConnection.get(rmqId);

    conn.createChannel(function(err, ch) {
      var ex = 'topic_events';

      ch.assertExchange(ex, 'topic', {durable: true});

      ch.assertQueue('', {exclusive: true}, function(err, q) {
        console.log(' [*] Waiting for logs. To exit press CTRL+C', q.queue);

        params.forEach(function(key) {
          ch.bindQueue(q.queue, ex, key);
        });

        ch.consume(q.queue, function(msg) {
          console.log(" [x] consuming ", msg.fields.routingKey, " => " ,msg.content.toString());
        }, {noAck: true});
      });
    });

  }

};

module.exports = subscribeEvent;