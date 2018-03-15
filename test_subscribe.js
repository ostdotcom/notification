"use strict";

const openSTNotification = require('./index');

var unAckCount = 0;

openSTNotification.subscribeEvent.rabbit(["ackqueue.test"], {queue: 'myQueue', ackRequired: 1, prefetch:10}, function(msgContent){
  unAckCount++;
  return new Promise(function(onResolve, onReject){
    console.log('Consumed message -> ', msgContent);
    setTimeout(function(){
      unAckCount--;
      onResolve();
    }, 3000)
  });

});

process.on('SIGINT', function () {
  console.log('Received SIGINT, checking unAckCount.');
  var f = function(){
    if (unAckCount === 0) {
      process.exit(1);
    } else {
      console.log('waiting for open tasks to be done.');
      setTimeout(f, 1000);
    }
  };

  setTimeout(f, 1000);
});