"use strict";

/**
 * Load OpenST Notification module
 */

const rootPrefix = "."
  , version = require(rootPrefix + '/package.json').version
  , publishEvent = require(rootPrefix + '/services/publish_event')
  , subscribeEvent = require(rootPrefix + '/services/subscribe_event')
  , rabbitmqConnection = require(rootPrefix + '/lib/rabbitmq/connect')
  , rmqId = 'rmq1' // To support horizontal scaling in future
;

const OpenSTNotification = function () {
  const oThis = this;

  oThis.connection = rabbitmqConnection;
  oThis.version = version;
  oThis.publishEvent = publishEvent;
  oThis.subscribeEvent = subscribeEvent;
  // oThis.validator = validator;

  oThis.connection.get(rmqId);

};

module.exports = new OpenSTNotification();

