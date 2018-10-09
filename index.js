'use strict';

/**
 * Load OpenST Notification module
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
 * OpenST Notification
 *
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

// instance map to ensure that only one object is created per config strategy
const instanceMap = {};

const OpenSTNotificationFactory = function() {};

OpenSTNotificationFactory.prototype = {
  /**
   * Get an instance of OpenSTNotification
   *
   * @param configStrategy
   * @returns {Promise<OpenSTNotification>}
   */
  getInstance: async function(configStrategy) {
    const oThis = this,
      rabbitMqMandatoryParams = [
        'OST_RMQ_USERNAME',
        'OST_RMQ_PASSWORD',
        'OST_RMQ_HOST',
        'OST_RMQ_PORT',
        'OST_RMQ_HEARTBEATS'
      ];

    // Check if all the mandatory connection parameters for RabbitMQ are available or not.
    for (let key = 0; key < rabbitMqMandatoryParams.length; key++) {
      if (!configStrategy.hasOwnProperty(rabbitMqMandatoryParams[key])) {
        throw 'RabbitMQ one or more mandatory connection parameters missing.';
      }
    }

    // Check if instance already present.
    let instanceKey = rabbitMqHelper.getInstanceKey(configStrategy),
      _instance = instanceMap[instanceKey];

    if (!_instance) {
      _instance = new OpenSTNotification(configStrategy);
      await _instance.connection.get();
      instanceMap[instanceKey] = _instance;
    }

    return _instance;
  }
};

const factory = new OpenSTNotificationFactory();
OpenSTNotification.getInstance = function() {
  return factory.getInstance.apply(factory, arguments);
};

module.exports = OpenSTNotification;
