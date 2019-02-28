'use strict';
/**
 * Load all the core constants.
 *
 * @module config/coreConstant
 */

class CoreConstants {
  /**
   * Constructor for core constants
   *
   * @constructor
   */
  constructor() {}

  /**
   * Web3 pool size
   *
   * @returns {*}
   */
  get icNameSpace() {
    return 'ostNotification';
  }
}

module.exports = new CoreConstants();
