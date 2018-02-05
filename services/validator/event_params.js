"use strict";

const rootPrefix = '../..'
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
;

const eventParams = {

  validateStakingIntent: function (params) {

    if(!params['_uuid'] || !params['stakingIntentHash'] || !params['_staker'] ||
      !params['_beneficiary'] || !params['_amountST'] || !params['_amountUT'] ||
      !params['expirationHeight'])
    {
      return Promise.resolve(responseHelper.error('ost_q_m_s_v_ep_1', 'invalid parameters'));
    }

  }

};

module.exports = eventParams;