"use strict";

const rootPrefix = '..'
  , rabbitmqConnection = require(rootPrefix + '/services/rabbitmqConnection')
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , util = require(rootPrefix + '/lib/util')
  , localEmitter = require(rootPrefix + '/services/local_emitter')
  , validator = require(rootPrefix + '/services/validator/init')
  , rmqId = 'rmq1'
;

const publishEvent = {

  perform: async function(params) {

    var oThis = this;

    var r = await validator.basicParams(params);

    if(r.isFailure()){
      return Promise.resolve(r);
    }

    var validatedParams = r.data
      , ex = 'topic_events'
      , key = validatedParams['topic']
      , message = validatedParams['message']
      , msgString = JSON.stringify(validatedParams)
      , conn = await rabbitmqConnection.get(rmqId);

    if(conn){
      conn.createChannel(function(err, ch) {

        ch.assertExchange(ex, 'topic', {durable: true});
        ch.publish(ex, key, new Buffer(msgString));
        console.log(" [x] Sent %s:'%s'", key, message);

        ch.close();

      });
    } else {
      util.saveUnpublishedMessages(msgString);

    }

    localEmitter.emitObj.emit(key, message);

    return Promise.resolve(responseHelper.successWithData({}));
  }

};

module.exports = publishEvent;