"use strict";

/**
 * Validate event parameters
 *
 * @module lib/validator/event_params
 */
const rootPrefix = '../..'
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , util = require(rootPrefix + '/lib/util')
  , paramErrorConfig = require(rootPrefix + '/config/param_error_config')
  , apiErrorConfig = require(rootPrefix + '/config/api_error_config')
;

const errorConfig = {
  param_error_config: paramErrorConfig,
  api_error_config: apiErrorConfig
};

/**
 * Validate event parameters constructor
 *
 * @constructor
 */
const EventParamsKlass = function () {
};

EventParamsKlass.prototype = {

  /**
   * Validate confirm staking intent event
   *
   * @param {object} params - event parameters
   *
   * @return {promise<result>}
   */
  validateStakingIntent: function (params) {

    if (!util.valPresent(params['_uuid']) || !util.valPresent(params['stakingIntentHash']) ||
      !util.valPresent(params['_staker']) || !util.valPresent(params['_beneficiary']) ||
      !util.valPresent(params['_amountST']) || !util.valPresent(params['_amountUT']) ||
      !util.valPresent(params['expirationHeight'])) {
      let errorParams = {
        internal_error_identifier: 's_v_ep_1',
        api_error_identifier: 'invalid_params',
        error_config: errorConfig,
        debug_options: {}
      };
      return Promise.resolve(responseHelper.error(errorParams));
    }

    return Promise.resolve(responseHelper.successWithData({}))

  }

};

module.exports = new EventParamsKlass();