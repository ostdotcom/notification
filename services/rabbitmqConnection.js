"use strict";

/**
 * Singleton class to manage and establish rabbitmq connection
 *
 * @module services/rabbitmqConnection
 */

const rootPrefix = '..'
  , amqp = require('amqplib/callback_api')
  , rabbitmqConstants = require(rootPrefix + '/lib/rabbitmq')
  , coreConstants = require(rootPrefix + '/config/core_constants')
  , localEvents = require(rootPrefix + '/services/local_emitter')
;

/**
 * constructor of the rabbitmqConnection
 *
 * @constructor
 */
const rabbitmqConnection = function () {
  this.connections = {};
  this.tryingConnection = {};
};

rabbitmqConnection.prototype = {

  /**
   *
   * Get the established connection and return. If connection is not present set new connection in required mode.
   * Note: For publish set connection async and return, otherwise wait for the connection.
   *
   * @param {string} rmqid - id of rabbitmq to get connection
   * @param {boolean} asyncCall - set connection mode in case connection is not available
   *
   * @return {Promise<connection object>}
   *
   */
  get: async function (rmqId, asyncCall) {

    var oThis = this;

    if(!coreConstants.RMQ_SUPPORT){
      return Promise.resolve(null);
    } else if(oThis.connections[rmqId]){
      console.log("connection found for => ", rmqId);
    } else if(asyncCall) {
      console.log("Setting connection async..");
      oThis.set(rmqId);
    } else {
      console.log("Setting connection..");
      await oThis.set(rmqId);
    }

    if(oThis.connections[rmqId]){
      console.log("connection is ready ");
    }

    return Promise.resolve(oThis.connections[rmqId]);

  },

  /**
   * Establishing new connection to rabbitmq.
   * Making sure that multiple instances are not trying to make multiple connections at a time
   *
   * @param {string} rmqId - name of the rabbitmq for which connection is to be established.
   *
   * @returns {Promise<>}
   *
   */
  set: function (rmqId) {

    var oThis = this
      , connectionAttempts = 0
      , retryConnectionAfter = 1000
    ;

    if(!coreConstants.RMQ_SUPPORT){
      return Promise.resolve(null);
    }

    return new Promise(function(onResolve, onReject){

      var connectRmqInstance = function () {

        oThis.tryingConnection[rmqId] = 1;

        amqp.connect(rabbitmqConstants.connectionString(), function (err, conn) {

          delete oThis.tryingConnection[rmqId];

          if (err || !conn) {
            oThis.connections[rmqId] = null;
            console.log("Error is : " + err);
            connectionAttempts++;
            console.log("Trying connect after ", (retryConnectionAfter * connectionAttempts));
            setTimeout(
              function () {
                if (connectionAttempts >= rabbitmqConstants.maxConnectionAttempts) {
                  console.log("Maximum retry connects failed");
                  // Notify about multiple rabbitmq connections failure.
                  return onResolve(null);
                } else {
                  connectRmqInstance();
                }
              }, (retryConnectionAfter * connectionAttempts));
          } else {
            conn.on("error", function (err) {
              console.error("[AMQP] conn error", err.message);

              if (err.message !== "Connection closing") {
                console.error("[AMQP] conn error in closing");
              }
              delete oThis.connections[rmqId];
              localEvents.emitObj.emit('rmq_fail', c_msg);
              connectRmqInstance();
            });
            conn.on("close", function (c_msg) {

              console.log("[AMQP] reconnecting", c_msg);
              delete oThis.connections[rmqId];
              localEvents.emitObj.emit('rmq_fail', c_msg);
              connectRmqInstance();
            });

            console.log("RMQ Connection Established..");
            oThis.connections[rmqId] = conn;
            // read file and publish pending messages.
            return onResolve(conn);
          }
        });
      };

      if(oThis.connections[rmqId]){
        return onResolve(oThis.connections[rmqId]);
      } else if(oThis.tryingConnection[rmqId]) {
        console.log("Re Trying connect after 2000");
        setTimeout( function(){
          if(oThis.connections[rmqId]){
            console.log("Connection found.....");
            return onResolve(oThis.connections[rmqId]);
          } else {
            connectRmqInstance();
          }
        }, 2000);
      } else if (connectionAttempts >= rabbitmqConstants.maxConnectionAttempts) {
        console.log("Maximum retry connects failed");
        // Notify about multiple rabbitmq connections failure.
        return onResolve(null);
      } else {
        connectRmqInstance();
      }
    });

  }

};

module.exports = new rabbitmqConnection;