"use strict";

const openSTNotification = require('./index');

const rootPrefix = ''
  , logger = require(rootPrefix + '/lib/logger/custom_console_logger')
;

var unAckCount = 0;

openSTNotification.subscribeEvent.rabbit(["ackqueue.test"], {queue: 'myQueue', ackRequired: 1, prefetch:10}, function(msgContent){
  unAckCount++;
  return new Promise(function(onResolve, onReject){
    logger.debug('Consumed message -> ', msgContent);
    setTimeout(function(){
      unAckCount--;
      onResolve();
    }, 3000)
  });

});

process.on('SIGINT', function () {
  logger.debug('Received SIGINT, checking unAckCount.');
  var f = function(){
    if (unAckCount === 0) {
      process.exit(1);
    } else {
      logger.debug('waiting for open tasks to be done.');
      setTimeout(f, 1000);
    }
  };

  setTimeout(f, 1000);
});