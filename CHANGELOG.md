## Notfication v1.0.6
Revoked SigInt handling from subscribe event.

## Notfication v1.0.5
Scaling out of Notification using Instance Composer.

Pause and resume queue consumption to save resources.

Upgrade connection management to assure one-to-one process and rabbitMQ connection mapping.

## Notfication v1.0.4
Common style guide followed across all OST repos using prettier ([Notification#18](https://github.com/ostdotcom/notification/issues/18))

## Notfication v1.0.2
Validation changes for execute transaction

## Notfication v1.0.1
Logger, response helper and web3 from OST Base is now used in OST Notification. OST Base repository was created and all the common functionality which different OST modules need were moved to it.

Log level support was introduced and non-important logs were moved to debug log level.

Standardized error codes are now being used in OST Notification.
