"use strict";

const rootPrefix = '../..'
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , eventParams = require(rootPrefix + '/services/validator/event_params');
;

const baseValidator = {

  perform: function (params) {

    var oThis = this;

    var r = oThis.basicParams(params);

    if( r.isFailure() ) { return Promise.resolve(r); }

    var message = params['message'];

    if(message['kind'] == 'event_received') {
      if (message['payload']['event_name'] == 'StakingIntentConfirmed') {
        r = eventParams.validateStakingIntent(message['payload']['params']);
        if( r.isFailure() ) { return Promise.resolve(r); }
      }
    }
  },

  basicParams: function (params) {

    var validatedParams = {};

    if(!params || !params['topic'] || !params['message']){
      return Promise.resolve(responseHelper.error('ost_q_m_s_v_i_1', 'invalid parameters'));
    }

    validatedParams['topic'] = params['topic'];

    validatedParams['message'] = {};

    var message = params['message'];

    if(!message || !message['kind'] || !message['payload']){
      return Promise.resolve(responseHelper.error('ost_q_m_s_v_i_2', 'invalid parameters'));
    }

    if(message['kind'] == 'event_received'){

      if(!message['payload']['event_name'] ||
        !message['payload']['params'] ||
        !message['payload']['contract_address']
      ){
        return Promise.resolve(responseHelper.error('ost_q_m_s_v_i_3', 'invalid payload for kind event_received'));
      }

    } else if(message['kind'] == 'transaction_initiated'){

      if(!message['payload']['contract_name'] ||
        !message['payload']['contract_address'] ||
        !message['payload']['method'] ||
        !message['payload']['params'] ||
        !message['payload']['transaction_hash'] ||
        !message['payload']['uuid']
      ){
        return Promise.resolve(responseHelper.error('ost_q_m_s_v_i_4', 'invalid payload for kind transaction_initiated'));
      }

    } else if(message['kind'] == 'transaction_mined'){

      if(!message['payload']['transaction_hash']){
        return Promise.resolve(responseHelper.error('ost_q_m_s_v_i_5', 'invalid payload for kind transaction_mined'));
      }

    } else {
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