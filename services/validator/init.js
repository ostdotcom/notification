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

const baseValidator = {

  /**
   * performer
   *
   * @param {object} params - topics {Array} - on which topic messages
   *                          message {object} - kind {string} - kind of the message
   *                                           - payload {object} - Payload to identify message and extra info.
   *
   * @return {Promise<Result>}
   */
  perform: async function (params) {

    var oThis = this;

    var r = oThis.basicParams(params);

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
   * Validate outer(basic) parameters.
   *
   * @param {object} params - topics {Array} - on which topic messages
   *                          message {object} - kind {string} - kind of the message
   *                                           - payload {object} - Payload to identify message and extra info.
   *
   * @return {Promise<Result>}
   */
  basicParams: function (params) {

    var validatedParams = {};

    if(!util.valPresent(params) || !util.valPresent(params['message']) ||
      !util.valPresent(params['topics']) || params['topics'].length == 0
    ){
      return Promise.resolve(responseHelper.error('ost_q_m_s_v_i_1', 'invalid parameters'));
    }

    validatedParams['topics'] = params['topics'];

    validatedParams['message'] = {};

    const message = params['message'];

    if(!util.valPresent(message) || !util.valPresent(message['kind']) || !util.valPresent(message['payload'])){
      return Promise.resolve(responseHelper.error('ost_q_m_s_v_i_2', 'invalid parameters'));
    }

    if(message['kind'] == 'event_received'){

      if(!util.valPresent(message['payload']['event_name']) ||
        !util.valPresent(message['payload']['params']) ||
        !util.valPresent(message['payload']['contract_address'])
      ){
        return Promise.resolve(responseHelper.error('ost_q_m_s_v_i_3', 'invalid payload for kind event_received'));
      }

    } else if(message['kind'] == 'transaction_initiated'){

      if(!util.valPresent(message['payload']['contract_name']) ||
        !util.valPresent(message['payload']['contract_address']) ||
        !util.valPresent(message['payload']['method']) ||
        !util.valPresent(message['payload']['params']) ||
        !util.valPresent(message['payload']['transaction_hash']) ||
        !util.valPresent(message['payload']['uuid'])
      ){
        return Promise.resolve(responseHelper.error('ost_q_m_s_v_i_4', 'invalid payload for kind transaction_initiated'));
      }

    } else if(message['kind'] == 'transaction_mined'){

      if(!util.valPresent(message['payload']['transaction_hash'])){
        return Promise.resolve(responseHelper.error('ost_q_m_s_v_i_5', 'invalid payload for kind transaction_mined'));
      }

    } else if(message['kind'] != 'error' && message['kind'] != 'info'){

      return Promise.resolve(responseHelper.error(
        'ost_q_m_s_v_i_6',
        'unsupported kind ('+message['kind']+') transfered. supported are event_received,transaction_initiated,transaction_mined')
      );

    }

    validatedParams['message']['kind'] = message['kind'];
    validatedParams['message']['payload'] = message['payload'];

    return Promise.resolve(responseHelper.successWithData(validatedParams));
  }

};

module.exports = baseValidator;