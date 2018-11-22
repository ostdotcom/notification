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

  oThis.rmqId = rabbitMqHelper.getRmqId(configStrategy);
  oThis.instanceKey = rabbitMqHelper.getInstanceKey(configStrategy);
  oThis.rmqHost = rabbitMqHelper.getConfigRmqHost(configStrategy);
  oThis.configRmqClusterNodes = rabbitMqHelper.getConfigRmqClusterNodes(configStrategy);

  // Wait in seconds for connection to establish.
  oThis.getConnectionTimeout = configStrategy.CONNECTION_WAIT_SECONDS;
  oThis.switchHostAfterTime = configStrategy.SWITCH_HOST_AFTER_TIME || 30;

  oThis.switchConnectionFunction = null;
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

      //Timeout is part of instancekey. Higher timeout connection attempt should not block lower timeout connection attempts.
      //Two different instanceKey can have same rmqId. This will happen when only connection timeout parameter is different.
      rmqIdToInProcessRequestsMap[oThis.instanceKey] = rmqIdToInProcessRequestsMap[oThis.instanceKey] || [];

      if (rmqIdToInProcessRequestsMap[oThis.instanceKey].length === 0) {
        // if this is the first request, initiate connection creation
        rmqIdToInProcessRequestsMap[oThis.instanceKey].push(promiseContext);

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
        rmqIdToInProcessRequestsMap[oThis.instanceKey].push(promiseContext);
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

    while (rmqIdToInProcessRequestsMap[oThis.instanceKey][0]) {
      let promiseContext = rmqIdToInProcessRequestsMap[oThis.instanceKey].shift();

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

    while (rmqIdToInProcessRequestsMap[oThis.instanceKey][0]) {
      let promiseContext = rmqIdToInProcessRequestsMap[oThis.instanceKey].shift();

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
      rmqId = oThis.rmqId;

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

        logger.log('Connection will attempted on: ', oThis.ic().configStrategy.OST_RMQ_HOST);
        amqp.connect(
          rabbitMqHelper.connectionString(oThis.ic().configStrategy),
          function(err, conn) {
            if (err || !conn) {
              rmqIdToConnectionMap[rmqId] = null;
              logger.error('Error from rmq connection attempt : ' + err);
              connectionAttempts++;
              logger.info('Trying connect after ', retryIntervalInMs * connectionAttempts);
              setTimeout(function() {
                if (connectionAttempts >= rabbitMqHelper.maxConnectionAttempts) {
                  logger.error('Maximum retry attempts for connection reached');
                  timedOutReason = 'Maximum retry connects failed for rmqId:' + rmqId;
                  process.emit('connectionTimedOut', { failedHost: oThis.rmqHost });
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
                setSwitchTimeouts();
                connectRmqInstance();
              });
              conn.once('close', function(c_msg) {
                logger.info('[AMQP] reconnecting', c_msg);
                delete rmqIdToConnectionMap[rmqId];
                localEvents.emitObj.emit('rmq_fail', c_msg);

                setSwitchTimeouts();
                connectRmqInstance();
              });

              logger.info('RMQ Connection Established..'); // Todo : In case connection is created check if configstrategy is in sync. If not, then set proper endpoint in configStrategy
              //Connections should be saved under rmqId. So that one connection of one rmqId is assured.
              rmqIdToConnectionMap[rmqId] = conn;
              timedOutReason = null;
              if (oThis.switchConnectionFunction) {
                clearTimeout(oThis.switchConnectionFunction);
              }
              if (connectionTimeout) {
                clearTimeout(connectionTimeout);
              }
              oThis.switchConnectionFunction = null;
              connectionAttempts = 0; //ConnectionAttempt reset here. So that at next failure, connectionAttempts counter starts from 0.
              return onResolve(conn);
            }
          }
        );
      };

      let setSwitchTimeouts = function() {
        if (oThis.switchHostAfterTime && !oThis.switchConnectionFunction) {
          //Second condition is kept to avoid double switch attempt instantaneusly in case two function calls come back to back
          oThis.switchConnectionFunction = setTimeout(function() {
            if (!rmqIdToConnectionMap[rmqId] && oThis.configRmqClusterNodes.length > 1) {
              logger.error('SwitchHostAfterTime Connection not established for rmqId:' + rmqId, connectionAttempts);
              timedOutReason = null;
              connectionAttempts = 0;
              let configStrategy = oThis.ic().configStrategy;
              for (var i = 0; i < oThis.configRmqClusterNodes.length; i++) {
                let newHost = oThis.configRmqClusterNodes[i];
                if (newHost != oThis.rmqHost) {
                  logger.step(
                    'Will try to establish connection on Host ' + newHost + ' - rmqId:' + rmqId,
                    connectionAttempts
                  );
                  Object.assign(configStrategy, { OST_RMQ_HOST: newHost });
                  rmqId = rabbitMqHelper.getRmqId(configStrategy);
                  process.emit('switchConnectionHost', { newHost: newHost, failedHost: oThis.rmqHost });
                  oThis.rmqHost = newHost;
                  oThis.switchConnectionFunction = null;
                  break;
                }
              }
              setSwitchTimeouts();
            }
          }, oThis.switchHostAfterTime * 1000);
        }
      };

      /**
       * Function to set connection timeout. Specifically used to quit attempting any more connections.
       */
      let setConnectionTimeout = function() {
        if (connectionTimeout) {
          clearTimeout(connectionTimeout);
        }
        if (oThis.getConnectionTimeout) {
          logger.info('Connection Timeout passed');
          connectionTimeout = setTimeout(function() {
            if (!rmqIdToConnectionMap[rmqId]) {
              logger.error('Connection timed out for rmqId:' + rmqId);
              timedOutReason = 'Connection timed out for rmqId:' + rmqId;
              process.emit('connectionTimedOut', { failedHost: oThis.rmqHost });
            }
          }, oThis.getConnectionTimeout * 1000);
        }
      };

      setSwitchTimeouts();
      setConnectionTimeout();
      connectRmqInstance();
    });
  }
};

InstanceComposer.register(RabbitmqConnectionKlass, 'getRabbitMqConnection', true);

module.exports = RabbitmqConnectionKlass;
