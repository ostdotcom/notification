"use strict";

const coreConstant = function () {};

coreConstant.prototype = {

  OST_RMQ_SUPPORT: process.env.OST_RMQ_SUPPORT,

  OST_RMQ_HOST: process.env.OST_RMQ_HOST,

  OST_RMQ_PORT: process.env.OST_RMQ_PORT,

  OST_RMQ_USERNAME: process.env.OST_RMQ_USERNAME,

  OST_RMQ_PASSWORD: process.env.OST_RMQ_PASSWORD,

  OST_RMQ_HEARTBEATS: process.env.OST_RMQ_HEARTBEATS,

  OST_RMQ_PRIMARY_EXCHANGE: process.env.OST_RMQ_PRIMARY_EXCHANGE

};

module.exports = new coreConstant;