"use strict";

/**
 * Validator service to be called to validate received message to subscriber.
 *
 * @module services/validator/init
 */

const rootPrefix = '../..'
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , eventParams = require(rootPrefix + '/services/validator/event_params')
  , util = require(rootPrefix + '/lib/util')
;

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
   * @return {promise<result>}
   */
  detailed: async function (params) {

    var oThis = this;

    var r = oThis.light(params);

    if( r.isFailure() ) { return Promise.resolve(r); }

    var message = params['message'];

    if(message['kind'] == 'event_received') {
      if (message['payload']['event_name'] == 'StakingIntentConfirmed') {
        r = await eventParams.validateStakingIntent(message['payload']['params']);
        if( r.isFailure() ) { return Promise.resolve(r); }
      }
    }

    return Promise.resolve(responseHelper.successWithData({}))
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
   * @return {promise<result>}
   */
  light: function (params) {

    var validatedParams = {};

    if(!util.valPresent(params) || !util.valPresent(params['message']) ||
      !util.valPresent(params['topics']) || params['topics'].length == 0
    ){
      return Promise.resolve(responseHelper.error('s_v_i_1', 'invalid parameters'));
    }

    validatedParams['topics'] = params['topics'];

    validatedParams['message'] = {};

    const message = params['message'];

    if(!util.valPresent(message) || !util.valPresent(message['kind']) || !util.valPresent(message['payload'])){
      return Promise.resolve(responseHelper.error('s_v_i_2', 'invalid parameters'));
    }

    if(message['kind'] == 'event_received'){

      if(!util.valPresent(message['payload']['event_name']) ||
        !util.valPresent(message['payload']['params']) ||
        !util.valPresent(message['payload']['contract_address']) ||
        !util.valPresent(message['payload']['chain_id'])
      ){
        return Promise.resolve(responseHelper.error('s_v_i_3', 'invalid payload for kind event_received'));
      }

    } else if(message['kind'] == 'transaction_initiated'){

      if(!util.valPresent(message['payload']['contract_name']) ||
        !util.valPresent(message['payload']['contract_address']) ||
        !util.valPresent(message['payload']['method']) ||
        !util.valPresent(message['payload']['params']) ||
        !util.valPresent(message['payload']['transaction_hash']) ||
        !util.valPresent(message['payload']['uuid']) ||
        !util.valPresent(message['payload']['chain_id'])
      ){
        return Promise.resolve(responseHelper.error('s_v_i_4', 'invalid payload for kind transaction_initiated'));
      }

    } else if(message['kind'] == 'transaction_mined'){

      if(
        !util.valPresent(message['payload']['transaction_hash']) ||
        !util.valPresent(message['payload']['chain_id'])
      ){
        return Promise.resolve(responseHelper.error('s_v_i_5', 'invalid payload for kind transaction_mined'));
      }

    } else if(message['kind'] == 'error' || message['kind'] == 'info') {

      if(
        !util.valPresent(message['payload']['chain_id'])
      ){
        return Promise.resolve(responseHelper.error('s_v_i_7', 'invalid payload for kind error or info'));
      }

    } else {

      return Promise.resolve(responseHelper.error(
        's_v_i_6',
        'unsupported kind ('+message['kind']+') transfered. supported are event_received,transaction_initiated,transaction_mined')
      );

    }

    validatedParams['message']['kind'] = message['kind'];
    validatedParams['message']['payload'] = message['payload'];

    return Promise.resolve(responseHelper.successWithData(validatedParams));
  }

};

module.exports = new InitKlass();