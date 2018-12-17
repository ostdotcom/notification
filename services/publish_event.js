'use strict';
/**
 * Publish event to RabbitMQ.
 *
 * @module services/publish_event
 */

const rootPrefix = '..',
  validator = require(rootPrefix + '/lib/validator/init'),
  localEmitter = require(rootPrefix + '/services/local_emitter'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  apiErrorConfig = require(rootPrefix + '/config/api_error_config'),
  logger = require(rootPrefix + '/lib/logger/custom_console_logger'),
  paramErrorConfig = require(rootPrefix + '/config/param_error_config'),
  OSTBase = require('@openstfoundation/openst-base'),
  coreConstants = require(rootPrefix + '/config/coreConstants');

const InstanceComposer = OSTBase.InstanceComposer;

require(rootPrefix + '/lib/rabbitmq/connect');

const errorConfig = {
  param_error_config: paramErrorConfig,
  api_error_config: apiErrorConfig
};

/**
 * Constructor to publish RMQ event
 *
 * @constructor
 */
class PublishEventKlass {
  constructor() {}

  /**
   * Publish to rabbitMQ and local emitter also.
   *
   * @param {object} params - event parameters
   * @param {array} params.topics - on which topic messages
   * @param {object} params.message -
   * @param {string} params.message.kind - kind of the message
   * @param {object} params.message.payload - Payload to identify message and extra info.
   *
   * @return {Promise<result>}
   */
  async perform(params) {
    const oThis = this;

    // Validations.
    const r = await validator.light(params);
    if (r.isFailure()) {
      logger.error(r);
      return Promise.resolve(r);
    }

    const validatedParams = r.data,
      ex = 'topic_events',
      topics = validatedParams['topics'],
      msgString = JSON.stringify(validatedParams);
    let publishedInRmq = 0;

    // Publish local events.
    topics.forEach(function(key) {
      localEmitter.emitObj.emit(key, msgString);
    });

    if (oThis.ic().configStrategy.enableRabbitmq == '1') {
      let rabbitMqConnection = oThis.ic().getInstanceFor(coreConstants.icNameSpace, 'getRabbitMqConnection');

      // Publish RMQ events.
      const conn = await rabbitMqConnection.get();

      if (conn) {
        publishedInRmq = 1;
        conn.createChannel(function(err, ch) {
          if (err) {
            let errorParams = {
              internal_error_identifier: 's_pe_2',
              api_error_identifier: 'cannot_create_channel',
              error_config: errorConfig,
              debug_options: { err: err }
            };
            logger.error(err.message);
            return Promise.resolve(responseHelper.error(errorParams));
          }

          ch.assertExchange(ex, 'topic', { durable: true });

          for (let index = 0; index < topics.length; index++) {
            let currTopic = topics[index];
            ch.publish(ex, currTopic, new Buffer(msgString), { persistent: true });
          }

          ch.close();
        });
      } else {
        let errorParams = {
          internal_error_identifier: 's_pe_1',
          api_error_identifier: 'no_rmq_connection',
          error_config: errorConfig,
          debug_options: {}
        };
        return Promise.resolve(responseHelper.error(errorParams));
      }
    }

    return Promise.resolve(responseHelper.successWithData({ publishedToRmq: publishedInRmq }));
  }
}

InstanceComposer.registerAsObject(PublishEventKlass, coreConstants.icNameSpace, 'getPublishEventKlass', true);

module.exports = PublishEventKlass;
