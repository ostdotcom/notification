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

  get: async function (rmqId) {

    var oThis = this;

    if(oThis.connections[rmqId]){
      console.log("connection found for => ", rmqId);
    } else {
      console.log("Setting connection..");
      await oThis.set(rmqId);
    }

    console.log("connection is ready ");

    return Promise.resolve(oThis.connections[rmqId]);

  },

  set: function (rmqId) {

    var oThis = this
      , connectionAttempts = 0
      , retryConnectionAfter = 1000
    ;

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
                //retryConnect(retryConnectionAfter * connectionAttempts);
                setTimeout(
                  function () {
                    if (connectionAttempts >= rabbitmqConstants.maxConnectionAttempts) {
                      delete oThis.tryingConnection[rmqId];
                      console.log("Maximum retry connects failed");
                      // Notify about multiple rabbitmq connections failure.
                      return onResolve(null);
                    } else {
                      connectRmqInstance();
                    }
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
                  delete oThis.tryingConnection[rmqId];
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

      var retryConnect = function(afterTime){
        setTimeout(
          function () {
            if (connectionAttempts >= rabbitmqConstants.maxConnectionAttempts) {
              delete oThis.tryingConnection[rmqId];
              console.log("Maximum retry connects failed");
              // Notify about multiple rabbitmq connections failure.
            } else {
              connectRmqInstance();
            }
          }, afterTime);
      };

      return connectRmqInstance();

  },

  bset: function (rmqId) {

    var oThis = this
      , connectionAttempts = 0
      , retryConnectionAfter = 1000
    ;

    if(oThis.tryingConnection[rmqId]){
      console.log("Already trying to reconnect, please wait for sometime...");
      retryConnect();
    }

    var connectRmqInstance = function () {

      return new Promise(function(onResolve, onReject){
        oThis.tryingConnection[rmqId] = 1;

        amqp.connect(rabbitmqConstants.connectionString(), function (err, conn) {
          if (err || !conn) {
            oThis.connections[rmqId] = null;
            console.log("Error is : " + err);
            connectionAttempts++;
            console.log("Trying connect after ", (retryConnectionAfter * connectionAttempts));
            retryConnect();
            return onResolve(null);
          } else {

            conn.on("error", function (err) {
              if (err.message !== "Connection closing") {
                console.error("[AMQP] conn error", err.message);
              }
            });
            conn.on("close", function (c_msg) {
              console.log("[AMQP] reconnecting", c_msg);
              delete oThis.connections[rmqId];
              delete oThis.tryingConnection[rmqId];
              return setTimeout(connectRmqInstance(), retryConnectionAfter);
            });

            console.log("Establishing connection..");
            oThis.connections[rmqId] = conn;
            // read file and publish pending messages.
            return onResolve(conn);
          }
        });
      });

    };

    var retryConnect = function(){
      setTimeout(
        function () {
          if (connectionAttempts >= rabbitmqConstants.maxConnectionAttempts) {
            delete oThis.tryingConnection[rmqId];
            console.log("Maximum retry connects failed");
            // Notify about multiple rabbitmq connections failure.
            return false;
          } else {
            return connectRmqInstance();
          }
        }, (retryConnectionAfter * connectionAttempts));
    };

    return connectRmqInstance();

  }



};

module.exports = new rabbitmqConnection;