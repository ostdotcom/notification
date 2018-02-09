# OpenST Notification

[![Latest version](https://img.shields.io/npm/v/@openstfoundation/openst-notification.svg?maxAge=3600)][npm]
[![Travis](https://img.shields.io/travis/OpenSTFoundation/openst-notification.svg?maxAge=600)][travis]
[![Downloads per month](https://img.shields.io/npm/dm/@openstfoundation/openst-notification.svg?maxAge=3600)][npm]
[![Gitter](https://img.shields.io/gitter/room/OpenSTFoundation/github.js.svg?maxAge=3600)][gitter]

OpenST Notification helps publish critical events from OpenST platform and sister packages. 
By default events are published using node EventEmitter and optionally events can also be 
published over RabbitMQ, using topic based exchange.


# Install OpenST Notification

```bash
npm install @openstfoundation/openst-notification --save
```

# Set EVN Variables

```bash
export OST_RMQ_SUPPORT=0 # Possible values are - '0' (disable), '1' (enable)
export OST_RMQ_HOST='127.0.0.1'
export OST_RMQ_PORT='5672'
export OST_RMQ_USERNAME=''
export OST_RMQ_PASSWORD=''
export OST_RMQ_HEARTBEATS='30'
```

# Examples:


#### Subscribe to OpenST Notifications:
- Below is the basic example how to connect openst notifications and start listening specific event. The first parameter is the name of Queue that will pass messages to the subscriber. 
- Its recommended to pass uniq queuename that doesn't conflict with someone else's queue name.
- If you don't pass queue name, the message would be published and discarded immediately, regardless of any subscriber listening. In case of connection failure, its possible to loss messages. 
- Last parameter is a callback function, that will receive published message content, use it your way. 
```js
const openSTNotification = require('@openstfoundation/openst-notification');
openSTNotification.subscribeEvent.rabbit('muQueue', ["event.ProposedBrandedToken"], function(msgContent){console.log('Consumed message -> ', msgContent)})
```

In case, if you want to listen multiple channels at a time, the second parameter will take array of those.
```js
const openSTNotification = require('@openstfoundation/openst-notification');
openSTNotification.subscribeEvent.rabbit('muQueue', ["event.ProposedBrandedToken", "obBoarding.registerBrandedToken"], function(msgContent){console.log('Consumed message -> ', msgContent)})
```

In case, of rabbitmq connection server failure the event 'rmq_fail' is emitted, you can resubscribe, as the subscription channels are broken on connection failure.  
```js
const openSTNotification = require('@openstfoundation/openst-notification');

function subscribe(){
	openSTNotification.subscribeEvent.rabbit('muQueue', ["event.ProposedBrandedToken", "obBoarding.registerBrandedToken"], function(msgContent){console.log('Consumed message -> ', msgContent)})
}
subscribe();
ind.subscribeEvent.local(['rmq_fail'], function(err){
	console.log('RMQ Failed event received.');
	setTimeout(subscribe, 2000);
})
```


#### Subscribe to OpenST local events:
If you don't wan't to listen to rabbitmq, you can also opt to listen local events.
Note: you could receive local events only in same process.
```js
const openSTNotification = require('@openstfoundation/openst-notification');
openSTNotification.subscribeEvent.local(["event.ProposedBrandedToken"], function(msgContent){console.log('Consumed message -> ', msgContent)})
```


#### Publish to OpenST Notifications:
- While publish to rabbitmq openst notification would also emit same event on local channel.

```js
const openSTNotification = require('@openstfoundation/openst-notification');
openSTNotification.publishEvent.perform(
  {
    topics:["event.ProposedBrandedToken"], 
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
   
