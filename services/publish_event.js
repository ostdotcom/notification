"use strict";
/**
 * Publish event to RabbitMQ.
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
  , rmqId = 'rmq1' // To support horizontal scaling in future
;

/**
 * Constructor to publish RMQ event
 *
 * @constructor
 */
const PublishEventKlass = function () {
};

PublishEventKlass.prototype = {

  /**
   * Publish to rabbitmq and local emitter also.
   *
   * @param {object} params - event parameters
   * @param {array} params.topics - on which topic messages
   * @param {object} params.message -
   * @param {string} params.message.kind - kind of the message
   * @param {object} params.message.payload - Payload to identify message and extra info.
   *
   * @return {promise<result>}
   */
  perform: async function(params) {

    // Validations
    const r = await validator.light(params);
    if(r.isFailure()){
      console.error(r);
      return Promise.resolve(r);
    }

    const validatedParams = r.data
      , ex = 'topic_events'
      , topics = validatedParams['topics']
      , msgString = JSON.stringify(validatedParams)
    ;

    // Publish local events
    topics.forEach(function(key) {
      localEmitter.emitObj.emit(key, msgString);
    });


    // publish RMQ events if required
    if(coreConstants.OST_RMQ_SUPPORT == '1'){

      const conn = await rabbitmqConnection.get(rmqId, true);

      if(conn){
        conn.createChannel(function(err, ch) {

          if (err) {
            return Promise.resolve(responseHelper.error('s_pe_2', 'Channel could not be created on queue: ' + err));
          }

          //TODO: assertExchange and publish, promise is not handled
          ch.assertExchange(ex, 'topic', {durable: true});
          topics.forEach(function(key) {
            ch.publish(ex, key, new Buffer(msgString));
          });

          ch.close();

        });
      } else {
        console.error("Connection not found writing to tmp.");
        util.saveUnpublishedMessages(msgString);
        return Promise.resolve(responseHelper.error('s_pe_1', 'Rabbitmq connection not found.'));
      }

    }

    return Promise.resolve(responseHelper.successWithData({}));
  }

};

module.exports = new PublishEventKlass();