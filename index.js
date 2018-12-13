'use strict';

/**
 * Load OpenST Notification module.
 */

const rootPrefix = '.',
  version = require(rootPrefix + '/package.json').version,
  rabbitMqHelper = require(rootPrefix + '/lib/rabbitmq/helper'),
  InstanceComposer = require(rootPrefix + '/instance_composer');

require(rootPrefix + '/lib/rabbitmq/helper');
require(rootPrefix + '/lib/rabbitmq/connect');
require(rootPrefix + '/services/publish_event');
require(rootPrefix + '/services/subscribe_event');

/**
 * OpenST-Notification
 *
 * @param configStrategy
 * @constructor
 */
const OpenSTNotification = function(configStrategy) {
  const oThis = this;

  if (!configStrategy) {
    throw 'Mandatory argument configStrategy missing.';
  }

  const instanceComposer = (oThis.ic = new InstanceComposer(configStrategy));

  oThis.version = version;
  oThis.connection = instanceComposer.getRabbitMqConnection();
  oThis.publishEvent = instanceComposer.getPublishEventKlass();
  oThis.subscribeEvent = instanceComposer.getSubscribeEventKlass();
};

// Instance Map to ensure that only one object is created per config strategy.
const instanceMap = {};

const OpenSTNotificationFactory = function() {};

OpenSTNotificationFactory.prototype = {
  /**
   * Get an instance of OpenSTNotification
   *
   * @param configStrategy
   * @returns {OpenSTNotification}
   */
  getInstance: function(configStrategy) {
    const oThis = this,
      rabbitMqMandatoryParams = ['username', 'password', 'host', 'port', 'heartbeats'];

    if (!configStrategy.hasOwnProperty('rabbitmq')) {
      throw 'RabbitMQ one or more mandatory connection parameters missing.';
    }

    // Check if all the mandatory connection parameters for RabbitMQ are available or not.
    for (let key = 0; key < rabbitMqMandatoryParams.length; key++) {
      if (!configStrategy.rabbitmq.hasOwnProperty(rabbitMqMandatoryParams[key])) {
        throw 'RabbitMQ one or more mandatory connection parameters missing.';
      }
    }

    // Check if instance already present.
    let instanceKey = rabbitMqHelper.getInstanceKey(configStrategy),
      _instance = instanceMap[instanceKey];

    if (!_instance) {
      _instance = new OpenSTNotification(configStrategy);
      instanceMap[instanceKey] = _instance;
    }
    _instance.connection.get();

    return _instance;
  }
};

const factory = new OpenSTNotificationFactory();
OpenSTNotification.getInstance = function() {
  return factory.getInstance.apply(factory, arguments);
};

module.exports = OpenSTNotification;
