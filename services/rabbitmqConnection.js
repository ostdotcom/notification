"use strict";

const rootPrefix = '..'
  , amqp = require('amqplib/callback_api')
  , rabbitmqConstants = require(rootPrefix + '/lib/rabbitmq')
  , coreConstants = require(rootPrefix + '/config/core_constants')
;

const rabbitmqConnection = function () {
  this.connections = {};
  this.tryingConnection = {};
};

rabbitmqConnection.prototype = {

  constructor: rabbitmqConnection,

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

  set: function (rmqId) {

    var oThis = this
      , connectionAttempts = 0
      , retryConnectionAfter = 1000
    ;

    if(!coreConstants.RMQ_SUPPORT){
      return onResolve(null);
    }

    var connectRmqInstance = function () {
      return new Promise(function(onResolve, onReject){
        if(oThis.connections[rmqId]){
          return onResolve(oThis.connections[rmqId]);
        } else if(oThis.tryingConnection[rmqId]) {
          console.log("Re Trying connect after 2000");
          setTimeout( function(){
            if(oThis.connections[rmqId]){
              return onResolve(oThis.connections[rmqId]);
            } else {
              connectRmqInstance()
            }
          }, 2000);
        } else {

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
                return setTimeout(connectRmqInstance, retryConnectionAfter);
              });
              conn.on("close", function (c_msg) {
                console.log("[AMQP] reconnecting", c_msg);
                delete oThis.connections[rmqId];
                return setTimeout(connectRmqInstance, retryConnectionAfter);
              });

              console.log("RMQ Connection Established..");
              oThis.connections[rmqId] = conn;
              // read file and publish pending messages.
              return onResolve(conn);
            }
          });
        }
      });
    };

    return connectRmqInstance();

  }

};

module.exports = new rabbitmqConnection;