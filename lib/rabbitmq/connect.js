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

/**
 * Constructor of the Rabbitmq ConnectionKlass
 *
 * @constructor
 */
const RabbitmqConnectionKlass = function() {
  this.connections = {};
  this.tryingConnection = {};
};

RabbitmqConnectionKlass.prototype = {
  /**
   *
   * Get the established connection and return. If connection is not present set new connection in required mode.
   * Note: For publish set connection async and return, otherwise wait for the connection.
   *
   * @param {string} rmqId - id of rabbitMQ to get connection
   * @param {boolean} asyncCall - set connection mode in case connection is not available
   *
   * @return {Promise<any>}
   *
   */
  get: async function(rmqId, asyncCall) {
    const oThis = this;

    if (oThis.connections[rmqId]) {
      return Promise.resolve(oThis.connections[rmqId]);
    } else if (asyncCall) {
      oThis.set(rmqId);
    } else {
      await oThis.set(rmqId);
    }

    return Promise.resolve(oThis.connections[rmqId]);
  },

  /**
   * Establishing new connection to rabbitMq.
   * Making sure that multiple instances are not trying to make multiple connections at a time
   *
   * @param {string} rmqId - name of the rabbitMq for which connection is to be established.
   *
   * @returns {Promise<any>}
   *
   */
  set: function(rmqId) {
    // Declare variables.
    const oThis = this,
      retryConnectionAfter = 1000;
    let connectionAttempts = 0;

    return new Promise(function(onResolve, onReject) {
      //let rabbitMqHelper = oThis.ic().getRabbitMqHelper();

      let connectRmqInstance = function() {
        if (oThis.connections[rmqId]) {
          return onResolve(oThis.connections[rmqId]);
        } else if (oThis.tryingConnection[rmqId] === 1) {
          logger.info('Re Trying connect after 2000');
          return setTimeout(connectRmqInstance, 2000);
        } else if (connectionAttempts >= rabbitMqHelper.maxConnectionAttempts) {
          logger.error('Maximum retry connects failed');
          // Notify about multiple rabbitMq connections failure.
          return onResolve(null);
        }

        oThis.tryingConnection[rmqId] = 1;

        amqp.connect(
          rabbitMqHelper.connectionString(oThis.ic().configStrategy),
          function(err, conn) {
            delete oThis.tryingConnection[rmqId];

            if (err || !conn) {
              oThis.connections[rmqId] = null;
              logger.error('Error is : ' + err);
              connectionAttempts++;
              //logger.debug("Trying connect after ", (retryConnectionAfter * connectionAttempts));
              setTimeout(function() {
                if (connectionAttempts >= rabbitMqHelper.maxConnectionAttempts) {
                  logger.error('Maximum retry connects failed');
                  // Notify about multiple rabbitMq connections failure.
                  return onResolve(null);
                } else {
                  connectRmqInstance();
                }
              }, retryConnectionAfter * connectionAttempts);
            } else {
              conn.once('error', function(err) {
                logger.error('[AMQP] conn error', err.message);

                if (err.message !== 'Connection closing') {
                  logger.error('[AMQP] conn error in closing');
                }
                delete oThis.connections[rmqId];
                localEvents.emitObj.emit('rmq_fail', err);
                connectRmqInstance();
              });
              conn.once('close', function(c_msg) {
                logger.info('[AMQP] reconnecting', c_msg);
                delete oThis.connections[rmqId];
                localEvents.emitObj.emit('rmq_fail', c_msg);
                connectRmqInstance();
              });

              logger.info('RMQ Connection Established..');
              oThis.connections[rmqId] = conn;
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
