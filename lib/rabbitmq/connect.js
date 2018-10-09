'use strict';

/**
 * Singleton class to manage and establish rabbitMq connection
 *
 * @module lib/rabbitmq/connect
 */

const rootPrefix = '../..',
  amqp = require('amqplib/callback_api'),
  rabbitMqHelper = require(rootPrefix + '/lib/rabbitmq/helper'),
  localEvents = require(rootPrefix + '/services/local_emitter'),
  InstanceComposer = require(rootPrefix + '/instance_composer'),
  logger = require(rootPrefix + '/lib/logger/custom_console_logger');

function _getTimeStamp() {
  return !Date.now ? +new Date() : Date.now();
}

const rmqIdToConnectionMap = {};
const rmqIdToInProcessRequestsMap = {};

/**
 * Constructor of the Rabbitmq ConnectionKlass
 *
 * @param {string} rmqId - id of rabbitMQ to get connection
 *
 * @constructor
 */
const RabbitmqConnectionKlass = function(configStrategy, instanceComposer) {
  const oThis = this;

  oThis.rmqId = rabbitMqHelper.getInstanceKey(configStrategy);
};

RabbitmqConnectionKlass.prototype = {
  /**
   *
   * Get the established connection and return. If connection is not present set new connection in required mode.
   * Note: For publish set connection async and return, otherwise wait for the connection.
   *
   * @param {boolean} asyncCall - set connection mode in case connection is not available
   *
   * @return {promise}
   *
   */
  get: function(asyncCall) {
    const oThis = this;

    if (rmqIdToConnectionMap[oThis.rmqId]) {
      return Promise.resolve(rmqIdToConnectionMap[oThis.rmqId]);
    } else if (asyncCall) {
      // TODO - start the init for connection
      return Promise.resolve();
    } else {
      let ts = _getTimeStamp(),
        promiseContext = {
          startTimestamp: ts,
          promiseObj: null,
          resolve: null,
          reject: null
        },
        promiseObj = new Promise(function(resolve, reject) {
          promiseContext.resolve = resolve;
          promiseContext.reject = reject;
        });

      promiseContext.promiseObj = promiseObj;

      rmqIdToInProcessRequestsMap[oThis.rmqId] = rmqIdToInProcessRequestsMap[oThis.rmqId] || [];

      if (rmqIdToInProcessRequestsMap[oThis.rmqId].length === 0) {
        rmqIdToInProcessRequestsMap[oThis.rmqId].push(promiseContext);

        // first request for connection
        oThis
          .set()
          .then(
            function(conn) {
              oThis.resolveAll(conn);
            },
            function(err) {
              oThis.rejectAll(err);
            }
          )
          .catch(function(err) {
            oThis.rejectAll('unhandled error in lib/rabbitmq/connect.js while calling set. error:', err);
          });
      } else {
        rmqIdToInProcessRequestsMap[oThis.rmqId].push(promiseContext);
      }

      return promiseObj;
    }
  },

  resolveAll: function(conn) {
    const oThis = this;

    while (rmqIdToInProcessRequestsMap[oThis.rmqId][0]) {
      let promiseContext = rmqIdToInProcessRequestsMap[oThis.rmqId].shift();

      let resolve = promiseContext.resolve;
      resolve(conn);
    }
  },

  rejectAll: function(reason) {
    const oThis = this;

    while (rmqIdToInProcessRequestsMap[oThis.rmqId][0]) {
      let promiseContext = rmqIdToInProcessRequestsMap[oThis.rmqId].shift();

      let reject = promiseContext.reject;
      reject(reason);
    }
  },

  /**
   * Establishing new connection to rabbitMq.
   * Making sure that multiple instances are not trying to make multiple connections at a time
   *
   * @returns {Promise<any>}
   *
   */
  set: function() {
    // Declare variables.
    const oThis = this,
      retryIntervalInMs = 1000;
    let connectionAttempts = 0;

    return new Promise(function(onResolve, onReject) {
      //let rabbitMqHelper = oThis.ic().getRabbitMqHelper();

      let connectRmqInstance = function() {
        if (rmqIdToConnectionMap[oThis.rmqId]) {
          return onResolve(rmqIdToConnectionMap[oThis.rmqId]);
        }

        amqp.connect(
          rabbitMqHelper.connectionString(oThis.ic().configStrategy),
          function(err, conn) {
            if (err || !conn) {
              rmqIdToConnectionMap[oThis.rmqId] = null;
              logger.error('Error is : ' + err);
              connectionAttempts++;
              //logger.debug("Trying connect after ", (retryConnectionAfter * connectionAttempts));
              setTimeout(function() {
                if (connectionAttempts >= rabbitMqHelper.maxConnectionAttempts) {
                  logger.error('Maximum retry connects failed');
                  // Notify about multiple rabbitMq connections failure.
                  return onReject(new Error('Maximum retry connects failed for rmqId:', oThis.rmqId));
                } else {
                  connectRmqInstance();
                }
              }, retryIntervalInMs * connectionAttempts);
            } else {
              conn.once('error', function(err) {
                logger.error('[AMQP] conn error', err.message);

                if (err.message !== 'Connection closing') {
                  logger.error('[AMQP] conn error in closing');
                }
                delete rmqIdToConnectionMap[oThis.rmqId];
                localEvents.emitObj.emit('rmq_fail', err);
                connectRmqInstance();
              });
              conn.once('close', function(c_msg) {
                logger.info('[AMQP] reconnecting', c_msg);
                delete rmqIdToConnectionMap[oThis.rmqId];
                localEvents.emitObj.emit('rmq_fail', c_msg);
                connectRmqInstance();
              });

              logger.info('RMQ Connection Established..');
              rmqIdToConnectionMap[oThis.rmqId] = conn;
              // read file and publish pending messages.
              return onResolve(conn);
            }
          }
        );
      };
      connectRmqInstance();
    });
  }
};

InstanceComposer.register(RabbitmqConnectionKlass, 'getRabbitMqConnection', true);

module.exports = RabbitmqConnectionKlass;
