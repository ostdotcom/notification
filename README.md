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

For further implementation details, please refer [API documentation][api-docs].

[gitter]: https://gitter.im/OpenSTFoundation/SimpleToken
[npm]: https://www.npmjs.com/package/@openstfoundation/openst-notification
[travis]: https://travis-ci.org/OpenSTFoundation/openst-notification
[api-docs]: https://openstfoundation.github.io/openst-notification/
   
