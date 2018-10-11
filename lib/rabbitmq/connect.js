'use strict';

/**
 * Pseudo Singleton Object (in the context of a config strategy) to manage and establish RabbitMq connections
 *
 * @module lib/rabbitmq/connect
 */

const rootPrefix = '../..',
  amqp = require('amqplib/callback_api'),
  rabbitMqHelper = require(rootPrefix + '/lib/rabbitmq/helper'),
  localEvents = require(rootPrefix + '/services/local_emitter'),
  InstanceComposer = require(rootPrefix + '/instance_composer'),
  logger = require(rootPrefix + '/lib/logger/custom_console_logger');

const rmqIdToConnectionMap = {},
  rmqIdToInProcessRequestsMap = {};

/**
 *
 * @param {object} configStrategy - config strategy
 * @param {object} instanceComposer - Instance Composer object
 *
 * @param configStrategy
 * @param instanceComposer
 * @constructor
 */
const RabbitmqConnectionKlass = function(configStrategy, instanceComposer) {
  const oThis = this;

  oThis.rmqId = rabbitMqHelper.getInstanceKey(configStrategy);
  // Wait in seconds for connection to establish.
  oThis.connectionWaitSeconds = configStrategy.CONNECTION_WAIT_SECONDS;
};

RabbitmqConnectionKlass.prototype = {
  /**
   * Get the established connection and return. If connection is not present set new connection in required mode.
   *
   * @return {Promise}
   */
  get: function() {
    const oThis = this;

    if (oThis.ic().configStrategy.OST_RMQ_SUPPORT !== '1') {
      return Promise.resolve(null);
    } else if (rmqIdToConnectionMap[oThis.rmqId]) {
      // if connection is present in map, return the same
      return Promise.resolve(rmqIdToConnectionMap[oThis.rmqId]);
    } else {
      let promiseContext = {
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
        // if this is the first request, initiate connection creation
        rmqIdToInProcessRequestsMap[oThis.rmqId].push(promiseContext);

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
        // else push into the list of in process request and wait for connection to be made by the head of the array
        rmqIdToInProcessRequestsMap[oThis.rmqId].push(promiseContext);
      }

      return promiseObj;
    }
  },

  /**
   * Resolve all the in process requests
   *
   * @param {object} conn - connection object
   */
  resolveAll: function(conn) {
    const oThis = this;

    while (rmqIdToInProcessRequestsMap[oThis.rmqId][0]) {
      let promiseContext = rmqIdToInProcessRequestsMap[oThis.rmqId].shift();

      let resolve = promiseContext.resolve;
      resolve(conn);
    }
  },

  /**
   * Reject all the in process requests
   *
   * @param {string} reason - error string to reject with
   */
  rejectAll: function(reason) {
    const oThis = this;

    while (rmqIdToInProcessRequestsMap[oThis.rmqId][0]) {
      let promiseContext = rmqIdToInProcessRequestsMap[oThis.rmqId].shift();

      let reject = promiseContext.reject;
      reject(reason);
    }
  },

  /**
   * Establishing new connection to RabbitMq.
   *
   * @returns {Promise}
   */
  set: function() {
    // Declare variables.
    const oThis = this,
      retryIntervalInMs = 1000;
    let connectionAttempts = 0,
      timedOutReason = null;

    if (oThis.ic().configStrategy.OST_RMQ_SUPPORT !== '1') {
      return Promise.resolve(null);
    }

    return new Promise(function(onResolve, onReject) {
      let connectRmqInstance = function() {
        if (rmqIdToConnectionMap[oThis.rmqId]) {
          return onResolve(rmqIdToConnectionMap[oThis.rmqId]);
        } else if (timedOutReason) {
          return onReject(new Error(timedOutReason));
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
                  timedOutReason = 'Maximum retry connects failed for rmqId:' + oThis.rmqId;
                }
                connectRmqInstance();
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
              return onResolve(conn);
            }
          }
        );
      };
      connectRmqInstance();
      if (oThis.connectionWaitSeconds) {
        setTimeout(function() {
          timedOutReason = 'Connection timed out for rmqId:' + oThis.rmqId;
          connectRmqInstance();
        }, oThis.connectionWaitSeconds * 1000);
      }
    });
  }
};

InstanceComposer.register(RabbitmqConnectionKlass, 'getRabbitMqConnection', true);

module.exports = RabbitmqConnectionKlass;
