"use strict";
/*
 * Load configuration file
 *
 */
var r_config = require("../rabbitmq.json");

const rabbitmqConstants = {
  // All configs
  allServers: function () {
    return r_config;
  },

  maxConnectionAttempts: 3,

  connectionString: function (rmqId) {
    var c = r_config[rmqId];
    return "amqp://" + c.user + ":" + c.pass + "@" + c.host + ":" + c.port + "/?heartbeat=" + c.heartbeat;
  },
  primaryExchange: function (rmqId) {
    var c = r_config[rmqId];
    return c.primaryExchange;
  },
  deadLetterExchange: function (rmqId) {
    var c = r_config[rmqId];
    return c.deadLetterExchange;
  },
  commonExchangeOptions: function () {
    return {
      durable: true,
      autoDelete: false
    }
  },
  deadLetterQueueOptions: function () {
    return {
      durable: true,
      autoDelete: false
    }
  }
};

module.exports = rabbitmqConstants;