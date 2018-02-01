"use strict";

const root_prefix = '..'
  , amqp = require('amqplib/callback_api')
  , rabbitmqConstants = require(root_prefix + '/lib/rabbitmq')
;

const rabbitmqConnection = function () {
  this.connections = {};
};

rabbitmqConnection.prototype = {

  constructor: rabbitmqConnection,

  get: function (rmqId) {

    var oThis = this
      , connectionAttempts = 0;

    return new Promise(function(onResolve, onReject){

      if(oThis.connections[rmqId]){
        return onResolve(oThis.connections[rmqId]);
      }

      var connectRmqInstance = function(){
        amqp.connect(rabbitmqConstants.connectionString(rmqId), function (err, conn) {
          if (err || !conn) {
            console.log("Error is : " + err);
            if(connectionAttempts >= rabbitmqConstants.maxConnectionAttempts){
              return onResolve(null);
            }
            setTimeout(
              function () {
                connectionAttempts++;
                connectRmqInstance(connectionString, queueNames);
              }, 100);
          } else {
            oThis.connections[rmqId] = conn;
            //conn.on('connect', oThis.performOnConnect());
            return onResolve(conn);
          }
        });
      };

      connectRmqInstance();

    });

  },

  performOnConnect: function () {

  }

};

module.exports = new rabbitmqConnection;