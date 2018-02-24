# OpenST Notification

[![Latest version](https://img.shields.io/npm/v/@openstfoundation/openst-notification.svg?maxAge=3600)][npm]
[![Travis](https://img.shields.io/travis/OpenSTFoundation/openst-notification.svg?maxAge=600)][travis]
[![Downloads per month](https://img.shields.io/npm/dm/@openstfoundation/openst-notification.svg?maxAge=3600)][npm]
[![Gitter](https://img.shields.io/gitter/room/OpenSTFoundation/github.js.svg?maxAge=3600)][gitter]

OpenST Notification helps publish critical events from OpenST platform and other related packages. 
All events get published using node EventEmitter and if configured, events are also published through 
RabbitMQ, using topic based exchange.


# Install OpenST Notification

```bash
npm install @openstfoundation/openst-notification --save
```

# Set EVN Variables

```bash
export OST_RMQ_SUPPORT='1' # Possible values are - '0' (disable), '1' (enable)
export OST_RMQ_HOST='127.0.0.1'
export OST_RMQ_PORT='5672'
export OST_RMQ_USERNAME=''
export OST_RMQ_PASSWORD=''
export OST_RMQ_HEARTBEATS='30'
```

# Examples:

#### Subscribe to OpenST events published through RabbitMQ:

- Basic example on how to listen a specific event. Arguments passed are:
  - <b>Events</b> [Array] (mandatory) - List of events to subscribe to
  - <b>Options</b> [object] (mandatory) - 
    - <b>queue</b> [string] (optional) - Name of the queue on which you want to receive all your subscribed events. These queues and events, published in them, have TTL of 6 days. If queue name is not passed, a queue with unique name is created and is deleted when subscriber gets disconnected.
    - <b>ackRequired</b> [number] - (optional) - The delivered message needs ack if passed 1 ( default 0 ). if 1 passed and ack not done, message will redeliver.
    - <b>prefetch</b> [number] (optional) - The number of messages released from queue in parallel. In case of ackRequired=1, queue will pause unless delivered messages are acknowledged.
  - <b>Callback</b> [function] (mandatory) - Callback method will be invoked whenever there is a new notification
  
```js
const openSTNotification = require('@openstfoundation/openst-notification');
openSTNotification.subscribeEvent.rabbit(
  ["event.ProposedBrandedToken"], 
  {
    queue: 'myQueue',
    ackRequired: 1, // means all delivered messages should get acknowledge. 
    prefetch:10
  }, 
  function(msgContent){
    // Please make sure to return promise in callback function. On promise resolve the message will get acknowledge.
    return new Promise(async function(onResolve, onReject) {
      console.log('Consumed message -> ', msgContent);
      response = await processMessage(msgContent);
      
      // Complete the task and in the end of all tasks done
      if(response == success){
        //The message will be acknowledged here. For that write onResolve();
        onResolve();   
      } else {
        //in case of failure to requeue same message.
        onReject();
      }
     
    })
  
  })
```

- Example on how to listen multiple events with one subscriber.

```js
const openSTNotification = require('@openstfoundation/openst-notification');
openSTNotification.subscribeEvent.rabbit(
  ["event.ProposedBrandedToken", "obBoarding.registerBrandedToken"], 
  {}, 
  function(msgContent){
    console.log('Consumed message -> ', msgContent)
  })
```

#### Subscribe to OpenST local events published through EventEmitter:

- Basic example on how to listen a specific event. Arguments passed are:
  - <b>Events</b> (mandatory) - List of events to subscribe to
  - <b>Callback</b> (mandatory) - Callback method will be invoked whenever there is a new notification
  
```js
const openSTNotification = require('@openstfoundation/openst-notification');
openSTNotification.subscribeEvent.local(["event.ProposedBrandedToken"], function(msgContent){console.log('Consumed message -> ', msgContent)})
```

#### Publish to OpenST Notifications:

- All events are by default published using EventEmitter and if configured, through RabbmitMQ as well.

```js
const openSTNotification = require('@openstfoundation/openst-notification');
openSTNotification.publishEvent.perform(
  {
    topics:["event.ProposedBrandedToken"], 
    publisher: 'MyPublisher',
    message: {
	  kind: "event_received",
	  payload: {
		event_name: 'ProposedBrandedToken',
		params: {
		  //params of the event
		},
        contract_address: 'contract address',
        chain_id: 'Chain id',
        chain_kind: 'kind of the chain'
	  }
	}
  })	
```

For further implementation details, please refer [API documentation][api-docs].

[gitter]: https://gitter.im/OpenSTFoundation/SimpleToken
[npm]: https://www.npmjs.com/package/@openstfoundation/openst-notification
[travis]: https://travis-ci.org/OpenSTFoundation/openst-notification
[api-docs]: https://openstfoundation.github.io/openst-notification/
   
