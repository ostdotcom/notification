"use strict";
/**
 * Publish event to Rabbitmq.
 *
 * @module services/publish_event
 *
 */

const rootPrefix = '..'
  , rabbitmqConnection = require(rootPrefix + '/services/rabbitmqConnection')
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , util = require(rootPrefix + '/lib/util')
  , localEmitter = require(rootPrefix + '/services/local_emitter')
  , validator = require(rootPrefix + '/services/validator/init')
  , coreConstants = require(rootPrefix + '/config/core_constants')
  , rmqId = 'rmq1'
;

const publishEvent = {

  /**
   * Publish to rabbitmq and local emitter also.
   *
   * @param {object} params - topics {Array} - on which topic messages
   *                          message {object} - kind {string} - kind of the message
   *                                           - payload {object} - Payload to identify message and extra info.
   *
   */
  perform: async function(params) {

    const r = await validator.basicParams(params);

    if(r.isFailure()){
      return Promise.resolve(r);
    }

    const validatedParams = r.data
      , ex = 'topic_events'
      , topics = validatedParams['topics']
      , msgString = JSON.stringify(validatedParams)
    ;

    if(coreConstants.RMQ_SUPPORT){

      const conn = await rabbitmqConnection.get(rmqId, true);

      if(conn){
        conn.createChannel(function(err, ch) {

          ch.assertExchange(ex, 'topic', {durable: true});
          topics.forEach(function(key) {
            ch.publish(ex, key, new Buffer(msgString));
            console.log(" [x] Sent %s:'%s'", key, msgString);
          });

          ch.close();

        });
      } else {
        console.log("Connection not found writing to tmp.");
        util.saveUnpublishedMessages(msgString);
      }

    }

    topics.forEach(function(key) {
      localEmitter.emitObj.emit(key, msgString);
    });

    return Promise.resolve(responseHelper.successWithData({}));
  }

};

module.exports = publishEvent;