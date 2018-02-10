"use strict";

/**
 * Validate event parameters
 *
 * @module lib/validator/event_params
 */
const rootPrefix = '../..'
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , util = require(rootPrefix + '/lib/util')
;

/**
 * Validate event parameters constructor
 *
 * @constructor
 */
const EventParamsKlass = function() {};

EventParamsKlass.prototype = {

  /**
   * Validate confirm staking intent event
   *
   * @param {object} params - event parameters
   *
   * @return {promise<result>}
   */
  validateStakingIntent: function (params) {

    if(!util.valPresent(params['_uuid']) || !util.valPresent(params['stakingIntentHash']) ||
      !util.valPresent(params['_staker']) || !util.valPresent(params['_beneficiary']) ||
      !util.valPresent(params['_amountST']) || !util.valPresent(params['_amountUT']) ||
      !util.valPresent(params['expirationHeight']))
    {
      return Promise.resolve(responseHelper.error('s_v_ep_1', 'invalid parameters'));
    }

    return Promise.resolve(responseHelper.successWithData({}))

  }

};

module.exports = new EventParamsKlass();