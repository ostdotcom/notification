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
  oThis.rmqHost = rabbitMqHelper.getConfigRmqHost(configStrategy);
  oThis.configRmqClusterNodes = rabbitMqHelper.getConfigRmqClusterNodes(configStrategy);

  // Wait in seconds for connection to establish.
  oThis.getConnectionTimeout = configStrategy.CONNECTION_WAIT_SECONDS || 60;
  oThis.switchHostAfterTime = configStrategy.SWITCH_HOST_AFTER_TIME || 30;
};

RabbitmqConnectionKlass.prototype = {
  /**
   * Get the established connection and return. If connection is not present set new connection in required mode.
   *
   * @return {Promise}
   */
  get: function() {
    const oThis = this;

    if (oThis.ic().configStrategy.OST_RMQ_SUPPORT != '1') {
      return Promise.resolve(null);
    } else if (rmqIdToConnectionMap[oThis.rmqId]) {
      // If connection is present in map, return the same connection.
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
      timedOutReason = null,
      connectionTimeout = null,
      switchHostAfterTime = null,
      rmqId = oThis.rmqId;

    console.log('Before swith host' + rmqId + '' + oThis.rmqId);

    if (oThis.ic().configStrategy.OST_RMQ_SUPPORT != '1') {
      return Promise.resolve(null);
    }

    return new Promise(function(onResolve, onReject) {
      let connectRmqInstance = function() {
        if (rmqIdToConnectionMap[rmqId]) {
          return onResolve(rmqIdToConnectionMap[rmqId]);
        } else if (timedOutReason) {
          return onReject(new Error(timedOutReason));
        }

        amqp.connect(
          rabbitMqHelper.connectionString(oThis.ic().configStrategy),
          function(err, conn) {
            if (err || !conn) {
              rmqIdToConnectionMap[rmqId] = null;
              logger.error('Error is : ' + err);
              connectionAttempts++;
              //logger.debug("Trying connect after ", (retryConnectionAfter * connectionAttempts));
              setTimeout(function() {
                if (connectionAttempts >= rabbitMqHelper.maxConnectionAttempts) {
                  logger.error('Maximum retry connects failed');
                  timedOutReason = 'Maximum retry connects failed for rmqId:' + rmqId;
                  //Call setTimeOut to run immediately.
                }
                connectRmqInstance();
              }, retryIntervalInMs * connectionAttempts);
            } else {
              conn.once('error', function(err) {
                logger.error('[AMQP] conn error', err.message);

                if (err.message !== 'Connection closing') {
                  logger.error('[AMQP] conn error in closing');
                }
                delete rmqIdToConnectionMap[rmqId];
                localEvents.emitObj.emit('rmq_fail', err);
                connectRmqInstance();
                setTimeouts();
              });
              conn.once('close', function(c_msg) {
                logger.info('[AMQP] reconnecting', c_msg);
                delete rmqIdToConnectionMap[rmqId];
                localEvents.emitObj.emit('rmq_fail', c_msg);
                connectRmqInstance();
                setTimeouts();
              });

              logger.info('RMQ Connection Established..');
              rmqIdToConnectionMap[rmqId] = conn;
              timedOutReason = null;
              return onResolve(conn);
            }
          }
        );
      };

      let setTimeouts = function() {
        if (connectionTimeout) {
          clearTimeout(connectionTimeout);
        }
        if (switchHostAfterTime) {
          clearTimeout(switchHostAfterTime);
        }
        if (oThis.getConnectionTimeout) {
          logger.error('getConnectionTimeout Connection not established for rmqId:' + rmqId);
          connectionTimeout = setTimeout(function() {
            console.log('Set timeout of getConnectionTimeout');
            if (!rmqIdToConnectionMap[rmqId]) {
              timedOutReason = 'Connection timed out for rmqId:' + rmqId;
              process.emit('connectionTimedOut', { failedHost: oThis.rmqHost });
            }
          }, oThis.getConnectionTimeout * 1000);
        }
        if (oThis.switchHostAfterTime) {
          logger.error('switchHostAfterTime Connection not established for rmqId:' + rmqId);
          switchHostAfterTime = setTimeout(function() {
            console.log('Set timeout of switchHostAfterTime');
            if (!rmqIdToConnectionMap[rmqId]) {
              timedOutReason = null;
              connectionAttempts = 0;
              let configStrategy = oThis.ic().configStrategy;
              for (var i = 0; i < oThis.configRmqClusterNodes.length; i++) {
                let newHost = oThis.configRmqClusterNodes[i];
                if (newHost != oThis.rmqHost) {
                  logger.step('Trying to establish connection on Host ' + newHost + ' - rmqId:' + rmqId);
                  Object.assign(configStrategy, { OST_RMQ_HOST: newHost });
                  rmqId = rabbitMqHelper.getInstanceKey(configStrategy);
                  process.emit('switchConnectionHost', { newHost: newHost, failedHost: oThis.rmqHost });
                  oThis.rmqHost = newHost;
                  break;
                }
              }
            }
          }, oThis.switchHostAfterTime * 1000);
        }
      };

      connectRmqInstance();
      setTimeouts();
    });
  }
};

InstanceComposer.register(RabbitmqConnectionKlass, 'getRabbitMqConnection', true);

module.exports = RabbitmqConnectionKlass;
