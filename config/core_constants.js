"use strict";

const coreConstant = function () {};

coreConstant.prototype = {

  RMQ_HOST: process.env.RMQ_HOST,

  RMQ_PORT: process.env.RMQ_PORT,

  RMQ_MONITOR_PORT: process.env.RMQ_MONITOR_PORT,

  RMQ_USERNAME: process.env.RMQ_USERNAME,

  RMQ_PASSWORD: process.env.RMQ_PASSWORD,

  RMQ_HEARTBEATS: process.env.RMQ_HEARTBEATS,

  RMQ_PRIMARY_EXCHANGE: process.env.RMQ_PRIMARY_EXCHANGE

};

module.exports = new coreConstant;