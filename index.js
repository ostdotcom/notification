/**
 * Index File for openst-cache
 */

"use strict";

const rootPrefix = "."
  , version = require(rootPrefix + '/package.json').version
  , publish_event = require(rootPrefix + '/services/publish_event')
  , subscribe_event = require(rootPrefix + '/services/subscribe_event')
  , rabbitmqConnection = require(rootPrefix + '/services/rabbitmqConnection')
  , rmqId = 'rmq1'
;

const OpenSTQueueManagement = function () {
  const oThis = this;

  rabbitmqConnection.get(rmqId);

  oThis.version = version;
  oThis.publish_event = new publish_event;
  oThis.subscribe_event = new subscribe_event;
  // oThis.validator = validator;
  // oThis.generic_event_emitter = generic_event_emitter;
};

module.exports = new OpenSTQueueManagement();

