"use strict";

/**
 * Load OpenST Notification module
 */

const rootPrefix = "."
  , version = require(rootPrefix + '/package.json').version
  , publish_event = require(rootPrefix + '/services/publish_event')
  , subscribe_event = require(rootPrefix + '/services/subscribe_event')
  , rabbitmqConnection = require(rootPrefix + '/services/rabbitmqConnection')
  , rmqId = 'rmq1' // To support horizontal scaling in future
;

const OpenSTNotification = function () {
  const oThis = this;

  oThis.connection = rabbitmqConnection;
  oThis.version = version;
  oThis.publish_event = publish_event;
  oThis.subscribe_event = subscribe_event;
  // oThis.validator = validator;

  oThis.connection.get(rmqId);

};

module.exports = new OpenSTNotification();

