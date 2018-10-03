'use strict';

/**
 * Validator service to be called to validate received message to subscriber.
 *
 * @module lib/validator/init
 */

const rootPrefix = '../..',
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  eventParams = require(rootPrefix + '/lib/validator/event_params'),
  logger = require(rootPrefix + '/lib/logger/custom_console_logger'),
  util = require(rootPrefix + '/lib/util'),
  paramErrorConfig = require(rootPrefix + '/config/param_error_config'),
  apiErrorConfig = require(rootPrefix + '/config/api_error_config');

const errorConfig = {
  param_error_config: paramErrorConfig,
  api_error_config: apiErrorConfig
};

/**
 * Validate event parameters constructor
 *
 * @constructor
 */
const InitKlass = function() {};

InitKlass.prototype = {
  /**
   * Perform detailed validation for specific event params
   *
   * @param {object} params - event parameters
   * @param {array} params.topics - on which topic messages
   * @param {object} params.message -
   * @param {string} params.message.kind - kind of the message
   * @param {object} params.message.payload - Payload to identify message and extra info.
   *
   * @return {Promise<result>}
   */
  detailed: async function(params) {
    const oThis = this;

    let r = oThis.light(params);

    if (r.isFailure()) {
      return Promise.resolve(r);
    }

    let message = params['message'];

    if (message['kind'] === 'event_received') {
      if (message['payload']['event_name'] === 'StakingIntentConfirmed') {
        r = await eventParams.validateStakingIntent(message['payload']['params']);
        if (r.isFailure()) {
          return Promise.resolve(r);
        }
      }
    }

    return Promise.resolve(responseHelper.successWithData({}));
  },

  /**
   * Perform basic validation for specific event params
   *
   * @param {object} params - event parameters
   *  * {array} topics - on which topic messages
   *  * {object} message -
   *    ** {string} kind - kind of the message
   *    ** {object} payload - Payload to identify message and extra info.
   *
   * @return {Promise<result>}
   */
  light: function(params) {
    let validatedParams = {};

    if (
      !util.valPresent(params) ||
      !util.valPresent(params['message']) ||
      !util.valPresent(params['topics']) ||
      params['topics'].length === 0 ||
      !util.valPresent(params['publisher'])
    ) {
      let errorParams = {
        internal_error_identifier: 's_v_i_1',
        api_error_identifier: 'invalid_notification_params',
        error_config: errorConfig,
        debug_options: {}
      };
      return Promise.resolve(responseHelper.error(errorParams));
    }

    validatedParams['topics'] = params['topics'];
    validatedParams['publisher'] = params['publisher'];

    validatedParams['message'] = {};

    const message = params['message'];

    if (!util.valPresent(message) || !util.valPresent(message['kind']) || !util.valPresent(message['payload'])) {
      let errorParams = {
        internal_error_identifier: 's_v_i_2',
        api_error_identifier: 'invalid_message_params',
        error_config: errorConfig,
        debug_options: {}
      };
      return Promise.resolve(responseHelper.error(errorParams));
    }

    // Specific events are validation for OST publisher.
    if (validatedParams['publisher'] === 'OST') {
      if (message['kind'] === 'event_received') {
        if (!util.valPresent(message['payload']['event_name']) || !util.valPresent(message['payload']['event_data'])) {
          let errorParams = {
            internal_error_identifier: 's_v_i_3',
            api_error_identifier: 'invalid_payload_for_received_event',
            error_config: errorConfig,
            debug_options: {}
          };
          return Promise.resolve(responseHelper.error(errorParams));
        }
      } else if (['transaction_initiated', 'transaction_mined', 'transaction_error'].includes(message['kind'])) {
        if (
          !util.valPresent(message['payload']['contract_name']) ||
          !util.valPresent(message['payload']['contract_address']) ||
          !util.valPresent(message['payload']['method']) ||
          !util.valPresent(message['payload']['params']) ||
          !util.valPresent(message['payload']['transaction_hash']) ||
          !util.valPresent(message['payload']['uuid']) ||
          !util.valPresent(message['payload']['chain_id']) ||
          !util.valPresent(message['payload']['tag'])
        ) {
          let errorParams = {
            internal_error_identifier: 's_v_i_4',
            api_error_identifier: 'invalid_payload_transaction_init',
            error_config: errorConfig,
            debug_options: {}
          };
          return Promise.resolve(responseHelper.error(errorParams));
        }
      } else if (message['kind'] === 'email') {
        if (!util.valPresent(message['payload']['subject']) || !util.valPresent(message['payload']['body'])) {
          let errorParams = {
            internal_error_identifier: 's_v_i_5',
            api_error_identifier: 'invalid_payload_for_email',
            error_config: errorConfig,
            debug_options: {}
          };
          return Promise.resolve(responseHelper.error(errorParams));
        }
      } else if (message['kind'] === 'shared_entity') {
        if (
          !util.valPresent(message['payload']['entity']) ||
          !util.valPresent(message['payload']['identifier']) ||
          !util.valPresent(message['payload']['operation']) ||
          !util.valPresent(message['payload']['data'])
        ) {
          let errorParams = {
            internal_error_identifier: 's_v_i_6',
            api_error_identifier: 'invalid_payload_shared_entity',
            error_config: errorConfig,
            debug_options: {}
          };
          return Promise.resolve(responseHelper.error(errorParams));
        }
      } else if (message['kind'] === 'execute_transaction') {
        if (!util.valPresent(message['payload']['transaction_uuid'])) {
          let errorParams = {
            internal_error_identifier: 's_v_i_7',
            api_error_identifier: 'invalid_payload_exec_transaction',
            error_config: errorConfig,
            debug_options: { message_kind: message['kind'] }
          };
          return Promise.resolve(responseHelper.error(errorParams));
        }
      } else if (message['kind'] === 'error' || message['kind'] === 'info' || message['kind'] === 'background_job') {
        // Nothing to check
      } else {
        let errorParams = {
          internal_error_identifier: 's_v_i_8',
          api_error_identifier: 'unsupported_message_kind',
          error_config: errorConfig,
          debug_options: {}
        };

        logger.error(
          'Unsupported kind (' +
            message['kind'] +
            ') transferred. supported are event_received,transaction_initiated,transaction_mined'
        );
        return Promise.resolve(responseHelper.error(errorParams));
      }
    } else {
      validatedParams['message']['kind'] = message['kind'];
      validatedParams['message']['payload'] = message['payload'];
    }

    validatedParams['message']['kind'] = message['kind'];
    validatedParams['message']['payload'] = message['payload'];

    return Promise.resolve(responseHelper.successWithData(validatedParams));
  }
};

module.exports = new InitKlass();
