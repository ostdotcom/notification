'use strict';

const rootPrefix = '.',
  OSTNotification = require(rootPrefix + '/index'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  configStrategy = require(rootPrefix + '/test/config_strategy.json');

let unAckCount = 0;

let ostNotification = OSTNotification.getInstance(configStrategy);

ostNotification.subscribeEvent.rabbit(['ackqueue.test'], { queue: 'myQueue', ackRequired: 1, prefetch: 10 }, function(
  msgContent
) {
  unAckCount++;
  return new Promise(function(onResolve, onReject) {
    logger.debug('Consumed message -> ', msgContent);
    setTimeout(function() {
      unAckCount--;
      onResolve();
    }, 3000);
  });
});

process.on('SIGINT', function() {
  logger.debug('Received SIGINT, checking unAckCount.');
  let f = function() {
    if (unAckCount === 0) {
      process.exit(1);
    } else {
      logger.debug('waiting for open tasks to be done.');
      setTimeout(f, 1000);
    }
  };

  setTimeout(f, 1000);
});
