"use strict";

/**
 * Response formatter
 *
 * @module lib/formatter/response
 */

function Result(data, errCode, errMsg) {
  this.success = (typeof errCode === "undefined");

  this.data = data || {};

  if (!this.success) {
    this.err = {
      code: errCode,
      msg: errMsg
    };
  }

  // Check if response has success
  this.isSuccess = function () {
    return this.success;
  };

  // Check if response is not success. More often not success is checked, so adding a method.
  this.isFailure = function () {
    return !this.isSuccess();
  };

}

/**
 * Response Helper
 *
 * @constructor
 */
const ResponseHelperKlass = function() {};

ResponseHelperKlass.prototype = {
  /**
   * Generate success response object<br><br>
   *
   * @param {object} data - data to be formatted
   *
   * @returns {object<result>} - formatted success result
   */
  successWithData: function (data) {
    return new Result(data);
  },

  /**
   * Generate error response object<br><br>
   *
   * @param {string} errCode - Error Code
   * @param {string} errMsg  - Error Message
   * @param {string} errPrefix - Error Prefix
   *
   * @returns {object<Result>} - formatted error result
   */
  error: function (errCode, errMsg, errPrefix) {
    errCode = 'openst-notification(' + errCode + ')';

    if (errPrefix) {
      errCode = errPrefix + "*" + errCode;
    }

    return new Result({}, errCode, errMsg);
  }

};

module.exports = new ResponseHelperKlass();
