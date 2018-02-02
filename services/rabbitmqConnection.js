"use strict";

const root_prefix = '..'
  , amqp = require('amqplib/callback_api')
  , rabbitmqConstants = require(root_prefix + '/lib/rabbitmq')
;

const rabbitmqConnection = function () {
  this.connections = {};
  this.tryingConnection = {};
};

rabbitmqConnection.prototype = {

  constructor: rabbitmqConnection,

  get: function (rmqId) {

    var oThis = this;

    console.log("Getting connection..");
    return new Promise(function(onResolve, onReject){

      if(oThis.connections[rmqId]){
        console.log(oThis.connections[rmqId]);
      } else {
        oThis.set(rmqId);
      }

      return onResolve(oThis.connections[rmqId]);

    });

  },

  set: function (rmqId) {

    var oThis = this
      , connectionAttempts = 0
      , retryConnectionAfter = 1000
    ;

    if(oThis.tryingConnection[rmqId]){
      console.log("Already trying to reconnect, please wait for sometime...");
      return null;
    }

    var connectRmqInstance = function () {

      oThis.tryingConnection[rmqId] = 1;
      console.log("Trying connect after ", retryConnectionAfter);

      amqp.connect(rabbitmqConstants.connectionString(rmqId), function (err, conn) {
        if (err || !conn) {
          console.log("Error is : " + err);
          if (connectionAttempts >= rabbitmqConstants.maxConnectionAttempts) {
            delete oThis.tryingConnection[rmqId];
            oThis.connections[rmqId] = null;
            return null;
          }
          setTimeout(
            function () {
              connectionAttempts++;
              connectRmqInstance();
            }, (retryConnectionAfter * connectionAttempts));
        } else {

          conn.on("error", function (err) {
            if (err.message !== "Connection closing") {
              console.error("[AMQP] conn error", err.message);
            }
          });
          conn.on("close", function (c_msg) {
            console.log("[AMQP] reconnecting", c_msg);
            delete oThis.connections[rmqId];
            return setTimeout(connectRmqInstance(), retryConnectionAfter);
          });

          console.log("Establishing connection..");
          oThis.connections[rmqId] = conn;
          // read file and publish pending messages.
          return conn;
        }
      });

    };

    return connectRmqInstance();

  }

};

module.exports = new rabbitmqConnection;