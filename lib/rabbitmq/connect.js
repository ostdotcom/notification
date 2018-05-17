"use strict";

/**
 * Singleton class to manage and establish rabbitmq connection
 *
 * @module lib/rabbitmq/connect
 */

const rootPrefix = '../..'
  , amqp = require('amqplib/callback_api')
  , rabbitmqHelper = require(rootPrefix + '/lib/rabbitmq/helper')
  , coreConstants = require(rootPrefix + '/config/core_constants')
  , localEvents = require(rootPrefix + '/services/local_emitter')
  , logger = require(rootPrefix + '/lib/logger/custom_console_logger')
;

/**
 * constructor of the RabbitmqConnectionKlass
 *
 * @constructor
 */
const RabbitmqConnectionKlass = function () {
  this.connections = {};
  this.tryingConnection = {};
};

RabbitmqConnectionKlass.prototype = {

  /**
   *
   * Get the established connection and return. If connection is not present set new connection in required mode.
   * Note: For publish set connection async and return, otherwise wait for the connection.
   *
   * @param {string} rmqid - id of rabbitmq to get connection
   * @param {boolean} asyncCall - set connection mode in case connection is not available
   *
   * @return {promise<connectionObject>}
   *
   */
  get: async function (rmqId, asyncCall) {

    var oThis = this;

    if (coreConstants.OST_RMQ_SUPPORT != '1') {
      return Promise.resolve(null);
    } else if (oThis.connections[rmqId]) {
      //logger.debug("connection found for => ", rmqId);
    } else if (asyncCall) {
      oThis.set(rmqId);
    } else {
      await oThis.set(rmqId);
    }

    return Promise.resolve(oThis.connections[rmqId]);

  },

  /**
   * Establishing new connection to rabbitmq.
   * Making sure that multiple instances are not trying to make multiple connections at a time
   *
   * @param {string} rmqId - name of the rabbitmq for which connection is to be established.
   *
   * @returns {promise<connectionObject>}
   *
   */
  set: function (rmqId) {

    var oThis = this
      , connectionAttempts = 0
      , retryConnectionAfter = 1000
    ;

    if (coreConstants.OST_RMQ_SUPPORT != '1') {
      return Promise.resolve(null);
    }

    return new Promise(function (onResolve, onReject) {

      var connectRmqInstance = function () {

        if (oThis.connections[rmqId]) {
          return onResolve(oThis.connections[rmqId]);
        } else if (oThis.tryingConnection[rmqId] == 1) {
          logger.info("Re Trying connect after 2000");
          return setTimeout(connectRmqInstance, 2000);
        } else if (connectionAttempts >= rabbitmqHelper.maxConnectionAttempts) {
          logger.error("Maximum retry connects failed");
          // Notify about multiple rabbitmq connections failure.
          return onResolve(null);
        }

        oThis.tryingConnection[rmqId] = 1;

        amqp.connect(rabbitmqHelper.connectionString(), function (err, conn) {

          delete oThis.tryingConnection[rmqId];

          if (err || !conn) {
            oThis.connections[rmqId] = null;
            logger.error("Error is : " + err);
            connectionAttempts++;
            //logger.debug("Trying connect after ", (retryConnectionAfter * connectionAttempts));
            setTimeout(
              function () {
                if (connectionAttempts >= rabbitmqHelper.maxConnectionAttempts) {
                  logger.error("Maximum retry connects failed");
                  // Notify about multiple rabbitmq connections failure.
                  return onResolve(null);
                } else {
                  connectRmqInstance();
                }
              }, (retryConnectionAfter * connectionAttempts));
          } else {
            conn.once("error", function (err) {
              logger.error("[AMQP] conn error", err.message);

              if (err.message !== "Connection closing") {
                logger.error("[AMQP] conn error in closing");
              }
              delete oThis.connections[rmqId];
              localEvents.emitObj.emit('rmq_fail', err);
              connectRmqInstance();
            });
            conn.once("close", function (c_msg) {

              logger.info("[AMQP] reconnecting", c_msg);
              delete oThis.connections[rmqId];
              localEvents.emitObj.emit('rmq_fail', c_msg);
              connectRmqInstance();
            });

            logger.info("RMQ Connection Established..");
            oThis.connections[rmqId] = conn;
            // read file and publish pending messages.
            return onResolve(conn);
          }
        });
      };
      connectRmqInstance();
    });

  }

};

module.exports = new RabbitmqConnectionKlass();