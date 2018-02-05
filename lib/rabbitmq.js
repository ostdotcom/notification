"use strict";
/*
 * Load configuration file
 *
 */
const rootPrefix = '..'
  , coreConstants = require(rootPrefix + '/config/core_constants')
  ;

const rabbitmqConstants = {

  maxConnectionAttempts: 10,

  connectionString: function () {
    return "amqp://" + coreConstants.RMQ_USERNAME + ":" + coreConstants.RMQ_PASSWORD + "@" +
      coreConstants.RMQ_HOST + ":" +coreConstants. RMQ_PORT +
      "/?heartbeat=" + coreConstants.RMQ_HEARTBEATS;
  }

};

module.exports = rabbitmqConstants;